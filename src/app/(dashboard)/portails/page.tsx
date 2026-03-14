"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { useToast } from "@/hooks/use-toast";

interface Portal {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  status: string;
  isPublic: boolean;
  requiresAuth: boolean;
  _count: {
    pages: number;
    news: number;
  };
}

export default function PortailsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [portals, setPortals] = useState<Portal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortals();
  }, []);

  const fetchPortals = async () => {
    try {
      const res = await fetch("/api/portals");
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setPortals(data.portals);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les portails",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: string }> = {
      PUBLISHED: { label: "Publié", variant: "default" },
      DRAFT: { label: "Brouillon", variant: "secondary" },
      ARCHIVED: { label: "Archivé", variant: "outline" },
    };
    return variants[status] || variants.DRAFT;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Icon name={Icons.ui.menu} size="2xl" className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Icon name="🚪" size="xl" />
            Portails
          </h1>
          <p className="text-muted-foreground">
            Accédez aux différents portails et espaces thématiques
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Portails Actifs
            </CardTitle>
            <Icon name="✅" size="md" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portals.filter((p) => p.status === "PUBLISHED").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pages Totales</CardTitle>
            <Icon name="📁" size="md" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portals.reduce((sum, p) => sum + p._count.pages, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actualités</CardTitle>
            <Icon name="📰" size="md" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {portals.reduce((sum, p) => sum + p._count.news, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portails Grid */}
      {portals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icon name="📭" size="2xl" className="mb-4" />
            <p className="text-center text-muted-foreground">
              Aucun portail disponible pour le moment
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {portals.map((portal) => (
            <Card
              key={portal.id}
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => router.push(`/portails/${portal.slug}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {portal.icon ? (
                      <Icon name={portal.icon} size="xl" />
                    ) : (
                      <Icon name="🚪" size="xl" />
                    )}
                    <div>
                      <CardTitle>{portal.name}</CardTitle>
                      <Badge
                        variant={getStatusBadge(portal.status).variant}
                        className="mt-1"
                      >
                        {getStatusBadge(portal.status).label}
                      </Badge>
                    </div>
                  </div>
                </div>
                {portal.description && (
                  <CardDescription className="mt-2">
                    {portal.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Icon name={Icons.nav.documents} size="sm" />
                    <span>{portal._count.pages} pages</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Icon name={Icons.info.info} size="sm" />
                    <span>{portal._count.news} actus</span>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {portal.isPublic && (
                    <Badge variant="outline">
                      <Icon
                        name="🌎"
                        size="xs"
                        className="mr-1"
                      />
                      Public
                    </Badge>
                  )}
                  {portal.requiresAuth && (
                    <Badge variant="outline">
                      <Icon
                        name="🔒"
                        size="xs"
                        className="mr-1"
                      />
                      Authentification
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sections supplémentaires */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name={Icons.info.info} size="md" />
              Actualités Récentes
            </CardTitle>
            <CardDescription>
              Les dernières nouvelles de votre organisation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/actualites")}
            >
              <Icon name={Icons.ui.arrowRight} size="sm" className="mr-2" />
              Voir toutes les actualités
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name={Icons.nav.documents} size="md" />
              Base Documentaire
            </CardTitle>
            <CardDescription>
              Accédez à tous les documents et procédures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/documents")}
            >
              <Icon name={Icons.ui.arrowRight} size="sm" className="mr-2" />
              Parcourir les documents
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
