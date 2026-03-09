"use client";

import { useState, useRef, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { useChatChannel } from "@/hooks/use-chat";
import {
  FileUploadDropzone,
  type UploadedFile,
} from "@/components/upload/FileUploadDropzone";
import { FileList } from "@/components/upload/FileList";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import TextareaAutosize from "react-textarea-autosize";

interface MessageInputProps {
  channelId: string;
}

export function MessageInput({ channelId }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [showUploadPopover, setShowUploadPopover] = useState(false);
  const { sendMessage, startTyping, stopTyping } = useChatChannel(channelId);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Typing indicator
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      startTyping();
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      stopTyping();
    }, 3000);
  };

  const handleSend = () => {
    if (!content.trim() && attachments.length === 0) return;

    sendMessage({
      content: content.trim(),
      attachments: attachments.map((file) => ({
        fileName: file.name,
        fileUrl: file.url,
        fileSize: file.size,
        mimeType: file.type,
      })),
    });
    setContent("");
    setAttachments([]);
    setIsTyping(false);
    stopTyping();

    // Focus back on textarea
    textareaRef.current?.focus();
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t p-4">
      {/* Liste des pièces jointes */}
      {attachments.length > 0 && (
        <div className="mb-3">
          <FileList
            files={attachments}
            onRemove={handleRemoveAttachment}
            maxHeight="200px"
          />
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Bouton emoji */}
        <Button variant="ghost" size="icon" className="shrink-0">
          <Icon name="😀" size="md" />
        </Button>

        {/* Textarea */}
        <div className="relative flex-1">
          <TextareaAutosize
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Envoyer un message..."
            className="max-h-[200px] min-h-[40px] w-full resize-none rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            minRows={1}
            maxRows={8}
          />
        </div>

        {/* Bouton pièce jointe avec popover */}
        <Popover open={showUploadPopover} onOpenChange={setShowUploadPopover}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Icon name={Icons.action.file} size="sm" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96" align="end">
            <div className="space-y-3">
              <h4 className="font-semibold">Ajouter des fichiers</h4>
              <FileUploadDropzone
                endpoint="chatAttachment"
                maxFiles={5}
                onUploadComplete={(files) => {
                  setAttachments((prev) => [...prev, ...files]);
                  setShowUploadPopover(false);
                }}
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* Bouton envoyer */}
        <Button
          onClick={handleSend}
          disabled={!content.trim() && attachments.length === 0}
          className="shrink-0"
        >
          <Icon name={Icons.action.send} size="sm" className="mr-2" />
          Envoyer
        </Button>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
          Entrée
        </kbd>{" "}
        pour envoyer,{" "}
        <kbd className="rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">
          Shift + Entrée
        </kbd>{" "}
        pour nouvelle ligne
      </p>
    </div>
  );
}
