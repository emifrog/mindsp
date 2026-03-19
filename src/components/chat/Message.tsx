"use client";

import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { ChatMessage } from "@/types/chat";
import { useChatChannel } from "@/hooks/use-chat";

interface MessageProps {
  message: ChatMessage;
  showAvatar: boolean;
}

export const Message = React.memo(function Message({ message, showAvatar }: MessageProps) {
  const [showActions, setShowActions] = useState(false);
  const { addReaction, removeReaction, deleteMessage } = useChatChannel(
    message.channelId
  );

  const getInitials = () => {
    if (!message.user) return "?";
    return `${message.user.firstName[0]}${message.user.lastName[0]}`.toUpperCase();
  };

  const handleReaction = (emoji: string) => {
    const existingReaction = message.reactions?.find(
      (r) => r.emoji === emoji && r.userId === message.userId
    );

    if (existingReaction) {
      removeReaction(message.id, emoji);
    } else {
      addReaction(message.id, emoji);
    }
  };

  // Grouper les réactions par emoji
  const groupedReactions = message.reactions?.reduce(
    (acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    },
    {} as Record<string, typeof message.reactions>
  );

  if (message.deletedAt) {
    return (
      <div className="flex gap-3 opacity-50">
        {showAvatar && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Icon name="👻" size="md" />
          </div>
        )}
        {!showAvatar && <div className="w-10" />}
        <div className="flex-1">
          <p className="text-sm italic text-muted-foreground">
            Message supprimé
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group -mx-2 flex gap-3 rounded-md px-2 py-1 transition-colors hover:bg-accent/50",
        !showAvatar && "mt-1"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar */}
      {showAvatar ? (
        <Avatar className="h-10 w-10">
          <AvatarImage src={message.user?.avatar || undefined} />
          <AvatarFallback>{getInitials()}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="flex w-10 items-start justify-center">
          <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
            {format(new Date(message.createdAt), "HH:mm")}
          </span>
        </div>
      )}

      {/* Contenu */}
      <div className="min-w-0 flex-1">
        {showAvatar && (
          <div className="mb-1 flex items-baseline gap-2">
            <span className="font-semibold">
              {message.user?.firstName} {message.user?.lastName}
            </span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.createdAt), "HH:mm")}
            </span>
            {message.editedAt && (
              <span className="text-xs italic text-muted-foreground">
                (modifié)
              </span>
            )}
          </div>
        )}

        <div className="whitespace-pre-wrap break-words text-sm">
          {message.content}
        </div>

        {/* Pièces jointes */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 rounded-md border bg-muted/50 p-2"
              >
                <Icon name={Icons.action.file} size="md" />
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
        )}

        {/* Réactions */}
        {groupedReactions && Object.keys(groupedReactions).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {Object.entries(groupedReactions).map(([emoji, reactions]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-sm transition-colors hover:bg-muted/80"
              >
                <span>{emoji}</span>
                <span className="text-xs">{reactions.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-start gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleReaction("👍")}
          >
            👍
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleReaction("❤️")}
          >
            ❤️
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Icon name={Icons.ui.menu} size="sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Icon name={Icons.action.edit} size="sm" className="mr-2" />
                Modifier
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icon name={Icons.action.copy} size="sm" className="mr-2" />
                Copier
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => deleteMessage(message.id)}
              >
                <Icon name={Icons.action.delete} size="sm" className="mr-2" />
                Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
});
