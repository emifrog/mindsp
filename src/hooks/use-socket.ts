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
} from "@/lib/realtime-client";

export function useSocket() {
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

export function useConversation(conversationId: string | null) {
  const { isConnected } = useSocket();
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!conversationId || !isConnected) {
      return;
    }

    // Rejoindre la conversation
    joinChannel(conversationId);

    // Écouter les nouveaux messages
    const unsubMessage = onMessage((message: any) => {
      if (message.conversationId === conversationId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    // Écouter les indicateurs de frappe
    const unsubTyping = onTyping((data) => {
      if (data.channelId === conversationId) {
        setTypingUsers((prev) => [...new Set([...prev, data.userId])]);
      }
    });

    const unsubStopTyping = onStopTyping((data) => {
      if (data.channelId === conversationId) {
        setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
      }
    });

    return () => {
      leaveChannel(conversationId);
      unsubMessage();
      unsubTyping();
      unsubStopTyping();
    };
  }, [conversationId, isConnected]);

  const sendMessage = useCallback(
    async (content: string, type = "TEXT") => {
      if (!conversationId) return;

      const response = await fetch(`/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content, type }),
      });

      if (response.ok) {
        const message = await response.json();
        await sendRealtimeMessage(conversationId, message);
      }
    },
    [conversationId]
  );

  const startTyping = useCallback(() => {
    if (!conversationId) return;
    sendTypingStart(conversationId);
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;
    sendTypingStop(conversationId);
  }, [conversationId]);

  const markAsRead = useCallback(
    async (messageId: string) => {
      if (!conversationId) return;
      await fetch(`/api/messages/${messageId}/read`, {
        method: "POST",
      });
    },
    [conversationId]
  );

  return {
    messages,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
  };
}
