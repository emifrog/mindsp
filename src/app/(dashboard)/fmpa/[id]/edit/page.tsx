"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

interface FMPA {
  id: string;
  type: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants: number | null;
  requiresApproval: boolean;
  instructors: string | null;
  equipment: string | null;
  objectives: string | null;
  status: string;
}

export default function EditFMPAPage() {
  const params = useParams();
  const router = useRouter();
  const { isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fmpa, setFmpa] = useState<FMPA | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchFMPA();
  }, [params.id]);

  const fetchFMPA = async () => {
    try {
      setLoadingData(true);
      const response = await fetch(`/api/fmpa/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setFmpa(data);
      } else {
        toast({
          title: "Erreur",
          description: data.error || "FMPA introuvable",
          variant: "destructive",
        });
        router.push("/fmpa");
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger la FMPA",
        variant: "destructive",
      });
      router.push("/fmpa");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const data = {
      type: formData.get("type"),
      title: formData.get("title"),
      description: formData.get("description") || null,
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
      status: formData.get("status"),
    };

    try {
      const response = await fetch(`/api/fmpa/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: "FMPA modifiée",
          description: "La FMPA a été modifiée avec succès",
        });
        router.push(`/fmpa/${params.id}`);
      } else {
        toast({
          title: "Erreur",
          description: result.error || "Impossible de modifier la FMPA",
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

  if (loadingData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!fmpa) {
    return null;
  }

  // Rediriger si pas autorisé
  if (!isAdmin && !isManager) {
    router.push("/fmpa");
    return null;
  }

  // Formater les dates pour l'input datetime-local
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Modifier la FMPA</h1>
          <p className="text-muted-foreground">{fmpa.title}</p>
        </div>
        <Button variant="ghost" asChild>
          <Link href={`/fmpa/${params.id}`}>
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
              Modifiez les informations de la FMPA
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
                defaultValue={fmpa.type}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
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
                defaultValue={fmpa.title}
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
                defaultValue={fmpa.description || ""}
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
                  defaultValue={formatDateForInput(fmpa.startDate)}
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
                  defaultValue={formatDateForInput(fmpa.endDate)}
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
                defaultValue={fmpa.location}
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
                defaultValue={fmpa.maxParticipants || ""}
                placeholder="Laisser vide pour illimité"
                disabled={loading}
              />
            </div>

            {/* Statut */}
            <div className="space-y-2">
              <Label htmlFor="status">Statut *</Label>
              <select
                id="status"
                name="status"
                required
                defaultValue={fmpa.status}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="DRAFT">Brouillon</option>
                <option value="PUBLISHED">Publié</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="COMPLETED">Terminé</option>
                <option value="CANCELLED">Annulé</option>
              </select>
            </div>

            {/* Approbation requise */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="requiresApproval"
                name="requiresApproval"
                defaultChecked={fmpa.requiresApproval}
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
                defaultValue={fmpa.instructors || ""}
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
                defaultValue={fmpa.equipment || ""}
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
                defaultValue={fmpa.objectives || ""}
                placeholder="Objectifs de la formation ou de la manœuvre..."
                disabled={loading}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? "Modification..." : "Enregistrer les modifications"}
              </Button>
              <Button
                type="button"
                variant="outline"
                asChild
                className="flex-1"
              >
                <Link href={`/fmpa/${params.id}`}>Annuler</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
