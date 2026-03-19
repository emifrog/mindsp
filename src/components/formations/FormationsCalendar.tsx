"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Users, MapPin } from "lucide-react";
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

interface Formation {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  category: string;
  status: string;
  maxParticipants?: number;
  _count?: {
    registrations: number;
  };
}

interface FormationsCalendarProps {
  formations: Formation[];
  onFormationClick?: (formation: Formation) => void;
}

export function FormationsCalendar({
  formations,
  onFormationClick,
}: FormationsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const formationsByDate = useMemo(() => {
    const map = new Map<string, Formation[]>();
    formations.forEach((f) => {
      let d = new Date(f.startDate);
      const end = new Date(f.endDate);
      while (d <= end) {
        const key = d.toDateString();
        map.set(key, [...(map.get(key) || []), f]);
        d = new Date(d.getTime() + 86400000);
      }
    });
    return map;
  }, [formations]);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      INCENDIE: "bg-red-500",
      SECOURS: "bg-blue-500",
      TECHNIQUE: "bg-green-500",
      MANAGEMENT: "bg-purple-500",
      REGLEMENTAIRE: "bg-yellow-500",
      AUTRE: "bg-gray-500",
    };
    return colors[category] || "bg-gray-500";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "default";
      case "FULL":
        return "destructive";
      case "IN_PROGRESS":
        return "secondary";
      case "COMPLETED":
        return "outline";
      default:
        return "secondary";
    }
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
            const dayFormations = formationsByDate.get(day.toDateString()) || [];
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] rounded-lg border p-2 transition-colors ${isToday ? "border-primary bg-primary/5" : "border-border hover:bg-accent"} ${!isSameMonth(day, currentDate) ? "opacity-50" : ""} `}
              >
                <div className="flex h-full flex-col">
                  <div className="mb-1 text-sm font-medium">
                    {format(day, "d")}
                  </div>

                  {dayFormations.length > 0 && (
                    <div className="flex-1 space-y-1 overflow-y-auto">
                      {dayFormations.map((formation) => (
                        <div
                          key={formation.id}
                          className={`cursor-pointer rounded p-1 text-xs ${getCategoryColor(formation.category)} text-white transition-opacity hover:opacity-80`}
                          onClick={() => onFormationClick?.(formation)}
                          title={formation.title}
                        >
                          <div className="truncate font-medium">
                            {formation.title}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                              {formation.location}
                            </span>
                          </div>
                          {formation.maxParticipants && (
                            <div className="mt-0.5 flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>
                                {formation._count?.registrations || 0}/
                                {formation.maxParticipants}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Légende */}
        <div className="mt-4 border-t pt-4">
          <div className="mb-2 text-sm font-medium">Catégories</div>
          <div className="flex flex-wrap gap-2">
            {[
              { category: "INCENDIE", label: "Incendie" },
              { category: "SECOURS", label: "Secours" },
              { category: "TECHNIQUE", label: "Technique" },
              { category: "MANAGEMENT", label: "Management" },
              { category: "REGLEMENTAIRE", label: "Réglementaire" },
              { category: "AUTRE", label: "Autre" },
            ].map(({ category, label }) => (
              <div key={category} className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded ${getCategoryColor(category)}`}
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
