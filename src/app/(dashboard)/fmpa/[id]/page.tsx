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
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ArrowLeft,
  UserPlus,
  UserMinus,
  Edit,
  Trash2,
  QrCode,
  FileDown,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { generateEmargementPDF, downloadPDF } from "@/lib/pdf";

interface Participation {
  id: string;
  status: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    badge: string | null;
  };
}

interface FMPA {
  id: string;
  type: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants: number | null;
  status: string;
  requiresApproval: boolean;
  instructors: string | null;
  equipment: string | null;
  objectives: string | null;
  qrCode: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
    badge: string | null;
  };
  participations: Participation[];
}

export default function FMPADetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  const [fmpa, setFmpa] = useState<FMPA | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);

  useEffect(() => {
    fetchFMPA();
  }, [params.id]);

  const fetchFMPA = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fmpa/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setFmpa(data);
        // Vérifier si l'utilisateur est déjà inscrit
        const userParticipation = data.participations.find(
          (p: Participation) => p.user.id === user?.id
        );
        setIsRegistered(!!userParticipation);
      } else {
        toast({
          title: "Erreur",
          description: data.error || "FMPA introuvable",
          variant: "destructive",
        });
        router.push("/fmpa");
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la FMPA",
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Inscription réussie",
          description: fmpa?.requiresApproval
            ? "Votre inscription est en attente d'approbation"
            : "Vous êtes inscrit à cette FMPA",
        });
        fetchFMPA();
      } else {
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de s'inscrire",
        variant: "destructive",
      });
    }
  };

  const handleUnregister = async () => {
    try {
      const response = await fetch(`/api/fmpa/${params.id}/register`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Désinscription réussie",
          description: "Vous n'êtes plus inscrit à cette FMPA",
        });
        fetchFMPA();
      } else {
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se désinscrire",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette FMPA ?")) return;

    try {
      const response = await fetch(`/api/fmpa/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "FMPA supprimée",
          description: "La FMPA a été supprimée avec succès",
        });
        router.push("/fmpa");
      } else {
        const data = await response.json();
        toast({
          title: "Erreur",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la FMPA",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    if (!fmpa) return;

    try {
      setExportingPDF(true);

      const pdfData = {
        title: fmpa.title,
        type: fmpa.type,
        startDate: new Date(fmpa.startDate),
        endDate: new Date(fmpa.endDate),
        location: fmpa.location,
        participants: fmpa.participations.map((p) => ({
          firstName: p.user.firstName,
          lastName: p.user.lastName,
          badge: p.user.badge,
          status: p.status,
          presentAt: null, // Sera rempli lors de l'émargement
        })),
      };

      const pdfBlob = await generateEmargementPDF(pdfData);
      const filename = `emargement-${fmpa.title.replace(/\s+/g, "-")}-${format(new Date(), "yyyy-MM-dd")}`;
      downloadPDF(pdfBlob, filename);

      toast({
        title: "PDF généré",
        description: "La feuille d'émargement a été téléchargée",
      });
    } catch (error) {
      console.error("Erreur export PDF:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive",
      });
    } finally {
      setExportingPDF(false);
    }
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      FORMATION: "bg-blue-100 text-blue-800",
      MANOEUVRE: "bg-orange-100 text-orange-800",
      PRESENCE_ACTIVE: "bg-green-100 text-green-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800",
      PUBLISHED: "bg-green-100 text-green-800",
      IN_PROGRESS: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-purple-100 text-purple-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getParticipationStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      REGISTERED: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-green-100 text-green-800",
      PRESENT: "bg-blue-100 text-blue-800",
      ABSENT: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!fmpa) {
    return null;
  }

  const canEdit = isAdmin || isManager || fmpa.createdBy.email === user?.email;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/fmpa">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Link>
        </Button>

        <div className="flex gap-2">
          {canEdit && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/fmpa/${fmpa.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Link>
              </Button>
              {isAdmin && (
                <Button variant="destructive" onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Informations principales */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="text-2xl">{fmpa.title}</CardTitle>
              <div className="flex gap-2">
                <Badge className={getTypeColor(fmpa.type)}>{fmpa.type}</Badge>
                <Badge className={getStatusColor(fmpa.status)}>
                  {fmpa.status}
                </Badge>
                {fmpa.requiresApproval && (
                  <Badge variant="outline">Approbation requise</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {fmpa.description && (
            <div>
              <h3 className="mb-2 font-semibold">Description</h3>
              <p className="text-muted-foreground">{fmpa.description}</p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Date</p>
                <p className="text-muted-foreground">
                  {format(new Date(fmpa.startDate), "PPP", { locale: fr })}
                </p>
              </div>
            </div>

            <div className="flex items-center text-sm">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Horaires</p>
                <p className="text-muted-foreground">
                  {format(new Date(fmpa.startDate), "HH:mm")} -{" "}
                  {format(new Date(fmpa.endDate), "HH:mm")}
                </p>
              </div>
            </div>

            <div className="flex items-center text-sm">
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Lieu</p>
                <p className="text-muted-foreground">{fmpa.location}</p>
              </div>
            </div>

            <div className="flex items-center text-sm">
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Participants</p>
                <p className="text-muted-foreground">
                  {fmpa.participations.length}
                  {fmpa.maxParticipants && ` / ${fmpa.maxParticipants}`}
                </p>
              </div>
            </div>
          </div>

          {fmpa.instructors && (
            <div>
              <h3 className="mb-2 font-semibold">Formateurs</h3>
              <p className="text-muted-foreground">{fmpa.instructors}</p>
            </div>
          )}

          {fmpa.equipment && (
            <div>
              <h3 className="mb-2 font-semibold">Équipement requis</h3>
              <p className="text-muted-foreground">{fmpa.equipment}</p>
            </div>
          )}

          {fmpa.objectives && (
            <div>
              <h3 className="mb-2 font-semibold">Objectifs</h3>
              <p className="text-muted-foreground">{fmpa.objectives}</p>
            </div>
          )}

          {/* Actions d'inscription */}
          {fmpa.status === "PUBLISHED" && (
            <div className="border-t pt-4">
              {isRegistered ? (
                <Button
                  variant="outline"
                  onClick={handleUnregister}
                  className="w-full"
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Se désinscrire
                </Button>
              ) : (
                <Button onClick={handleRegister} className="w-full">
                  <UserPlus className="mr-2 h-4 w-4" />
                  S&apos;inscrire
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Liste des participants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Participants ({fmpa.participations.length})</CardTitle>
              <CardDescription>
                Liste des personnes inscrites à cette FMPA
              </CardDescription>
            </div>
            {(isAdmin || isManager) && fmpa.participations.length > 0 && (
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={exportingPDF}
              >
                <FileDown className="mr-2 h-4 w-4" />
                {exportingPDF ? "Génération..." : "Exporter PDF"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {fmpa.participations.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Aucun participant pour le moment
            </p>
          ) : (
            <div className="space-y-2">
              {fmpa.participations.map((participation) => (
                <div
                  key={participation.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">
                        {participation.user.firstName}{" "}
                        {participation.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {participation.user.badge || participation.user.email}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={getParticipationStatusColor(
                      participation.status
                    )}
                  >
                    {participation.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code */}
      {(isAdmin || isManager) && (
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>Code QR pour l&apos;émargement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <QrCode className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-mono text-sm">{fmpa.qrCode}</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Générer le QR Code
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
