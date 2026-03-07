/**
 * Service de notifications centralisé
 * Gère les notifications in-app, push et email
 */

import { prisma } from "./prisma";
import { NotificationType } from "@prisma/client";

export interface NotificationData {
  userId: string;
  tenantId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Créer une notification in-app
 */
export async function createNotification(data: NotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        tenantId: data.tenantId,
        type: data.type,
        title: data.title,
        message: data.message,
        linkUrl: data.link,
        read: false,
      },
    });

    // Note: Les notifications temps réel sont gérées via Supabase Realtime côté client

    return notification;
  } catch (error) {
    console.error("Erreur création notification:", error);
    return null;
  }
}

/**
 * Créer des notifications pour plusieurs utilisateurs
 */
export async function createBulkNotifications(
  userIds: string[],
  data: Omit<NotificationData, "userId">
) {
  const notifications = await Promise.all(
    userIds.map((userId) =>
      createNotification({
        ...data,
        userId,
      })
    )
  );

  return notifications.filter((n) => n !== null);
}

/**
 * Marquer une notification comme lue
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    });
    return true;
  } catch (error) {
    console.error("Erreur marquage notification:", error);
    return false;
  }
}

/**
 * Marquer toutes les notifications d'un utilisateur comme lues
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error("Erreur marquage notifications:", error);
    return false;
  }
}

/**
 * Récupérer les notifications d'un utilisateur
 */
export async function getUserNotifications(
  userId: string,
  options: { unreadOnly?: boolean; limit?: number } = {}
) {
  const { unreadOnly = false, limit = 50 } = options;

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        ...(unreadOnly ? { read: false } : {}),
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return notifications;
  } catch (error) {
    console.error("Erreur récupération notifications:", error);
    return [];
  }
}

/**
 * Supprimer les anciennes notifications (> 30 jours)
 */
export async function cleanOldNotifications() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  try {
    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
        read: true,
      },
    });

    console.log(`🧹 ${result.count} anciennes notifications supprimées`);
    return result.count;
  } catch (error) {
    console.error("Erreur nettoyage notifications:", error);
    return 0;
  }
}

/**
 * Notifications spécifiques FMPA
 */
export async function notifyFMPAInvitation(
  userId: string,
  tenantId: string,
  fmpaTitle: string,
  fmpaId: string
) {
  return createNotification({
    userId,
    tenantId,
    type: "FMPA_CREATED",
    title: "Nouvelle FMPA disponible",
    message: `Une nouvelle FMPA "${fmpaTitle}" est disponible pour inscription`,
    link: `/fmpa/${fmpaId}`,
  });
}

export async function notifyFMPAReminder(
  userId: string,
  tenantId: string,
  fmpaTitle: string,
  fmpaId: string,
  startDate: Date
) {
  return createNotification({
    userId,
    tenantId,
    type: "FMPA_REMINDER",
    title: "Rappel FMPA",
    message: `La FMPA "${fmpaTitle}" commence demain à ${startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`,
    link: `/fmpa/${fmpaId}`,
  });
}

export async function notifyParticipationApproved(
  userId: string,
  tenantId: string,
  fmpaTitle: string,
  fmpaId: string
) {
  return createNotification({
    userId,
    tenantId,
    type: "FORMATION_APPROVED",
    title: "Inscription approuvée",
    message: `Votre inscription à "${fmpaTitle}" a été approuvée`,
    link: `/fmpa/${fmpaId}`,
  });
}

export async function notifyParticipationRejected(
  userId: string,
  tenantId: string,
  fmpaTitle: string,
  fmpaId: string
) {
  return createNotification({
    userId,
    tenantId,
    type: "FORMATION_REJECTED",
    title: "Inscription refusée",
    message: `Votre inscription à "${fmpaTitle}" a été refusée`,
    link: `/fmpa/${fmpaId}`,
  });
}

export async function notifyFMPACancelled(
  userIds: string[],
  tenantId: string,
  fmpaTitle: string
) {
  return createBulkNotifications(userIds, {
    tenantId,
    type: "FMPA_CANCELLED",
    title: "FMPA annulée",
    message: `La FMPA "${fmpaTitle}" a été annulée`,
  });
}
