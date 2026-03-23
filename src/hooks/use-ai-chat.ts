"use client";

import { useState, useCallback, useRef } from "react";

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  isStreaming?: boolean;
}

export interface UseAIChatReturn {
  messages: AIMessage[];
  isLoading: boolean;
  conversationId: string | null;
  sendMessage: (content: string) => Promise<void>;
  newConversation: () => void;
  loadConversation: (id: string) => Promise<void>;
  conversations: { id: string; title: string | null; updatedAt: string; _count: { messages: number } }[];
  loadConversations: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
}

export function useAIChat(): UseAIChatReturn {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<UseAIChatReturn["conversations"]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Ajouter le message utilisateur
      const userMsg: AIMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        createdAt: new Date(),
      };

      // Placeholder pour la réponse IA
      const assistantMsg: AIMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: "",
        createdAt: new Date(),
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);

      try {
        abortRef.current = new AbortController();

        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content.trim(),
            conversationId,
            stream: true,
          }),
          signal: abortRef.current.signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Erreur serveur");
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("Streaming non supporté");

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          const lines = text.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6);

            try {
              const data = JSON.parse(jsonStr);

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.text) {
                fullContent += data.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: fullContent }
                      : m
                  )
                );
              }

              if (data.done) {
                setConversationId(data.conversationId);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, isStreaming: false }
                      : m
                  )
                );
              }
            } catch {
              // Ignorer les lignes JSON invalides
            }
          }
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") return;

        const errorMessage =
          error instanceof Error
            ? error.message
            : "Une erreur est survenue. Réessayez.";

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: `❌ ${errorMessage}`, isStreaming: false }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [conversationId, isLoading]
  );

  const newConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/ai/chat?conversationId=${id}`);
      if (!res.ok) return;

      const { conversation } = await res.json();
      setConversationId(conversation.id);
      setMessages(
        conversation.messages.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: new Date(m.createdAt),
        }))
      );
    } catch (error) {
      console.error("Erreur chargement conversation:", error);
    }
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/ai/chat");
      if (!res.ok) return;

      const { conversations: convs } = await res.json();
      setConversations(convs);
    } catch (error) {
      console.error("Erreur chargement conversations:", error);
    }
  }, []);

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/ai/chat?conversationId=${id}`, {
          method: "DELETE",
        });
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (conversationId === id) {
          newConversation();
        }
      } catch (error) {
        console.error("Erreur suppression conversation:", error);
      }
    },
    [conversationId, newConversation]
  );

  return {
    messages,
    isLoading,
    conversationId,
    sendMessage,
    newConversation,
    loadConversation,
    conversations,
    loadConversations,
    deleteConversation,
  };
}
