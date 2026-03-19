"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FMPAItem {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
}

const FMPA_TYPE_COLORS: Record<string, string> = {
  FORMATION: "bg-blue-500",
  MANOEUVRE: "bg-red-500",
  EXERCICE: "bg-orange-500",
  PRESENCE_ACTIVE: "bg-green-500",
  CEREMONIE: "bg-purple-500",
  REUNION: "bg-yellow-500",
  AUTRE: "bg-gray-500",
};

export function FMPACalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [fmpas, setFmpas] = useState<FMPAItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFMPAs();
  }, [currentDate]);

  const fetchFMPAs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/fmpa");
      if (response.ok) {
        const data = await response.json();
        setFmpas(data.fmpas || []);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const fmpasByDate = useMemo(() => {
    const map = new Map<string, FMPAItem[]>();
    fmpas.forEach((f) => {
      const key = new Date(f.startDate).toDateString();
      map.set(key, [...(map.get(key) || []), f]);
    });
    return map;
  }, [fmpas]);

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Calendrier FMPA</CardTitle>
            <CardDescription>Vue mensuelle des FMPA</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[200px] text-center font-medium capitalize">
              {monthName}
            </div>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {/* En-têtes des jours */}
            {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}

            {/* Jours du mois */}
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="p-2" />;
              }

              const date = new Date(year, month, day);
              const dayFMPAs = fmpasByDate.get(date.toDateString()) || [];
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={day}
                  className={cn(
                    "min-h-[100px] rounded-lg border p-2",
                    isToday && "border-primary bg-primary/5"
                  )}
                >
                  <div
                    className={cn(
                      "mb-1 text-sm font-medium",
                      isToday && "text-primary"
                    )}
                  >
                    {day}
                  </div>

                  <div className="space-y-1">
                    {dayFMPAs.slice(0, 3).map((fmpa) => (
                      <Link
                        key={fmpa.id}
                        href={`/fmpa/${fmpa.id}`}
                        className="block"
                      >
                        <div
                          className={cn(
                            "truncate rounded px-1 py-0.5 text-xs text-white",
                            FMPA_TYPE_COLORS[fmpa.type] || "bg-gray-500"
                          )}
                        >
                          {fmpa.title}
                        </div>
                      </Link>
                    ))}
                    {dayFMPAs.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayFMPAs.length - 3} autre(s)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
