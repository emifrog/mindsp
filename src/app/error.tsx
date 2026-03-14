"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur globale:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-destructive">Erreur</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Une erreur est survenue
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Un problème inattendu s&apos;est produit. Veuillez réessayer.
        </p>
        <button
          onClick={() => reset()}
          className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
