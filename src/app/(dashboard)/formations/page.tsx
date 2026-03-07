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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Plus,
  Search,
  Users,
  Clock,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Formation {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string;
  level: string;
  duration: number | null;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants: number | null;
  status: string;
  _count: {
    registrations: number;
  };
  instructor: {
    firstName: string;
    lastName: string;
  } | null;
}

export default function FormationsPage() {
  const { user, isAdmin, isManager } = useAuth();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [filteredFormations, setFilteredFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchFormations();
  }, []);

  useEffect(() => {
    filterFormations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, categoryFilter, statusFilter, formations]);

  const fetchFormations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/formations");
      const data = await response.json();

      if (response.ok) {
        setFormations(data.formations);
        setFilteredFormations(data.formations);
      }
    } catch (error) {
      console.error("Erreur chargement formations:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterFormations = () => {
    let filtered = formations;

    // Filtre par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.title.toLowerCase().includes(query) ||
          f.code.toLowerCase().includes(query) ||
          f.description?.toLowerCase().includes(query)
      );
    }

    // Filtre par catégorie
    if (categoryFilter !== "all") {
      filtered = filtered.filter((f) => f.category === categoryFilter);
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      filtered = filtered.filter((f) => f.status === statusFilter);
    }

    setFilteredFormations(filtered);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      INCENDIE: "Incendie",
      SECOURS: "Secours",
      TECHNIQUE: "Technique",
      MANAGEMENT: "Management",
      REGLEMENTAIRE: "Réglementaire",
      AUTRE: "Autre",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      INCENDIE: "bg-red-500",
      SECOURS: "bg-blue-500",
      TECHNIQUE: "bg-green-500",
      MANAGEMENT: "bg-purple-500",
      REGLEMENTAIRE: "bg-orange-500",
      AUTRE: "bg-gray-500",
    };
    return colors[category] || colors.AUTRE;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: "Brouillon",
      OPEN: "Ouvert",
      FULL: "Complet",
      IN_PROGRESS: "En cours",
      COMPLETED: "Terminé",
      CANCELLED: "Annulé",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: "secondary",
      OPEN: "default",
      FULL: "destructive",
      IN_PROGRESS: "default",
      COMPLETED: "secondary",
      CANCELLED: "destructive",
    };
    return colors[status] || "secondary";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Formations</h1>
          <p className="text-muted-foreground">
            Catalogue des formations disponibles
          </p>
        </div>
        {(isAdmin || isManager) && (
          <Button asChild>
            <Link href="/formations/nouvelle">
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle formation
            </Link>
          </Button>
        )}
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les catégories</SelectItem>
                <SelectItem value="INCENDIE">Incendie</SelectItem>
                <SelectItem value="SECOURS">Secours</SelectItem>
                <SelectItem value="TECHNIQUE">Technique</SelectItem>
                <SelectItem value="MANAGEMENT">Management</SelectItem>
                <SelectItem value="REGLEMENTAIRE">Réglementaire</SelectItem>
                <SelectItem value="AUTRE">Autre</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="OPEN">Ouvert</SelectItem>
                <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                <SelectItem value="COMPLETED">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des formations */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Chargement...</p>
          </CardContent>
        </Card>
      ) : filteredFormations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Aucune formation</h3>
            <p className="text-muted-foreground">
              {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                ? "Aucune formation ne correspond à vos critères"
                : "Aucune formation disponible pour le moment"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredFormations.map((formation) => (
            <Link key={formation.id} href={`/formations/${formation.id}`}>
              <Card className="cursor-pointer transition-shadow hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded-full ${getCategoryColor(
                            formation.category
                          )}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {formation.code}
                        </span>
                      </div>
                      <CardTitle className="mt-2">{formation.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {getCategoryLabel(formation.category)}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusColor(formation.status) as "default" | "secondary" | "destructive" | "outline"}>
                      {getStatusLabel(formation.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {formation.description && (
                    <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                      {formation.description}
                    </p>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(formation.startDate), "PPP", {
                        locale: fr,
                      })}
                    </div>

                    {formation.duration && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formation.duration}h
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {formation._count.registrations}
                      {formation.maxParticipants &&
                        ` / ${formation.maxParticipants}`}{" "}
                      inscrits
                    </div>

                    {formation.instructor && (
                      <div className="text-muted-foreground">
                        👨‍🏫 {formation.instructor.firstName}{" "}
                        {formation.instructor.lastName}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
