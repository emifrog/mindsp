"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileUploadDropzone,
  type UploadedFile,
} from "@/components/upload/FileUploadDropzone";
import { FileList } from "@/components/upload/FileList";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ComposeEmailProps {
  trigger?: React.ReactNode;
  onSent?: () => void;
}

export function ComposeEmail({ trigger, onSent }: ComposeEmailProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    to: "",
    cc: "",
    bcc: "",
    subject: "",
    body: "",
  });

  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [showUpload, setShowUpload] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/mail/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          attachments: attachments.map((file) => ({
            fileName: file.name,
            fileUrl: file.url,
            fileSize: file.size,
            mimeType: file.type,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error("Erreur lors de l'envoi");
      }

      toast({
        title: "Email envoyé !",
        description: "Votre message a été envoyé avec succès.",
      });

      // Réinitialiser
      setFormData({
        to: "",
        cc: "",
        bcc: "",
        subject: "",
        body: "",
      });
      setAttachments([]);
      setOpen(false);
      onSent?.();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'email. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Icon name={Icons.action.add} size="sm" className="mr-2" />
            Nouveau message
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon name="📨" size="lg" />
              Nouveau message
            </DialogTitle>
            <DialogDescription>
              Composez un nouveau message électronique
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Destinataires */}
            <div className="space-y-2">
              <Label htmlFor="to">
                À <span className="text-destructive">*</span>
              </Label>
              <Input
                id="to"
                placeholder="user1@example.com, user2@example.com"
                value={formData.to}
                onChange={(e) =>
                  setFormData({ ...formData, to: e.target.value })
                }
                required
              />
            </div>

            {/* CC */}
            <div className="space-y-2">
              <Label htmlFor="cc">CC (Copie)</Label>
              <Input
                id="cc"
                placeholder="user3@example.com"
                value={formData.cc}
                onChange={(e) =>
                  setFormData({ ...formData, cc: e.target.value })
                }
              />
            </div>

            {/* BCC */}
            <div className="space-y-2">
              <Label htmlFor="bcc">BCC (Copie cachée)</Label>
              <Input
                id="bcc"
                placeholder="user4@example.com"
                value={formData.bcc}
                onChange={(e) =>
                  setFormData({ ...formData, bcc: e.target.value })
                }
              />
            </div>

            {/* Sujet */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                Sujet <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject"
                placeholder="Objet du message"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                required
              />
            </div>

            {/* Corps du message */}
            <div className="space-y-2">
              <Label htmlFor="body">
                Message <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="body"
                placeholder="Écrivez votre message ici..."
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                rows={8}
                required
              />
            </div>

            {/* Pièces jointes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Pièces jointes</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUpload(!showUpload)}
                >
                  <Icon name={Icons.action.file} size="sm" className="mr-2" />
                  {showUpload ? "Masquer" : "Ajouter des fichiers"}
                </Button>
              </div>

              {showUpload && (
                <FileUploadDropzone
                  endpoint="mailAttachment"
                  maxFiles={10}
                  onUploadComplete={(files) => {
                    setAttachments((prev) => [...prev, ...files]);
                    setShowUpload(false);
                  }}
                />
              )}

              {attachments.length > 0 && (
                <FileList
                  files={attachments}
                  onRemove={handleRemoveAttachment}
                  maxHeight="200px"
                />
              )}
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
              disabled={
                loading || !formData.to || !formData.subject || !formData.body
              }
            >
              {loading ? (
                <>
                  <Icon
                    name={Icons.ui.menu}
                    size="sm"
                    className="mr-2 animate-spin"
                  />
                  Envoi...
                </>
              ) : (
                <>
                  <Icon name={Icons.action.send} size="sm" className="mr-2" />
                  Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
