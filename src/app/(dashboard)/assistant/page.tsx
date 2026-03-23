"use client";

import { AIChatPanel } from "@/components/ai/AIChatPanel";

export default function AssistantPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b px-4 py-3 sm:px-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Assistant IA</h1>
        <p className="text-sm text-muted-foreground">
          Posez vos questions en langage naturel sur les données de votre SDIS
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <AIChatPanel fullPage />
      </div>
    </div>
  );
}
