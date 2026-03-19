"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { AgendaEventType, AgendaEventStatus } from "@prisma/client";

// Lazy load du formulaire événement
const EventForm = dynamic(
  () =>
    import("@/components/agenda/EventForm").then((mod) => ({
      default: mod.EventForm,
    })),
  {
    loading: () => <Skeleton className="h-[700px] w-full" />,
    ssr: false,
  }
);

interface EventData {
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
}

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleSuccess = () => {
    router.push(`/agenda/${params.id}`);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/agenda/${event.id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Modifier l&apos;événement</h1>
          <p className="text-muted-foreground">
            Modifiez les détails de votre événement
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de l&apos;événement</CardTitle>
          <CardDescription>
            Modifiez les champs que vous souhaitez mettre à jour
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm
            initialData={{
              id: event.id,
              title: event.title,
              description: event.description,
              startDate: new Date(event.startDate),
              endDate: new Date(event.endDate),
              allDay: event.allDay,
              type: event.type,
              status: event.status,
              location: event.location,
              color: event.color,
            }}
            onSuccess={handleSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
}
