"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { MailingListManager } from "@/components/messaging/MailingListManager";
import { DirectorySearch } from "@/components/messaging/DirectorySearch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MailingListsPage() {
  const [selectedListId, setSelectedListId] = useState<string | undefined>();

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Listes de diffusion</h1>
            <p className="text-sm text-muted-foreground">
              Gérez vos listes et votre annuaire de contacts
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="lists" className="space-y-6">
          <TabsList>
            <TabsTrigger value="lists">Mes listes</TabsTrigger>
            <TabsTrigger value="directory">Annuaire</TabsTrigger>
          </TabsList>

          <TabsContent value="lists" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Listes de diffusion</CardTitle>
                <CardDescription>
                  Créez et gérez vos listes pour envoyer des messages groupés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MailingListManager
                  selectedListId={selectedListId}
                  onSelectList={(list) => setSelectedListId(list.id)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="directory" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Annuaire</CardTitle>
                  <CardDescription>
                    Recherchez et ajoutez des contacts à vos favoris
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DirectorySearch
                    onToggleFavorite={() => {
                      // Rafraîchir la liste si nécessaire
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mes favoris</CardTitle>
                  <CardDescription>
                    Vos contacts favoris pour un accès rapide
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DirectorySearch
                    showFavoritesOnly={true}
                    onToggleFavorite={() => {
                      // Rafraîchir la liste
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
