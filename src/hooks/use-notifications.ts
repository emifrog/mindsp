import { useEffect, useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "./use-auth";
import { useToast } from "./use-toast";
import { supabase } from "@/lib/supabase";
import { fetcher } from "@/lib/fetcher";

interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  icon?: string | null;
  linkUrl?: string | null;
  read: boolean;
  priority: string;
  actionLabel?: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: AppNotification[];
  unreadCount: number;
}

export function useNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    user ? "/api/notifications" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  // Écouter les nouvelles notifications via Supabase Realtime
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(`notifications:${user.id}`);

    channel
      .on(
        "broadcast",
        { event: "new-notification" },
        ({ payload }: { payload: AppNotification }) => {
          mutate(
            (current) =>
              current
                ? {
                    notifications: [payload, ...current.notifications],
                    unreadCount: current.unreadCount + 1,
                  }
                : current,
            { revalidate: false }
          );

          toast({
            title: payload.title,
            description: payload.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast, mutate]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: "PATCH",
        });

        if (response.ok) {
          mutate(
            (current) =>
              current
                ? {
                    notifications: current.notifications.map((n) =>
                      n.id === notificationId ? { ...n, read: true } : n
                    ),
                    unreadCount: Math.max(0, current.unreadCount - 1),
                  }
                : current,
            { revalidate: false }
          );
        }
      } catch (error) {
        console.error("Erreur marquage notification:", error);
      }
    },
    [mutate]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
      });

      if (response.ok) {
        mutate(
          (current) =>
            current
              ? {
                  notifications: current.notifications.map((n) => ({
                    ...n,
                    read: true,
                  })),
                  unreadCount: 0,
                }
              : current,
          { revalidate: false }
        );
      }
    } catch (error) {
      console.error("Erreur marquage notifications:", error);
    }
  }, [mutate]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          mutate(
            (current) => {
              if (!current) return current;
              const notification = current.notifications.find(
                (n) => n.id === notificationId
              );
              return {
                notifications: current.notifications.filter(
                  (n) => n.id !== notificationId
                ),
                unreadCount:
                  notification && !notification.read
                    ? Math.max(0, current.unreadCount - 1)
                    : current.unreadCount,
              };
            },
            { revalidate: false }
          );
        }
      } catch (error) {
        console.error("Erreur suppression notification:", error);
      }
    },
    [mutate]
  );

  return {
    notifications,
    unreadCount,
    loading: isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: () => mutate(),
  };
}
