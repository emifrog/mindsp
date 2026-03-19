"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  NOTIFICATION_ICONS,
  PRIORITY_COLORS,
  PRIORITY_BADGES,
} from "@/types/notification";
import type {
  Notification as AppNotification,
  NotificationType,
  NotificationPriority,
} from "@/types/notification";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const getNotificationIcon = (type: NotificationType, customIcon?: string) => {
    if (customIcon) return customIcon;
    return NOTIFICATION_ICONS[type] || "🔔";
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    return PRIORITY_COLORS[priority] || "text-foreground";
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    return PRIORITY_BADGES[priority];
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === "unread" && notif.read) return false;
    if (typeFilter && !notif.type.includes(typeFilter)) return false;
    return true;
  });

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
  };

  const groupedNotifications = filteredNotifications.reduce(
    (acc: Record<string, any[]>, notif) => {
      const today = new Date();
      const notifDate = new Date(notif.createdAt);
      const diffDays = Math.floor(
        (today.getTime() - notifDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let group = "Plus ancien";
      if (diffDays === 0) group = "Aujourd'hui";
      else if (diffDays === 1) group = "Hier";
      else if (diffDays < 7) group = "Cette semaine";
      else if (diffDays < 30) group = "Ce mois-ci";

      if (!acc[group]) acc[group] = [];
      acc[group].push(notif);
      return acc;
    },
    {}
  );

  return (
    <div className="container mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-bold">
            <Icon name={Icons.nav.notifications} size="xl" />
            Notifications
          </h1>
          <p className="mt-1 text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
              : "Tout est lu"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Icon name={Icons.action.check} size="sm" className="mr-2" />
              Tout marquer lu
            </Button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <Tabs
        value={filter}
        onValueChange={(v) => setFilter(v as "all" | "unread")}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="all">Toutes ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Non lues ({unreadCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filtres par type */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={typeFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setTypeFilter(null)}
        >
          Toutes
        </Button>
        <Button
          variant={typeFilter === "CHAT" ? "default" : "outline"}
          size="sm"
          onClick={() => setTypeFilter("CHAT")}
        >
          💬 Chat
        </Button>
        <Button
          variant={typeFilter === "MAIL" ? "default" : "outline"}
          size="sm"
          onClick={() => setTypeFilter("MAIL")}
        >
          📧 Mail
        </Button>
        <Button
          variant={typeFilter === "FMPA" ? "default" : "outline"}
          size="sm"
          onClick={() => setTypeFilter("FMPA")}
        >
          🔥 FMPA
        </Button>
        <Button
          variant={typeFilter === "FORMATION" ? "default" : "outline"}
          size="sm"
          onClick={() => setTypeFilter("FORMATION")}
        >
          🎓 Formation
        </Button>
        <Button
          variant={typeFilter === "EVENT" ? "default" : "outline"}
          size="sm"
          onClick={() => setTypeFilter("EVENT")}
        >
          📅 Événement
        </Button>
      </div>

      {/* Liste des notifications */}
      {filteredNotifications.length === 0 ? (
        <div className="py-16 text-center">
          <Icon
            name="🔔"
            size="2xl"
            className="mx-auto mb-4 opacity-50"
          />
          <h3 className="mb-2 text-lg font-semibold">Aucune notification</h3>
          <p className="text-muted-foreground">
            {filter === "unread"
              ? "Vous avez tout lu !"
              : "Vous n'avez pas encore de notifications"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(
            ([group, notifs]: [string, any[]]) => (
              <div key={group}>
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                  {group}
                </h2>
                <div className="space-y-2">
                  {notifs.map((notification: any) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "rounded-lg border p-4 transition-colors hover:bg-accent",
                        !notification.read && "border-primary/20 bg-accent/50"
                      )}
                    >
                      <div className="flex gap-4">
                        {/* Icône */}
                        <div className="mt-1 shrink-0">
                          <Icon
                            name={getNotificationIcon(
                              notification.type,
                              notification.icon
                            )}
                            size="xl"
                          />
                        </div>

                        {/* Contenu */}
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <h3
                              className={cn(
                                "font-semibold",
                                getPriorityColor(notification.priority)
                              )}
                            >
                              {notification.title}
                            </h3>
                            <div className="flex shrink-0 items-center gap-2">
                              {notification.priority === "URGENT" && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Urgent
                                </Badge>
                              )}
                              {notification.priority === "HIGH" && (
                                <Badge variant="secondary" className="text-xs">
                                  Important
                                </Badge>
                              )}
                              {!notification.read && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                          </div>

                          <p className="mb-3 text-sm text-muted-foreground">
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                {
                                  addSuffix: true,
                                  locale: fr,
                                }
                              )}
                            </span>

                            <div className="flex items-center gap-2">
                              {notification.linkUrl && (
                                <Link href={notification.linkUrl}>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() =>
                                      handleNotificationClick(notification)
                                    }
                                  >
                                    {notification.actionLabel || "Voir"} →
                                  </Button>
                                </Link>
                              )}
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                >
                                  <Icon name={Icons.action.check} size="sm" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  deleteNotification(notification.id)
                                }
                              >
                                <Icon name={Icons.action.delete} size="sm" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
