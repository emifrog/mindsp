"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  GraduationCap,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Formation {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string;
  level: string;
  duration: number | null;
  prerequisites: string | null;
  validityYears: number | null;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants: number | null;
  minParticipants: number | null;
  price: number | null;
  status: string;
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  registrations: Array<{
    id: string;
    status: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

export default function FormationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [formation, setFormation] = useState<Formation | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    fetchFormation();
  }, [params.id]);

  const fetchFormation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/formations/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setFormation(data.formation);
      }
    } catch (error) {
      console.error("Erreur chargement formation:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegistering(true);
    try {
      const response = await fetch(`/api/formations/${params.id}/register`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Inscription enregistrée",
          description: "Votre inscription est en attente de validation",
        });
        fetchFormation(); // Rafraîchir
      } else {
        toast({
          title: "Erreur",
          description: data.error || "Impossible de s'inscrire",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur inscription:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!confirm("Voulez-vous vraiment vous désinscrire ?")) return;

    try {
      const response = await fetch(`/api/formations/${params.id}/register`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Désinscription réussie",
          description: "Vous êtes désinscrit de cette formation",
        });
        fetchFormation();
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de se désinscrire",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur désinscription:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!formation) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Formation introuvable</p>
        </CardContent>
      </Card>
    );
  }

  const userRegistration = formation.registrations.find(
    (r) => r.user.id === user?.id
  );
  const isRegistered = !!userRegistration;
  const canRegister =
    formation.status === "OPEN" &&
    !isRegistered &&
    (!formation.maxParticipants ||
      formation.registrations.filter((r) =>
        ["PENDING", "APPROVED"].includes(r.status)
      ).length < formation.maxParticipants);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/formations">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold">{formation.title}</h1>
            <Badge>{formation.code}</Badge>
          </div>
          <p className="text-muted-foreground">{formation.category}</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {/* Informations principales */}
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {formation.description || "Aucune description"}
              </p>
            </CardContent>
          </Card>

          {formation.prerequisites && (
            <Card>
              <CardHeader>
                <CardTitle>Prérequis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-muted-foreground">
                  {formation.prerequisites}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>
                Participants ({formation.registrations.length}
                {formation.maxParticipants && `/${formation.maxParticipants}`})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formation.registrations.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun participant pour le moment
                </p>
              ) : (
                <div className="space-y-2">
                  {formation.registrations.map((reg) => (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">
                          {reg.user.firstName} {reg.user.lastName}
                        </p>
                      </div>
                      <Badge
                        variant={
                          reg.status === "APPROVED"
                            ? "default"
                            : reg.status === "PENDING"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {reg.status === "APPROVED" && (
                          <CheckCircle className="mr-1 h-3 w-3" />
                        )}
                        {reg.status === "REJECTED" && (
                          <XCircle className="mr-1 h-3 w-3" />
                        )}
                        {reg.status === "APPROVED"
                          ? "Approuvé"
                          : reg.status === "PENDING"
                            ? "En attente"
                            : reg.status === "REJECTED"
                              ? "Refusé"
                              : reg.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Inscription */}
          <Card>
            <CardHeader>
              <CardTitle>Inscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isRegistered ? (
                <>
                  <div className="rounded-lg bg-primary/10 p-4 text-center">
                    <CheckCircle className="mx-auto h-8 w-8 text-primary" />
                    <p className="mt-2 font-medium">Vous êtes inscrit</p>
                    <p className="text-sm text-muted-foreground">
                      Statut :{" "}
                      {userRegistration.status === "PENDING"
                        ? "En attente"
                        : userRegistration.status}
                    </p>
                  </div>
                  {userRegistration.status === "PENDING" && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleUnregister}
                    >
                      Se désinscrire
                    </Button>
                  )}
                </>
              ) : canRegister ? (
                <Button
                  className="w-full"
                  onClick={handleRegister}
                  disabled={registering}
                >
                  {registering ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Inscription...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="mr-2 h-4 w-4" />
                      S&apos;inscrire
                    </>
                  )}
                </Button>
              ) : (
                <div className="rounded-lg bg-destructive/10 p-4 text-center">
                  <p className="text-sm text-destructive">
                    {formation.status !== "OPEN"
                      ? "Inscriptions fermées"
                      : "Formation complète"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Détails */}
          <Card>
            <CardHeader>
              <CardTitle>Détails</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Dates</p>
                  <p className="text-muted-foreground">
                    Du{" "}
                    {format(new Date(formation.startDate), "PPP", {
                      locale: fr,
                    })}
                    <br />
                    Au{" "}
                    {format(new Date(formation.endDate), "PPP", { locale: fr })}
                  </p>
                </div>
              </div>

              {formation.duration && (
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">Durée</p>
                    <p className="text-muted-foreground">
                      {formation.duration} heures
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <p className="font-medium">Lieu</p>
                  <p className="text-muted-foreground">{formation.location}</p>
                </div>
              </div>

              {formation.instructor && (
                <div className="flex items-start gap-2">
                  <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <p className="font-medium">Formateur</p>
                    <p className="text-muted-foreground">
                      {formation.instructor.firstName}{" "}
                      {formation.instructor.lastName}
                    </p>
                  </div>
                </div>
              )}

              {formation.validityYears && (
                <div className="text-sm">
                  <p className="font-medium">Validité</p>
                  <p className="text-muted-foreground">
                    {formation.validityYears} an
                    {formation.validityYears > 1 ? "s" : ""}
                  </p>
                </div>
              )}

              {formation.price !== null && formation.price > 0 && (
                <div className="text-sm">
                  <p className="font-medium">Prix</p>
                  <p className="text-muted-foreground">{formation.price} €</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
