"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tenantSlug, setTenantSlug] = useState("sdis13");

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signIn("credentials", {
        email,
        password,
        tenantSlug,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Erreur de connexion",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connexion réussie",
          description: "Bienvenue sur MindSP !",
        });
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4 flex justify-center">
            <Image
              src="/logo-banner.png"
              alt="MindSP Logo"
              width={150}
              height={150}
              priority
              className="h-auto w-auto"
            />
          </div>
          <CardDescription>Connectez-vous à votre espace SDIS</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenantSlug">Organisation</Label>
              <Select
                value={tenantSlug}
                onValueChange={setTenantSlug}
                disabled={isLoading}
              >
                <SelectTrigger id="tenantSlug">
                  <SelectValue placeholder="Sélectionnez votre SDIS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sdis13">
                    <div className="flex items-center gap-2">
                      <span className="text-lg"></span>
                      <span>SDIS 13 - Bouches-du-Rhône</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="sdis06">
                    <div className="flex items-center gap-2">
                      <span className="text-lg"></span>
                      <span>SDIS 06 - Alpes-Maritimes</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Sélectionnez votre SDIS
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@sdis13.fr"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm">
            <p className="text-muted-foreground">
              Comptes de test disponibles :
            </p>
            <div className="rounded-lg bg-muted p-3 text-left">
              <p className="font-mono text-xs">
                <strong>SDIS13 Admin:</strong>
                <br />
                admin@sdis13.fr / Password123!
              </p>
              <p className="mt-2 font-mono text-xs">
                <strong>SDIS06 Admin:</strong>
                <br />
                admin@sdis06.fr / Password123!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
