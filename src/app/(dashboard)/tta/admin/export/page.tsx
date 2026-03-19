"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Loader2, FileText, FileSpreadsheet } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface TTAExport {
  id: string;
  month: number;
  year: number;
  format: string;
  fileName: string;
  totalEntries: number;
  totalAmount: number;
  totalUsers: number;
  createdAt: string;
  creator: {
    firstName: string;
    lastName: string;
  };
}

export default function TTAExportPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [exports, setExports] = useState<TTAExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [exportForm, setExportForm] = useState({
    month: currentMonth.toString(),
    year: currentYear.toString(),
    format: "CSV",
  });

  useEffect(() => {
    if (isAdmin) {
      fetchExports();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchExports = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/tta/export");
      const data = await response.json();

      if (response.ok) {
        setExports(data.exports);
      }
    } catch (error) {
      console.error("Erreur chargement exports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/tta/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportForm),
      });

      if (response.ok) {
        // Télécharger le fichier
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          response.headers
            .get("Content-Disposition")
            ?.split("filename=")[1]
            ?.replace(/"/g, "") ||
          `TTA_${exportForm.year}_${exportForm.month}.${exportForm.format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Export réussi",
          description: "Le fichier a été téléchargé",
        });

        // Rafraîchir la liste
        fetchExports();
      } else {
        const data = await response.json();
        toast({
          title: "Erreur",
          description: data.error || "Impossible de créer l'export",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur export:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const getFormatIcon = (format: string) => {
    if (format === "CSV" || format === "EXCEL") {
      return <FileSpreadsheet className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Accès réservé aux administrateurs
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Export TTA</h1>
        <p className="text-muted-foreground">
          Exportez les saisies validées au format SEPA ou CSV
        </p>
      </div>

      {/* Formulaire d'export */}
      <Card>
        <CardHeader>
          <CardTitle>Nouvel export</CardTitle>
          <CardDescription>
            Sélectionnez la période et le format d&apos;export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="month">Mois</Label>
              <Select
                value={exportForm.month}
                onValueChange={(value) =>
                  setExportForm({ ...exportForm, month: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {format(new Date(2024, m - 1, 1), "MMMM", { locale: fr })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Année</Label>
              <Select
                value={exportForm.year}
                onValueChange={(value) =>
                  setExportForm({ ...exportForm, year: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => currentYear - i).map(
                    (y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select
                value={exportForm.format}
                onValueChange={(value) =>
                  setExportForm({ ...exportForm, format: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="SEPA_XML">SEPA XML</SelectItem>
                  <SelectItem value="EXCEL">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4">
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Générer l&apos;export
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historique des exports */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des exports</CardTitle>
          <CardDescription>Liste des exports précédents</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            </div>
          ) : exports.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Aucun export</h3>
              <p className="text-muted-foreground">
                Créez votre premier export
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {exports.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-start gap-3">
                    {getFormatIcon(exp.format)}
                    <div>
                      <p className="font-medium">{exp.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(2024, exp.month - 1, 1), "MMMM yyyy", {
                          locale: fr,
                        })}{" "}
                        - {exp.totalEntries} entrée(s) - {exp.totalUsers}{" "}
                        utilisateur(s)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Créé le{" "}
                        {format(new Date(exp.createdAt), "PPP à HH:mm", {
                          locale: fr,
                        })}{" "}
                        par {exp.creator.firstName} {exp.creator.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge variant="outline">{exp.format}</Badge>
                      <p className="mt-1 text-lg font-bold text-primary">
                        {exp.totalAmount.toFixed(2)} €
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
