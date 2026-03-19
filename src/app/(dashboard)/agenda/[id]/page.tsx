"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Edit,
  Trash2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  EVENT_TYPE_LABELS,
  EVENT_COLORS,
  formatDateRange,
} from "@/lib/calendar-utils";
import { ParticipantSelector } from "@/components/agenda/ParticipantSelector";
import type { AgendaEventType, AgendaEventStatus } from "@prisma/client";

interface EventDetails {
  id: string;
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  allDay: boolean;
  type: AgendaEventType;
  status: AgendaEventStatus;
  location?: string | null;
  color?: string | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string | null;
  };
  participants: Array<{
    id: string;
    status: string;
    role?: string | null;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      avatar?: string | null;
    };
  }>;
  reminders: Array<{
    id: string;
    type: string;
    timing: number;
  }>;
}

const STATUS_LABELS: Record<AgendaEventStatus, string> = {
  SCHEDULED: "Planifié",
  CONFIRMED: "Confirmé",
  CANCELLED: "Annulé",
  COMPLETED: "Terminé",
};

const STATUS_COLORS: Record<AgendaEventStatus, string> = {
  SCHEDULED: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-100 text-gray-800",
};

export default function EventDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchEvent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/agenda/events/${params.id}`);

      if (!response.ok) {
        throw new Error("Événement non trouvé");
      }

      const data = await response.json();
      setEvent(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'événement",
        variant: "destructive",
      });
      router.push("/agenda");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/agenda/events/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      toast({
        title: "Succès",
        description: "Événement supprimé avec succès",
      });

      router.push("/agenda");
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'événement",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const eventColor = event.color || EVENT_COLORS[event.type];
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);

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
            <h1 className="text-2xl sm:text-3xl font-bold">{event.title}</h1>
            <p className="text-muted-foreground">
              {formatDateRange(startDate, endDate)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/agenda/${event.id}/modifier`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer cet événement ? Cette
                  action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Suppression..." : "Supprimer"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {/* Informations principales */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Détails de l&apos;événement</CardTitle>
                  <CardDescription>Informations générales</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge
                    className="border"
                    style={{
                      backgroundColor: `${eventColor}20`,
                      color: eventColor,
                      borderColor: eventColor,
                    }}
                  >
                    {EVENT_TYPE_LABELS[event.type]}
                  </Badge>
                  <Badge className={STATUS_COLORS[event.status]}>
                    {STATUS_LABELS[event.status]}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.description && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">Description</h3>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {event.description}
                  </p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date et heure</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateRange(startDate, endDate)}
                    </p>
                    {event.allDay && (
                      <Badge variant="secondary" className="mt-1">
                        Toute la journée
                      </Badge>
                    )}
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Lieu</p>
                      <p className="text-sm text-muted-foreground">
                        {event.location}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Participants ({event.participants.length})
                  </CardTitle>
                  <CardDescription>
                    Personnes invitées à cet événement
                  </CardDescription>
                </div>
                <ParticipantSelector
                  eventId={event.id}
                  existingParticipantIds={event.participants.map(
                    (p) => p.user.id
                  )}
                  onParticipantsAdded={fetchEvent}
                />
              </div>
            </CardHeader>
            <CardContent>
              {event.participants.length > 0 ? (
                <div className="space-y-3">
                  {event.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={participant.user.avatar || undefined}
                          />
                          <AvatarFallback>
                            {participant.user.firstName[0]}
                            {participant.user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {participant.user.firstName}{" "}
                            {participant.user.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {participant.user.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {participant.role && (
                          <Badge variant="outline">{participant.role}</Badge>
                        )}
                        <Badge
                          variant={
                            participant.status === "ACCEPTED"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {participant.status === "ACCEPTED" && "Accepté"}
                          {participant.status === "DECLINED" && "Refusé"}
                          {participant.status === "TENTATIVE" && "Peut-être"}
                          {participant.status === "PENDING" && "En attente"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Aucun participant pour le moment
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Organisateur */}
          <Card>
            <CardHeader>
              <CardTitle>Organisateur</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={event.createdBy.avatar || undefined} />
                  <AvatarFallback>
                    {event.createdBy.firstName[0]}
                    {event.createdBy.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {event.createdBy.firstName} {event.createdBy.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {event.createdBy.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rappels */}
          {event.reminders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Rappels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {event.reminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {reminder.timing} min avant ({reminder.type})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
