"use client";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center">
        <div className="mb-6 text-6xl">📡</div>
        <h1 className="mb-2 text-2xl font-bold">Hors connexion</h1>
        <p className="mb-6 text-muted-foreground">
          Vous n&apos;tes pas connect&eacute; &agrave; Internet.
          <br />
          V&eacute;rifiez votre connexion et r&eacute;essayez.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
        >
          R&eacute;essayer
        </button>
      </div>
    </div>
  );
}
