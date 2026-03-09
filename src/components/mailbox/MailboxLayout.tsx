"use client";

import { useState } from "react";
import { FolderList } from "./FolderList";
import { MessageList } from "./MessageList";
import { MessageView } from "./MessageView";
import { ComposeEmail } from "./ComposeEmail";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import type { MailMessage } from "@/types/mailbox";

export function MailboxLayout() {
  const [selectedMessage, setSelectedMessage] = useState<MailMessage | null>(
    null
  );
  const [showSidebar, setShowSidebar] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<string>("INBOX");

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Sidebar - Dossiers */}
      <div
        className={`${
          showSidebar ? "w-64" : "w-0"
        } overflow-hidden border-r transition-all duration-300`}
      >
        <div className="flex h-full flex-col">
          {/* Header Sidebar */}
          <div className="border-b p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Icon name={Icons.nav.messages} size="md" />
                Mailbox
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

            {/* Bouton Nouveau message */}
            <ComposeEmail />
          </div>

          {/* Liste des dossiers */}
          <FolderList
            currentFolder={currentFolder}
            onSelectFolder={setCurrentFolder}
          />
        </div>
      </div>

      {/* Zone principale - Messages */}
      <div className="flex flex-1">
        {/* Liste des messages */}
        <div className={`${selectedMessage ? "w-96" : "flex-1"} border-r`}>
          <MessageList
            folder={currentFolder}
            selectedMessageId={selectedMessage?.id}
            onSelectMessage={setSelectedMessage}
            onToggleSidebar={() => setShowSidebar(!showSidebar)}
            showSidebarButton={!showSidebar}
          />
        </div>

        {/* Vue détaillée du message */}
        {selectedMessage ? (
          <div className="flex-1">
            <MessageView
              message={selectedMessage}
              onClose={() => setSelectedMessage(null)}
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Icon
                name="✉️"
                size="2xl"
                className="mx-auto mb-4 text-muted-foreground"
              />
              <h3 className="mb-2 text-lg font-semibold">
                Sélectionnez un message
              </h3>
              <p className="text-muted-foreground">
                Choisissez un message dans la liste pour le lire
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
