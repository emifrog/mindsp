"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useConversation } from "@/hooks/use-socket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  reads: Array<{
    userId: string;
    readAt: string;
  }>;
}

interface ConversationData {
  id: string;
  type: string;
  name: string | null;
  members: Array<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar: string | null;
    };
  }>;
}

export default function ConversationPage() {
  const params = useParams();
  const { user } = useAuth();
  const conversationId = params.id as string;

  const {
    messages: realtimeMessages,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
  } = useConversation(conversationId);

  const [conversation, setConversation] = useState<ConversationData | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    fetchConversation();
    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    // Ajouter les nouveaux messages en temps réel
    if (realtimeMessages.length > 0) {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = realtimeMessages.filter((m) => !existingIds.has(m.id));
        return [...prev, ...newMsgs as unknown as Message[]];
      });
    }
  }, [realtimeMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    try {
      const response = await fetch(`/api/conversations`);
      const data = await response.json();

      if (response.ok) {
        const conv = data.conversations.find(
          (c: ConversationData) => c.id === conversationId
        );
        setConversation(conv);
      }
    } catch (error) {
      console.error("Erreur chargement conversation:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`
      );
      const data = await response.json();

      if (response.ok) {
        setMessages(data.messages);

        // Marquer le dernier message comme lu
        if (data.messages.length > 0) {
          const lastMessage = data.messages[data.messages.length - 1];
          if (lastMessage.sender.id !== user?.id) {
            markAsRead(lastMessage.id);
          }
        }
      }
    } catch (error) {
      console.error("Erreur chargement messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      sendMessage(newMessage.trim());
      setNewMessage("");
      stopTyping();
    } catch (error) {
      console.error("Erreur envoi message:", error);
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Gérer l'indicateur de frappe
    startTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1000);
  };

  const getConversationName = () => {
    if (!conversation) return "Conversation";

    if (conversation.type === "DIRECT") {
      const otherMember = conversation.members.find(
        (m) => m.user.id !== user?.id
      );
      return otherMember
        ? `${otherMember.user.firstName} ${otherMember.user.lastName}`
        : "Conversation";
    }
    return conversation.name || "Groupe";
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  const isMessageRead = (message: Message) => {
    if (message.sender.id === user?.id) {
      // Vérifier si au moins un autre membre a lu
      return message.reads.some((r) => r.userId !== user?.id);
    }
    return false;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <Card className="rounded-b-none border-b">
        <CardHeader className="py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/messages">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <CardTitle className="text-xl">{getConversationName()}</CardTitle>
            {conversation && (
              <span className="text-sm text-muted-foreground">
                {conversation.members.length} membre(s)
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card className="flex-1 overflow-hidden rounded-none border-x">
        <CardContent className="h-full overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender.id === user?.id;

              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {getInitials(
                        message.sender.firstName,
                        message.sender.lastName
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className={`flex flex-col ${isOwn ? "items-end" : ""}`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      {!isOwn && (
                        <p className="mb-1 text-xs font-semibold">
                          {message.sender.firstName} {message.sender.lastName}
                        </p>
                      )}
                      <p className="text-sm">{message.content}</p>
                    </div>

                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {format(new Date(message.createdAt), "HH:mm", {
                          locale: fr,
                        })}
                      </span>
                      {isOwn && isMessageRead(message) && (
                        <span className="text-primary">✓✓</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Indicateur de frappe */}
            {typingUsers.length > 0 && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>...</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1 rounded-lg bg-muted px-4 py-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </CardContent>
      </Card>

      {/* Input */}
      <Card className="rounded-t-none border-t">
        <CardContent className="p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Écrivez votre message..."
              disabled={sending}
              className="flex-1"
            />
            <Button type="submit" disabled={!newMessage.trim() || sending}>
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
