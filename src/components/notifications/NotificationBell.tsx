"use client";

import { useState } from "react";
import { useNotifications } from "@/hooks/use-notifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { NOTIFICATION_ICONS, PRIORITY_COLORS } from "@/types/notification";
import type {
  NotificationType,
  NotificationPriority,
} from "@/types/notification";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
    setOpen(false);
  };

  const getNotificationIcon = (type: NotificationType, customIcon?: string) => {
    if (customIcon) return customIcon;
    return NOTIFICATION_ICONS[type] || "fluent-emoji:bell";
  };

  const getPriorityColor = (priority: NotificationPriority) => {
    return PRIORITY_COLORS[priority] || "text-foreground";
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Icon name={Icons.nav.notifications} size="md" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="h-auto p-1 text-xs"
            >
              <Icon name={Icons.action.check} size="sm" className="mr-1" />
              Tout marquer lu
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Icon
              name="fluent-emoji:bell"
              size="2xl"
              className="mx-auto mb-2 opacity-50"
            />
            <p className="text-sm text-muted-foreground">Aucune notification</p>
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="cursor-pointer p-0"
                onClick={() => handleNotificationClick(notification.id)}
                asChild
              >
                <Link
                  href={notification.linkUrl || "#"}
                  className={cn(
                    "flex gap-3 p-3 transition-colors hover:bg-accent",
                    !notification.read && "bg-accent/50"
                  )}
                >
                  <div className="mt-0.5 shrink-0">
                    <Icon
                      name={getNotificationIcon(
                        notification.type,
                        notification.icon
                      )}
                      size="lg"
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "text-sm font-medium leading-tight",
                          getPriorityColor(notification.priority)
                        )}
                      >
                        {notification.title}
                      </p>
                      {notification.priority === "URGENT" && (
                        <Badge
                          variant="destructive"
                          className="shrink-0 text-xs"
                        >
                          Urgent
                        </Badge>
                      )}
                      {notification.priority === "HIGH" && (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          Important
                        </Badge>
                      )}
                    </div>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                      {notification.actionLabel && (
                        <span className="text-xs font-medium text-primary">
                          {notification.actionLabel} →
                        </span>
                      )}
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}

        {notifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/notifications"
                className="w-full py-2 text-center text-sm font-medium text-primary"
              >
                Voir toutes les notifications ({notifications.length})
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
