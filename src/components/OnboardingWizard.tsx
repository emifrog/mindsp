"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STEPS = [
  {
    title: "Bienvenue sur MindSP",
    description:
      "Votre solution de gestion pour les Services Départementaux d'Incendie et de Secours.",
    content:
      "MindSP centralise la gestion de vos FMPA, formations, personnels, communications et bien plus. Tout est accessible depuis un seul espace.",
    icon: "1",
  },
  {
    title: "Vos modules",
    description: "Découvrez les fonctionnalités à votre disposition.",
    content:
      "FMPA & Formations — Planifiez et suivez les participations. Chat & Messagerie — Communiquez avec vos équipes en temps réel. Personnel — Gérez les fiches, qualifications et alertes. Calendrier — Visualisez tous les événements du centre.",
    icon: "2",
  },
  {
    title: "Notifications",
    description: "Restez informé en temps réel.",
    content:
      "Activez les notifications pour ne rien manquer : rappels FMPA, nouveaux messages, alertes de qualifications expirantes. Vous pouvez personnaliser vos préférences dans les paramètres.",
    icon: "3",
  },
];

export function OnboardingWizard() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((res) => res.json())
      .then((data) => {
        if (!data.completed) {
          setVisible(true);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function completeOnboarding() {
    await fetch("/api/onboarding", { method: "POST" });
    setVisible(false);
  }

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      completeOnboarding();
    }
  }

  if (loading || !visible) return null;

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-primary-foreground">
            {current.icon}
          </div>
          <CardTitle className="text-xl">{current.title}</CardTitle>
          <CardDescription>{current.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {current.content}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i === step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={completeOnboarding}
            >
              Passer
            </Button>
            <Button size="sm" onClick={handleNext}>
              {step < STEPS.length - 1 ? "Suivant" : "Commencer"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
