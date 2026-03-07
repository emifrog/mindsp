"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { MailMessage } from "@/types/mailbox";

interface MessageListProps {
  folder: string;
  selectedMessageId?: string;
  onSelectMessage: (message: MailMessage) => void;
  onToggleSidebar: () => void;
  showSidebarButton: boolean;
}

export function MessageList({
  folder,
  selectedMessageId,
  onSelectMessage,
  onToggleSidebar,
  showSidebarButton,
}: MessageListProps) {
  const [messages, setMessages] = useState<MailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMessages();
  }, [folder]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/mail/inbox`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(
    (msg) =>
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.from?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.from?.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Icon name={Icons.ui.menu} size="2xl" className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="mb-3 flex items-center gap-2">
          {showSidebarButton && (
            <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
              <Icon name={Icons.ui.menu} size="sm" />
            </Button>
          )}
          <h2 className="text-lg font-semibold">
            {folder === "INBOX" && "Boîte de réception"}
            {folder === "SENT" && "Envoyés"}
            {folder === "DRAFTS" && "Brouillons"}
            {folder === "ARCHIVE" && "Archives"}
            {folder === "TRASH" && "Corbeille"}
            {folder === "STARRED" && "Étoilés"}
          </h2>
        </div>

        {/* Recherche */}
        <div className="relative">
          <Icon
            name={Icons.action.search}
            size="sm"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Liste des messages */}
      <ScrollArea className="flex-1">
        <div>
          {filteredMessages.length === 0 ? (
            <div className="py-12 text-center">
              <Icon
                name="fluent-emoji:empty-nest"
                size="2xl"
                className="mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">Aucun message</p>
            </div>
          ) : (
            filteredMessages.map((message) => (
              <button
                key={message.id}
                onClick={() => onSelectMessage(message)}
                className={cn(
                  "w-full border-b p-4 text-left transition-colors hover:bg-accent",
                  selectedMessageId === message.id && "bg-accent",
                  !message.recipientInfo?.isRead && "bg-muted/30"
                )}
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    {message.recipientInfo?.isStarred && (
                      <Icon name="fluent-emoji:star" size="sm" />
                    )}
                    <span
                      className={cn(
                        "truncate font-medium",
                        !message.recipientInfo?.isRead && "font-bold"
                      )}
                    >
                      {message.from?.firstName} {message.from?.lastName}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {format(new Date(message.createdAt), "d MMM", {
                      locale: fr,
                    })}
                  </span>
                </div>

                <div className="mb-1 flex items-center gap-2">
                  <h3
                    className={cn(
                      "flex-1 truncate text-sm",
                      !message.recipientInfo?.isRead && "font-semibold"
                    )}
                  >
                    {message.subject}
                  </h3>
                  {message._count?.attachments > 0 && (
                    <Icon name={Icons.action.file} size="sm" />
                  )}
                </div>

                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {message.body.substring(0, 100)}...
                </p>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
