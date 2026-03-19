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
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, Euro, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface TTAEntry {
  id: string;
  date: string;
  activityType: string;
  description: string | null;
  hours: number;
  nightHours: number;
  sundayHours: number;
  holidayHours: number;
  totalAmount: number;
  status: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

export default function TTAPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<TTAEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    date: "",
    activityType: "FMPA",
    description: "",
    hours: "",
    nightHours: "",
    sundayHours: "",
    holidayHours: "",
  });

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/tta/entries?month=${currentMonth}&year=${currentYear}`
      );
      const data = await response.json();

      if (response.ok) {
        setEntries(data.entries);
      }
    } catch (error) {
      console.error("Erreur chargement entrées:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/tta/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          hours: parseFloat(formData.hours),
          nightHours: formData.nightHours ? parseFloat(formData.nightHours) : 0,
          sundayHours: formData.sundayHours
            ? parseFloat(formData.sundayHours)
            : 0,
          holidayHours: formData.holidayHours
            ? parseFloat(formData.holidayHours)
            : 0,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Entrée ajoutée",
          description: "Votre saisie a été enregistrée",
        });
        setEntries([data.entry, ...entries]);
        setShowForm(false);
        setFormData({
          date: "",
          activityType: "FMPA",
          description: "",
          hours: "",
          nightHours: "",
          sundayHours: "",
          holidayHours: "",
        });
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Impossible d'ajouter l'entrée",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur création entrée:", error);
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
    if (!confirm("Supprimer cette entrée ?")) return;

    try {
      const response = await fetch(`/api/tta/entries/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Entrée supprimée",
          description: "L'entrée a été supprimée",
        });
        setEntries(entries.filter((e) => e.id !== id));
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'entrée",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: "En attente",
      VALIDATED: "Validé",
      REJECTED: "Refusé",
      EXPORTED: "Exporté",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "secondary",
      VALIDATED: "default",
      REJECTED: "destructive",
      EXPORTED: "outline",
    };
    return colors[status] || "secondary";
  };

  const getActivityLabel = (type: string) => {
    const labels: Record<string, string> = {
      FMPA: "FMPA",
      INTERVENTION: "Intervention",
      FORMATION: "Formation",
      GARDE: "Garde",
      ASTREINTE: "Astreinte",
      AUTRE: "Autre",
    };
    return labels[type] || type;
  };

  const totalAmount = entries.reduce((sum, e) => sum + e.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Temps de Travail Additionnel</h1>
          <p className="text-muted-foreground">
            Saisissez vos heures pour le mois en cours
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle saisie
        </Button>
      </div>

      {/* Résumé */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total du mois</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toFixed(2)} €</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Heures totales
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entries.reduce((sum, e) => sum + e.hours, 0)}h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entrées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Formulaire */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nouvelle saisie</CardTitle>
            <CardDescription>
              Enregistrez vos heures de travail additionnel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="activityType">Type d&apos;activité *</Label>
                  <Select
                    value={formData.activityType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, activityType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FMPA">FMPA</SelectItem>
                      <SelectItem value="INTERVENTION">Intervention</SelectItem>
                      <SelectItem value="FORMATION">Formation</SelectItem>
                      <SelectItem value="GARDE">Garde</SelectItem>
                      <SelectItem value="ASTREINTE">Astreinte</SelectItem>
                      <SelectItem value="AUTRE">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Détails de l'activité..."
                  rows={2}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="hours">Heures *</Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={formData.hours}
                    onChange={(e) =>
                      setFormData({ ...formData, hours: e.target.value })
                    }
                    placeholder="8"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nightHours">Heures nuit</Label>
                  <Input
                    id="nightHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.nightHours}
                    onChange={(e) =>
                      setFormData({ ...formData, nightHours: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sundayHours">Heures dimanche</Label>
                  <Input
                    id="sundayHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.sundayHours}
                    onChange={(e) =>
                      setFormData({ ...formData, sundayHours: e.target.value })
                    }
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="holidayHours">Heures férié</Label>
                  <Input
                    id="holidayHours"
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.holidayHours}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        holidayHours: e.target.value,
                      })
                    }
                    placeholder="0"
                  />
                </div>
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
                      <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
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

      {/* Liste des entrées */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Aucune entrée</h3>
            <p className="text-muted-foreground">
              Commencez par ajouter vos heures
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">
                        {format(new Date(entry.date), "PPP", { locale: fr })}
                      </CardTitle>
                      <Badge variant={getStatusColor(entry.status) as "default" | "secondary" | "destructive" | "outline"}>
                        {getStatusLabel(entry.status)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {getActivityLabel(entry.activityType)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium">{entry.hours}h</p>
                      <p className="text-lg font-bold text-primary">
                        {entry.totalAmount.toFixed(2)} €
                      </p>
                    </div>
                    {entry.status === "PENDING" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(entry.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {entry.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {entry.description}
                  </p>
                  {(entry.nightHours > 0 ||
                    entry.sundayHours > 0 ||
                    entry.holidayHours > 0) && (
                    <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                      {entry.nightHours > 0 && (
                        <span>🌙 {entry.nightHours}h nuit</span>
                      )}
                      {entry.sundayHours > 0 && (
                        <span>📅 {entry.sundayHours}h dimanche</span>
                      )}
                      {entry.holidayHours > 0 && (
                        <span>🎉 {entry.holidayHours}h férié</span>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
