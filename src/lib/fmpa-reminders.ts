import { prisma } from "@/lib/prisma";
import { addDays, isBefore, startOfDay } from "date-fns";

export interface ReminderConfig {
  type:
    | "REGISTRATION"
    | "CONFIRMATION"
    | "REMINDER"
    | "CANCELLATION"
    | "MODIFICATION";
  daysBeforeEvent: number;
  title: string;
  message: string;
}

const REMINDER_CONFIGS: ReminderConfig[] = [
  {
    type: "REGISTRATION",
    daysBeforeEvent: 7,
    title: "Inscription FMPA - J-7",
    message:
      "N'oubliez pas de vous inscrire à la FMPA qui aura lieu dans 7 jours",
  },
  {
    type: "CONFIRMATION",
    daysBeforeEvent: 3,
    title: "Confirmation FMPA - J-3",
    message:
      "Merci de confirmer votre présence à la FMPA qui aura lieu dans 3 jours",
  },
  {
    type: "REMINDER",
    daysBeforeEvent: 1,
    title: "Rappel FMPA - Demain",
    message: "Rappel : la FMPA aura lieu demain",
  },
];

/**
 * Créer une notification pour un utilisateur
 */
export async function createNotification(
  userId: string,
  tenantId: string,
  type: "FMPA_REMINDER" | "FMPA_CANCELLED" | "FMPA_MODIFIED",
  title: string,
  message: string,
  fmpaId?: string
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        tenantId,
        type,
        title,
        message,
        linkUrl: fmpaId ? `/fmpa/${fmpaId}` : undefined,
        read: false,
      },
    });
  } catch (error) {
    console.error("Erreur création notification:", error);
  }
}

/**
 * Envoyer les rappels pour les FMPA à venir
 */
export async function sendFMPAReminders() {
  const today = startOfDay(new Date());

  for (const config of REMINDER_CONFIGS) {
    const targetDate = addDays(today, config.daysBeforeEvent);

    // Trouver les FMPA qui commencent à cette date
    const fmpas = await prisma.fMPA.findMany({
      where: {
        status: "PUBLISHED",
        startDate: {
          gte: targetDate,
          lt: addDays(targetDate, 1),
        },
      },
      include: {
        participations: {
          where: {
            status: {
              in: ["REGISTERED", "CONFIRMED"],
            },
          },
          include: {
            user: true,
          },
        },
      },
    });

    // Envoyer les notifications
    for (const fmpa of fmpas) {
      for (const participation of fmpa.participations) {
        const message = `${config.message}: "${fmpa.title}" le ${new Date(
          fmpa.startDate
        ).toLocaleDateString("fr-FR")} à ${fmpa.location}`;

        await createNotification(
          participation.userId,
          fmpa.tenantId,
          "FMPA_REMINDER",
          config.title,
          message,
          fmpa.id
        );
      }
    }
  }
}

/**
 * Notifier les participants d'une annulation
 */
export async function notifyFMPACancellation(fmpaId: string) {
  const fmpa = await prisma.fMPA.findUnique({
    where: { id: fmpaId },
    include: {
      participations: {
        where: {
          status: {
            notIn: ["CANCELLED"],
          },
        },
      },
    },
  });

  if (!fmpa) return;

  const message = `La FMPA "${fmpa.title}" prévue le ${new Date(
    fmpa.startDate
  ).toLocaleDateString("fr-FR")} a été annulée.`;

  for (const participation of fmpa.participations) {
    await createNotification(
      participation.userId,
      fmpa.tenantId,
      "FMPA_CANCELLED",
      "FMPA Annulée",
      message,
      fmpa.id
    );
  }
}

/**
 * Notifier les participants d'une modification
 */
export async function notifyFMPAModification(
  fmpaId: string,
  changes: string[]
) {
  const fmpa = await prisma.fMPA.findUnique({
    where: { id: fmpaId },
    include: {
      participations: {
        where: {
          status: {
            notIn: ["CANCELLED"],
          },
        },
      },
    },
  });

  if (!fmpa) return;

  const changesText = changes.join(", ");
  const message = `La FMPA "${fmpa.title}" a été modifiée. Changements: ${changesText}`;

  for (const participation of fmpa.participations) {
    await createNotification(
      participation.userId,
      fmpa.tenantId,
      "FMPA_MODIFIED",
      "FMPA Modifiée",
      message,
      fmpa.id
    );
  }
}

/**
 * Fonction à exécuter quotidiennement (cron job)
 */
export async function dailyFMPAReminders() {
  console.log("Envoi des rappels FMPA quotidiens...");
  await sendFMPAReminders();
  console.log("Rappels FMPA envoyés avec succès");
}
