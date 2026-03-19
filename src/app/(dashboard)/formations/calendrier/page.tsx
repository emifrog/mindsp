"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load du calendrier (composant lourd)
const FormationsCalendar = dynamic(
  () =>
    import("@/components/formations/FormationsCalendar").then((mod) => ({
      default: mod.FormationsCalendar,
    })),
  {
    loading: () => (
      <Card>
        <CardContent className="py-12">
          <Skeleton className="h-[600px] w-full" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
);

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

export default function FormationsCalendarPage() {
  const router = useRouter();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormations();
  }, []);

  const fetchFormations = async () => {
    try {
      const response = await fetch("/api/formations");
      const data = await response.json();
      if (response.ok) {
        setFormations(data.formations || []);
      }
    } catch (error) {
      console.error("Erreur chargement formations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormationClick = (formation: Formation) => {
    router.push(`/formations/${formation.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/formations")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Calendrier des Formations</h1>
            <p className="text-muted-foreground">
              Vue mensuelle des formations disponibles
            </p>
          </div>
        </div>
        <Button onClick={() => router.push("/formations/nouvelle")}>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle formation
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : (
        <FormationsCalendar
          formations={formations}
          onFormationClick={handleFormationClick}
        />
      )}
    </div>
  );
}
