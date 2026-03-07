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
import { CheckCircle, XCircle, Loader2, GraduationCap } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Registration {
  id: string;
  status: string;
  registeredAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  formation: {
    id: string;
    code: string;
    title: string;
    startDate: string;
  };
}

export default function FormationInscriptionsAdminPage() {
  const { isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedRegistration, setSelectedRegistration] =
    useState<Registration | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (isAdmin || isManager) {
      fetchRegistrations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      // On récupère toutes les formations avec leurs inscriptions
      const response = await fetch("/api/formations");
      const data = await response.json();

      if (response.ok) {
        // Extraire toutes les inscriptions en attente
        const allRegistrations: Registration[] = [];
        data.formations.forEach((formation: { id: string; code: string; title: string; startDate: string; registrations?: { id: string; status: string; registeredAt: string; user: { id: string; firstName: string; lastName: string; email: string } }[] }) => {
          if (formation.registrations) {
            formation.registrations.forEach((reg: { id: string; status: string; registeredAt: string; user: { id: string; firstName: string; lastName: string; email: string } }) => {
              if (reg.status === "PENDING") {
                allRegistrations.push({
                  ...reg,
                  formation: {
                    id: formation.id,
                    code: formation.code,
                    title: formation.title,
                    startDate: formation.startDate,
                  },
                });
              }
            });
          }
        });
        setRegistrations(allRegistrations);
      }
    } catch (error) {
      console.error("Erreur chargement inscriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (registrationId: string) => {
    setProcessing(true);
    try {
      const response = await fetch(
        `/api/formations/registrations/${registrationId}/validate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "APPROVED" }),
        }
      );

      if (response.ok) {
        toast({
          title: "Inscription approuvée",
          description: "L'inscription a été validée",
        });
        fetchRegistrations();
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'approuver l'inscription",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur approbation:", error);
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
    if (!selectedRegistration || !rejectionReason.trim()) {
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
        `/api/formations/registrations/${selectedRegistration.id}/validate`,
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
          title: "Inscription rejetée",
          description: "L'inscription a été refusée",
        });
        setShowRejectDialog(false);
        setSelectedRegistration(null);
        setRejectionReason("");
        fetchRegistrations();
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de rejeter l'inscription",
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
        <h1 className="text-3xl font-bold">Validation des inscriptions</h1>
        <p className="text-muted-foreground">
          Gérez les demandes d&apos;inscription aux formations
        </p>
      </div>

      {/* Liste des inscriptions */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : registrations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">
              Aucune inscription en attente
            </h3>
            <p className="text-muted-foreground">
              Toutes les inscriptions ont été traitées
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {registrations.map((registration) => (
            <Card key={registration.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>
                      {registration.user.firstName} {registration.user.lastName}
                    </CardTitle>
                    <CardDescription>{registration.user.email}</CardDescription>
                  </div>
                  <Badge variant="secondary">En attente</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Formation</p>
                    <p className="text-sm text-muted-foreground">
                      {registration.formation.code} -{" "}
                      {registration.formation.title}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Date de début</p>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(registration.formation.startDate),
                        "PPP",
                        { locale: fr }
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Demande effectuée le</p>
                    <p className="text-sm text-muted-foreground">
                      {format(
                        new Date(registration.registeredAt),
                        "PPP à HH:mm",
                        {
                          locale: fr,
                        }
                      )}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(registration.id)}
                      disabled={processing}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approuver
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedRegistration(registration);
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
            <DialogTitle>Refuser l&apos;inscription</DialogTitle>
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
              placeholder="Ex: Formation complète, prérequis non remplis..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setSelectedRegistration(null);
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
                "Refuser l'inscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
