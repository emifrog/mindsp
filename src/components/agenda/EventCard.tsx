"use client";

import React from "react";
import { Clock, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { EVENT_COLORS, formatTime } from "@/lib/calendar-utils";
import type { AgendaEventType } from "@prisma/client";

interface EventCardProps {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  type: AgendaEventType;
  location?: string | null;
  color?: string | null;
  participantCount?: number;
  allDay?: boolean;
}

export const EventCard = React.memo(function EventCard({
  title,
  startDate,
  endDate,
  type,
  location,
  color,
  participantCount,
  allDay,
}: EventCardProps) {
  const eventColor = color || EVENT_COLORS[type];

  return (
    <div
      className={cn(
        "group relative w-full cursor-pointer rounded-md border-l-4 bg-card p-2 text-left text-xs transition-all hover:shadow-md"
      )}
      style={{ borderLeftColor: eventColor }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-1">
          <p className="line-clamp-2 font-medium leading-tight">{title}</p>

          {!allDay && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {formatTime(startDate)} - {formatTime(endDate)}
              </span>
            </div>
          )}

          {location && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{location}</span>
            </div>
          )}

          {participantCount !== undefined && participantCount > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{participantCount}</span>
            </div>
          )}
        </div>

        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: eventColor }}
        />
      </div>
    </div>
  );
});
