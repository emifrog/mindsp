// Service de gestion des notifications push

import { prisma } from "@/lib/prisma";
import type {
  CreateNotificationData,
  NotificationType,
} from "@/types/notification";

export class NotificationService {
  /**
   * Créer une notification
   */
  static async create(tenantId: string, data: CreateNotificationData) {
    const notification = await prisma.notification.create({
      data: {
        tenantId,
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        icon: data.icon,
        linkUrl: data.linkUrl,
        priority: data.priority || "NORMAL",
        actionLabel: data.actionLabel,
        actionUrl: data.actionUrl,
        metadata: data.metadata,
        expiresAt: data.expiresAt,
      },
    });

    // Envoyer notification push si demandé
    if (data.sendPush) {
      await this.sendPushNotification(notification.id);
    }

    return notification;
  }

  /**
   * Créer des notifications en masse
   */
  static async createMany(
    tenantId: string,
    notifications: CreateNotificationData[]
  ) {
    const created = await prisma.notification.createMany({
      data: notifications.map((notif) => ({
        tenantId,
        userId: notif.userId,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        icon: notif.icon,
        linkUrl: notif.linkUrl,
        priority: notif.priority || "NORMAL",
        actionLabel: notif.actionLabel,
        actionUrl: notif.actionUrl,
        metadata: notif.metadata,
        expiresAt: notif.expiresAt,
      })),
    });

    return created;
  }

  /**
   * Marquer comme lu
   */
  static async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.update({
      where: {
        id: notificationId,
        userId, // Sécurité : vérifier que c'est bien l'utilisateur
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Marquer toutes comme lues
   */
  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Supprimer une notification
   */
  static async delete(notificationId: string, userId: string) {
    return await prisma.notification.delete({
      where: {
        id: notificationId,
        userId, // Sécurité
      },
    });
  }

  /**
   * Supprimer les notifications expirées
   */
  static async deleteExpired() {
    return await prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  /**
   * Récupérer les notifications d'un utilisateur
   */
  static async getUserNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
      types?: NotificationType[];
    }
  ) {
    const where: any = {
      userId,
    };

    if (options?.unreadOnly) {
      where.read = false;
    }

    if (options?.types && options.types.length > 0) {
      where.type = { in: options.types };
    }

    // Exclure les notifications expirées
    where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId,
          read: false,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      }),
    ]);

    return {
      notifications,
      total,
      unreadCount,
    };
  }

  /**
   * Statistiques des notifications
   */
  static async getStats(userId: string) {
    const [total, unread, byPriority] = await Promise.all([
      prisma.notification.count({
        where: { userId },
      }),
      prisma.notification.count({
        where: { userId, read: false },
      }),
      prisma.notification.groupBy({
        by: ["priority"],
        where: { userId },
        _count: true,
      }),
    ]);

    return {
      total,
      unread,
      byPriority: {
        low: byPriority.find((p) => p.priority === "LOW")?._count || 0,
        normal: byPriority.find((p) => p.priority === "NORMAL")?._count || 0,
        high: byPriority.find((p) => p.priority === "HIGH")?._count || 0,
        urgent: byPriority.find((p) => p.priority === "URGENT")?._count || 0,
      },
    };
  }

  /**
   * Envoyer une notification push navigateur
   */
  static async sendPushNotification(notificationId: string) {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: {
        id: true,
        userId: true,
        title: true,
        message: true,
        icon: true,
        linkUrl: true,
      },
    });

    if (!notification) {
      console.warn(`Notification ${notificationId} non trouvée`);
      return;
    }

    // Import dynamique pour éviter les erreurs circulaires
    const { WebPushService } = await import("@/lib/web-push-server");

    // Envoyer la notification push
    const result = await WebPushService.sendToUser(notification.userId, {
      title: notification.title,
      body: notification.message,
      icon: notification.icon || "/icon-192x192.png",
      badge: "/icon-96x96.png",
      data: {
        url: notification.linkUrl,
        notificationId: notification.id,
      },
    });

    // Marquer comme envoyée
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        pushSent: true,
        pushSentAt: new Date(),
      },
    });

    return result;
  }

  /**
   * Notifications pour nouveau message Chat
   */
  static async notifyChatMessage(
    tenantId: string,
    channelId: string,
    messageId: string,
    senderId: string,
    senderName: string,
    content: string,
    recipientIds: string[]
  ) {
    const notifications: CreateNotificationData[] = recipientIds
      .filter((id) => id !== senderId) // Ne pas notifier l'expéditeur
      .map((userId) => ({
        userId,
        type: "CHAT_MESSAGE",
        title: `Nouveau message de ${senderName}`,
        message: content.substring(0, 100),
        icon: "fluent-emoji:speech-balloon",
        linkUrl: `/chat?channel=${channelId}&message=${messageId}`,
        priority: "NORMAL",
        sendPush: true,
      }));

    if (notifications.length > 0) {
      await this.createMany(tenantId, notifications);
    }
  }

  /**
   * Notifications pour mention dans Chat
   */
  static async notifyChatMention(
    tenantId: string,
    channelId: string,
    messageId: string,
    senderId: string,
    senderName: string,
    content: string,
    mentionedUserIds: string[]
  ) {
    const notifications: CreateNotificationData[] = mentionedUserIds.map(
      (userId) => ({
        userId,
        type: "CHAT_MENTION",
        title: `${senderName} vous a mentionné`,
        message: content.substring(0, 100),
        icon: "fluent-emoji:waving-hand",
        linkUrl: `/chat?channel=${channelId}&message=${messageId}`,
        priority: "HIGH",
        actionLabel: "Voir le message",
        actionUrl: `/chat?channel=${channelId}&message=${messageId}`,
        sendPush: true,
      })
    );

    await this.createMany(tenantId, notifications);
  }

  /**
   * Notifications pour nouveau mail
   */
  static async notifyMailReceived(
    tenantId: string,
    messageId: string,
    senderId: string,
    senderName: string,
    subject: string,
    recipientIds: string[],
    isImportant: boolean = false
  ) {
    const notifications: CreateNotificationData[] = recipientIds.map(
      (userId) => ({
        userId,
        type: isImportant ? "MAIL_IMPORTANT" : "MAIL_RECEIVED",
        title: isImportant
          ? `📧 Mail important de ${senderName}`
          : `Nouveau mail de ${senderName}`,
        message: subject,
        icon: isImportant
          ? "fluent-emoji:exclamation-mark"
          : "fluent-emoji:incoming-envelope",
        linkUrl: `/mailbox?message=${messageId}`,
        priority: isImportant ? "HIGH" : "NORMAL",
        actionLabel: "Lire le mail",
        actionUrl: `/mailbox?message=${messageId}`,
        sendPush: true,
      })
    );

    await this.createMany(tenantId, notifications);
  }

  /**
   * Notifications pour invitation à un canal
   */
  static async notifyChannelInvite(
    tenantId: string,
    channelId: string,
    channelName: string,
    inviterId: string,
    inviterName: string,
    invitedUserIds: string[]
  ) {
    const notifications: CreateNotificationData[] = invitedUserIds.map(
      (userId) => ({
        userId,
        type: "CHAT_CHANNEL_INVITE",
        title: `Invitation au canal ${channelName}`,
        message: `${inviterName} vous a invité à rejoindre le canal`,
        icon: "fluent-emoji:envelope-with-arrow",
        linkUrl: `/chat?channel=${channelId}`,
        priority: "NORMAL",
        actionLabel: "Rejoindre",
        actionUrl: `/chat?channel=${channelId}`,
        sendPush: true,
      })
    );

    await this.createMany(tenantId, notifications);
  }
}
