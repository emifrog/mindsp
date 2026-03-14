"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChatChannel } from "@/hooks/use-chat";
import { Message } from "./Message";
import { TypingIndicator } from "./TypingIndicator";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface MessageListProps {
  channelId: string;
}

export function MessageList({ channelId }: MessageListProps) {
  const { messages, setMessages, typingUsers } = useChatChannel(channelId);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId]);

  useEffect(() => {
    // Auto-scroll vers le bas quand nouveaux messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/chat/channels/${channelId}/messages`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Grouper les messages par date (mémoïsé pour éviter recalcul à chaque render)
  const groupedMessages = useMemo(
    () =>
      messages.reduce(
        (groups, message) => {
          const date = format(new Date(message.createdAt), "yyyy-MM-dd");
          if (!groups[date]) {
            groups[date] = [];
          }
          groups[date].push(message);
          return groups;
        },
        {} as Record<string, typeof messages>
      ),
    [messages]
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Icon name={Icons.ui.menu} size="2xl" className="animate-spin" />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="space-y-4 p-4">
        {Object.entries(groupedMessages).map(([date, msgs]) => (
          <div key={date}>
            {/* Séparateur de date */}
            <div className="my-4 flex items-center gap-4">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium text-muted-foreground">
                {format(new Date(date), "EEEE d MMMM yyyy", { locale: fr })}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Messages du jour */}
            <div className="space-y-4">
              {msgs.map((message, index) => {
                const prevMessage = msgs[index - 1];
                const showAvatar =
                  !prevMessage ||
                  prevMessage.userId !== message.userId ||
                  new Date(message.createdAt).getTime() -
                    new Date(prevMessage.createdAt).getTime() >
                    300000; // 5 minutes

                return (
                  <Message
                    key={message.id}
                    message={message}
                    showAvatar={showAvatar}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-12">
            <Icon name="👋" size="2xl" className="mb-4" />
            <h3 className="mb-2 text-lg font-semibold">
              Début de la conversation
            </h3>
            <p className="text-center text-muted-foreground">
              Soyez le premier à envoyer un message !
            </p>
          </div>
        )}

        {/* Typing indicators */}
        {typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}
      </div>
    </ScrollArea>
  );
}
