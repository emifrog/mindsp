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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Loader2, Euro, Clock } from "lucide-react";
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
  baseAmount: number;
  nightBonus: number;
  sundayBonus: number;
  holidayBonus: number;
  user: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export default function TTAValidationPage() {
  const { isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<TTAEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<TTAEntry | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (isAdmin || isManager) {
      fetchEntries();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/tta/entries?month=${currentMonth}&year=${currentYear}&status=PENDING`
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

  const handleValidate = async (entryId: string) => {
    setProcessing(true);
    try {
      const response = await fetch(`/api/tta/entries/${entryId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "VALIDATED" }),
      });

      if (response.ok) {
        toast({
          title: "Entrée validée",
          description: "L'entrée a été validée avec succès",
        });
        setEntries(entries.filter((e) => e.id !== entryId));
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de valider l'entrée",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur validation:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEntry || !rejectionReason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez indiquer une raison de rejet",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(
        `/api/tta/entries/${selectedEntry.id}/validate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "REJECTED",
            rejectionReason,
          }),
        }
      );

      if (response.ok) {
        toast({
          title: "Entrée rejetée",
          description: "L'entrée a été refusée",
        });
        setEntries(entries.filter((e) => e.id !== selectedEntry.id));
        setShowRejectDialog(false);
        setSelectedEntry(null);
        setRejectionReason("");
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de rejeter l'entrée",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur rejet:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
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
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  if (!isAdmin && !isManager) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Accès réservé aux administrateurs
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Validation TTA</h1>
        <p className="text-muted-foreground">
          Validez les saisies de temps de travail additionnel
        </p>
      </div>

      {/* Résumé */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              En attente de validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entries.length}</div>
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
            <div className="text-2xl font-bold">{totalHours}h</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant total</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toFixed(2)} €</div>
          </CardContent>
        </Card>
      </div>

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
            <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              Aucune entrée en attente
            </h3>
            <p className="text-muted-foreground">
              Toutes les saisies ont été traitées
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
                    <CardTitle>
                      {entry.user.firstName} {entry.user.lastName}
                    </CardTitle>
                    <CardDescription>
                      {format(new Date(entry.date), "PPP", { locale: fr })} -{" "}
                      {getActivityLabel(entry.activityType)}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">En attente</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {entry.description && (
                    <p className="text-sm text-muted-foreground">
                      {entry.description}
                    </p>
                  )}

                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Heures normales
                      </span>
                      <span className="font-medium">
                        {entry.hours}h × 15€ = {entry.baseAmount.toFixed(2)} €
                      </span>
                    </div>
                    {entry.nightHours > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          🌙 Heures nuit
                        </span>
                        <span className="font-medium">
                          {entry.nightHours}h × 5€ ={" "}
                          {entry.nightBonus.toFixed(2)} €
                        </span>
                      </div>
                    )}
                    {entry.sundayHours > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          📅 Heures dimanche
                        </span>
                        <span className="font-medium">
                          {entry.sundayHours}h × 7.5€ ={" "}
                          {entry.sundayBonus.toFixed(2)} €
                        </span>
                      </div>
                    )}
                    {entry.holidayHours > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          🎉 Heures férié
                        </span>
                        <span className="font-medium">
                          {entry.holidayHours}h × 10€ ={" "}
                          {entry.holidayBonus.toFixed(2)} €
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-2">
                      <span className="font-semibold">Total</span>
                      <span className="text-lg font-bold text-primary">
                        {entry.totalAmount.toFixed(2)} €
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleValidate(entry.id)}
                      disabled={processing}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Valider
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedEntry(entry);
                        setShowRejectDialog(true);
                      }}
                      disabled={processing}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Refuser
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de rejet */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser l&apos;entrée</DialogTitle>
            <DialogDescription>
              Veuillez indiquer la raison du refus
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectionReason">Raison du refus *</Label>
            <Textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ex: Heures incorrectes, activité non éligible..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedEntry(null);
                setRejectionReason("");
              }}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                "Refuser l'entrée"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
