/**
 * Connecteur Antibia - Gestion operationnelle SDIS
 *
 * Synchronise:
 * - Interventions → CalendarEvent + TTAEntry
 * - Gardes → CalendarEvent + TTAEntry
 * - Disponibilites → UserPresence
 *
 * Prerequis: convention partenariale avec Antibia pour acces API
 */

import { prisma } from "@/lib/prisma";
import { BaseConnector } from "./base-connector";
import type {
  ConnectorConfig,
  SyncOptions,
  SyncResult,
  AntibiaIntervention,
  AntibiaGarde,
  AntibiaDisponibilite,
} from "./types";

export class AntibiaConnector extends BaseConnector {
  get name() {
    return "Antibia";
  }

  constructor(config: ConnectorConfig) {
    super(config);
  }

  /**
   * Tester la connexion a l'API Antibia
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request("/api/v1/ping");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Synchroniser les interventions
   * Antibia → CalendarEvent (type: INTERVENTION) + TTAEntry (type: INTERVENTION)
   */
  async syncInterventions(
    tenantId: string,
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    this.resetErrors();
    const startTime = Date.now();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    const from = options.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = options.to || new Date();

    // Recuperer les interventions depuis Antibia
    const interventions = await this.requestWithRetry<AntibiaIntervention[]>(
      `/api/v1/interventions?from=${from.toISOString()}&to=${to.toISOString()}&limit=${options.limit || 500}`
    );

    // Mapper matricule → userId via la table PersonnelFile
    const matriculeMap = await this.buildMatriculeMap(tenantId);

    for (const intervention of interventions) {
      try {
        // Creer/mettre a jour l'evenement calendrier
        const existingEvent = await prisma.calendarEvent.findFirst({
          where: {
            tenantId,
            externalId: intervention.id,
            externalSource: "ANTIBIA",
          } as any,
        });

        if (existingEvent) {
          if (options.fullSync) {
            await prisma.calendarEvent.update({
              where: { id: existingEvent.id },
              data: {
                title: `${intervention.type} - ${intervention.motif}`,
                description: `${intervention.adresse}, ${intervention.commune}`,
                startDate: intervention.dateDepart,
                endDate: intervention.dateRetour || intervention.dateDepart,
              },
            });
            updated++;
          } else {
            skipped++;
          }
          continue;
        }

        // Trouver le createur (premier chef d'agres)
        const chef = intervention.personnel.find((p) => p.role === "CHEF_AGRES");
        const creatorId = chef
          ? matriculeMap.get(chef.matricule)
          : undefined;

        if (!creatorId) {
          this.addError(
            intervention.id,
            `Matricule chef d'agres ${chef?.matricule} non trouve dans MindSP`
          );
          continue;
        }

        await prisma.calendarEvent.create({
          data: {
            tenantId,
            title: `${intervention.type} - ${intervention.motif}`,
            description: `${intervention.adresse}, ${intervention.commune}\nEngins: ${intervention.engins.map((e) => e.code).join(", ")}`,
            location: `${intervention.adresse}, ${intervention.commune}`,
            startDate: intervention.dateDepart,
            endDate: intervention.dateRetour || intervention.dateDepart,
            type: "INTERVENTION",
            createdBy: creatorId,
            externalId: intervention.id,
            externalSource: "ANTIBIA",
          } as any,
        });

        // Creer les entrees TTA pour chaque agent
        for (const agent of intervention.personnel) {
          const userId = matriculeMap.get(agent.matricule);
          if (!userId) continue;

          const dureeHeures = intervention.duree
            ? intervention.duree / 60
            : 1;

          await prisma.tTAEntry.create({
            data: {
              userId,
              tenantId,
              date: intervention.dateDepart,
              month: intervention.dateDepart.getMonth() + 1,
              year: intervention.dateDepart.getFullYear(),
              activityType: "INTERVENTION",
              duration: dureeHeures,
              description: `${intervention.type} - ${intervention.motif}`,
              status: "VALIDATED",
              validatedById: creatorId,
              validatedAt: new Date(),
            } as any,
          });
        }

        created++;
      } catch (error) {
        this.addError(
          intervention.id,
          (error as Error).message
        );
      }
    }

    return this.createSyncResult(created, updated, skipped, startTime);
  }

  /**
   * Synchroniser les gardes
   * Antibia → CalendarEvent (type: GARDE) + TTAEntry (type: GARDE)
   */
  async syncGardes(
    tenantId: string,
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    this.resetErrors();
    const startTime = Date.now();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    const from = options.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = options.to || new Date();

    const gardes = await this.requestWithRetry<AntibiaGarde[]>(
      `/api/v1/gardes?from=${from.toISOString()}&to=${to.toISOString()}`
    );

    const matriculeMap = await this.buildMatriculeMap(tenantId);

    for (const garde of gardes) {
      try {
        const userId = matriculeMap.get(garde.matricule);
        if (!userId) {
          this.addError(garde.id, `Matricule ${garde.matricule} non trouve`);
          continue;
        }

        // Verifier si deja importe
        const existing = await prisma.tTAEntry.findFirst({
          where: {
            userId,
            tenantId,
            date: garde.dateDebut,
            activityType: "GARDE",
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        const dureeHeures =
          (garde.dateFin.getTime() - garde.dateDebut.getTime()) / (1000 * 60 * 60);

        await prisma.tTAEntry.create({
          data: {
            userId,
            tenantId,
            date: garde.dateDebut,
            month: garde.dateDebut.getMonth() + 1,
            year: garde.dateDebut.getFullYear(),
            activityType: "GARDE",
            duration: dureeHeures,
            description: `${garde.type} - ${garde.centreSecours}`,
            status: "VALIDATED",
          } as any,
        });

        created++;
      } catch (error) {
        this.addError(garde.id, (error as Error).message);
      }
    }

    return this.createSyncResult(created, updated, skipped, startTime);
  }

  /**
   * Synchroniser les disponibilites
   * Antibia → UserPresence
   */
  async syncDisponibilites(
    tenantId: string,
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    this.resetErrors();
    const startTime = Date.now();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    const disponibilites = await this.requestWithRetry<AntibiaDisponibilite[]>(
      `/api/v1/disponibilites?sdisId=${this.config.externalSdisId}`
    );

    const matriculeMap = await this.buildMatriculeMap(tenantId);

    for (const dispo of disponibilites) {
      try {
        const userId = matriculeMap.get(dispo.matricule);
        if (!userId) {
          skipped++;
          continue;
        }

        await prisma.userPresence.upsert({
          where: { userId },
          update: {
            status: dispo.statut === "DISPONIBLE" ? "ONLINE" : "OFFLINE",
            lastSeen: new Date(),
          },
          create: {
            userId,
            status: dispo.statut === "DISPONIBLE" ? "ONLINE" : "OFFLINE",
            lastSeen: new Date(),
          },
        });

        updated++;
      } catch (error) {
        this.addError(dispo.id, (error as Error).message);
      }
    }

    return this.createSyncResult(created, updated, skipped, startTime);
  }

  /**
   * Construire un mapping matricule → userId
   */
  private async buildMatriculeMap(
    tenantId: string
  ): Promise<Map<string, string>> {
    const users = await prisma.user.findMany({
      where: { tenantId, status: "ACTIVE" },
      select: { id: true, badge: true },
    });

    const map = new Map<string, string>();
    for (const user of users) {
      if (user.badge) {
        map.set(user.badge, user.id);
      }
    }
    return map;
  }
}
