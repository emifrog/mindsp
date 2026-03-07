"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "./use-auth";
import {
  initRealtime,
  disconnectRealtime,
  joinChannel,
  leaveChannel,
  sendMessage as sendRealtimeMessage,
  sendTypingStart,
  sendTypingStop,
  onMessage,
  onTyping,
  onStopTyping,
  onPresenceChange,
  getOnlineUsers,
} from "@/lib/realtime-client";
import type {
  ChatMessage,
  ChatReaction,
  PresenceStatus,
  SendMessageData,
} from "@/types/chat";

export function useChatSocket() {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!user?.id || !user?.tenantId || initializedRef.current) {
      return;
    }

    initRealtime(user.id, user.tenantId);
    initializedRef.current = true;
    setIsConnected(true);

    return () => {
      disconnectRealtime();
      initializedRef.current = false;
      setIsConnected(false);
    };
  }, [user?.id, user?.tenantId]);

  return {
    isConnected,
  };
}

export function useChatChannel(channelId: string | null) {
  const { isConnected } = useChatSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!channelId || !isConnected) {
      return;
    }

    // Rejoindre le canal
    joinChannel(channelId);

    // Écouter les nouveaux messages
    const unsubMessage = onMessage((message: ChatMessage) => {
      if (message.channelId === channelId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Écouter les typing indicators
    const unsubTyping = onTyping((data) => {
      if (data.channelId === channelId) {
        setTypingUsers((prev) => new Set(prev).add(data.userId));
      }
    });

    const unsubStopTyping = onStopTyping((data) => {
      if (data.channelId === channelId) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    });

    return () => {
      leaveChannel(channelId);
      unsubMessage();
      unsubTyping();
      unsubStopTyping();
    };
  }, [channelId, isConnected]);

  const sendMessage = useCallback(
    async (data: Omit<SendMessageData, "channelId">) => {
      if (!channelId) return;

      // Appeler l'API pour créer le message en DB
      const response = await fetch(`/api/chat/channels/${channelId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const message = await response.json();
        // Broadcast via Supabase Realtime
        await sendRealtimeMessage(channelId, message);
      }
    },
    [channelId]
  );

  const editMessage = useCallback(
    async (messageId: string, content: string) => {
      await fetch(`/api/chat/messages/${messageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
    },
    []
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    await fetch(`/api/chat/messages/${messageId}`, {
      method: "DELETE",
    });
  }, []);

  const addReaction = useCallback(
    async (messageId: string, emoji: string) => {
      await fetch(`/api/chat/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
    },
    []
  );

  const removeReaction = useCallback(
    async (messageId: string, emoji: string) => {
      await fetch(`/api/chat/messages/${messageId}/reactions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
    },
    []
  );

  const startTyping = useCallback(() => {
    if (!channelId) return;
    sendTypingStart(channelId);
  }, [channelId]);

  const stopTyping = useCallback(() => {
    if (!channelId) return;
    sendTypingStop(channelId);
  }, [channelId]);

  return {
    messages,
    setMessages,
    typingUsers: Array.from(typingUsers),
    sendMessage,
    editMessage,
    deleteMessage,
    addReaction,
    removeReaction,
    startTyping,
    stopTyping,
  };
}

export function useChatPresence() {
  const { isConnected } = useChatSocket();
  const [presences, setPresences] = useState<Map<string, PresenceStatus>>(
    new Map()
  );

  useEffect(() => {
    if (!isConnected) return;

    const unsubPresence = onPresenceChange((data) => {
      setPresences((prev) => new Map(prev).set(data.userId, data.status));
    });

    return () => {
      unsubPresence();
    };
  }, [isConnected]);

  const getOnline = useCallback(() => {
    return getOnlineUsers();
  }, []);

  return {
    presences,
    getOnlineUsers: getOnline,
  };
}
