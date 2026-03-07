"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface EmargementFmpa {
  title: string;
  type: string;
  location: string;
  startDate: string;
}

export default function EmargementPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fmpa, setFmpa] = useState<EmargementFmpa | null>(null);

  useEffect(() => {
    if (code) {
      handleEmargement();
    } else {
      setError("Code QR invalide");
      setLoading(false);
    }
  }, [code]);

  const handleEmargement = async () => {
    try {
      setLoading(true);

      // Vérifier le code et marquer la présence
      const response = await fetch(`/api/emargement/${params.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFmpa(data.fmpa);
      } else {
        setError(data.error || "Erreur lors de l'émargement");
      }
    } catch (err) {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Clock className="h-12 w-12 animate-spin text-primary" />
              <p className="text-center text-muted-foreground">
                Vérification en cours...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <div className="mb-4 flex justify-center">
              <XCircle className="h-16 w-16 text-red-600" />
            </div>
            <CardTitle className="text-center text-2xl">
              Émargement échoué
            </CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success && fmpa) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="w-full max-w-md border-green-200">
          <CardHeader>
            <div className="mb-4 flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-center text-2xl">
              Émargement réussi !
            </CardTitle>
            <CardDescription className="text-center">
              Votre présence a été enregistrée
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 rounded-lg bg-green-50 p-4">
              <div>
                <p className="text-sm text-muted-foreground">FMPA</p>
                <p className="font-semibold">{fmpa.title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Type</p>
                <Badge>{fmpa.type}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lieu</p>
                <p className="font-medium">{fmpa.location}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">
                  {new Date(fmpa.startDate).toLocaleString("fr-FR")}
                </p>
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground">
              Vous pouvez fermer cette page
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
