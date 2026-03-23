"use client";

import { useState } from "react";
import { Bot, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIChatPanel } from "./AIChatPanel";
import { cn } from "@/lib/utils";

export function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Panel de chat */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-20 right-4 z-50 w-[380px] h-[520px] rounded-xl border bg-card shadow-2xl",
            "animate-in slide-in-from-bottom-4 fade-in duration-200",
            "sm:w-[420px] sm:h-[560px]"
          )}
        >
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <AIChatPanel className="h-full rounded-xl overflow-hidden" />
        </div>
      )}

      {/* Bouton flottant */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="icon"
        className={cn(
          "fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg",
          "transition-all duration-200 hover:scale-105",
          isOpen
            ? "bg-muted text-muted-foreground hover:bg-muted/80"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        )}
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Bot className="h-5 w-5" />
        )}
      </Button>
    </>
  );
}
