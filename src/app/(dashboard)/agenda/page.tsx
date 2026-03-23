"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CalendarHeader } from "@/components/agenda/CalendarHeader";
import { CalendarGrid } from "@/components/agenda/CalendarGrid";
import { EventFilters } from "@/components/agenda/EventFilters";
import { addMonths, getMonthRange, toISOString } from "@/lib/calendar-utils";
import type { AgendaEventType, AgendaEventStatus } from "@prisma/client";

interface AgendaEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: AgendaEventType;
  location?: string | null;
  color?: string | null;
  allDay?: boolean;
  _count?: {
    participants: number;
  };
}

export default function AgendaPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    type?: AgendaEventType;
    status?: AgendaEventStatus;
  }>({});

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, filters]);

  const fetchEvents = async () => {
    try {
      setLoading(true);

      // Récupérer les événements du mois actuel
      const { start, end } = getMonthRange(
        currentDate.getFullYear(),
        currentDate.getMonth()
      );

      const params = new URLSearchParams({
        startDate: toISOString(start),
        endDate: toISOString(end),
        limit: "100",
      });

      // Ajouter les filtres
      if (filters.type) {
        params.append("type", filters.type);
      }
      if (filters.status) {
        params.append("status", filters.status);
      }

      const response = await fetch(`/api/agenda/events?${params}`);

      if (!response.ok) {
        throw new Error("Erreur de chargement");
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Erreur chargement événements:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les événements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => addMonths(prev, -1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (eventId: string) => {
    router.push(`/agenda/${eventId}`);
  };

  const handleDayClick = (date: Date) => {
    // TODO: Ouvrir dialog de création avec date pré-remplie
    // eslint-disable-next-line no-console
  };

  const handleNewEvent = () => {
    router.push("/agenda/nouveau");
  };

  // Convertir les dates string en Date objects pour le calendrier
  const eventsWithDates = events.map((event) => ({
    ...event,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
  }));

  return (
    <div className="flex h-full flex-col">
      {/* Header avec bouton nouveau */}
      <div className="flex items-center justify-between border-b bg-card px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            Gérez vos événements et votre planning
          </p>
        </div>
        <div className="flex gap-2">
          <EventFilters filters={filters} onFiltersChange={setFilters} />
          <Button onClick={handleNewEvent}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel événement
          </Button>
        </div>
      </div>

      {/* Navigation calendrier */}
      <CalendarHeader
        currentDate={currentDate}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      {/* Grille calendrier */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-2 text-sm text-muted-foreground">Chargement...</p>
          </div>
        </div>
      ) : (
        <CalendarGrid
          currentDate={currentDate}
          events={eventsWithDates}
          onEventClick={handleEventClick}
          onDayClick={handleDayClick}
        />
      )}
    </div>
  );
}
