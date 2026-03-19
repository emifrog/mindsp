"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format, isBefore, addDays } from "date-fns";
import { fr } from "date-fns/locale";

interface Qualification {
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
}

interface QualificationsListProps {
  qualifications: Qualification[];
  onAdd?: () => void;
}

export function QualificationsList({
  qualifications,
  onAdd,
}: QualificationsListProps) {
  const getStatusIcon = (status: string, validUntil?: string) => {
    if (status === "EXPIRED") {
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
    if (status === "EXPIRING_SOON") {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "VALID":
        return "default";
      case "EXPIRING_SOON":
        return "secondary";
      case "EXPIRED":
        return "destructive";
      case "SUSPENDED":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      VALID: "Valide",
      EXPIRING_SOON: "Expire bientôt",
      EXPIRED: "Expiré",
      SUSPENDED: "Suspendu",
    };
    return labels[status] || status;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FORMATION: "Formation",
      SPECIALITE: "Spécialité",
      PERMIS: "Permis",
      HABILITATION: "Habilitation",
      AUTRE: "Autre",
    };
    return labels[type] || type;
  };

  const getDaysUntilExpiry = (validUntil?: string) => {
    if (!validUntil) return null;
    const now = new Date();
    const expiry = new Date(validUntil);
    const diff = Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return diff;
  };

  // Grouper par statut
  const groupedQualifications = {
    valid: qualifications.filter((q) => q.status === "VALID"),
    expiringSoon: qualifications.filter((q) => q.status === "EXPIRING_SOON"),
    expired: qualifications.filter((q) => q.status === "EXPIRED"),
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Qualifications et Compétences</CardTitle>
          {onAdd && (
            <Button onClick={onAdd} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {qualifications.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            Aucune qualification enregistrée
          </p>
        ) : (
          <div className="space-y-6">
            {/* Alertes expiration */}
            {groupedQualifications.expiringSoon.length > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950/20">
                <div className="mb-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-yellow-900 dark:text-yellow-100">
                    {groupedQualifications.expiringSoon.length} qualification(s)
                    à renouveler
                  </span>
                </div>
                <div className="space-y-1">
                  {groupedQualifications.expiringSoon.map((q) => {
                    const days = getDaysUntilExpiry(q.validUntil);
                    return (
                      <div
                        key={q.id}
                        className="text-sm text-yellow-800 dark:text-yellow-200"
                      >
                        • {q.name} - Expire dans {days} jour(s)
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Liste des qualifications */}
            <div className="space-y-3">
              {qualifications.map((qualification) => (
                <QualificationItem
                  key={qualification.id}
                  qualification={qualification}
                  getStatusIcon={getStatusIcon}
                  getTypeLabel={getTypeLabel}
                  getStatusColor={getStatusColor}
                  getStatusLabel={getStatusLabel}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const QualificationItem = React.memo(function QualificationItem({
  qualification,
  getStatusIcon,
  getTypeLabel,
  getStatusColor,
  getStatusLabel,
}: {
  qualification: Qualification;
  getStatusIcon: (status: string, validUntil?: string) => React.ReactNode;
  getTypeLabel: (type: string) => string;
  getStatusColor: (status: string) => "default" | "secondary" | "destructive" | "outline";
  getStatusLabel: (status: string) => string;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg border p-4 transition-colors hover:bg-accent">
      <div className="flex flex-1 items-start gap-3">
        <div className="mt-1">
          {getStatusIcon(qualification.status, qualification.validUntil)}
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="font-medium">{qualification.name}</span>
            <Badge variant="outline">
              {getTypeLabel(qualification.type)}
            </Badge>
            {qualification.level && (
              <Badge variant="secondary">{qualification.level}</Badge>
            )}
          </div>

          <div className="space-y-1 text-sm text-muted-foreground">
            <div>
              Obtenue le{" "}
              {format(new Date(qualification.obtainedDate), "PPP", {
                locale: fr,
              })}
            </div>
            {qualification.validUntil && (
              <div>
                Valide jusqu&apos;au{" "}
                {format(new Date(qualification.validUntil), "PPP", {
                  locale: fr,
                })}
              </div>
            )}
            {qualification.organization && (
              <div>Organisme : {qualification.organization}</div>
            )}
            {qualification.certificateNumber && (
              <div>N° {qualification.certificateNumber}</div>
            )}
          </div>
        </div>
      </div>

      <Badge variant={getStatusColor(qualification.status)}>
        {getStatusLabel(qualification.status)}
      </Badge>
    </div>
  );
});
