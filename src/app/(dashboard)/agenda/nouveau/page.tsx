"use client";

import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load du formulaire événement
const EventForm = dynamic(
  () =>
    import("@/components/agenda/EventForm").then((mod) => ({
      default: mod.EventForm,
    })),
  {
    loading: () => <Skeleton className="h-[700px] w-full" />,
    ssr: false,
  }
);

export default function NewEventPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/agenda">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Nouvel événement</h1>
          <p className="text-muted-foreground">
            Créez un événement dans le calendrier
          </p>
        </div>
      </div>

      {/* Formulaire */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de l&apos;événement</CardTitle>
          <CardDescription>
            Remplissez les détails de votre événement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm />
        </CardContent>
      </Card>
    </div>
  );
}
