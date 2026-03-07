"use client";

import { useState, useEffect } from "react";
import { Download, TrendingUp, Users, Clock, Award } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface FMPAStats {
  global: {
    totalFMPAs: number;
    totalParticipations: number;
    totalPresent: number;
    attendanceRate: number;
  };
  userParticipationRates: {
    user: { id: string; firstName: string; lastName: string };
    totalParticipations: number;
    presentCount: number;
    rate: number;
  }[];
  trainingHoursByUser: {
    user: { id: string; firstName: string; lastName: string };
    formationsCount: number;
    totalHours: number;
  }[];
  fmpaAttendanceRates: {
    fmpa: { id: string; title: string; type: string };
    totalParticipants: number;
    presentCount: number;
    rate: number;
  }[];
}

export function FMPAStatistics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState<FMPAStats | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/fmpa/statistics?period=${period}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await fetch(
        `/api/fmpa/team-stats?period=${period}&format=excel`
      );

      if (!response.ok) throw new Error("Erreur lors de l'export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `statistiques-equipe-${period}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export réussi",
        description: "Le fichier Excel a été téléchargé",
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter les statistiques",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Statistiques FMPA</h2>
          <p className="text-muted-foreground">
            Analyse détaillée des participations et présences
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
              <SelectItem value="all">Tout</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} disabled={exporting}>
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Export..." : "Exporter Excel"}
          </Button>
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total FMPA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.global.totalFMPAs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Participations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.global.totalParticipations}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Présences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.global.totalPresent}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Taux global</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.global.attendanceRate}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Taux de participation par personne */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Taux de participation par personne</CardTitle>
          </div>
          <CardDescription>
            Classement des participants par taux de présence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="text-right">Participations</TableHead>
                <TableHead className="text-right">Présences</TableHead>
                <TableHead className="text-right">Taux</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.userParticipationRates
                .slice(0, 10)
                .map((userStat: FMPAStats["userParticipationRates"][number]) => (
                  <TableRow key={userStat.user.id}>
                    <TableCell className="font-medium">
                      {userStat.user.firstName} {userStat.user.lastName}
                    </TableCell>
                    <TableCell className="text-right">
                      {userStat.totalParticipations}
                    </TableCell>
                    <TableCell className="text-right">
                      {userStat.presentCount}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={userStat.rate >= 80 ? "default" : "secondary"}
                      >
                        {userStat.rate}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Heures de formation par personne */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <CardTitle>Heures de formation par personne</CardTitle>
          </div>
          <CardDescription>Temps total passé en formation</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead className="text-right">Formations</TableHead>
                <TableHead className="text-right">Heures totales</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.trainingHoursByUser.slice(0, 10).map((userStat: FMPAStats["trainingHoursByUser"][number]) => (
                <TableRow key={userStat.user.id}>
                  <TableCell className="font-medium">
                    {userStat.user.firstName} {userStat.user.lastName}
                  </TableCell>
                  <TableCell className="text-right">
                    {userStat.formationsCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{userStat.totalHours}h</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Taux de présence par FMPA */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <CardTitle>Taux de présence par FMPA</CardTitle>
          </div>
          <CardDescription>Performance de chaque FMPA</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>FMPA</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Participants</TableHead>
                <TableHead className="text-right">Présents</TableHead>
                <TableHead className="text-right">Taux</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.fmpaAttendanceRates.slice(0, 10).map((fmpaStat: FMPAStats["fmpaAttendanceRates"][number]) => (
                <TableRow key={fmpaStat.fmpa.id}>
                  <TableCell className="font-medium">
                    {fmpaStat.fmpa.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{fmpaStat.fmpa.type}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {fmpaStat.totalParticipants}
                  </TableCell>
                  <TableCell className="text-right">
                    {fmpaStat.presentCount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant={fmpaStat.rate >= 80 ? "default" : "secondary"}
                    >
                      {fmpaStat.rate}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
