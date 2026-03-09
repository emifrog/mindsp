"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useUploadThing } from "@/lib/uploadthing";
import { useToast } from "@/hooks/use-toast";

interface FileUploadDropzoneProps {
  endpoint:
    | "avatarUploader"
    | "chatAttachment"
    | "mailAttachment"
    | "documentUploader";
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export interface UploadedFile {
  url: string;
  name: string;
  size: number;
  type: string;
}

export function FileUploadDropzone({
  endpoint,
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  disabled = false,
  className,
}: FileUploadDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      setUploading(false);
      setProgress(0);

      const uploadedFiles: UploadedFile[] = res.map((file) => ({
        url: file.url,
        name: file.name,
        size: file.size,
        type: file.type,
      }));

      onUploadComplete?.(uploadedFiles);

      toast({
        title: "Upload réussi !",
        description: `${uploadedFiles.length} fichier(s) uploadé(s)`,
      });
    },
    onUploadError: (error) => {
      setUploading(false);
      setProgress(0);
      onUploadError?.(error);

      toast({
        title: "Erreur d'upload",
        description: error.message,
        variant: "destructive",
      });
    },
    onUploadProgress: (p) => {
      setProgress(p);
    },
  });

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      if (acceptedFiles.length > maxFiles) {
        toast({
          title: "Trop de fichiers",
          description: `Maximum ${maxFiles} fichier(s) autorisé(s)`,
          variant: "destructive",
        });
        return;
      }

      setUploading(true);
      await startUpload(acceptedFiles);
    },
    [maxFiles, startUpload, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: disabled || uploading || isUploading,
    maxFiles,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
        isDragActive && "border-primary bg-primary/5",
        (disabled || uploading) && "cursor-not-allowed opacity-50",
        !isDragActive &&
          !disabled &&
          !uploading &&
          "border-muted-foreground/25 hover:border-primary/50",
        className
      )}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4">
        {uploading ? (
          <>
            <Icon
              name={Icons.ui.menu}
              size="2xl"
              className="animate-spin text-primary"
            />
            <div className="w-full max-w-xs">
              <Progress value={progress} className="h-2" />
              <p className="mt-2 text-sm text-muted-foreground">
                {Math.round(progress)}%
              </p>
            </div>
            <p className="text-sm font-medium">Upload en cours...</p>
          </>
        ) : (
          <>
            <Icon
              name="⛈️"
              size="2xl"
              className={cn(
                "transition-transform",
                isDragActive && "scale-110"
              )}
            />
            {isDragActive ? (
              <p className="text-sm font-medium">Déposez les fichiers ici...</p>
            ) : (
              <>
                <div>
                  <p className="mb-1 text-sm font-medium">
                    Glissez-déposez vos fichiers ici
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ou cliquez pour sélectionner (max {maxFiles} fichier
                    {maxFiles > 1 ? "s" : ""})
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                >
                  <Icon name={Icons.action.add} size="sm" className="mr-2" />
                  Parcourir
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
