/**
 * Connecteur Microsoft 365 — via Microsoft Graph API
 *
 * Synchronise :
 * - Outlook Mail ↔ Mailbox MindSP
 * - Outlook Calendar ↔ Agenda MindSP
 * - Teams Messages → Notifications MindSP
 * - OneDrive Files → Documents MindSP
 * - Azure AD Users → Users MindSP (SSO)
 *
 * Prérequis :
 * - Azure App Registration avec permissions Graph API
 * - Consentement admin Azure AD du SDIS
 * - Variables : MS365_TENANT_ID, MS365_CLIENT_ID, MS365_CLIENT_SECRET
 */

import { prisma } from "@/lib/prisma";
import type { SyncResult, SyncError } from "./types";
import type {
  Microsoft365Config,
  MSGraphMail,
  MSGraphMailSend,
  MSGraphEvent,
  MSGraphEventCreate,
  MSGraphTeamsMessage,
  MSGraphTeamsChannel,
  MSGraphDriveItem,
  MSGraphUser,
} from "./microsoft-types";

export class Microsoft365Connector {
  private config: Microsoft365Config;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private errors: SyncError[] = [];

  constructor(config: Microsoft365Config) {
    this.config = {
      scopes: ["https://graph.microsoft.com/.default"],
      debug: false,
      ...config,
    };
  }

  get name() {
    return "Microsoft365";
  }

  // ═══════════════════════════════════════════
  // Authentification OAuth2 (Client Credentials)
  // ═══════════════════════════════════════════

  /**
   * Obtenir un access token via client credentials flow
   * Pour les opérations app-only (sans utilisateur connecté)
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: this.config.scopes!.join(" "),
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`[Microsoft365] Token error: ${error}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);

    return this.accessToken!;
  }

  /**
   * Faire un appel à l'API Microsoft Graph
   */
  private async graphRequest<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAccessToken();
    const url = `https://graph.microsoft.com/v1.0${path}`;

    if (this.config.debug) {
      console.log(`[Microsoft365] ${options.method || "GET"} ${path}`);
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`[Microsoft365] Graph API ${response.status}: ${error}`);
    }

    if (response.status === 204) return {} as T;
    return (await response.json()) as T;
  }

  /**
   * Tester la connexion à Microsoft Graph
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.graphRequest("/organization");
      return true;
    } catch (error) {
      if (this.config.debug) {
        console.error("[Microsoft365] Connection test failed:", error);
      }
      return false;
    }
  }

  // ═══════════════════════════════════════════
  // Outlook Mail
  // ═══════════════════════════════════════════

  /**
   * Synchroniser les mails Outlook → Mailbox MindSP
   * Requiert permission : Mail.Read
   */
  async syncMails(
    tenantId: string,
    userEmail: string,
    options: { limit?: number; since?: Date } = {}
  ): Promise<SyncResult> {
    this.resetErrors();
    const startTime = Date.now();
    let created = 0, updated = 0, skipped = 0;

    const limit = options.limit || 50;
    const sinceFilter = options.since
      ? `&$filter=receivedDateTime ge ${options.since.toISOString()}`
      : "";

    const result = await this.graphRequest<{ value: MSGraphMail[] }>(
      `/users/${userEmail}/messages?$top=${limit}&$orderby=receivedDateTime desc${sinceFilter}`
    );

    // Trouver l'utilisateur MindSP correspondant
    const user = await prisma.user.findFirst({
      where: { tenantId, email: userEmail },
    });

    if (!user) {
      this.addError(userEmail, `Utilisateur ${userEmail} non trouvé dans MindSP`);
      return this.createSyncResult(created, updated, skipped, startTime);
    }

    for (const mail of result.value) {
      try {
        // Vérifier si déjà importé via externalId
        const existing = await prisma.mailMessage.findFirst({
          where: { tenantId, externalId: mail.id } as any,
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Créer le mail dans MindSP
        const message = await prisma.mailMessage.create({
          data: {
            tenantId,
            fromId: user.id,
            subject: mail.subject || "(Sans objet)",
            body: mail.body.content,
            isImportant: mail.importance === "high",
            externalId: mail.id,
            externalSource: "OUTLOOK",
            createdAt: new Date(mail.receivedDateTime),
          } as any,
        });

        // Créer les destinataires
        for (const to of mail.toRecipients) {
          const recipient = await prisma.user.findFirst({
            where: { tenantId, email: to.emailAddress.address },
          });
          if (recipient) {
            await prisma.mailRecipient.create({
              data: {
                messageId: message.id,
                userId: recipient.id,
                type: "TO",
                isRead: mail.isRead,
              },
            });
          }
        }

        created++;
      } catch (error) {
        this.addError(mail.id, (error as Error).message);
      }
    }

    return this.createSyncResult(created, updated, skipped, startTime);
  }

  /**
   * Envoyer un mail via Outlook
   * Requiert permission : Mail.Send
   */
  async sendMail(userEmail: string, mail: MSGraphMailSend): Promise<boolean> {
    try {
      await this.graphRequest(`/users/${userEmail}/sendMail`, {
        method: "POST",
        body: JSON.stringify({ message: mail }),
      });
      return true;
    } catch (error) {
      if (this.config.debug) {
        console.error("[Microsoft365] Send mail error:", error);
      }
      return false;
    }
  }

  // ═══════════════════════════════════════════
  // Outlook Calendar
  // ═══════════════════════════════════════════

  /**
   * Synchroniser le calendrier Outlook → Agenda MindSP
   * Requiert permission : Calendars.Read
   */
  async syncCalendar(
    tenantId: string,
    userEmail: string,
    options: { from?: Date; to?: Date } = {}
  ): Promise<SyncResult> {
    this.resetErrors();
    const startTime = Date.now();
    let created = 0, updated = 0, skipped = 0;

    const from = options.from || new Date();
    const to = options.to || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // +90 jours

    const result = await this.graphRequest<{ value: MSGraphEvent[] }>(
      `/users/${userEmail}/calendarView?startDateTime=${from.toISOString()}&endDateTime=${to.toISOString()}&$top=100`
    );

    const user = await prisma.user.findFirst({
      where: { tenantId, email: userEmail },
    });

    if (!user) {
      this.addError(userEmail, `Utilisateur ${userEmail} non trouvé`);
      return this.createSyncResult(created, updated, skipped, startTime);
    }

    for (const event of result.value) {
      try {
        const existing = await prisma.calendarEvent.findFirst({
          where: { tenantId, externalId: event.id, externalSource: "OUTLOOK" } as any,
        });

        if (existing) {
          // Mettre à jour si modifié
          await prisma.calendarEvent.update({
            where: { id: existing.id },
            data: {
              title: event.subject,
              description: event.body?.content,
              location: event.location?.displayName,
              startDate: new Date(event.start.dateTime),
              endDate: new Date(event.end.dateTime),
              allDay: event.isAllDay,
            },
          });
          updated++;
          continue;
        }

        // Déterminer le type d'événement depuis les catégories Outlook
        const type = this.mapOutlookCategoryToEventType(event.categories);

        await prisma.calendarEvent.create({
          data: {
            tenantId,
            title: event.subject,
            description: event.body?.content,
            location: event.location?.displayName,
            startDate: new Date(event.start.dateTime),
            endDate: new Date(event.end.dateTime),
            allDay: event.isAllDay,
            type: type as any,
            createdBy: user.id,
            externalId: event.id,
            externalSource: "OUTLOOK",
          } as any,
        });

        created++;
      } catch (error) {
        this.addError(event.id, (error as Error).message);
      }
    }

    return this.createSyncResult(created, updated, skipped, startTime);
  }

  /**
   * Créer un événement dans Outlook Calendar
   * Requiert permission : Calendars.ReadWrite
   */
  async createCalendarEvent(
    userEmail: string,
    event: MSGraphEventCreate
  ): Promise<MSGraphEvent | null> {
    try {
      return await this.graphRequest<MSGraphEvent>(
        `/users/${userEmail}/events`,
        {
          method: "POST",
          body: JSON.stringify(event),
        }
      );
    } catch (error) {
      if (this.config.debug) {
        console.error("[Microsoft365] Create event error:", error);
      }
      return null;
    }
  }

  /**
   * Pousser un FMPA/Formation vers Outlook Calendar de tous les participants
   * Requiert permission : Calendars.ReadWrite
   */
  async pushEventToOutlook(
    tenantId: string,
    title: string,
    description: string,
    location: string,
    startDate: Date,
    endDate: Date,
    participantEmails: string[]
  ): Promise<{ success: number; failed: number }> {
    let success = 0, failed = 0;

    const event: MSGraphEventCreate = {
      subject: `[MindSP] ${title}`,
      body: {
        contentType: "html",
        content: description,
      },
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "Europe/Paris",
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "Europe/Paris",
      },
      location: { displayName: location },
      attendees: participantEmails.map((email) => ({
        emailAddress: { address: email },
        type: "required" as const,
      })),
      categories: ["MindSP"],
    };

    // Envoyer depuis le premier participant (organisateur)
    const organizer = participantEmails[0];
    if (organizer) {
      const result = await this.createCalendarEvent(organizer, event);
      if (result) {
        success = participantEmails.length;
      } else {
        failed = participantEmails.length;
      }
    }

    return { success, failed };
  }

  // ═══════════════════════════════════════════
  // Teams
  // ═══════════════════════════════════════════

  /**
   * Envoyer une notification dans un canal Teams
   * Requiert permission : ChannelMessage.Send
   */
  async sendTeamsMessage(
    teamId: string,
    channelId: string,
    content: string
  ): Promise<boolean> {
    try {
      await this.graphRequest(
        `/teams/${teamId}/channels/${channelId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            body: {
              contentType: "html",
              content,
            },
          }),
        }
      );
      return true;
    } catch (error) {
      if (this.config.debug) {
        console.error("[Microsoft365] Teams message error:", error);
      }
      return false;
    }
  }

  /**
   * Lister les canaux d'une équipe Teams
   * Requiert permission : Channel.ReadBasic.All
   */
  async listTeamsChannels(teamId: string): Promise<MSGraphTeamsChannel[]> {
    try {
      const result = await this.graphRequest<{ value: MSGraphTeamsChannel[] }>(
        `/teams/${teamId}/channels`
      );
      return result.value;
    } catch {
      return [];
    }
  }

  /**
   * Envoyer une alerte MindSP dans Teams
   * Ex: "🔥 FMPA Manœuvre incendie - Demain 14h00 - 12 inscrits"
   */
  async sendTeamsAlert(
    teamId: string,
    channelId: string,
    alert: {
      title: string;
      type: "FMPA" | "FORMATION" | "ALERTE" | "INFO";
      message: string;
      linkUrl?: string;
    }
  ): Promise<boolean> {
    const icons: Record<string, string> = {
      FMPA: "🔥",
      FORMATION: "🎓",
      ALERTE: "⚠️",
      INFO: "ℹ️",
    };

    const icon = icons[alert.type] || "📢";
    const link = alert.linkUrl
      ? `<br/><a href="https://mindsp.vercel.app${alert.linkUrl}">Voir dans MindSP →</a>`
      : "";

    const html = `<b>${icon} ${alert.title}</b><br/>${alert.message}${link}`;

    return this.sendTeamsMessage(teamId, channelId, html);
  }

  // ═══════════════════════════════════════════
  // OneDrive / SharePoint
  // ═══════════════════════════════════════════

  /**
   * Lister les fichiers d'un dossier OneDrive
   * Requiert permission : Files.Read.All
   */
  async listFiles(
    userEmail: string,
    folderPath: string = "/root/children"
  ): Promise<MSGraphDriveItem[]> {
    try {
      const result = await this.graphRequest<{ value: MSGraphDriveItem[] }>(
        `/users/${userEmail}/drive${folderPath}`
      );
      return result.value;
    } catch {
      return [];
    }
  }

  /**
   * Synchroniser un dossier OneDrive → Documents MindSP
   * Requiert permission : Files.Read.All
   */
  async syncDocuments(
    tenantId: string,
    userEmail: string,
    folderPath: string = "/root:/SDIS:/children"
  ): Promise<SyncResult> {
    this.resetErrors();
    const startTime = Date.now();
    let created = 0, updated = 0, skipped = 0;

    const files = await this.listFiles(userEmail, folderPath);

    const user = await prisma.user.findFirst({
      where: { tenantId, email: userEmail },
    });

    if (!user) {
      this.addError(userEmail, `Utilisateur ${userEmail} non trouvé`);
      return this.createSyncResult(created, updated, skipped, startTime);
    }

    for (const file of files) {
      // Ignorer les dossiers
      if (file.folder) continue;

      try {
        const existing = await prisma.portalDocument.findFirst({
          where: { tenantId, externalId: file.id } as any,
        });

        if (existing) {
          skipped++;
          continue;
        }

        await prisma.portalDocument.create({
          data: {
            tenantId,
            name: file.name,
            description: `Importé depuis OneDrive le ${new Date().toLocaleDateString("fr-FR")}`,
            fileUrl: file.webUrl,
            fileSize: file.size,
            mimeType: file.file?.mimeType || "application/octet-stream",
            category: "AUTRE",
            uploadedById: user.id,
            externalId: file.id,
            externalSource: "ONEDRIVE",
          } as any,
        });

        created++;
      } catch (error) {
        this.addError(file.id, (error as Error).message);
      }
    }

    return this.createSyncResult(created, updated, skipped, startTime);
  }

  // ═══════════════════════════════════════════
  // Azure AD Users (SSO)
  // ═══════════════════════════════════════════

  /**
   * Synchroniser les utilisateurs Azure AD → Users MindSP
   * Requiert permission : User.Read.All
   */
  async syncUsers(
    tenantId: string,
    options: { department?: string } = {}
  ): Promise<SyncResult> {
    this.resetErrors();
    const startTime = Date.now();
    let created = 0, updated = 0, skipped = 0;

    let filter = "";
    if (options.department) {
      filter = `?$filter=department eq '${options.department}'`;
    }

    const result = await this.graphRequest<{ value: MSGraphUser[] }>(
      `/users${filter}&$select=id,displayName,givenName,surname,mail,userPrincipalName,jobTitle,department,officeLocation,mobilePhone&$top=999`
    );

    for (const adUser of result.value) {
      if (!adUser.mail) continue;

      try {
        const existing = await prisma.user.findFirst({
          where: { tenantId, email: adUser.mail },
        });

        if (existing) {
          // Mettre à jour les infos depuis Azure AD
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              firstName: adUser.givenName || existing.firstName,
              lastName: adUser.surname || existing.lastName,
              phone: adUser.mobilePhone || existing.phone,
            },
          });
          updated++;
          continue;
        }

        // Créer l'utilisateur (sans mot de passe — SSO only)
        await prisma.user.create({
          data: {
            tenantId,
            email: adUser.mail,
            firstName: adUser.givenName || adUser.displayName.split(" ")[0],
            lastName: adUser.surname || adUser.displayName.split(" ").slice(1).join(" "),
            passwordHash: "", // Pas de mot de passe — authentification via SSO
            phone: adUser.mobilePhone,
            role: "USER",
            status: "ACTIVE",
          },
        });

        created++;
      } catch (error) {
        this.addError(adUser.id, (error as Error).message);
      }
    }

    return this.createSyncResult(created, updated, skipped, startTime);
  }

  // ═══════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════

  /**
   * Mapper les catégories Outlook vers les types d'événements MindSP
   */
  private mapOutlookCategoryToEventType(categories: string[]): string {
    const map: Record<string, string> = {
      FMPA: "FMPA",
      Formation: "FORMATION",
      Réunion: "MEETING",
      Intervention: "INTERVENTION",
      Garde: "GARDE",
      MindSP: "FMPA",
    };

    for (const cat of categories) {
      if (map[cat]) return map[cat];
    }
    return "MEETING";
  }

  private resetErrors() {
    this.errors = [];
  }

  private addError(externalId: string, message: string) {
    this.errors.push({ externalId, message });
    if (this.config.debug) {
      console.error(`[Microsoft365] Erreur ${externalId}: ${message}`);
    }
  }

  private createSyncResult(
    created: number,
    updated: number,
    skipped: number,
    startTime: number
  ): SyncResult {
    return {
      created,
      updated,
      skipped,
      errors: [...this.errors],
      duration: Date.now() - startTime,
      syncedAt: new Date(),
    };
  }
}
