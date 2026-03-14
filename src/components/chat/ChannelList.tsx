"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CreateChannelDialog } from "./CreateChannelDialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { ChatChannel } from "@/types/chat";

const getChannelIcon = (channel: ChatChannel) => {
  if (channel.icon) return channel.icon;
  if (channel.type === "PUBLIC") return "💬";
  if (channel.type === "PRIVATE") return "🔒";
  return "👤";
};

const ChannelItem = memo(function ChannelItem({
  channel,
  isSelected,
  onSelect,
}: {
  channel: ChatChannel;
  isSelected: boolean;
  onSelect: (channel: ChatChannel) => void;
}) {
  return (
    <button
      onClick={() => onSelect(channel)}
      className={cn(
        "group w-full rounded-lg px-3 py-2.5 text-left transition-all",
        isSelected
          ? "bg-primary text-primary-foreground shadow-sm"
          : "hover:bg-accent/50"
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "shrink-0",
            isSelected && "scale-110 transition-transform"
          )}
        >
          <Icon name={getChannelIcon(channel)} size="lg" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center justify-between gap-2">
            <span
              className={cn(
                "truncate text-sm font-semibold",
                isSelected ? "text-primary-foreground" : "text-foreground"
              )}
            >
              {channel.type === "PUBLIC" && "#"}
              {channel.name}
            </span>
            {channel.unreadCount && channel.unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="h-5 min-w-5 px-1.5 text-xs font-bold"
              >
                {channel.unreadCount > 99 ? "99+" : channel.unreadCount}
              </Badge>
            )}
          </div>
          {channel.lastMessage && (
            <p
              className={cn(
                "truncate text-xs",
                isSelected
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground"
              )}
            >
              <span className="font-medium">
                {channel.lastMessage.user?.firstName}:
              </span>{" "}
              {channel.lastMessage.content}
            </p>
          )}
          {channel.description && !channel.lastMessage && (
            <p
              className={cn(
                "truncate text-xs italic",
                isSelected
                  ? "text-primary-foreground/70"
                  : "text-muted-foreground"
              )}
            >
              {channel.description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
});

interface ChannelListProps {
  selectedChannelId?: string;
  onSelectChannel: (channel: ChatChannel) => void;
}

export function ChannelList({
  selectedChannelId,
  onSelectChannel,
}: ChannelListProps) {
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    try {
      const res = await fetch("/api/chat/channels");
      const data = await res.json();
      setChannels(data.channels || []);
    } catch (error) {
      console.error("Error fetching channels:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChannels = useMemo(
    () =>
      channels.filter((channel) =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [channels, searchQuery]
  );

  const { publicChannels, privateChannels, directMessages } = useMemo(() => ({
    publicChannels: filteredChannels.filter((c) => c.type === "PUBLIC"),
    privateChannels: filteredChannels.filter((c) => c.type === "PRIVATE"),
    directMessages: filteredChannels.filter((c) => c.type === "DIRECT"),
  }), [filteredChannels]);

  const handleSelectChannel = useCallback(
    (channel: ChatChannel) => onSelectChannel(channel),
    [onSelectChannel]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Icon name={Icons.ui.menu} size="xl" className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Recherche */}
      <div className="border-b p-3">
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

      {/* Liste des canaux */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-3">
          {/* Canaux publics */}
          {publicChannels.length > 0 && (
            <div>
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
                Canaux
              </h3>
              <div className="space-y-1">
                {publicChannels.map((channel) => (
                  <ChannelItem key={channel.id} channel={channel} isSelected={selectedChannelId === channel.id} onSelect={handleSelectChannel} />
                ))}
              </div>
            </div>
          )}

          {/* Canaux privés */}
          {privateChannels.length > 0 && (
            <div>
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
                Canaux Privés
              </h3>
              <div className="space-y-1">
                {privateChannels.map((channel) => (
                  <ChannelItem key={channel.id} channel={channel} isSelected={selectedChannelId === channel.id} onSelect={handleSelectChannel} />
                ))}
              </div>
            </div>
          )}

          {/* Messages directs */}
          {directMessages.length > 0 && (
            <div>
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
                Messages Directs
              </h3>
              <div className="space-y-1">
                {directMessages.map((channel) => (
                  <ChannelItem key={channel.id} channel={channel} isSelected={selectedChannelId === channel.id} onSelect={handleSelectChannel} />
                ))}
              </div>
            </div>
          )}

          {filteredChannels.length === 0 && (
            <div className="py-8 text-center">
              <Icon
                name="📭"
                size="2xl"
                className="mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">
                Aucun canal trouvé
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bouton créer canal */}
      <div className="border-t p-3">
        <CreateChannelDialog onChannelCreated={fetchChannels} />
      </div>
    </div>
  );
}
