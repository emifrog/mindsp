"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  FileUploadDropzone,
  type UploadedFile,
} from "@/components/upload/FileUploadDropzone";
import { FileList } from "@/components/upload/FileList";
import { useToast } from "@/hooks/use-toast";

interface UploadDocumentDialogProps {
  portalId: string;
  onUploaded?: () => void;
}

const categories = [
  { value: "PROCEDURE", label: "Procédure", icon: "📋" },
  {
    value: "FORMATION",
    label: "Formation",
    icon: "🎓",
  },
  { value: "TECHNIQUE", label: "Technique", icon: "⚙️" },
  {
    value: "ADMINISTRATIF",
    label: "Administratif",
    icon: "📁",
  },
  { value: "SECURITE", label: "Sécurité", icon: "🔒" },
  { value: "MATERIEL", label: "Matériel", icon: "📦" },
  { value: "AUTRE", label: "Autre", icon: "📄" },
];

export function UploadDocumentDialog({
  portalId,
  onUploaded,
}: UploadDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "AUTRE",
    tags: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploadedFiles.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez uploader au moins un fichier",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Créer un document pour chaque fichier uploadé
      for (const file of uploadedFiles) {
        const res = await fetch("/api/portal-documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            portalId,
            name: formData.name || file.name,
            description: formData.description,
            category: formData.category,
            tags: formData.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            fileName: file.name,
            fileUrl: file.url,
            fileSize: file.size,
            mimeType: file.type,
          }),
        });

        if (!res.ok) {
          throw new Error("Erreur lors de l'upload");
        }
      }

      toast({
        title: "Documents uploadés !",
        description: `${uploadedFiles.length} document(s) ajouté(s) avec succès.`,
      });

      // Réinitialiser
      setFormData({
        name: "",
        description: "",
        category: "AUTRE",
        tags: "",
      });
      setUploadedFiles([]);
      setOpen(false);
      onUploaded?.();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'uploader les documents. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Icon name={Icons.action.add} size="sm" className="mr-2" />
          Uploader un document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="📄" size="lg" />
              Uploader un document
            </DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau document à la base documentaire
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Upload de fichiers */}
            <div className="space-y-2">
              <Label>
                Fichiers <span className="text-destructive">*</span>
              </Label>
              <FileUploadDropzone
                endpoint="documentUploader"
                maxFiles={20}
                onUploadComplete={(files) => {
                  setUploadedFiles((prev) => [...prev, ...files]);
                }}
              />
              {uploadedFiles.length > 0 && (
                <FileList
                  files={uploadedFiles}
                  onRemove={handleRemoveFile}
                  maxHeight="200px"
                />
              )}
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="name">Nom du document</Label>
              <Input
                id="name"
                placeholder="Laissez vide pour utiliser le nom du fichier"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Description du document..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            {/* Catégorie */}
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      <div className="flex items-center gap-2">
                        <Icon name={cat.icon} size="sm" />
                        {cat.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (séparés par des virgules)</Label>
              <Input
                id="tags"
                placeholder="pompiers, formation, sécurité"
                value={formData.tags}
                onChange={(e) =>
                  setFormData({ ...formData, tags: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={loading || uploadedFiles.length === 0}
            >
              {loading ? (
                <>
                  <Icon
                    name={Icons.ui.menu}
                    size="sm"
                    className="mr-2 animate-spin"
                  />
                  Upload...
                </>
              ) : (
                <>
                  <Icon name={Icons.action.add} size="sm" className="mr-2" />
                  Uploader
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
