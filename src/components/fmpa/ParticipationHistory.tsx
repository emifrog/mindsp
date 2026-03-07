"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, CheckCircle, XCircle, Clock, type LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Participation {
  id: string;
  status: string;
  fmpa: {
    title: string;
    startDate: string;
    location: string;
    type: string;
  };
}

interface ParticipationHistoryProps {
  userId?: string;
  limit?: number;
}

const STATUS_LABELS: Record<string, string> = {
  REGISTERED: "Inscrit",
  CONFIRMED: "Confirmé",
  PRESENT: "Présent",
  ABSENT: "Absent",
  EXCUSED: "Excusé",
  CANCELLED: "Annulé",
};

const STATUS_ICONS: Record<string, LucideIcon> = {
  REGISTERED: Clock,
  CONFIRMED: CheckCircle,
  PRESENT: CheckCircle,
  ABSENT: XCircle,
  EXCUSED: Clock,
  CANCELLED: XCircle,
};

const STATUS_COLORS: Record<string, string> = {
  REGISTERED: "bg-yellow-500",
  CONFIRMED: "bg-blue-500",
  PRESENT: "bg-green-500",
  ABSENT: "bg-red-500",
  EXCUSED: "bg-orange-500",
  CANCELLED: "bg-gray-500",
};

export function ParticipationHistory({
  userId,
  limit = 10,
}: ParticipationHistoryProps) {
  const { toast } = useToast();
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    rate: 0,
  });

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, limit]);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      // TODO: Créer l'API endpoint pour l'historique
      // Pour l'instant, simulons avec les données
      const response = await fetch(
        `/api/fmpa/participations/history?userId=${userId || "me"}&limit=${limit}`
      );

      if (response.ok) {
        const data = await response.json();
        setParticipations(data.participations || []);
        setStats(data.stats || { total: 0, present: 0, absent: 0, rate: 0 });
      }
    } catch (error) {
      console.error("Erreur:", error);
      // Ne pas afficher d'erreur si l'endpoint n'existe pas encore
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des participations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des participations</CardTitle>
        <CardDescription>
          Vos {limit} dernières participations aux FMPA
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted p-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
            <p className="text-xs text-muted-foreground">Présent(s)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.rate}%</p>
            <p className="text-xs text-muted-foreground">Taux présence</p>
          </div>
        </div>

        {/* Liste des participations */}
        {participations.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-sm font-semibold">Aucune participation</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Vous n&apos;avez pas encore participé à de FMPA
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {participations.map((participation) => {
              const StatusIcon = STATUS_ICONS[participation.status] || Clock;
              const fmpa = participation.fmpa;
              const date = new Date(fmpa.startDate);

              return (
                <div
                  key={participation.id}
                  className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <div
                    className={`mt-1 rounded-full p-2 ${STATUS_COLORS[participation.status]} bg-opacity-20`}
                  >
                    <StatusIcon
                      className={`h-4 w-4 ${STATUS_COLORS[participation.status].replace("bg-", "text-")}`}
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{fmpa.title}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {date.toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{fmpa.location}</span>
                        </div>
                      </div>

                      <Badge
                        className={`${STATUS_COLORS[participation.status]} text-white`}
                      >
                        {STATUS_LABELS[participation.status]}
                      </Badge>
                    </div>

                    <Badge variant="outline" className="text-xs">
                      {fmpa.type}
                    </Badge>
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
