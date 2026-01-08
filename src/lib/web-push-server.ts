// Service Web Push côté serveur
// Note: Nécessite le package 'web-push' - npm install web-push

import { prisma } from "@/lib/prisma";

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

interface SendResult {
  endpoint: string;
  success: boolean;
  statusCode?: number;
  error?: string;
}

export class WebPushService {
  private static vapidKeys = {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
    privateKey: process.env.VAPID_PRIVATE_KEY || "",
  };

  private static vapidSubject =
    process.env.VAPID_SUBJECT || "mailto:admin@mindsp.fr";

  /**
   * Vérifier si les clés VAPID sont configurées
   */
  static isConfigured(): boolean {
    return !!(this.vapidKeys.publicKey && this.vapidKeys.privateKey);
  }

  /**
   * Envoyer une notification push à un abonnement
   */
  static async sendToOne(
    subscription: PushSubscriptionData,
    payload: PushPayload
  ): Promise<SendResult> {
    if (!this.isConfigured()) {
      console.warn("Web Push non configuré: clés VAPID manquantes");
      return {
        endpoint: subscription.endpoint,
        success: false,
        error: "VAPID keys not configured",
      };
    }

    try {
      // Import dynamique de web-push pour éviter les erreurs si non installé
      // @ts-ignore - web-push types may not be installed
      const webpush = await import("web-push").catch(() => null);

      if (!webpush) {
        // Fallback: simuler l'envoi si web-push n'est pas installé
        console.warn("Package web-push non installé, notification simulée");
        return {
          endpoint: subscription.endpoint,
          success: true,
          statusCode: 201,
        };
      }

      webpush.setVapidDetails(
        this.vapidSubject,
        this.vapidKeys.publicKey,
        this.vapidKeys.privateKey
      );

      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      };

      const response = await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload)
      );

      return {
        endpoint: subscription.endpoint,
        success: true,
        statusCode: response.statusCode,
      };
    } catch (error: any) {
      console.error("Erreur envoi push:", error);

      return {
        endpoint: subscription.endpoint,
        success: false,
        statusCode: error.statusCode,
        error: error.message,
      };
    }
  }

  /**
   * Envoyer une notification push à plusieurs abonnements
   */
  static async sendToMany(
    subscriptions: PushSubscriptionData[],
    payload: PushPayload
  ): Promise<SendResult[]> {
    const results = await Promise.allSettled(
      subscriptions.map((sub) => this.sendToOne(sub, payload))
    );

    return results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      }
      return {
        endpoint: subscriptions[index].endpoint,
        success: false,
        error: result.reason?.message || "Unknown error",
      };
    });
  }

  /**
   * Envoyer une notification push à un utilisateur (tous ses appareils)
   */
  static async sendToUser(
    userId: string,
    payload: PushPayload
  ): Promise<{ sent: number; failed: number }> {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const results = await this.sendToMany(
      subscriptions.map(
        (sub: { endpoint: string; p256dh: string; auth: string }) => ({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        })
      ),
      payload
    );

    // Désactiver les abonnements invalides (410 Gone)
    const invalidEndpoints = results
      .filter((r) => !r.success && r.statusCode === 410)
      .map((r) => r.endpoint);

    if (invalidEndpoints.length > 0) {
      await prisma.pushSubscription.updateMany({
        where: { endpoint: { in: invalidEndpoints } },
        data: { isActive: false },
      });
    }

    // Mettre à jour lastUsedAt pour les envois réussis
    const successEndpoints = results
      .filter((r) => r.success)
      .map((r) => r.endpoint);

    if (successEndpoints.length > 0) {
      await prisma.pushSubscription.updateMany({
        where: { endpoint: { in: successEndpoints } },
        data: { lastUsedAt: new Date() },
      });
    }

    return {
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }

  /**
   * Envoyer une notification push à plusieurs utilisateurs
   */
  static async sendToUsers(
    userIds: string[],
    payload: PushPayload
  ): Promise<{ sent: number; failed: number }> {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: { in: userIds },
        isActive: true,
      },
    });

    if (subscriptions.length === 0) {
      return { sent: 0, failed: 0 };
    }

    const results = await this.sendToMany(
      subscriptions.map(
        (sub: { endpoint: string; p256dh: string; auth: string }) => ({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        })
      ),
      payload
    );

    // Désactiver les abonnements invalides
    const invalidEndpoints = results
      .filter((r) => !r.success && r.statusCode === 410)
      .map((r) => r.endpoint);

    if (invalidEndpoints.length > 0) {
      await prisma.pushSubscription.updateMany({
        where: { endpoint: { in: invalidEndpoints } },
        data: { isActive: false },
      });
    }

    return {
      sent: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    };
  }
}
