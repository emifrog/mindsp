"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur tableau de bord:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-destructive">Erreur</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Une erreur est survenue
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Un problème inattendu s&apos;est produit dans le tableau de bord.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
}
