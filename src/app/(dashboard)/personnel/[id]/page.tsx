"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { CareerTimeline } from "@/components/personnel/CareerTimeline";
import { QualificationsList } from "@/components/personnel/QualificationsList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Mail,
  Phone,
  Shield,
  Wrench,
  FileText,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PersonnelEquipment {
  id: string;
  name: string;
  type: string;
  condition: string;
  serialNumber?: string;
  nextCheck?: string;
  status: string;
}

interface PersonnelDocument {
  id: string;
  title: string;
  type: string;
  documentDate?: string;
  description?: string;
}

interface PersonnelFile {
  user: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    avatar?: string;
    badge?: string;
  };
  currentGrade: string;
  medicalStatus?: {
    status: string;
    validUntil: string;
    nextCheckup: string;
    restrictions?: string;
  };
  engagementDate: string;
  reengagementDate?: string;
  gradeHistory?: Array<{
    id: string;
    grade: string;
    effectiveDate: string;
    promotionType: string;
    orderNumber?: string;
    orderDate?: string;
    notes?: string;
  }>;
  medals?: Array<{
    id: string;
    name: string;
    type: string;
    level?: string;
    awardDate: string;
    ceremonyDate?: string;
    ceremonyPlace?: string;
  }>;
  qualifications?: Array<{
    id: string;
    name: string;
    type: string;
    level?: string;
    obtainedDate: string;
    validUntil?: string;
    renewable: boolean;
    organization?: string;
    certificateNumber?: string;
    status: string;
  }>;
  equipments?: PersonnelEquipment[];
  documents?: PersonnelDocument[];
}

export default function PersonnelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [file, setFile] = useState<PersonnelFile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchFile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchFile = async () => {
    try {
      const response = await fetch(`/api/personnel/files/${params.id}`);
      const data = await response.json();
      if (response.ok) {
        setFile(data.file);
      }
    } catch (error) {
      console.error("Erreur chargement fiche:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!file) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.push("/personnel")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Fiche non trouvée</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getAptitudeColor = (status: string) => {
    switch (status) {
      case "APT":
        return "default";
      case "INAPT_TEMP":
        return "secondary";
      case "INAPT_DEF":
        return "destructive";
      case "RESTRICTIONS":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getAptitudeLabel = (status: string) => {
    const labels: Record<string, string> = {
      APT: "Apte",
      INAPT_TEMP: "Inapte temporaire",
      INAPT_DEF: "Inapte définitif",
      RESTRICTIONS: "Avec restrictions",
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/personnel")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Fiche Personnel</h1>
          <p className="text-muted-foreground">
            Informations détaillées et historique
          </p>
        </div>
      </div>

      {/* Profil */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={file.user.avatar} />
              <AvatarFallback className="text-2xl">
                {file.user.firstName[0]}
                {file.user.lastName[0]}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <h2 className="text-2xl font-bold">
                  {file.user.firstName} {file.user.lastName}
                </h2>
                <Badge variant="outline">{file.user.badge}</Badge>
                <Badge>{file.currentGrade}</Badge>
              </div>

              <div className="grid gap-2 text-sm text-muted-foreground">
                {file.user.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{file.user.email}</span>
                  </div>
                )}
                {file.user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{file.user.phone}</span>
                  </div>
                )}
              </div>

              {/* Aptitude médicale */}
              {file.medicalStatus && (
                <div className="mt-4 rounded-lg bg-muted p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Aptitude médicale</span>
                    <Badge
                      variant={getAptitudeColor(file.medicalStatus.status)}
                    >
                      {getAptitudeLabel(file.medicalStatus.status)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>
                      Valide jusqu&apos;au{" "}
                      {format(new Date(file.medicalStatus.validUntil), "PPP", {
                        locale: fr,
                      })}
                    </div>
                    <div>
                      Prochaine visite :{" "}
                      {format(new Date(file.medicalStatus.nextCheckup), "PPP", {
                        locale: fr,
                      })}
                    </div>
                    {file.medicalStatus.restrictions && (
                      <div className="mt-2 text-yellow-600">
                        Restrictions : {file.medicalStatus.restrictions}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="career" className="space-y-4">
        <TabsList>
          <TabsTrigger value="career">Carrière</TabsTrigger>
          <TabsTrigger value="qualifications">
            Qualifications ({file.qualifications?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="equipment">
            Équipements ({file.equipments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({file.documents?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="career">
          <CareerTimeline
            engagementDate={file.engagementDate}
            reengagementDate={file.reengagementDate}
            currentGrade={file.currentGrade}
            gradeHistory={file.gradeHistory || []}
            medals={file.medals || []}
          />
        </TabsContent>

        <TabsContent value="qualifications">
          <QualificationsList qualifications={file.qualifications || []} />
        </TabsContent>

        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Équipements Individuels
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!file.equipments || file.equipments.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  Aucun équipement enregistré
                </p>
              ) : (
                <div className="space-y-3">
                  {file.equipments.map((equipment: PersonnelEquipment) => (
                    <div
                      key={equipment.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div>
                        <div className="font-medium">{equipment.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {equipment.type} - {equipment.condition}
                          {equipment.serialNumber && (
                            <span> • N° {equipment.serialNumber}</span>
                          )}
                        </div>
                        {equipment.nextCheck && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Prochain contrôle :{" "}
                            {format(new Date(equipment.nextCheck), "PPP", {
                              locale: fr,
                            })}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant={
                          equipment.status === "ASSIGNED"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {equipment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents Administratifs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!file.documents || file.documents.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  Aucun document enregistré
                </p>
              ) : (
                <div className="space-y-3">
                  {file.documents.map((doc: PersonnelDocument) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {doc.type}
                          {doc.documentDate && (
                            <span>
                              {" "}
                              •{" "}
                              {format(new Date(doc.documentDate), "PPP", {
                                locale: fr,
                              })}
                            </span>
                          )}
                        </div>
                        {doc.description && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            {doc.description}
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm">
                        Voir
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
