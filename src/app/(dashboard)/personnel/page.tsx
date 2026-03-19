"use client";

import { AlertsDashboard } from "@/components/personnel/AlertsDashboard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PersonnelPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Suivi du Personnel</h1>
          <p className="text-muted-foreground">
            Gestion de l&apos;état opérationnel et de la carrière
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle fiche
        </Button>
      </div>

      {/* Dashboard des alertes */}
      <AlertsDashboard />
    </div>
  );
}
