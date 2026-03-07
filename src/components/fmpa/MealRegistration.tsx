"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Utensils } from "lucide-react";

interface MealRegistrationProps {
  fmpaId: string;
  mealOptions?: { menus?: string[] };
  currentRegistration?: {
    id: string;
    menuChoice?: string | null;
    dietaryRestrictions?: string | null;
    confirmed: boolean;
  } | null;
  onUpdate?: () => void;
}

export function MealRegistration({
  fmpaId,
  mealOptions,
  currentRegistration,
  onUpdate,
}: MealRegistrationProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [menuChoice, setMenuChoice] = useState(
    currentRegistration?.menuChoice || ""
  );
  const [dietaryRestrictions, setDietaryRestrictions] = useState(
    currentRegistration?.dietaryRestrictions || ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      const method = currentRegistration ? "PUT" : "POST";
      const response = await fetch(`/api/fmpa/${fmpaId}/meal`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menuChoice: menuChoice || undefined,
          dietaryRestrictions: dietaryRestrictions || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l&apos;inscription");
      }

      toast({
        title: currentRegistration
          ? "Inscription modifiée"
          : "Inscription confirmée",
        description: "Votre inscription au repas a été enregistrée",
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (
      !confirm("Êtes-vous sûr de vouloir annuler votre inscription au repas ?")
    ) {
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/fmpa/${fmpaId}/meal`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l&apos;annulation");
      }

      toast({
        title: "Inscription annulée",
        description: "Votre inscription au repas a été annulée",
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Utensils className="h-5 w-5 text-primary" />
          <CardTitle>Inscription repas</CardTitle>
        </div>
        <CardDescription>
          {currentRegistration
            ? "Modifiez votre inscription au repas"
            : "Inscrivez-vous pour le repas"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {currentRegistration?.confirmed && (
          <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">Inscription confirmée</p>
            </div>
            <p className="mt-1 text-sm">
              Votre inscription au repas a été confirmée par l&apos;organisateur
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mealOptions?.menus && mealOptions.menus.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="menuChoice">Choix du menu</Label>
              <select
                id="menuChoice"
                value={menuChoice}
                onChange={(e) => setMenuChoice(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Sélectionner un menu</option>
                {mealOptions.menus.map((menu: string, index: number) => (
                  <option key={index} value={menu}>
                    {menu}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="dietaryRestrictions">
              Régimes spéciaux / Allergies
            </Label>
            <Textarea
              id="dietaryRestrictions"
              placeholder="Ex: Végétarien, allergie aux fruits de mer..."
              value={dietaryRestrictions}
              onChange={(e) => setDietaryRestrictions(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              Indiquez vos restrictions alimentaires ou allergies
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting
                ? "Enregistrement..."
                : currentRegistration
                  ? "Modifier"
                  : "S&apos;inscrire"}
            </Button>
            {currentRegistration && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
