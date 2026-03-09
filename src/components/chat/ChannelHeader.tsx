"use client";

import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatChannel } from "@/types/chat";

interface ChannelHeaderProps {
  channel: ChatChannel;
  onToggleSidebar: () => void;
  showSidebarButton: boolean;
}

export function ChannelHeader({
  channel,
  onToggleSidebar,
  showSidebarButton,
}: ChannelHeaderProps) {
  const getChannelIcon = () => {
    if (channel.icon) return channel.icon;
    if (channel.type === "PUBLIC") return Icons.nav.messages;
    if (channel.type === "PRIVATE") return "🔒";
    return "👤";
  };

  return (
    <div className="flex h-16 items-center justify-between border-b px-4">
      <div className="flex items-center gap-3">
        {showSidebarButton && (
          <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
            <Icon name={Icons.ui.menu} size="sm" />
          </Button>
        )}

        <Icon name={getChannelIcon()} size="lg" />

        <div>
          <h2 className="font-semibold">{channel.name}</h2>
          {channel.description && (
            <p className="text-xs text-muted-foreground">
              {channel.description}
            </p>
          )}
          {channel._count && (
            <p className="text-xs text-muted-foreground">
              {channel._count.members} membre
              {channel._count.members > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Icon name={Icons.action.search} size="sm" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Icon name={Icons.ui.menu} size="sm" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Icon name={Icons.info.info} size="sm" className="mr-2" />
              Détails du canal
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icon name={Icons.info.users} size="sm" className="mr-2" />
              Voir les membres
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icon name={Icons.action.settings} size="sm" className="mr-2" />
              Paramètres
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              <Icon name={Icons.action.delete} size="sm" className="mr-2" />
              Quitter le canal
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
