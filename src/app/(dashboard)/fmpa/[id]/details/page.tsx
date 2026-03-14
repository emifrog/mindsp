"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ParticipantsList } from "@/components/fmpa/ParticipantsList";
import { MealRegistration } from "@/components/fmpa/MealRegistration";

interface FMPAParticipation {
  id: string;
  userId: string;
  status: string;
  mealRegistration?: {
    id: string;
    menuChoice?: string;
    dietaryRestrictions?: string;
    confirmed: boolean;
  } | null;
}

interface FMPADetail {
  title: string;
  description?: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants?: number;
  objectives?: string;
  equipment?: string;
  mealAvailable?: boolean;
  mealOptions?: { menus?: string[] };
  createdBy: { firstName: string; lastName: string };
  participations?: FMPAParticipation[];
  userId?: string;
}

interface FMPADetailStats {
  total: number;
  capacity?: { isFull: boolean };
  rates?: { attendance: number; meal: number };
  byStatus?: {
    registered: number;
    confirmed: number;
    present: number;
    absent: number;
    excused: number;
  };
  meals?: {
    total: number;
    byMenu?: { menu: string; count: number }[];
  };
}

export default function FMPADetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [fmpa, setFmpa] = useState<FMPADetail | null>(null);
  const [stats, setStats] = useState<FMPADetailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userParticipation, setUserParticipation] = useState<FMPAParticipation | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch FMPA details
      const fmpaRes = await fetch(`/api/fmpa/${params.id}`);
      if (!fmpaRes.ok) throw new Error("FMPA introuvable");
      const fmpaData = await fmpaRes.json();
      setFmpa(fmpaData);

      // Find user participation
      const userPart = fmpaData.participations?.find(
        (p: FMPAParticipation) => p.userId === fmpaData.userId // TODO: Get from session
      );
      setUserParticipation(userPart);

      // Fetch stats
      const statsRes = await fetch(`/api/fmpa/${params.id}/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      const response = await fetch(`/api/fmpa/${params.id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l&apos;inscription");
      }

      toast({
        title: "Inscription réussie",
        description: "Vous êtes maintenant inscrit à cette FMPA",
      });

      fetchData();
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur",
        variant: "destructive",
      });
    }
  };

  const handleUnregister = async () => {
    if (!confirm("Êtes-vous sûr de vouloir vous désinscrire ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/fmpa/${params.id}/register`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la désinscription");
      }

      toast({
        title: "Désinscription réussie",
        description: "Vous n&apos;êtes plus inscrit à cette FMPA",
      });

      fetchData();
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!fmpa) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <p className="text-lg font-medium">FMPA introuvable</p>
        <Button asChild className="mt-4">
          <Link href="/fmpa">Retour à la liste</Link>
        </Button>
      </div>
    );
  }

  const startDate = new Date(fmpa.startDate);
  const endDate = new Date(fmpa.endDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/fmpa">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{fmpa.title}</h1>
            <p className="text-muted-foreground">
              {startDate.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          {!userParticipation && fmpa.status === "PUBLISHED" && (
            <Button onClick={handleRegister}>S&apos;inscrire</Button>
          )}
          {userParticipation && fmpa.status === "PUBLISHED" && (
            <Button variant="destructive" onClick={handleUnregister}>
              Se désinscrire
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/fmpa/${params.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Link>
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.total || 0}
              {fmpa.maxParticipants && ` / ${fmpa.maxParticipants}`}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.capacity?.isFull ? "Complet" : "Places disponibles"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Taux de présence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.rates?.attendance || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.byStatus?.present || 0} présent(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Repas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.meals?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.rates?.meal || 0}% inscrits
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Détails</TabsTrigger>
          <TabsTrigger value="participants">
            <Users className="mr-2 h-4 w-4" />
            Participants ({fmpa.participations?.length || 0})
          </TabsTrigger>
          {fmpa.mealAvailable && userParticipation && (
            <TabsTrigger value="meal">Repas</TabsTrigger>
          )}
          <TabsTrigger value="stats">
            <TrendingUp className="mr-2 h-4 w-4" />
            Statistiques
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fmpa.description && (
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {fmpa.description}
                  </p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="font-medium">Type</h3>
                  <Badge>{fmpa.type}</Badge>
                </div>

                <div>
                  <h3 className="font-medium">Statut</h3>
                  <Badge>{fmpa.status}</Badge>
                </div>

                <div>
                  <h3 className="font-medium">Lieu</h3>
                  <p className="text-sm text-muted-foreground">
                    {fmpa.location}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium">Organisateur</h3>
                  <p className="text-sm text-muted-foreground">
                    {fmpa.createdBy.firstName} {fmpa.createdBy.lastName}
                  </p>
                </div>
              </div>

              {fmpa.objectives && (
                <div>
                  <h3 className="font-medium">Objectifs pédagogiques</h3>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {fmpa.objectives}
                  </p>
                </div>
              )}

              {fmpa.equipment && (
                <div>
                  <h3 className="font-medium">Matériel nécessaire</h3>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {fmpa.equipment}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="participants">
          <ParticipantsList
            fmpaId={params.id as string}
            participants={fmpa.participations || []}
            canValidate={true} // TODO: Check permissions
            onUpdate={fetchData}
          />
        </TabsContent>

        {fmpa.mealAvailable && userParticipation && (
          <TabsContent value="meal">
            <MealRegistration
              fmpaId={params.id as string}
              mealOptions={fmpa.mealOptions}
              currentRegistration={userParticipation.mealRegistration}
              onUpdate={fetchData}
            />
          </TabsContent>
        )}

        <TabsContent value="stats">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Statuts des participants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Inscrits</span>
                    <Badge variant="outline">
                      {stats?.byStatus?.registered || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Confirmés</span>
                    <Badge variant="outline">
                      {stats?.byStatus?.confirmed || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Présents</span>
                    <Badge variant="outline">
                      {stats?.byStatus?.present || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Absents</span>
                    <Badge variant="outline">
                      {stats?.byStatus?.absent || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Excusés</span>
                    <Badge variant="outline">
                      {stats?.byStatus?.excused || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {stats?.meals?.byMenu && stats.meals.byMenu.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Répartition des menus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats.meals.byMenu.map((menu: { menu: string; count: number }, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span>{menu.menu}</span>
                        <Badge variant="outline">{menu.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
