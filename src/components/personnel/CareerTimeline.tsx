"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp, Calendar } from "lucide-react";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { fr } from "date-fns/locale";

interface GradeHistoryItem {
  id: string;
  grade: string;
  effectiveDate: string;
  promotionType: string;
  orderNumber?: string;
  orderDate?: string;
  notes?: string;
}

interface Medal {
  id: string;
  name: string;
  type: string;
  level?: string;
  awardDate: string;
  ceremonyDate?: string;
  ceremonyPlace?: string;
}

interface CareerTimelineProps {
  engagementDate: string;
  reengagementDate?: string;
  currentGrade: string;
  gradeHistory: GradeHistoryItem[];
  medals: Medal[];
}

export function CareerTimeline({
  engagementDate,
  reengagementDate,
  currentGrade,
  gradeHistory,
  medals,
}: CareerTimelineProps) {
  const calculateSeniority = () => {
    const start = new Date(engagementDate);
    const now = new Date();
    const years = differenceInYears(now, start);
    const months = differenceInMonths(now, start) % 12;
    return { years, months };
  };

  const seniority = calculateSeniority();

  const getPromotionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ANCIENNETE: "Ancienneté",
      CHOIX: "Au choix",
      EXAMEN: "Examen",
      AUTRE: "Autre",
    };
    return labels[type] || type;
  };

  const getMedalTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      HONNEUR: "bg-yellow-500",
      MERITE: "bg-blue-500",
      ANCIENNETE: "bg-green-500",
      COURAGE: "bg-red-500",
      AUTRE: "bg-gray-500",
    };
    return colors[type] || "bg-gray-500";
  };

  // Combiner et trier tous les événements
  const allEvents = [
    {
      type: "engagement",
      date: engagementDate,
      title: "Engagement",
      description: "Début de carrière",
    },
    ...gradeHistory.map((g) => ({
      type: "grade",
      date: g.effectiveDate,
      title: `Grade: ${g.grade}`,
      description: getPromotionTypeLabel(g.promotionType),
      details: g,
    })),
    ...medals.map((m) => ({
      type: "medal",
      date: m.awardDate,
      title: m.name,
      description: m.level || "",
      details: m,
    })),
    ...(reengagementDate
      ? [
          {
            type: "reengagement",
            date: reengagementDate,
            title: "Réengagement",
            description: "Renouvellement",
          },
        ]
      : []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-4">
      {/* Résumé carrière */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ancienneté</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {seniority.years} ans {seniority.months} mois
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Depuis {format(new Date(engagementDate), "PPP", { locale: fr })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grade actuel</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentGrade}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {gradeHistory.length} promotion(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Médailles</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{medals.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Décorations obtenues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Historique de carrière</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-4">
            {/* Ligne verticale */}
            <div className="absolute bottom-0 left-4 top-0 w-0.5 bg-border" />

            {allEvents.map((event, index) => (
              <div key={index} className="relative pl-10">
                {/* Point sur la timeline */}
                <div
                  className={`absolute left-2.5 h-3 w-3 rounded-full border-2 border-background ${
                    event.type === "engagement"
                      ? "bg-green-500"
                      : event.type === "grade"
                        ? "bg-blue-500"
                        : event.type === "medal"
                          ? "bg-yellow-500"
                          : "bg-purple-500"
                  } `}
                />

                {/* Contenu */}
                <div className="pb-4">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium">{event.title}</span>
                    {event.type === "medal" && (event as any).details && (
                      <Badge className={getMedalTypeColor((event as any).details.type)}>
                        {(event as any).details.type}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {format(new Date(event.date), "PPP", { locale: fr })}
                  </p>
                  {event.type === "grade" && (event as any).details?.orderNumber && (
                    <p className="text-xs text-muted-foreground">
                      Arrêté n° {(event as any).details.orderNumber}
                    </p>
                  )}
                  {event.type === "medal" && (event as any).details?.ceremonyPlace && (
                    <p className="text-xs text-muted-foreground">
                      Cérémonie : {(event as any).details.ceremonyPlace}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
