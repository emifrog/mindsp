"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, Euro } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";

interface TTAEntry {
  id: string;
  date: string;
  activityType: string;
  hours: number;
  totalAmount: number;
  status: string;
}

interface TTACalendarProps {
  entries: TTAEntry[];
  onDateClick?: (date: Date) => void;
}

export function TTACalendar({ entries, onDateClick }: TTACalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const entriesByDate = useMemo(() => {
    const map = new Map<string, TTAEntry[]>();
    entries.forEach((e) => {
      const key = new Date(e.date).toDateString();
      map.set(key, [...(map.get(key) || []), e]);
    });
    return map;
  }, [entries]);

  const getActivityColor = (type: string) => {
    const colors: Record<string, string> = {
      FMPA: "bg-blue-500",
      INTERVENTION: "bg-red-500",
      FORMATION: "bg-green-500",
      GARDE: "bg-purple-500",
      ASTREINTE: "bg-orange-500",
      AUTRE: "bg-gray-500",
    };
    return colors[type] || "bg-gray-500";
  };

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {format(currentDate, "MMMM yyyy", { locale: fr })}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={today}>
              Aujourd&apos;hui
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Jours de la semaine */}
        <div className="mb-2 grid grid-cols-7 gap-2">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grille du calendrier */}
        <div className="grid grid-cols-7 gap-2">
          {/* Jours vides avant le début du mois */}
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Jours du mois */}
          {days.map((day) => {
            const dayEntries = entriesByDate.get(day.toDateString()) || [];
            const dayTotal = {
              hours: dayEntries.reduce((sum, e) => sum + e.hours, 0),
              amount: dayEntries.reduce((sum, e) => sum + e.totalAmount, 0),
            };
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`aspect-square cursor-pointer rounded-lg border p-2 transition-colors ${isToday ? "border-primary bg-primary/5" : "border-border hover:bg-accent"} ${!isSameMonth(day, currentDate) ? "opacity-50" : ""} `}
                onClick={() => onDateClick?.(day)}
              >
                <div className="flex h-full flex-col">
                  <div className="mb-1 text-sm font-medium">
                    {format(day, "d")}
                  </div>

                  {dayEntries.length > 0 && (
                    <div className="flex-1 space-y-1">
                      {/* Indicateurs d'activités */}
                      <div className="flex flex-wrap gap-1">
                        {dayEntries.slice(0, 3).map((entry) => (
                          <div
                            key={entry.id}
                            className={`h-2 w-2 rounded-full ${getActivityColor(
                              entry.activityType
                            )}`}
                            title={entry.activityType}
                          />
                        ))}
                        {dayEntries.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{dayEntries.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Totaux */}
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{dayTotal.hours}h</span>
                        </div>
                        <div className="flex items-center gap-1 font-medium text-primary">
                          <Euro className="h-3 w-3" />
                          <span>{dayTotal.amount.toFixed(0)}€</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="mt-4 border-t pt-4">
          <div className="mb-2 text-sm font-medium">Types d&apos;activités</div>
          <div className="flex flex-wrap gap-2">
            {[
              { type: "FMPA", label: "FMPA" },
              { type: "INTERVENTION", label: "Intervention" },
              { type: "FORMATION", label: "Formation" },
              { type: "GARDE", label: "Garde" },
              { type: "ASTREINTE", label: "Astreinte" },
              { type: "AUTRE", label: "Autre" },
            ].map(({ type, label }) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${getActivityColor(type)}`}
                />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
