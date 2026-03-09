"use client";

import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FilePreviewProps {
  file: {
    url: string;
    name: string;
    size: number;
    type?: string;
  };
  onRemove?: () => void;
  showRemove?: boolean;
  className?: string;
}

export function FilePreview({
  file,
  onRemove,
  showRemove = true,
  className,
}: FilePreviewProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  const getFileIcon = (type?: string): string => {
    if (!type) return "📄";

    if (type.startsWith("image/")) return "🖼️";
    if (type.startsWith("video/")) return "🎞️";
    if (type.startsWith("audio/")) return "🎵";
    if (type.includes("pdf")) return "📃";
    if (type.includes("word") || type.includes("document"))
      return "📘";
    if (type.includes("excel") || type.includes("spreadsheet"))
      return "📗";
    if (type.includes("powerpoint") || type.includes("presentation"))
      return "📙";
    if (type.includes("zip") || type.includes("rar") || type.includes("7z"))
      return "📦";

    return "📄";
  };

  const isImage = file.type?.startsWith("image/");

  return (
    <div
      className={cn(
        "group relative rounded-lg border p-3 transition-colors hover:bg-accent/50",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Icône ou Image */}
        <div className="shrink-0">
          {isImage ? (
            <div className="relative h-12 w-12 overflow-hidden rounded bg-muted">
              <img
                src={file.url}
                alt={file.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <Icon name={getFileIcon(file.type)} size="2xl" />
          )}
        </div>

        {/* Info fichier */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {formatFileSize(file.size)}
            </Badge>
            {file.type && (
              <span className="text-xs text-muted-foreground">
                {file.type.split("/")[1]?.toUpperCase() || "FILE"}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              <Icon name="👀" size="sm" />
            </a>
          </Button>

          {showRemove && onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Icon name={Icons.action.delete} size="sm" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
