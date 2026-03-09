"use client";

import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { useToast } from "@/hooks/use-toast";
import {
  FileUploadDropzone,
  type UploadedFile,
} from "@/components/upload/FileUploadDropzone";

interface PortalDocument {
  id: string;
  name: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category: string;
  tags: string[];
  description: string | null;
  downloadCount: number;
  createdAt: string;
  uploadedBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

const categoryIcons: Record<string, string> = {
  PROCEDURE: "📋",
  FORMATION: Icons.nav.formations,
  TECHNIQUE: "⚙️",
  ADMINISTRATIF: "📁",
  SECURITE: "🔒",
  MATERIEL: "📦",
  AUTRE: "📄",
};

const categoryLabels: Record<string, string> = {
  PROCEDURE: "Procédure",
  FORMATION: "Formation",
  TECHNIQUE: "Technique",
  ADMINISTRATIF: "Administratif",
  SECURITE: "Sécurité",
  MATERIEL: "Matériel",
  AUTRE: "Autre",
};

export default function DocumentsPage() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<PortalDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory]);

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams({
        ...(selectedCategory && { category: selectedCategory }),
      });

      const res = await fetch(`/api/portal-documents?${params}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setDocuments(data.documents);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: PortalDocument) => {
    try {
      // Ouvrir le document dans un nouvel onglet
      window.open(doc.fileUrl, "_blank");

      // Incrémenter le compteur de téléchargements
      await fetch(`/api/portal-documents/${doc.id}/download`, {
        method: "POST",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const filteredDocuments = documents.filter((doc) =>
    search
      ? doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.description?.toLowerCase().includes(search.toLowerCase()) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
      : true
  );

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
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <Icon name={Icons.nav.documents} size="xl" />
          Base Documentaire
        </h1>
        <p className="text-muted-foreground">
          Accédez à tous les documents et procédures
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
            <Icon name={Icons.nav.documents} size="md" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procédures</CardTitle>
            <Icon name="📋" size="md" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter((d) => d.category === "PROCEDURE").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formations</CardTitle>
            <Icon name={Icons.nav.formations} size="md" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter((d) => d.category === "FORMATION").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Téléchargements
            </CardTitle>
            <Icon name={Icons.action.download} size="md" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.reduce((sum, d) => sum + d.downloadCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md flex-1">
          <div className="relative">
            <Icon
              name={Icons.action.search}
              size="sm"
              className="absolute left-3 top-1/2 -translate-y-1/2"
            />
            <Input
              placeholder="Rechercher un document..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            Tous
          </Button>
          {Object.entries(categoryLabels).map(([key, label]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(key)}
            >
              <Icon name={categoryIcons[key]} size="sm" className="mr-2" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Liste des documents */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icon name="📭" size="2xl" className="mb-4" />
            <p className="text-center text-muted-foreground">
              Aucun document trouvé
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex flex-1 items-start gap-4">
                    <div className="flex-shrink-0">
                      <Icon name={categoryIcons[doc.category]} size="xl" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge>{categoryLabels[doc.category]}</Badge>
                        <Badge variant="outline">
                          {formatFileSize(doc.fileSize)}
                        </Badge>
                        {doc.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <CardTitle className="text-lg">{doc.name}</CardTitle>
                      {doc.description && (
                        <CardDescription className="mt-2">
                          {doc.description}
                        </CardDescription>
                      )}
                      <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Icon name={Icons.info.user} size="sm" />
                          <span>
                            {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon name={Icons.action.download} size="sm" />
                          <span>{doc.downloadCount} téléchargements</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => handleDownload(doc)} className="ml-4">
                    <Icon
                      name={Icons.action.download}
                      size="sm"
                      className="mr-2"
                    />
                    Télécharger
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
