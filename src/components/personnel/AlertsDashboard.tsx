"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, Shield, Wrench } from "lucide-react";

interface Alert {
  id: string;
  type: string;
  user: {
    firstName: string;
    lastName: string;
    badge: string;
  };
  description: string;
  expiryDate: string;
  urgency: string;
}

interface AlertsData {
  summary: {
    total: number;
    urgent: number;
    medical: number;
    qualifications: number;
  };
  alerts: {
    medical: Alert[];
    qualifications: Alert[];
    equipment: Alert[];
  };
}

interface AlertsDashboardProps {
  onAlertClick?: (alert: Alert) => void;
}

export function AlertsDashboard({ onAlertClick }: AlertsDashboardProps) {
  const [alerts, setAlerts] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch("/api/personnel/alerts");
      const data = await response.json();
      if (response.ok) {
        setAlerts(data);
      }
    } catch (error) {
      console.error("Erreur chargement alertes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "URGENT":
        return "destructive";
      case "HIGH":
        return "default";
      default:
        return "secondary";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "MEDICAL":
        return <Shield className="h-4 w-4" />;
      case "QUALIFICATION":
        return <Clock className="h-4 w-4" />;
      case "EQUIPMENT":
        return <Wrench className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "MEDICAL":
        return "Médical";
      case "QUALIFICATION":
        return "Qualification";
      case "EQUIPMENT":
        return "Équipement";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (!alerts) {
    return null;
  }

  const allAlerts = [
    ...alerts.alerts.medical,
    ...alerts.alerts.qualifications,
    ...alerts.alerts.equipment,
  ].sort((a, b) => {
    const urgencyOrder: Record<string, number> = {
      URGENT: 0,
      HIGH: 1,
      MEDIUM: 2,
    };
    return (urgencyOrder[a.urgency] || 3) - (urgencyOrder[b.urgency] || 3);
  });

  return (
    <div className="space-y-4">
      {/* Résumé */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total alertes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.summary.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {alerts.summary.urgent}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Médical</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.summary.medical}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Qualifications
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.summary.qualifications}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des alertes */}
      <Card>
        <CardHeader>
          <CardTitle>Alertes d&apos;expiration</CardTitle>
        </CardHeader>
        <CardContent>
          {allAlerts.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Aucune alerte
            </p>
          ) : (
            <div className="space-y-2">
              {allAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                  onClick={() => onAlertClick?.(alert)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {getTypeIcon(alert.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {alert.user.firstName} {alert.user.lastName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {alert.user.badge}
                        </Badge>
                        <Badge variant={getUrgencyColor(alert.urgency)}>
                          {alert.urgency}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{getTypeLabel(alert.type)}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
