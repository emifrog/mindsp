"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Loader2, Save, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  badge: string | null;
  role: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Formulaire profil
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");

  // Formulaire mot de passe
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/settings/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile(data.user);
        setFirstName(data.user.firstName);
        setLastName(data.user.lastName);
        setPhone(data.user.phone || "");
      }
    } catch (error) {
      console.error("Erreur chargement profil:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone: phone || null }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile((prev) => (prev ? { ...prev, ...data.user } : prev));
        toast({ title: "Profil mis a jour" });
      } else {
        const err = await res.json();
        toast({ title: "Erreur", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Impossible de sauvegarder", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Erreur", description: "Le mot de passe doit faire 8 caracteres minimum", variant: "destructive" });
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        toast({ title: "Mot de passe modifie" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const err = await res.json();
        toast({ title: "Erreur", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Impossible de modifier le mot de passe", variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const map: Record<string, string> = {
      SUPER_ADMIN: "Super Administrateur",
      ADMIN: "Administrateur",
      MANAGER: "Manager",
      USER: "Utilisateur",
    };
    return map[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Mon profil</h1>
        <p className="text-muted-foreground mt-1">
          Gerez vos informations personnelles
        </p>
      </div>

      {/* Informations du compte (lecture seule) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations du compte
          </CardTitle>
          <CardDescription>
            Ces informations sont gerees par votre administrateur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Email</Label>
              <p className="font-medium">{profile?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Role</Label>
              <p className="font-medium">{getRoleLabel(profile?.role || "")}</p>
            </div>
            {profile?.badge && (
              <div>
                <Label className="text-muted-foreground text-xs">Matricule</Label>
                <p className="font-medium">{profile.badge}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground text-xs">Membre depuis</Label>
              <p className="font-medium">
                {profile?.createdAt
                  ? new Date(profile.createdAt).toLocaleDateString("fr-FR", {
                      year: "numeric",
                      month: "long",
                    })
                  : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modifier le profil */}
      <Card>
        <CardHeader>
          <CardTitle>Modifier le profil</CardTitle>
          <CardDescription>
            Mettez a jour vos informations personnelles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prenom</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Telephone</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Changer le mot de passe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Changer le mot de passe
          </CardTitle>
          <CardDescription>
            Minimum 8 caracteres
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            variant="outline"
          >
            {changingPassword ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Lock className="h-4 w-4 mr-2" />
            )}
            Modifier le mot de passe
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
