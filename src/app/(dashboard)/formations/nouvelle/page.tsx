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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, GraduationCap } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function NewFormationPage() {
  const router = useRouter();
  const { user, isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    duration: "",
    prerequisites: "",
    validityYears: "",
    category: "AUTRE",
    level: "CONTINUE",
    startDate: "",
    endDate: "",
    location: "",
    maxParticipants: "",
    minParticipants: "",
    price: "",
    instructorId: "",
  });

  useEffect(() => {
    if (!isAdmin && !isManager) {
      router.push("/formations");
      return;
    }
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Erreur chargement utilisateurs:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/formations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          duration: formData.duration ? parseInt(formData.duration) : null,
          validityYears: formData.validityYears
            ? parseInt(formData.validityYears)
            : null,
          maxParticipants: formData.maxParticipants
            ? parseInt(formData.maxParticipants)
            : null,
          minParticipants: formData.minParticipants
            ? parseInt(formData.minParticipants)
            : null,
          price: formData.price ? parseFloat(formData.price) : null,
          instructorId: formData.instructorId || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Formation créée",
          description: "La formation a été créée avec succès",
        });
        router.push(`/formations/${data.formation.id}`);
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Impossible de créer la formation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur création formation:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin && !isManager) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/formations">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Nouvelle formation</h1>
          <p className="text-muted-foreground">Créez une nouvelle formation</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Informations principales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
              <CardDescription>Détails de la formation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  required
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder="Ex: FOR-2025-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Formation incendie niveau 1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Description de la formation..."
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCENDIE">Incendie</SelectItem>
                      <SelectItem value="SECOURS">Secours</SelectItem>
                      <SelectItem value="TECHNIQUE">Technique</SelectItem>
                      <SelectItem value="MANAGEMENT">Management</SelectItem>
                      <SelectItem value="REGLEMENTAIRE">
                        Réglementaire
                      </SelectItem>
                      <SelectItem value="AUTRE">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Niveau *</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) =>
                      setFormData({ ...formData, level: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INITIALE">Initiale</SelectItem>
                      <SelectItem value="CONTINUE">Continue</SelectItem>
                      <SelectItem value="PERFECTIONNEMENT">
                        Perfectionnement
                      </SelectItem>
                      <SelectItem value="SPECIALISATION">
                        Spécialisation
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="duration">Durée (heures)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    placeholder="Ex: 8"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="validityYears">Validité (années)</Label>
                  <Input
                    id="validityYears"
                    type="number"
                    min="0"
                    value={formData.validityYears}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        validityYears: e.target.value,
                      })
                    }
                    placeholder="Ex: 3"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prerequisites">Prérequis</Label>
                <Textarea
                  id="prerequisites"
                  value={formData.prerequisites}
                  onChange={(e) =>
                    setFormData({ ...formData, prerequisites: e.target.value })
                  }
                  placeholder="Prérequis nécessaires..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Dates et logistique */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dates et lieu</CardTitle>
                <CardDescription>Planification de la formation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Date de début *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Date de fin *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Lieu *</Label>
                  <Input
                    id="location"
                    required
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="Ex: Caserne centrale"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Capacité et formateur</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minParticipants">Min. participants</Label>
                    <Input
                      id="minParticipants"
                      type="number"
                      min="0"
                      value={formData.minParticipants}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minParticipants: e.target.value,
                        })
                      }
                      placeholder="Ex: 5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxParticipants">Max. participants</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      min="0"
                      value={formData.maxParticipants}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxParticipants: e.target.value,
                        })
                      }
                      placeholder="Ex: 20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Prix (€)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="Ex: 0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructorId">Formateur</Label>
                  <Select
                    value={formData.instructorId || undefined}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        instructorId: value === "none" ? "" : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un formateur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun formateur</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <Link href="/formations">Annuler</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
                Création...
              </>
            ) : (
              <>
                <GraduationCap className="mr-2 h-4 w-4" />
                Créer la formation
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
