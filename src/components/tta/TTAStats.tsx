"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Euro,
  Clock,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface TTAEntry {
  id: string;
  hours: number;
  nightHours: number;
  sundayHours: number;
  holidayHours: number;
  totalAmount: number;
  baseAmount: number;
  nightBonus: number;
  sundayBonus: number;
  holidayBonus: number;
  status: string;
}

interface TTAStatsProps {
  entries: TTAEntry[];
}

export function TTAStats({ entries }: TTAStatsProps) {
  const { stats, averageHourlyRate } = useMemo(() => {
    const s = {
      totalHours: entries.reduce((sum, e) => sum + e.hours, 0),
      totalAmount: entries.reduce((sum, e) => sum + e.totalAmount, 0),
      totalNightHours: entries.reduce((sum, e) => sum + e.nightHours, 0),
      totalSundayHours: entries.reduce((sum, e) => sum + e.sundayHours, 0),
      totalHolidayHours: entries.reduce((sum, e) => sum + e.holidayHours, 0),
      totalBaseAmount: entries.reduce((sum, e) => sum + e.baseAmount, 0),
      totalNightBonus: entries.reduce((sum, e) => sum + e.nightBonus, 0),
      totalSundayBonus: entries.reduce((sum, e) => sum + e.sundayBonus, 0),
      totalHolidayBonus: entries.reduce((sum, e) => sum + e.holidayBonus, 0),
      validatedCount: entries.filter((e) => e.status === "VALIDATED").length,
      pendingCount: entries.filter((e) => e.status === "PENDING").length,
      rejectedCount: entries.filter((e) => e.status === "REJECTED").length,
      exportedCount: entries.filter((e) => e.status === "EXPORTED").length,
    };
    return {
      stats: s,
      averageHourlyRate: s.totalHours > 0 ? s.totalAmount / s.totalHours : 0,
    };
  }, [entries]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total montant */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total du mois</CardTitle>
          <Euro className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalAmount.toFixed(2)} €
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Base: {stats.totalBaseAmount.toFixed(2)} €
          </p>
        </CardContent>
      </Card>

      {/* Total heures */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Heures totales</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalHours}h</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Taux moyen: {averageHourlyRate.toFixed(2)} €/h
          </p>
        </CardContent>
      </Card>

      {/* Nombre d'entrées */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Entrées</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{entries.length}</div>
          <div className="mt-1 flex gap-2 text-xs">
            <span className="text-green-600">✓ {stats.validatedCount}</span>
            <span className="text-yellow-600">⏳ {stats.pendingCount}</span>
            {stats.rejectedCount > 0 && (
              <span className="text-red-600">✗ {stats.rejectedCount}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bonus totaux */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Majorations</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {(
              stats.totalNightBonus +
              stats.totalSundayBonus +
              stats.totalHolidayBonus
            ).toFixed(2)}{" "}
            €
          </div>
          <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {stats.totalNightBonus > 0 && (
              <div>🌙 Nuit: {stats.totalNightBonus.toFixed(2)} €</div>
            )}
            {stats.totalSundayBonus > 0 && (
              <div>📅 Dimanche: {stats.totalSundayBonus.toFixed(2)} €</div>
            )}
            {stats.totalHolidayBonus > 0 && (
              <div>🎉 Férié: {stats.totalHolidayBonus.toFixed(2)} €</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Détails heures spéciales */}
      {(stats.totalNightHours > 0 ||
        stats.totalSundayHours > 0 ||
        stats.totalHolidayHours > 0) && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Heures spéciales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {stats.totalNightHours > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground">Nuit</div>
                  <div className="text-xl font-bold">
                    {stats.totalNightHours}h
                  </div>
                </div>
              )}
              {stats.totalSundayHours > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground">Dimanche</div>
                  <div className="text-xl font-bold">
                    {stats.totalSundayHours}h
                  </div>
                </div>
              )}
              {stats.totalHolidayHours > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground">Férié</div>
                  <div className="text-xl font-bold">
                    {stats.totalHolidayHours}h
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statuts */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Statuts des entrées
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Validées</span>
              </div>
              <span className="font-medium">{stats.validatedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">En attente</span>
              </div>
              <span className="font-medium">{stats.pendingCount}</span>
            </div>
            {stats.rejectedCount > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Refusées</span>
                </div>
                <span className="font-medium">{stats.rejectedCount}</span>
              </div>
            )}
            {stats.exportedCount > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Exportées</span>
                </div>
                <span className="font-medium">{stats.exportedCount}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
