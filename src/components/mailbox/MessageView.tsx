"use client";

import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { MailMessage } from "@/types/mailbox";

interface MessageViewProps {
  message: MailMessage;
  onClose: () => void;
}

export function MessageView({ message, onClose }: MessageViewProps) {
  const getInitials = () => {
    if (!message.from) return "?";
    return `${message.from.firstName[0]}${message.from.lastName[0]}`.toUpperCase();
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{message.subject}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icon name={Icons.ui.close} size="sm" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Icon name={Icons.action.reply} size="sm" className="mr-2" />
            Répondre
          </Button>
          <Button variant="outline" size="sm">
            <Icon name={Icons.action.forward} size="sm" className="mr-2" />
            Transférer
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon">
            <Icon name="⭐" size="sm" />
          </Button>
          <Button variant="ghost" size="icon">
            <Icon name={Icons.action.delete} size="sm" />
          </Button>
        </div>
      </div>

      {/* Contenu */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {/* Expéditeur */}
          <div className="mb-6 flex items-start gap-3">
            <Avatar>
              <AvatarImage src={message.from?.avatar || undefined} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {message.from?.firstName} {message.from?.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {message.from?.email}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(message.createdAt), "PPP à HH:mm", {
                    locale: fr,
                  })}
                </span>
              </div>

              {/* Destinataires */}
              {message.recipients && message.recipients.length > 0 && (
                <div className="mt-2 text-sm">
                  <span className="text-muted-foreground">À : </span>
                  {message.recipients
                    .filter((r) => r.type === "TO")
                    .map((r) => `${r.user?.firstName} ${r.user?.lastName}`)
                    .join(", ")}
                </div>
              )}
            </div>
          </div>

          {/* Corps du message */}
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">{message.body}</div>
          </div>

          {/* Pièces jointes */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-6 border-t pt-6">
              <h3 className="mb-3 text-sm font-semibold">
                Pièces jointes ({message.attachments.length})
              </h3>
              <div className="space-y-2">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent"
                  >
                    <Icon name={Icons.action.file} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {attachment.fileName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(attachment.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Icon name={Icons.action.download} size="sm" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
