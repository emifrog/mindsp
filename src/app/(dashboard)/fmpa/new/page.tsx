"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewFMPAPage() {
  const router = useRouter();
  const { isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Rediriger si pas autorisé
  if (!isAdmin && !isManager) {
    router.push("/fmpa");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const data = {
      type: formData.get("type"),
      title: formData.get("title"),
      description: formData.get("description"),
      startDate: new Date(formData.get("startDate") as string).toISOString(),
      endDate: new Date(formData.get("endDate") as string).toISOString(),
      location: formData.get("location"),
      maxParticipants: formData.get("maxParticipants")
        ? parseInt(formData.get("maxParticipants") as string)
        : null,
      requiresApproval: formData.get("requiresApproval") === "on",
      instructors: formData.get("instructors") || null,
      equipment: formData.get("equipment") || null,
      objectives: formData.get("objectives") || null,
    };

    try {
      const response = await fetch("/api/fmpa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "FMPA créée",
          description: "La FMPA a été créée avec succès",
        });
        router.push(`/fmpa/${result.id}`);
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Impossible de créer la FMPA",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Créer une FMPA</h1>
          <p className="text-muted-foreground">
            Formation, Manœuvre ou Présence Active
          </p>
        </div>
        <Button variant="ghost" asChild>
          <Link href="/fmpa">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Annuler
          </Link>
        </Button>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
            <CardDescription>
              Remplissez les informations de base de la FMPA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                name="type"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Sélectionnez un type</option>
                <option value="FORMATION">Formation</option>
                <option value="MANOEUVRE">Manœuvre</option>
                <option value="PRESENCE_ACTIVE">Présence Active</option>
              </select>
            </div>

            {/* Titre */}
            <div className="space-y-2">
              <Label htmlFor="title">Titre *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Formation PSE1"
                required
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Description détaillée de la FMPA..."
                disabled={loading}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Dates */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date et heure de début *</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="datetime-local"
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Date et heure de fin *</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="datetime-local"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Lieu */}
            <div className="space-y-2">
              <Label htmlFor="location">Lieu *</Label>
              <Input
                id="location"
                name="location"
                placeholder="Ex: Centre de formation SDIS"
                required
                disabled={loading}
              />
            </div>

            {/* Participants max */}
            <div className="space-y-2">
              <Label htmlFor="maxParticipants">
                Nombre maximum de participants
              </Label>
              <Input
                id="maxParticipants"
                name="maxParticipants"
                type="number"
                min="1"
                placeholder="Laisser vide pour illimité"
                disabled={loading}
              />
            </div>

            {/* Approbation requise */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresApproval"
                name="requiresApproval"
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="requiresApproval" className="cursor-pointer">
                Approbation requise pour les inscriptions
              </Label>
            </div>

            {/* Formateurs */}
            <div className="space-y-2">
              <Label htmlFor="instructors">Formateurs / Responsables</Label>
              <Input
                id="instructors"
                name="instructors"
                placeholder="Ex: Commandant Dupont, Lieutenant Martin"
                disabled={loading}
              />
            </div>

            {/* Équipement */}
            <div className="space-y-2">
              <Label htmlFor="equipment">Équipement requis</Label>
              <textarea
                id="equipment"
                name="equipment"
                rows={3}
                placeholder="Liste de l'équipement nécessaire..."
                disabled={loading}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Objectifs */}
            <div className="space-y-2">
              <Label htmlFor="objectives">Objectifs pédagogiques</Label>
              <textarea
                id="objectives"
                name="objectives"
                rows={3}
                placeholder="Objectifs de la formation ou de la manœuvre..."
                disabled={loading}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Création..." : "Créer la FMPA"}
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
                className="flex-1"
              >
                <Link href="/fmpa">Annuler</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
