"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface DashboardStats {
  fmpaCount: number;
  personnelCount: number;
  unreadMessages: number;
  formationsCount: number;
}

interface RecentActivity {
  id: string;
  type: string;
  title: string;
  date: string;
  url: string;
}

interface NextFmpa {
  id: string;
  title: string;
  type: string;
  startDate: string;
  location: string | null;
  _count: { participations: number };
}

interface PersonnelAlert {
  type: string;
  name: string;
  user: string;
  daysLeft: number;
}

interface ParticipationRate {
  month: string;
  rate: number;
}

const statColors = [
  "text-orange-500 bg-orange-500/10",
  "text-blue-500 bg-blue-500/10",
  "text-green-500 bg-green-500/10",
  "text-purple-500 bg-purple-500/10",
];

export default function DashboardPage() {
  const { user, tenantSlug, role, isAdmin, isManager } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [nextFmpa, setNextFmpa] = useState<NextFmpa | null>(null);
  const [alerts, setAlerts] = useState<PersonnelAlert[]>([]);
  const [participationRates, setParticipationRates] = useState<ParticipationRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [fmpaRes, usersRes, notifRes, formationsRes] = await Promise.all([
        fetch("/api/fmpa?limit=1&page=1").then((r) => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/users?limit=1&page=1").then((r) => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/notifications/stats").then((r) => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/formations?limit=1&page=1").then((r) => r.ok ? r.json() : null).catch(() => null),
      ]);

      setStats({
        fmpaCount: fmpaRes?.pagination?.total ?? 0,
        personnelCount: usersRes?.pagination?.total ?? 0,
        unreadMessages: notifRes?.unread ?? 0,
        formationsCount: formationsRes?.pagination?.total ?? 0,
      });

      // Construire les activites recentes a partir des FMPA et formations
      const recentItems: RecentActivity[] = [];

      if (fmpaRes?.fmpas) {
        for (const fmpa of fmpaRes.fmpas.slice(0, 2)) {
          recentItems.push({
            id: fmpa.id,
            type: "FMPA",
            title: fmpa.title,
            date: new Date(fmpa.startDate).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
            url: `/fmpa/${fmpa.id}`,
          });
        }
      }

      if (formationsRes?.formations) {
        for (const formation of formationsRes.formations.slice(0, 2)) {
          recentItems.push({
            id: formation.id,
            type: "Formation",
            title: formation.title,
            date: new Date(formation.startDate).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
            url: `/formations/${formation.id}`,
          });
        }
      }

      setActivities(recentItems.slice(0, 4));

      // Prochain FMPA
      if (fmpaRes?.fmpas?.length > 0) {
        const upcoming = fmpaRes.fmpas.find(
          (f: any) => new Date(f.startDate) >= new Date()
        );
        if (upcoming) setNextFmpa(upcoming);
      }

      // Alertes personnel (qualifications expirant bientot)
      const alertsRes = await fetch("/api/personnel/alerts").then((r) => r.ok ? r.json() : null).catch(() => null);
      if (alertsRes?.alerts) {
        const allAlerts = [
          ...(alertsRes.alerts.medical || []).map((a: any) => ({ type: "medical", name: a.userName || "Aptitude medicale", user: `Expire ${a.urgency}`, daysLeft: a.daysUntilExpiry ?? 0 })),
          ...(alertsRes.alerts.qualifications || []).map((a: any) => ({ type: "qualification", name: a.name || "Qualification", user: a.userName || "", daysLeft: a.daysUntilExpiry ?? 0 })),
          ...(alertsRes.alerts.equipment || []).map((a: any) => ({ type: "equipment", name: a.name || "Equipement", user: a.userName || "", daysLeft: a.daysUntilExpiry ?? 0 })),
        ];
        setAlerts(allAlerts.slice(0, 4));
      }

      // Taux de participation (stats FMPA)
      const statsRes = await fetch("/api/fmpa/statistics?period=year").then((r) => r.ok ? r.json() : null).catch(() => null);
      if (statsRes?.global) {
        setParticipationRates([
          { month: "Global", rate: statsRes.global.attendanceRate },
        ]);
      }
    } catch (error) {
      console.error("Erreur chargement dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const statItems = [
    {
      title: "FMPA a venir",
      value: stats?.fmpaCount ?? "-",
      description: "Ce mois-ci",
      icon: Icons.pompier.feu,
      href: "/fmpa",
    },
    {
      title: "Personnel actif",
      value: stats?.personnelCount ?? "-",
      description: "Agents disponibles",
      icon: Icons.nav.personnel,
      href: "/personnel",
    },
    {
      title: "Notifications",
      value: stats?.unreadMessages ?? "-",
      description: "Non lues",
      icon: Icons.nav.messages,
      href: "/notifications",
    },
    {
      title: "Formations",
      value: stats?.formationsCount ?? "-",
      description: "En cours",
      icon: Icons.nav.formations,
      href: "/formations",
    },
  ];

  // Actions rapides filtrees par role
  const quickActions = [
    {
      label: "Creer une FMPA",
      icon: Icons.pompier.feu,
      href: "/fmpa",
      roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
    },
    {
      label: "Nouveau message",
      icon: Icons.nav.messages,
      href: "/messages/new",
      roles: ["ADMIN", "SUPER_ADMIN", "MANAGER", "USER"],
    },
    {
      label: "Creer une formation",
      icon: Icons.nav.formations,
      href: "/formations/nouvelle",
      roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
    },
    {
      label: "Gerer le personnel",
      icon: Icons.nav.personnel,
      href: "/personnel",
      roles: ["ADMIN", "SUPER_ADMIN", "MANAGER"],
    },
    {
      label: "Mes FMPA",
      icon: Icons.pompier.feu,
      href: "/fmpa",
      roles: ["USER"],
    },
    {
      label: "Mes formations",
      icon: Icons.nav.formations,
      href: "/formations",
      roles: ["USER"],
    },
  ].filter((action) => action.roles.includes(role || "USER"));

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue {user?.name} — {tenantSlug?.toUpperCase()}
        </p>
      </div>

      {/* Stats Grid - cliquables avec couleurs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((stat, i) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${statColors[i]}`}>
                  <Icon name={stat.icon} size="md" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    stat.value
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Activites recentes + Actions rapides */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activites recentes</CardTitle>
            <CardDescription>
              Vos derniers evenements et formations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucune activite recente
              </p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <Link key={activity.id} href={activity.url}>
                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors cursor-pointer">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{activity.type}</Badge>
                          <p className="text-sm font-medium">{activity.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {activity.date}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Acces rapide aux fonctionnalites principales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <Button className="w-full justify-start" variant="outline">
                    <Icon name={action.icon} size="sm" className="mr-2" />
                    {action.label}
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Widgets: Prochain FMPA + Alertes personnel */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Prochain FMPA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-lg p-1.5 text-orange-500 bg-orange-500/10">
                <Icon name={Icons.pompier.feu} size="sm" />
              </div>
              Prochain FMPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : nextFmpa ? (
              <Link href={`/fmpa/${nextFmpa.id}`}>
                <div className="rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{nextFmpa.title}</h3>
                    <Badge variant="outline">{nextFmpa.type}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div>
                      <p className="text-xs uppercase tracking-wide mb-0.5">Date</p>
                      <p className="text-foreground font-medium">
                        {new Date(nextFmpa.startDate).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide mb-0.5">Inscrits</p>
                      <p className="text-foreground font-medium">
                        {nextFmpa._count?.participations ?? 0} participants
                      </p>
                    </div>
                  </div>
                  {nextFmpa.location && (
                    <p className="text-xs text-muted-foreground">
                      {nextFmpa.location}
                    </p>
                  )}
                </div>
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Aucun FMPA a venir
              </p>
            )}
          </CardContent>
        </Card>

        {/* Alertes personnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="rounded-lg p-1.5 text-red-500 bg-red-500/10">
                <Icon name="⚠️" size="sm" />
              </div>
              Alertes personnel
            </CardTitle>
            <CardDescription>Qualifications et aptitudes a renouveler</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-green-600 font-medium">Tout est a jour</p>
                <p className="text-xs text-muted-foreground mt-1">Aucune alerte en cours</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      alert.daysLeft <= 7
                        ? "border-red-500/30 bg-red-500/5"
                        : alert.daysLeft <= 30
                          ? "border-yellow-500/30 bg-yellow-500/5"
                          : ""
                    }`}
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-medium truncate">{alert.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{alert.user}</p>
                    </div>
                    <Badge
                      variant={alert.daysLeft <= 7 ? "destructive" : "outline"}
                      className="ml-2 shrink-0"
                    >
                      {alert.daysLeft <= 0 ? "Expire" : `${alert.daysLeft}j`}
                    </Badge>
                  </div>
                ))}
                {(isAdmin || isManager) && (
                  <Link href="/personnel">
                    <Button variant="ghost" size="sm" className="w-full mt-1 text-xs">
                      Voir toutes les alertes
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Taux de participation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="rounded-lg p-1.5 text-blue-500 bg-blue-500/10">
              <Icon name="📊" size="sm" />
            </div>
            Taux de participation FMPA
          </CardTitle>
          <CardDescription>Annee en cours</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : participationRates.length > 0 ? (
            <div className="space-y-4">
              {participationRates.map((item) => (
                <div key={item.month} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Taux de presence {item.month.toLowerCase()}</span>
                    <span className={`font-bold text-lg ${
                      item.rate >= 80 ? "text-green-500" : item.rate >= 50 ? "text-yellow-500" : "text-red-500"
                    }`}>
                      {item.rate}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.rate >= 80 ? "bg-green-500" : item.rate >= 50 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${item.rate}%` }}
                    />
                  </div>
                </div>
              ))}
              {stats && (
                <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.fmpaCount}</p>
                    <p className="text-xs text-muted-foreground">FMPA total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.personnelCount}</p>
                    <p className="text-xs text-muted-foreground">Agents</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{stats.formationsCount}</p>
                    <p className="text-xs text-muted-foreground">Formations</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Aucune donnee de participation disponible
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
