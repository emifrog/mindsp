"use client";

import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { formatDateRange } from "@/lib/calendar-utils";

interface TrainingProposalProps {
  proposalId: string;
  training: {
    id: string;
    title: string;
    description?: string | null;
    startDate: string;
    endDate: string;
    location?: string | null;
    maxParticipants?: number | null;
  };
  currentRegistration?: {
    id: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED" | "WAITLIST";
  } | null;
  registrationCount?: number;
  onRegistrationChange?: () => void;
}

export function TrainingProposal({
  proposalId,
  training,
  currentRegistration,
  registrationCount = 0,
  onRegistrationChange,
}: TrainingProposalProps) {
  const { toast } = useToast();
  const [registering, setRegistering] = useState(false);
  const [registration, setRegistration] = useState(currentRegistration);

  const handleRegister = async () => {
    try {
      setRegistering(true);

      const response = await fetch(
        `/api/messaging/training-proposals/${proposalId}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'inscription");
      }

      const data = await response.json();
      setRegistration(data);

      toast({
        title: data.waitlist
          ? "Ajouté à la liste d'attente"
          : "Inscription confirmée",
        description: data.waitlist
          ? "Vous serez notifié si une place se libère"
          : "Vous êtes inscrit à cette formation",
      });

      if (onRegistrationChange) {
        onRegistrationChange();
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de s'inscrire",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Êtes-vous sûr de vouloir annuler votre inscription ?")) {
      return;
    }

    try {
      setRegistering(true);

      const response = await fetch(
        `/api/messaging/training-proposals/${proposalId}/register`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de l'annulation");
      }

      setRegistration(null);

      toast({
        title: "Inscription annulée",
        description: "Votre inscription a été annulée",
      });

      if (onRegistrationChange) {
        onRegistrationChange();
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'annuler l'inscription",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  const startDate = new Date(training.startDate);
  const endDate = new Date(training.endDate);
  const isFull =
    training.maxParticipants && registrationCount >= training.maxParticipants;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {training.title}
            </CardTitle>
            <CardDescription>Proposition de formation</CardDescription>
          </div>
          <Badge variant="secondary">Formation</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Détails */}
        <div className="space-y-2">
          {training.description && (
            <p className="text-sm text-muted-foreground">
              {training.description}
            </p>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatDateRange(startDate, endDate)}</span>
          </div>

          {training.location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{training.location}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {registrationCount} inscrit(s)
              {training.maxParticipants &&
                ` / ${training.maxParticipants} places`}
            </span>
            {isFull && (
              <Badge variant="destructive" className="text-xs">
                Complet
              </Badge>
            )}
          </div>
        </div>

        {/* Statut inscription */}
        {registration && (
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm font-medium">
              {registration.status === "CONFIRMED" && (
                <span className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Inscription confirmée
                </span>
              )}
              {registration.status === "PENDING" && (
                <span className="flex items-center gap-2 text-yellow-600">
                  <Clock className="h-4 w-4" />
                  Inscription en attente de confirmation
                </span>
              )}
              {registration.status === "WAITLIST" && (
                <span className="flex items-center gap-2 text-orange-600">
                  <Clock className="h-4 w-4" />
                  Liste d&apos;attente
                </span>
              )}
              {registration.status === "CANCELLED" && (
                <span className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  Inscription annulée
                </span>
              )}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {!registration ? (
            <Button
              className="flex-1"
              onClick={handleRegister}
              disabled={registering}
            >
              {isFull ? "Rejoindre la liste d&apos;attente" : "S&apos;inscrire"}
            </Button>
          ) : (
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCancel}
              disabled={registering}
            >
              Annuler mon inscription
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
