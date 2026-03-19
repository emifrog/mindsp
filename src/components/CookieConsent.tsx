"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "mindsp-cookie-consent";

type ConsentChoice = "accepted" | "refused" | null;

function getConsent(): ConsentChoice {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentChoice;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!getConsent()) {
      setVisible(true);
    }
  }, []);

  function handleChoice(choice: "accepted" | "refused") {
    localStorage.setItem(COOKIE_CONSENT_KEY, choice);
    document.cookie = `cookie-consent=${choice}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-4 shadow-lg sm:p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          <p>
            Ce site utilise des cookies essentiels au fonctionnement de
            l&apos;application et, avec votre accord, des cookies d&apos;analyse
            pour améliorer votre expérience.{" "}
            <a
              href="/politique-de-confidentialite"
              className="underline hover:text-foreground"
            >
              En savoir plus
            </a>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleChoice("refused")}
          >
            Refuser
          </Button>
          <Button size="sm" onClick={() => handleChoice("accepted")}>
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Vérifie si l'utilisateur a accepté les cookies analytics */
export function hasAnalyticsConsent(): boolean {
  return getConsent() === "accepted";
}
