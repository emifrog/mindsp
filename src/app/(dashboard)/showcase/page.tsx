"use client";

import { HeroSection } from "@/components/ui/hero-section";
import { StatCard } from "@/components/ui/stat-card";
import {
  CardModern,
  CardModernHeader,
  CardModernTitle,
  CardModernDescription,
  CardModernContent,
} from "@/components/ui/card-modern";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  CheckCircle,
  TrendingUp,
  Flame,
  MessageSquare,
  GraduationCap,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ShowcasePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="mb-12">
        <HeroSection
          title="Design Moderne 2025"
          subtitle="Nouveau Look"
          description="Découvrez la nouvelle interface de MindSP avec des couleurs vibrantes, des effets glassmorphism et des animations fluides."
          primaryAction={{
            label: "Explorer",
            onClick: () => router.push("/dashboard"),
          }}
          secondaryAction={{
            label: "Documentation",
            onClick: () => {
              if (typeof window !== "undefined") {
                window.open("/DESIGN_SYSTEM_MODERNE.md", "_blank");
              }
            },
          }}
        />
      </div>

      {/* Stats Cards */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">Statistiques Modernes</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Utilisateurs Actifs"
            value="1,234"
            icon={Users}
            trend={{ value: 12, isPositive: true }}
            variant="primary"
          />

          <StatCard
            title="FMPA en Cours"
            value="89"
            icon={Calendar}
            trend={{ value: 5, isPositive: true }}
            variant="success"
          />

          <StatCard
            title="Taux de Présence"
            value="94%"
            icon={CheckCircle}
            trend={{ value: 3, isPositive: true }}
            variant="info"
          />

          <StatCard
            title="Croissance"
            value="+18%"
            icon={TrendingUp}
            trend={{ value: 8, isPositive: true }}
            variant="warning"
          />
        </div>
      </div>

      {/* Card Variants */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">Variantes de Cards</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Default Card */}
          <CardModern>
            <CardModernHeader>
              <CardModernTitle>Card Standard</CardModernTitle>
              <CardModernDescription>
                Shadow moderne avec hover effect
              </CardModernDescription>
            </CardModernHeader>
            <CardModernContent>
              <p className="text-sm text-muted-foreground">
                Card avec shadow moderne et effet hover subtil.
              </p>
            </CardModernContent>
          </CardModern>

          {/* Glass Card */}
          <CardModern variant="glass">
            <CardModernHeader>
              <CardModernTitle>Card Glass</CardModernTitle>
              <CardModernDescription>Effet glassmorphism</CardModernDescription>
            </CardModernHeader>
            <CardModernContent>
              <p className="text-sm text-muted-foreground">
                Card avec effet verre dépoli et backdrop blur.
              </p>
            </CardModernContent>
          </CardModern>

          {/* Gradient Card */}
          <CardModern variant="gradient">
            <CardModernHeader>
              <CardModernTitle>Card Gradient</CardModernTitle>
              <CardModernDescription className="text-white/80">
                Gradient bleu → cyan
              </CardModernDescription>
            </CardModernHeader>
            <CardModernContent>
              <p className="text-sm text-white/90">
                Card avec gradient primary et texte blanc.
              </p>
            </CardModernContent>
          </CardModern>

          {/* Glow Card */}
          <CardModern variant="glow">
            <CardModernHeader>
              <CardModernTitle>Card Glow</CardModernTitle>
              <CardModernDescription>Effet lumineux</CardModernDescription>
            </CardModernHeader>
            <CardModernContent>
              <p className="text-sm text-muted-foreground">
                Card avec effet glow autour.
              </p>
            </CardModernContent>
          </CardModern>

          {/* Card with Gradient Title */}
          <CardModern>
            <CardModernHeader>
              <CardModernTitle gradient>Titre Gradient</CardModernTitle>
              <CardModernDescription>
                Titre avec effet gradient
              </CardModernDescription>
            </CardModernHeader>
            <CardModernContent>
              <p className="text-sm text-muted-foreground">
                Card avec titre en gradient bleu → cyan.
              </p>
            </CardModernContent>
          </CardModern>

          {/* Card with Icon */}
          <CardModern className="transition-transform hover:scale-105">
            <CardModernHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3">
                  <Flame className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardModernTitle>Avec Icône</CardModernTitle>
                  <CardModernDescription>
                    Card interactive
                  </CardModernDescription>
                </div>
              </div>
            </CardModernHeader>
            <CardModernContent>
              <p className="text-sm text-muted-foreground">
                Card avec icône et effet scale au hover.
              </p>
            </CardModernContent>
          </CardModern>
        </div>
      </div>

      {/* Buttons & Badges */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">Boutons & Badges</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <CardModern>
            <CardModernHeader>
              <CardModernTitle>Boutons Modernes</CardModernTitle>
            </CardModernHeader>
            <CardModernContent>
              <div className="flex flex-wrap gap-3">
                <Button className="glow-primary">Primary Glow</Button>
                <Button variant="outline" className="hover:glow-accent">
                  Outline Hover
                </Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
            </CardModernContent>
          </CardModern>

          <CardModern>
            <CardModernHeader>
              <CardModernTitle>Badges Colorés</CardModernTitle>
            </CardModernHeader>
            <CardModernContent>
              <div className="flex flex-wrap gap-3">
                <Badge className="bg-primary text-primary-foreground">
                  Primary
                </Badge>
                <Badge className="glow-primary bg-success text-success-foreground">
                  Success
                </Badge>
                <Badge className="bg-warning text-warning-foreground">
                  Warning
                </Badge>
                <Badge className="bg-destructive text-destructive-foreground">
                  Error
                </Badge>
                <Badge className="glow-accent bg-info text-info-foreground">
                  Info
                </Badge>
              </div>
            </CardModernContent>
          </CardModern>
        </div>
      </div>

      {/* Gradient Backgrounds */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">Arrière-plans Gradient</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          <div className="gradient-primary rounded-xl p-8 text-center text-white">
            <h3 className="mb-2 text-xl font-bold">Gradient Primary</h3>
            <p className="text-sm opacity-90">Bleu → Cyan</p>
          </div>

          <div className="gradient-secondary rounded-xl p-8 text-center text-white">
            <h3 className="mb-2 text-xl font-bold">Gradient Secondary</h3>
            <p className="text-sm opacity-90">Violet → Bleu</p>
          </div>

          <div className="gradient-animated rounded-xl p-8 text-center text-white">
            <h3 className="mb-2 text-xl font-bold">Gradient Animé</h3>
            <p className="text-sm opacity-90">Animation infinie</p>
          </div>
        </div>
      </div>

      {/* Text Gradients */}
      <div className="mb-12">
        <h2 className="mb-6 text-2xl font-bold">Textes Gradient</h2>
        <div className="space-y-4">
          <h1 className="text-gradient text-6xl font-bold">
            Titre Géant Gradient
          </h1>
          <h2 className="text-gradient text-4xl font-bold">
            Sous-titre Gradient
          </h2>
          <p className="text-gradient text-2xl font-semibold">
            Paragraphe avec gradient
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="mb-6 text-2xl font-bold">Modules Disponibles</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          <CardModern
            variant="glass"
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <CardModernHeader>
              <div className="mb-4 w-fit rounded-full bg-primary/10 p-3">
                <Flame className="h-8 w-8 text-primary" />
              </div>
              <CardModernTitle>FMPA</CardModernTitle>
              <CardModernDescription>
                Gestion complète des formations
              </CardModernDescription>
            </CardModernHeader>
            <CardModernContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ QR Codes</li>
                <li>✓ Émargement</li>
                <li>✓ Export PDF</li>
              </ul>
            </CardModernContent>
          </CardModern>

          <CardModern
            variant="glass"
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <CardModernHeader>
              <div className="mb-4 w-fit rounded-full bg-accent/10 p-3">
                <MessageSquare className="h-8 w-8 text-accent" />
              </div>
              <CardModernTitle>Messagerie</CardModernTitle>
              <CardModernDescription>
                Communication temps réel
              </CardModernDescription>
            </CardModernHeader>
            <CardModernContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Socket.IO</li>
                <li>✓ Notifications</li>
                <li>✓ Groupes</li>
              </ul>
            </CardModernContent>
          </CardModern>

          <CardModern
            variant="glass"
            className="cursor-pointer transition-transform hover:scale-105"
          >
            <CardModernHeader>
              <div className="mb-4 w-fit rounded-full bg-success/10 p-3">
                <GraduationCap className="h-8 w-8 text-success" />
              </div>
              <CardModernTitle>Formations</CardModernTitle>
              <CardModernDescription>
                Catalogue et attestations
              </CardModernDescription>
            </CardModernHeader>
            <CardModernContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ Inscriptions</li>
                <li>✓ Validation</li>
                <li>✓ PDF</li>
              </ul>
            </CardModernContent>
          </CardModern>
        </div>
      </div>
    </div>
  );
}
