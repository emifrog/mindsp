/**
 * Connecteur LGTP - Logiciel de Gestion des Temps et Plannings
 *
 * Synchronise:
 * - Temps de travail → TTAEntry
 * - Plannings → CalendarEvent
 * - Compteurs d'heures → PersonnelFile metadata
 *
 * Prerequis: convention partenariale avec l'editeur LGTP pour acces API
 */

import { prisma } from "@/lib/prisma";
import { BaseConnector } from "./base-connector";
import type {
  ConnectorConfig,
  SyncOptions,
  SyncResult,
  LGTPTemps,
  LGTPPlanning,
  LGTPCompteur,
} from "./types";

// Mapping des types LGTP vers les types MindSP ActivityType
const ACTIVITY_TYPE_MAP: Record<string, string> = {
  GARDE: "GARDE",
  ASTREINTE: "ASTREINTE",
  FORMATION: "FORMATION",
  FMPA: "FMPA",
  INTERVENTION: "INTERVENTION",
  REPOS: "GARDE",       // Comptabilise comme jour off
  CONGE: "GARDE",       // Comptabilise comme conge
  MALADIE: "GARDE",     // Comptabilise comme absence
};

export class LGTPConnector extends BaseConnector {
  get name() {
    return "LGTP";
  }

  constructor(config: ConnectorConfig) {
    super(config);
  }

  /**
   * Tester la connexion a l'API LGTP
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.request("/api/v1/status");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Synchroniser les entrees de temps
   * LGTP → TTAEntry
   */
  async syncTemps(
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

    const entries = await this.requestWithRetry<LGTPTemps[]>(
      `/api/v1/temps?from=${from.toISOString()}&to=${to.toISOString()}&limit=${options.limit || 1000}`
    );

    const matriculeMap = await this.buildMatriculeMap(tenantId);

    for (const entry of entries) {
      try {
        const userId = matriculeMap.get(entry.matricule);
        if (!userId) {
          this.addError(entry.id, `Matricule ${entry.matricule} non trouve`);
          continue;
        }

        const activityType = ACTIVITY_TYPE_MAP[entry.type] || "GARDE";

        // Verifier si deja importe (meme user, meme date, meme type)
        const existing = await prisma.tTAEntry.findFirst({
          where: {
            userId,
            tenantId,
            date: entry.date,
            activityType: activityType as any,
          },
        });

        if (existing) {
          if (options.fullSync) {
            await prisma.tTAEntry.update({
              where: { id: existing.id },
              data: {
                duration: entry.duree,
                description: entry.commentaire || `${entry.type} ${entry.heureDebut}-${entry.heureFin}`,
                status: entry.valide ? "VALIDATED" : "PENDING",
              },
            });
            updated++;
          } else {
            skipped++;
          }
          continue;
        }

        await prisma.tTAEntry.create({
          data: {
            userId,
            tenantId,
            date: entry.date,
            month: entry.date.getMonth() + 1,
            year: entry.date.getFullYear(),
            activityType: activityType as any,
            duration: entry.duree,
            description: entry.commentaire || `${entry.type} ${entry.heureDebut}-${entry.heureFin}`,
            status: entry.valide ? "VALIDATED" : "PENDING",
          },
        });

        created++;
      } catch (error) {
        this.addError(entry.id, (error as Error).message);
      }
    }

    return this.createSyncResult(created, updated, skipped, startTime);
  }

  /**
   * Synchroniser un planning mensuel
   * LGTP → CalendarEvent (gardes, astreintes, repos)
   */
  async syncPlanning(
    tenantId: string,
    mois: number,
    annee: number
  ): Promise<SyncResult> {
    this.resetErrors();
    const startTime = Date.now();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    const planning = await this.requestWithRetry<LGTPPlanning>(
      `/api/v1/plannings/${annee}/${mois}?sdisId=${this.config.externalSdisId}`
    );

    const matriculeMap = await this.buildMatriculeMap(tenantId);

    for (const ligne of planning.lignes) {
      const userId = matriculeMap.get(ligne.matricule);
      if (!userId) {
        this.addError(
          `${ligne.matricule}`,
          `Matricule ${ligne.matricule} (${ligne.nom} ${ligne.prenom}) non trouve`
        );
        continue;
      }

      for (const [jour, typeActivite] of Object.entries(ligne.jours)) {
        try {
          if (!typeActivite || typeActivite === "R") continue; // Repos normal

          const date = new Date(annee, mois - 1, parseInt(jour));
          const activityType = ACTIVITY_TYPE_MAP[typeActivite] || "GARDE";

          const existing = await prisma.tTAEntry.findFirst({
            where: {
              userId,
              tenantId,
              date,
              activityType: activityType as any,
            },
          });

          if (existing) {
            skipped++;
            continue;
          }

          // Duree par defaut selon le type
          const defaultDurations: Record<string, number> = {
            GARDE: 24,
            ASTREINTE: 24,
            FORMATION: 8,
            FMPA: 4,
          };

          await prisma.tTAEntry.create({
            data: {
              userId,
              tenantId,
              date,
              month: mois,
              year: annee,
              activityType: activityType as any,
              duration: defaultDurations[activityType] || 8,
              description: `Planning ${typeActivite} - ${planning.centreSecours}`,
              status: "PENDING",
            },
          });

          created++;
        } catch (error) {
          this.addError(
            `${ligne.matricule}-J${jour}`,
            (error as Error).message
          );
        }
      }
    }

    return this.createSyncResult(created, updated, skipped, startTime);
  }

  /**
   * Synchroniser les compteurs d'heures
   * LGTP → metadata sur PersonnelFile
   */
  async syncCompteurs(
    tenantId: string,
    annee: number
  ): Promise<SyncResult> {
    this.resetErrors();
    const startTime = Date.now();
    let created = 0;
    let updated = 0;
    let skipped = 0;

    const compteurs = await this.requestWithRetry<LGTPCompteur[]>(
      `/api/v1/compteurs/${annee}?sdisId=${this.config.externalSdisId}`
    );

    const matriculeMap = await this.buildMatriculeMap(tenantId);

    for (const compteur of compteurs) {
      try {
        const userId = matriculeMap.get(compteur.matricule);
        if (!userId) {
          skipped++;
          continue;
        }

        // Stocker les compteurs dans les metadata de PersonnelFile
        const file = await prisma.personnelFile.findFirst({
          where: { userId, tenantId },
        });

        if (!file) {
          this.addError(
            compteur.matricule,
            `Fiche personnel non trouvee pour ${compteur.matricule}`
          );
          continue;
        }

        const metadata = (file.metadata as Record<string, unknown>) || {};
        metadata.lgtp_compteurs = {
          annee: compteur.annee,
          heuresGarde: compteur.heuresGarde,
          heuresAstreinte: compteur.heuresAstreinte,
          heuresFormation: compteur.heuresFormation,
          heuresFMPA: compteur.heuresFMPA,
          congesRestants: compteur.congesRestants,
          reposCompensatoire: compteur.reposCompensatoire,
          syncedAt: new Date().toISOString(),
        };

        await prisma.personnelFile.update({
          where: { id: file.id },
          data: { metadata: metadata as any },
        });

        updated++;
      } catch (error) {
        this.addError(compteur.matricule, (error as Error).message);
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
