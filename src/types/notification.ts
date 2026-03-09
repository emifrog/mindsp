// Types pour le système de notifications push

export type NotificationType =
  // FMPA
  | "FMPA_CREATED"
  | "FMPA_UPDATED"
  | "FMPA_CANCELLED"
  | "FMPA_REMINDER"
  // Chat
  | "CHAT_MESSAGE"
  | "CHAT_MENTION"
  | "CHAT_REACTION"
  | "CHAT_CHANNEL_INVITE"
  // Mailbox
  | "MAIL_RECEIVED"
  | "MAIL_IMPORTANT"
  // Formation
  | "FORMATION_APPROVED"
  | "FORMATION_REJECTED"
  | "FORMATION_REMINDER"
  // Événements
  | "EVENT_INVITATION"
  | "EVENT_REMINDER"
  | "EVENT_UPDATED"
  // Système
  | "SYSTEM"
  | "ANNOUNCEMENT";

export type NotificationPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface Notification {
  id: string;
  tenantId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  linkUrl?: string;
  read: boolean;
  readAt?: Date;
  priority: NotificationPriority;
  actionLabel?: string;
  actionUrl?: string;
  pushSent: boolean;
  pushSentAt?: Date;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
  createdAt: Date;
}

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  linkUrl?: string;
  priority?: NotificationPriority;
  actionLabel?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: Date;
  sendPush?: boolean; // Envoyer notification push navigateur
}

export interface NotificationStats {
  total: number;
  unread: number;
  byPriority: {
    low: number;
    normal: number;
    high: number;
    urgent: number;
  };
  byType: Record<NotificationType, number>;
}

export interface NotificationPreferences {
  userId: string;
  // Push notifications navigateur
  browserPushEnabled: boolean;

  // Types de notifications activées
  enabledTypes: NotificationType[];

  // Paramètres par type
  chatNotifications: boolean;
  mailNotifications: boolean;
  fmpaNotifications: boolean;
  formationNotifications: boolean;
  eventNotifications: boolean;
  systemNotifications: boolean;

  // Horaires silencieux
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // Format "HH:mm"
  quietHoursEnd?: string;

  // Groupement
  groupSimilar: boolean;
  maxNotificationsPerGroup: number;
}

// Configuration des icônes par type
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  // FMPA
  FMPA_CREATED: "🔥",
  FMPA_UPDATED: "📝",
  FMPA_CANCELLED: "❌",
  FMPA_REMINDER: "⏰",

  // Chat
  CHAT_MESSAGE: "💬",
  CHAT_MENTION: "👋",
  CHAT_REACTION: "❤️",
  CHAT_CHANNEL_INVITE: "📨",

  // Mailbox
  MAIL_RECEIVED: "📨",
  MAIL_IMPORTANT: "❗",

  // Formation
  FORMATION_APPROVED: "✅",
  FORMATION_REJECTED: "❌",
  FORMATION_REMINDER: "🎓",

  // Événements
  EVENT_INVITATION: "📅",
  EVENT_REMINDER: "⏰",
  EVENT_UPDATED: "📝",

  // Système
  SYSTEM: "ℹ️",
  ANNOUNCEMENT: "📢",
};

// Couleurs par priorité
export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  LOW: "text-muted-foreground",
  NORMAL: "text-foreground",
  HIGH: "text-orange-500",
  URGENT: "text-red-500",
};

// Badges par priorité
export const PRIORITY_BADGES: Record<NotificationPriority, string> = {
  LOW: "bg-gray-100 text-gray-800",
  NORMAL: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};
