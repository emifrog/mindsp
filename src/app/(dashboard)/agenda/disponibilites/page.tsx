"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Availability {
  id: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string | null;
}

export default function DisponibilitesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    type: "UNAVAILABLE",
    reason: "",
  });

  useEffect(() => {
    fetchAvailabilities();
  }, []);

  const fetchAvailabilities = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/calendar/availability");
      const data = await response.json();

      if (response.ok) {
        setAvailabilities(data.availabilities);
      }
    } catch (error) {
      console.error("Erreur chargement disponibilités:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/calendar/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Disponibilité ajoutée",
          description: "Votre disponibilité a été enregistrée",
        });
        setAvailabilities([...availabilities, data.availability]);
        setShowForm(false);
        setFormData({
          startDate: "",
          endDate: "",
          type: "UNAVAILABLE",
          reason: "",
        });
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Impossible d'ajouter la disponibilité",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur création disponibilité:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette disponibilité ?")) return;

    try {
      const response = await fetch(`/api/calendar/availability?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Disponibilité supprimée",
          description: "La disponibilité a été supprimée",
        });
        setAvailabilities(availabilities.filter((a) => a.id !== id));
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer la disponibilité",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur suppression disponibilité:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      AVAILABLE: "Disponible",
      UNAVAILABLE: "Indisponible",
      PARTIAL: "Partiellement disponible",
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      AVAILABLE: "bg-green-500",
      UNAVAILABLE: "bg-red-500",
      PARTIAL: "bg-orange-500",
    };
    return colors[type] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/agenda">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Mes disponibilités</h1>
            <p className="text-muted-foreground">
              Gérez vos périodes de disponibilité
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle disponibilité</CardTitle>
            <CardDescription>
              Indiquez votre disponibilité pour une période
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AVAILABLE">Disponible</SelectItem>
                    <SelectItem value="UNAVAILABLE">Indisponible</SelectItem>
                    <SelectItem value="PARTIAL">
                      Partiellement disponible
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Raison (optionnel)</Label>
                <Textarea
                  id="reason"
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  placeholder="Ex: Congés, formation externe..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des disponibilités */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      ) : availabilities.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold">Aucune disponibilité</h3>
            <p className="text-muted-foreground">
              Ajoutez vos périodes de disponibilité
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {availabilities.map((availability) => (
            <Card key={availability.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-1 h-3 w-3 rounded-full ${getTypeColor(
                        availability.type
                      )}`}
                    />
                    <div>
                      <CardTitle className="text-base">
                        {getTypeLabel(availability.type)}
                      </CardTitle>
                      <CardDescription>
                        Du{" "}
                        {format(
                          new Date(availability.startDate),
                          "PPP à HH:mm",
                          { locale: fr }
                        )}
                        <br />
                        Au{" "}
                        {format(new Date(availability.endDate), "PPP à HH:mm", {
                          locale: fr,
                        })}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(availability.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              {availability.reason && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {availability.reason}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
