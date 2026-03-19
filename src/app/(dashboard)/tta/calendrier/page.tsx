"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/use-auth";
import { TTAStats } from "@/components/tta/TTAStats";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load du calendrier TTA
const TTACalendar = dynamic(
  () =>
    import("@/components/tta/TTACalendar").then((mod) => ({
      default: mod.TTACalendar,
    })),
  {
    loading: () => <Skeleton className="h-[600px] w-full" />,
    ssr: false,
  }
);

interface TTAEntry {
  id: string;
  date: string;
  activityType: string;
  description: string | null;
  hours: number;
  nightHours: number;
  sundayHours: number;
  holidayHours: number;
  totalAmount: number;
  baseAmount: number;
  nightBonus: number;
  sundayBonus: number;
  holidayBonus: number;
  status: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

export default function TTACalendarPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<TTAEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/tta/entries?month=${currentMonth}&year=${currentYear}`
      );
      const data = await response.json();

      if (response.ok) {
        setEntries(data.entries);
      }
    } catch (error) {
      console.error("Erreur chargement entrées:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    // Rediriger vers la page principale avec la date sélectionnée
    router.push(`/tta?date=${date.toISOString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/tta")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Calendrier TTA</h1>
            <p className="text-muted-foreground">
              Vue mensuelle de vos heures de travail additionnel
            </p>
          </div>
        </div>
        <Button onClick={() => router.push("/tta")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle saisie
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Statistiques */}
          <TTAStats entries={entries} />

          {/* Calendrier */}
          <TTACalendar entries={entries} onDateClick={handleDateClick} />
        </>
      )}
    </div>
  );
}
