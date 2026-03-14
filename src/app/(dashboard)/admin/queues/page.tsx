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
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Mail,
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

interface QueueData {
  emails: QueueStats;
  notifications: QueueStats;
  reminders: QueueStats;
}

export default function QueuesMonitoringPage() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<QueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
    // Rafraîchir toutes les 10 secondes
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/queues/stats");
      const data = await response.json();

      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getQueueIcon = (queueName: string) => {
    switch (queueName) {
      case "emails":
        return <Mail className="h-5 w-5" />;
      case "notifications":
        return <Bell className="h-5 w-5" />;
      case "reminders":
        return <Clock className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  const renderQueueCard = (name: string, queueStats: QueueStats) => {
    const total =
      queueStats.waiting +
      queueStats.active +
      queueStats.completed +
      queueStats.failed +
      queueStats.delayed;

    return (
      <Card key={name}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 capitalize">
              {getQueueIcon(name)}
              {name}
            </CardTitle>
            <Badge variant="outline">{total} jobs</Badge>
          </div>
          <CardDescription>
            {queueStats.active > 0
              ? `${queueStats.active} en cours de traitement`
              : "Aucun job en cours"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-muted-foreground">En attente:</span>
                <span className="font-semibold">{queueStats.waiting}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-blue-500" />
                <span className="text-muted-foreground">Actifs:</span>
                <span className="font-semibold">{queueStats.active}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-muted-foreground">Différés:</span>
                <span className="font-semibold">{queueStats.delayed}</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Complétés:</span>
                <span className="font-semibold">{queueStats.completed}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-muted-foreground">Échoués:</span>
                <span className="font-semibold">{queueStats.failed}</span>
              </div>
            </div>
          </div>

          {queueStats.failed > 0 && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3">
              <p className="text-sm text-destructive">
                ⚠️ {queueStats.failed} job(s) en échec nécessitent une attention
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Monitoring des Queues</h1>
          <p className="text-muted-foreground">
            Surveillance des tâches asynchrones
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Rafraîchir
        </Button>
      </div>

      {/* Stats globales */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total en attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.emails.waiting +
                  stats.notifications.waiting +
                  stats.reminders.waiting}
              </div>
              <p className="text-xs text-muted-foreground">
                Jobs dans la queue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total complétés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.emails.completed +
                  stats.notifications.completed +
                  stats.reminders.completed}
              </div>
              <p className="text-xs text-muted-foreground">
                Jobs traités avec succès
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total échoués
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.emails.failed +
                  stats.notifications.failed +
                  stats.reminders.failed}
              </div>
              <p className="text-xs text-muted-foreground">Jobs en erreur</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Détails par queue */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats && (
          <>
            {renderQueueCard("emails", stats.emails)}
            {renderQueueCard("notifications", stats.notifications)}
            {renderQueueCard("reminders", stats.reminders)}
          </>
        )}
      </div>
    </div>
  );
}
