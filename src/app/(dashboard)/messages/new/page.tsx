"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string | null;
}

export default function NewConversationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [conversationType, setConversationType] = useState<"DIRECT" | "GROUP">(
    "DIRECT"
  );
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();

      if (response.ok) {
        // Exclure l'utilisateur actuel
        setUsers(data.users.filter((u: User) => u.id !== user?.id));
      }
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateConversation = async () => {
    if (selectedUsers.length === 0) return;

    if (conversationType === "DIRECT" && selectedUsers.length !== 1) {
      alert(
        "Sélectionnez exactement 1 utilisateur pour une conversation directe"
      );
      return;
    }

    if (conversationType === "GROUP" && !groupName.trim()) {
      alert("Veuillez entrer un nom pour le groupe");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: conversationType,
          name: conversationType === "GROUP" ? groupName : null,
          memberIds: selectedUsers,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/messages/${data.conversation.id}`);
      } else {
        alert(data.error || "Erreur lors de la création");
      }
    } catch (error) {
      console.error("Erreur création conversation:", error);
      alert("Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  const canCreate =
    selectedUsers.length > 0 &&
    (conversationType === "DIRECT"
      ? selectedUsers.length === 1
      : groupName.trim().length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/messages">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Nouvelle conversation</h1>
          <p className="text-muted-foreground">
            Créez une conversation directe ou un groupe
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Type de conversation */}
        <Card>
          <CardHeader>
            <CardTitle>Type de conversation</CardTitle>
            <CardDescription>
              Choisissez entre une conversation directe ou un groupe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={conversationType}
              onValueChange={(value) =>
                setConversationType(value as "DIRECT" | "GROUP")
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="DIRECT" id="direct" />
                <Label htmlFor="direct" className="cursor-pointer">
                  Conversation directe (1-1)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="GROUP" id="group" />
                <Label htmlFor="group" className="cursor-pointer">
                  Groupe (plusieurs personnes)
                </Label>
              </div>
            </RadioGroup>

            {conversationType === "GROUP" && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="groupName">Nom du groupe</Label>
                <Input
                  id="groupName"
                  placeholder="Ex: Équipe Intervention"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sélection des membres */}
        <Card>
          <CardHeader>
            <CardTitle>
              Membres {selectedUsers.length > 0 && `(${selectedUsers.length})`}
            </CardTitle>
            <CardDescription>
              {conversationType === "DIRECT"
                ? "Sélectionnez 1 personne"
                : "Sélectionnez les membres du groupe"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Aucun utilisateur disponible
              </p>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto">
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent"
                  >
                    <Checkbox
                      id={u.id}
                      checked={selectedUsers.includes(u.id)}
                      onCheckedChange={() => handleUserToggle(u.id)}
                    />
                    <Label
                      htmlFor={u.id}
                      className="flex flex-1 cursor-pointer items-center gap-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                        {u.firstName[0]}
                        {u.lastName[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {u.email}
                        </p>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium">
              {selectedUsers.length} membre(s) sélectionné(s)
            </p>
            {conversationType === "GROUP" && groupName && (
              <p className="text-xs text-muted-foreground">
                Groupe : {groupName}
              </p>
            )}
          </div>
          <Button
            onClick={handleCreateConversation}
            disabled={!canCreate || creating}
            size="lg"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Créer la conversation
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
