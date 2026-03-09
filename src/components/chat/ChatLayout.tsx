"use client";

import { useState } from "react";
import { ChannelList } from "./ChannelList";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ChannelHeader } from "./ChannelHeader";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import type { ChatChannel } from "@/types/chat";

export function ChatLayout() {
  const [selectedChannel, setSelectedChannel] = useState<ChatChannel | null>(
    null
  );
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar - Liste des canaux */}
      <div
        className={`${
          showSidebar ? "w-72" : "w-0"
        } overflow-hidden border-r bg-card transition-all duration-300`}
      >
        <div className="flex h-full flex-col">
          {/* Header Sidebar */}
          <div className="border-b bg-gradient-to-r from-primary/10 to-primary/5 p-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Icon name="💬" size="lg" />
                Chat
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(false)}
                className="lg:hidden"
              >
                <Icon name={Icons.ui.close} size="sm" />
              </Button>
            </div>
          </div>

          {/* Liste des canaux */}
          <ChannelList
            selectedChannelId={selectedChannel?.id}
            onSelectChannel={setSelectedChannel}
          />
        </div>
      </div>

      {/* Zone principale - Messages */}
      <div className="flex flex-1 flex-col bg-background">
        {selectedChannel ? (
          <>
            {/* Header du canal */}
            <ChannelHeader
              channel={selectedChannel}
              onToggleSidebar={() => setShowSidebar(!showSidebar)}
              showSidebarButton={!showSidebar}
            />

            {/* Liste des messages */}
            <MessageList channelId={selectedChannel.id} />

            {/* Input de message */}
            <MessageInput channelId={selectedChannel.id} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-background to-accent/20">
            <div className="max-w-md px-6 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-primary/20 blur-3xl"></div>
                <Icon
                  name="💬"
                  size="2xl"
                  className="relative mx-auto animate-bounce"
                />
              </div>
              <h3 className="mb-3 text-2xl font-bold">
                Bienvenue sur le Chat !
              </h3>
              <p className="mb-6 text-muted-foreground">
                Sélectionnez un canal dans la liste pour commencer à discuter
                avec votre équipe
              </p>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Icon name="💬" size="sm" />
                  <span>Canaux publics pour toute l&apos;équipe</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Icon name="🔒" size="sm" />
                  <span>
                    Canaux privés pour les discussions confidentielles
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Icon name="👤" size="sm" />
                  <span>Messages directs en tête-à-tête</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
