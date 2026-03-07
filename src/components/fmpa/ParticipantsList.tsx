"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, UserCheck, type LucideIcon } from "lucide-react";

interface Participant {
  id: string;
  status: string;
  registeredAt: string;
  validatedAt?: string | null;
  excuseReason?: string | null;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    badge?: string | null;
  };
  mealRegistration?: {
    menuChoice?: string | null;
    dietaryRestrictions?: string | null;
  } | null;
}

interface ParticipantsListProps {
  fmpaId: string;
  participants: Participant[];
  canValidate?: boolean;
  onUpdate?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  REGISTERED: "Inscrit",
  CONFIRMED: "Confirmé",
  PRESENT: "Présent",
  ABSENT: "Absent",
  EXCUSED: "Excusé",
  CANCELLED: "Annulé",
};

const STATUS_ICONS: Record<string, LucideIcon> = {
  REGISTERED: Clock,
  CONFIRMED: CheckCircle,
  PRESENT: UserCheck,
  ABSENT: XCircle,
  EXCUSED: Clock,
  CANCELLED: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  REGISTERED: "bg-yellow-500",
  CONFIRMED: "bg-blue-500",
  PRESENT: "bg-green-500",
  ABSENT: "bg-red-500",
  EXCUSED: "bg-orange-500",
  CANCELLED: "bg-gray-500",
};

export function ParticipantsList({
  fmpaId,
  participants,
  canValidate = false,
  onUpdate,
}: ParticipantsListProps) {
  const { toast } = useToast();
  const [validating, setValidating] = useState<string | null>(null);
  const [excuseReason, setExcuseReason] = useState("");

  const handleValidate = async (
    participantId: string,
    status: string,
    reason?: string
  ) => {
    try {
      setValidating(participantId);

      const response = await fetch(
        `/api/fmpa/${fmpaId}/participants/${participantId}/validate`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            excuseReason: reason,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la validation");
      }

      toast({
        title: "Statut mis à jour",
        description: `Le participant a été marqué comme ${STATUS_LABELS[status]}`,
      });

      setExcuseReason("");
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur",
        variant: "destructive",
      });
    } finally {
      setValidating(null);
    }
  };

  if (participants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
          <CardDescription>Aucun participant inscrit</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Participants ({participants.length})</CardTitle>
        <CardDescription>
          Liste des personnes inscrites à cette FMPA
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {participants.map((participant) => {
            const StatusIcon = STATUS_ICONS[participant.status] || Clock;

            return (
              <div
                key={participant.id}
                className="flex items-start gap-4 rounded-lg border p-4"
              >
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback>
                    {participant.user.firstName[0]}
                    {participant.user.lastName[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">
                        {participant.user.firstName} {participant.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {participant.user.email}
                      </p>
                      {participant.user.badge && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {participant.user.badge}
                        </Badge>
                      )}
                    </div>

                    <Badge
                      className={`${STATUS_COLORS[participant.status]} text-white`}
                    >
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {STATUS_LABELS[participant.status]}
                    </Badge>
                  </div>

                  {participant.mealRegistration && (
                    <div className="rounded-md bg-muted p-2 text-sm">
                      <p className="font-medium">🍽️ Repas</p>
                      {participant.mealRegistration.menuChoice && (
                        <p className="text-xs">
                          Menu : {participant.mealRegistration.menuChoice}
                        </p>
                      )}
                      {participant.mealRegistration.dietaryRestrictions && (
                        <p className="text-xs text-muted-foreground">
                          {participant.mealRegistration.dietaryRestrictions}
                        </p>
                      )}
                    </div>
                  )}

                  {participant.excuseReason && (
                    <div className="rounded-md bg-orange-50 p-2 text-sm text-orange-800">
                      <p className="font-medium">Raison de l&apos;excuse :</p>
                      <p className="text-xs">{participant.excuseReason}</p>
                    </div>
                  )}

                  {canValidate && participant.status !== "CANCELLED" && (
                    <div className="space-y-2">
                      <Select
                        onValueChange={(value) => {
                          if (value === "EXCUSED") {
                            // Demander la raison
                            const reason = prompt("Raison de l'excuse :");
                            if (reason) {
                              handleValidate(participant.id, value, reason);
                            }
                          } else {
                            handleValidate(participant.id, value);
                          }
                        }}
                        disabled={validating === participant.id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Changer le statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONFIRMED">Confirmer</SelectItem>
                          <SelectItem value="PRESENT">
                            Marquer présent
                          </SelectItem>
                          <SelectItem value="ABSENT">Marquer absent</SelectItem>
                          <SelectItem value="EXCUSED">Excuser</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Inscrit le{" "}
                    {new Date(participant.registeredAt).toLocaleDateString(
                      "fr-FR"
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
