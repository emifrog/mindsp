"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Users, UserPlus, Trash2, Globe, Lock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DirectorySearch } from "@/components/messaging/DirectorySearch";
import { useToast } from "@/hooks/use-toast";

interface ListMember {
  id: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
    badge?: string | null;
  };
  addedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  addedAt: string;
}

interface MailingListDetails {
  id: string;
  name: string;
  description?: string | null;
  type: "STATIC" | "DYNAMIC";
  isPublic: boolean;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  members: ListMember[];
}

export default function MailingListDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [list, setList] = useState<MailingListDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchList();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchList = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messaging/lists/${params.id}`);

      if (!response.ok) {
        throw new Error("Liste non trouvée");
      }

      const data = await response.json();
      setList(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste",
        variant: "destructive",
      });
      router.push("/messaging/lists");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) {
      toast({
        title: "Attention",
        description: "Veuillez sélectionner au moins un utilisateur",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `/api/messaging/lists/${params.id}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userIds: selectedUsers,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'ajout");
      }

      const data = await response.json();

      toast({
        title: "Succès",
        description: `${data.added} membre(s) ajouté(s)`,
      });

      setDialogOpen(false);
      setSelectedUsers([]);
      fetchList();
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter les membres",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce membre ?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/messaging/lists/${params.id}/members`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast({
        title: "Succès",
        description: "Membre retiré avec succès",
      });

      fetchList();
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de retirer le membre",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!list) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/messaging/lists">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{list.name}</h1>
              {list.isPublic ? (
                <Globe className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            {list.description && (
              <p className="text-sm text-muted-foreground">
                {list.description}
              </p>
            )}
          </div>
          <Badge variant="outline">
            {list.type === "STATIC" ? "Statique" : "Dynamique"}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {/* Informations */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Créée par</p>
                <p className="text-sm text-muted-foreground">
                  {list.createdBy.firstName} {list.createdBy.lastName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Type</p>
                <p className="text-sm text-muted-foreground">
                  {list.type === "STATIC"
                    ? "Liste statique"
                    : "Liste dynamique"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Visibilité</p>
                <p className="text-sm text-muted-foreground">
                  {list.isPublic ? "Publique" : "Privée"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Membres</p>
                <p className="text-sm text-muted-foreground">
                  {list.members.length} personne(s)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Membres */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Membres ({list.members.length})</CardTitle>
                  <CardDescription>
                    Personnes faisant partie de cette liste
                  </CardDescription>
                </div>
                {list.type === "STATIC" && (
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <UserPlus className="mr-2 h-4 w-4" />
                        Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Ajouter des membres</DialogTitle>
                        <DialogDescription>
                          Sélectionnez les personnes à ajouter à la liste
                        </DialogDescription>
                      </DialogHeader>

                      <DirectorySearch
                        onSelectUser={(user) => {
                          setSelectedUsers((prev) =>
                            prev.includes(user.id)
                              ? prev.filter((id) => id !== user.id)
                              : [...prev, user.id]
                          );
                        }}
                        selectedUserIds={selectedUsers}
                      />

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setDialogOpen(false)}
                        >
                          Annuler
                        </Button>
                        <Button onClick={handleAddMembers}>
                          Ajouter ({selectedUsers.length})
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {list.members.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-sm font-semibold">Aucun membre</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ajoutez des membres à cette liste
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {list.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={member.user.avatar || undefined} />
                          <AvatarFallback>
                            {member.user.firstName[0]}
                            {member.user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {member.user.firstName} {member.user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.user.email}
                          </p>
                          {member.user.badge && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {member.user.badge}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {list.type === "STATIC" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
