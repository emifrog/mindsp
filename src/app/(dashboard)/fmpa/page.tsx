"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { FMPATable } from "./components/FMPATable";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

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
  createdBy: {
    firstName: string;
    lastName: string;
  };
  _count: {
    participations: number;
  };
}

export default function FMPAPage() {
  const { isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  const [fmpas, setFmpas] = useState<FMPA[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchFMPAs();
  }, []);

  const fetchFMPAs = async () => {
    try {
      const res = await fetch("/api/fmpa");
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setFmpas(data.fmpas);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les FMPA",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/fmpa/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur de suppression");

      toast({
        title: "Succès",
        description: "FMPA supprimée avec succès",
      });

      fetchFMPAs();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la FMPA",
        variant: "destructive",
      });
    }
  };

  // Filtrage par type
  const filterByType = (type: string) => {
    if (type === "all") return fmpas;
    return fmpas.filter((f) => f.type === type);
  };

  // Filtrage par recherche
  const filterBySearch = (fmpas: FMPA[]) => {
    if (!searchQuery) return fmpas;
    const query = searchQuery.toLowerCase();
    return fmpas.filter(
      (f) =>
        f.title.toLowerCase().includes(query) ||
        f.location.toLowerCase().includes(query) ||
        f.description?.toLowerCase().includes(query)
    );
  };

  const getFilteredFMPAs = (type: string) => {
    return filterBySearch(filterByType(type));
  };

  const countByType = (type: string) => {
    return filterByType(type).length;
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
            <Icon name={Icons.pompier.feu} size="xl" />
            FMPA
          </h1>
          <p className="text-muted-foreground">
            Formations, Manœuvres et Présences Actives
          </p>
        </div>
        {(isAdmin || isManager) && (
          <Button asChild>
            <Link href="/fmpa/new">
              <Icon name={Icons.action.add} size="sm" className="mr-2" />
              Créer une FMPA
            </Link>
          </Button>
        )}
      </div>

      {/* Stats rapides */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total
                </p>
                <p className="text-2xl font-bold">{fmpas.length}</p>
              </div>
              <Icon name={Icons.pompier.feu} size="xl" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Formations
                </p>
                <p className="text-2xl font-bold">{countByType("FORMATION")}</p>
              </div>
              <Icon name={Icons.fmpa.formation} size="xl" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Manœuvres
                </p>
                <p className="text-2xl font-bold">{countByType("MANOEUVRE")}</p>
              </div>
              <Icon name={Icons.fmpa.manoeuvre} size="xl" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Présences
                </p>
                <p className="text-2xl font-bold">
                  {countByType("PRESENCE_ACTIVE")}
                </p>
              </div>
              <Icon name={Icons.fmpa.presence} size="xl" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <div className="relative">
        <Icon
          name={Icons.action.search}
          size="sm"
          className="absolute left-3 top-1/2 -translate-y-1/2"
        />
        <Input
          placeholder="Rechercher par titre, lieu ou description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs avec filtres par type */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <Icon name={Icons.pompier.feu} size="sm" />
            Toutes ({fmpas.length})
          </TabsTrigger>
          <TabsTrigger value="FORMATION" className="flex items-center gap-2">
            <Icon name={Icons.fmpa.formation} size="sm" />
            Formations ({countByType("FORMATION")})
          </TabsTrigger>
          <TabsTrigger value="MANOEUVRE" className="flex items-center gap-2">
            <Icon name={Icons.fmpa.manoeuvre} size="sm" />
            Manœuvres ({countByType("MANOEUVRE")})
          </TabsTrigger>
          <TabsTrigger
            value="PRESENCE_ACTIVE"
            className="flex items-center gap-2"
          >
            <Icon name={Icons.fmpa.presence} size="sm" />
            Présences ({countByType("PRESENCE_ACTIVE")})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <FMPATable
            fmpas={getFilteredFMPAs("all")}
            onDelete={isAdmin || isManager ? handleDelete : undefined}
          />
        </TabsContent>

        <TabsContent value="FORMATION" className="mt-6">
          <FMPATable
            fmpas={getFilteredFMPAs("FORMATION")}
            onDelete={isAdmin || isManager ? handleDelete : undefined}
          />
        </TabsContent>

        <TabsContent value="MANOEUVRE" className="mt-6">
          <FMPATable
            fmpas={getFilteredFMPAs("MANOEUVRE")}
            onDelete={isAdmin || isManager ? handleDelete : undefined}
          />
        </TabsContent>

        <TabsContent value="PRESENCE_ACTIVE" className="mt-6">
          <FMPATable
            fmpas={getFilteredFMPAs("PRESENCE_ACTIVE")}
            onDelete={isAdmin || isManager ? handleDelete : undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
