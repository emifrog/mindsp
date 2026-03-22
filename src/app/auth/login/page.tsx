"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

function LoginForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tenantSlug, setTenantSlug] = useState("sdis13");

  const callbackUrl = searchParams.get("callbackUrl") || "/";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // 1. Récupérer le token CSRF
      const csrfRes = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfRes.json();

      // 2. Envoyer les credentials directement (contourne le bug signIn() v5 beta)
      await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          csrfToken,
          email,
          password,
          tenantSlug,
        }),
        redirect: "follow",
      });

      // 3. Vérifier que la session a été créée
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();

      if (session?.user) {
        window.location.href = callbackUrl || "/";
        return;
      }

      toast({
        title: "Erreur de connexion",
        description: "Email ou mot de passe incorrect",
        variant: "destructive",
      });
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
              placeholder={`email@${tenantSlug}.fr`}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                disabled={isLoading}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 space-y-2 text-center text-sm">
            <p className="text-muted-foreground">
              Comptes de test (dev uniquement) :
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
        )}
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Suspense fallback={<div className="text-muted-foreground">Chargement...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
