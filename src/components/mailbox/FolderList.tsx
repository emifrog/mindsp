"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { MailboxStats } from "@/types/mailbox";

interface FolderListProps {
  currentFolder: string;
  onSelectFolder: (folder: string) => void;
}

export function FolderList({ currentFolder, onSelectFolder }: FolderListProps) {
  const [stats, setStats] = useState<MailboxStats>({
    inbox: 0,
    unread: 0,
    sent: 0,
    drafts: 0,
    archived: 0,
    starred: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/mail/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const folders = [
    {
      id: "INBOX",
      name: "Boîte de réception",
      icon: "📥",
      count: stats.inbox,
      badge: stats.unread,
    },
    {
      id: "SENT",
      name: "Envoyés",
      icon: "📤",
      count: stats.sent,
    },
    {
      id: "DRAFTS",
      name: "Brouillons",
      icon: "📝",
      count: stats.drafts,
    },
    {
      id: "ARCHIVE",
      name: "Archives",
      icon: "🗄️",
      count: stats.archived,
    },
    {
      id: "TRASH",
      name: "Corbeille",
      icon: "🗑️",
    },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Liste des dossiers */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-3">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onSelectFolder(folder.id)}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors hover:bg-accent",
                currentFolder === folder.id && "bg-accent"
              )}
            >
              <div className="flex items-center gap-2">
                <Icon name={folder.icon} size="md" />
                <span className="font-medium">{folder.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {folder.badge !== undefined && folder.badge > 0 && (
                  <Badge variant="destructive" className="h-5 min-w-5 px-1">
                    {folder.badge}
                  </Badge>
                )}
                {folder.count !== undefined &&
                  folder.count > 0 &&
                  !folder.badge && (
                    <span className="text-xs text-muted-foreground">
                      {folder.count}
                    </span>
                  )}
              </div>
            </button>
          ))}

          {/* Starred */}
          {stats.starred > 0 && (
            <>
              <div className="my-2 h-px bg-border" />
              <button
                onClick={() => onSelectFolder("STARRED")}
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left transition-colors hover:bg-accent",
                  currentFolder === "STARRED" && "bg-accent"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon name="⭐" size="md" />
                  <span className="font-medium">Étoilés</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {stats.starred}
                </span>
              </button>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
