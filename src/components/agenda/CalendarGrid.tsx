"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  DAYS_OF_WEEK_SHORT,
  getCalendarDays,
  isSameDay,
} from "@/lib/calendar-utils";
import { EventCard } from "./EventCard";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { AgendaEventType } from "@prisma/client";

interface CalendarEvent {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: AgendaEventType;
  location?: string | null;
  color?: string | null;
  allDay?: boolean;
  _count?: {
    participants: number;
  };
}

interface CalendarGridProps {
  currentDate: Date;
  events: CalendarEvent[];
  onEventClick?: (eventId: string) => void;
  onDayClick?: (date: Date) => void;
}

export function CalendarGrid({
  currentDate,
  events,
  onEventClick,
  onDayClick,
}: CalendarGridProps) {
  const days = getCalendarDays(
    currentDate.getFullYear(),
    currentDate.getMonth()
  );

  // Grouper les événements par jour
  const eventsByDay = useMemo(() => events.reduce(
    (acc, event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);

      // Trouver tous les jours où l'événement est actif
      days.forEach(({ date }) => {
        if (
          (isSameDay(date, eventStart) ||
            isSameDay(date, eventEnd) ||
            (date > eventStart && date < eventEnd)) &&
          date.getMonth() === currentDate.getMonth()
        ) {
          const key = date.toISOString().split("T")[0];
          if (!acc[key]) {
            acc[key] = [];
          }
          // Éviter les doublons
          if (!acc[key].find((e) => e.id === event.id)) {
            acc[key].push(event);
          }
        }
      });

      return acc;
    },
    {} as Record<string, CalendarEvent[]>
  ), [events, days, currentDate]);

  // Vue liste mobile : jours du mois courant avec événements
  const daysWithEvents = useMemo(() => days
    .filter(({ isCurrentMonth }) => isCurrentMonth)
    .map(({ date, day, isToday }) => {
      const dateKey = date.toISOString().split("T")[0];
      return { date, day, isToday, events: eventsByDay[dateKey] || [] };
    })
    .filter(({ events }) => events.length > 0), [days, eventsByDay]);

  return (
    <div className="flex-1 overflow-auto">
      {/* Vue grille desktop */}
      <div className="hidden md:block">
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {DAYS_OF_WEEK_SHORT.map((day) => (
            <div
              key={day}
              className="border-r p-2 text-center text-sm font-medium last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div
          className="grid grid-cols-7"
          style={{ gridAutoRows: "minmax(120px, 1fr)" }}
        >
          {days.map(({ date, day, isCurrentMonth, isToday }) => {
            const dateKey = date.toISOString().split("T")[0];
            const dayEvents = eventsByDay[dateKey] || [];

            return (
              <button
                key={date.toISOString()}
                onClick={() => onDayClick?.(date)}
                className={cn(
                  "group relative border-b border-r p-2 text-left transition-colors last:border-r-0",
                  "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring",
                  !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                  isToday && "bg-primary/5"
                )}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full text-sm",
                      isToday &&
                        "bg-primary font-semibold text-primary-foreground",
                      !isCurrentMonth && "opacity-50"
                    )}
                  >
                    {day}
                  </span>
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event.id);
                      }}
                    >
                      <EventCard
                        id={event.id}
                        title={event.title}
                        startDate={new Date(event.startDate)}
                        endDate={new Date(event.endDate)}
                        type={event.type}
                        location={event.location}
                        color={event.color}
                        allDay={event.allDay}
                        participantCount={event._count?.participants}
                      />
                    </div>
                  ))}

                  {dayEvents.length > 3 && (
                    <div className="rounded-md bg-muted px-2 py-1 text-center text-xs text-muted-foreground">
                      +{dayEvents.length - 3} autre
                      {dayEvents.length - 3 > 1 ? "s" : ""}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vue liste mobile */}
      <div className="space-y-3 md:hidden">
        {daysWithEvents.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Aucun événement ce mois-ci
          </div>
        ) : (
          daysWithEvents.map(({ date, isToday, events: dayEvents }) => (
            <div key={date.toISOString()}>
              <button
                onClick={() => onDayClick?.(date)}
                className={cn(
                  "mb-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold",
                  isToday ? "bg-primary/10 text-primary" : "text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm",
                    isToday && "bg-primary text-primary-foreground"
                  )}
                >
                  {date.getDate()}
                </span>
                <span>
                  {format(date, "EEEE d MMMM", { locale: fr })}
                </span>
              </button>
              <div className="space-y-2 pl-2">
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => onEventClick?.(event.id)}
                    className="cursor-pointer"
                  >
                    <EventCard
                      id={event.id}
                      title={event.title}
                      startDate={new Date(event.startDate)}
                      endDate={new Date(event.endDate)}
                      type={event.type}
                      location={event.location}
                      color={event.color}
                      allDay={event.allDay}
                      participantCount={event._count?.participants}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
