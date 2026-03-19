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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, MessageSquare, Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  fmpaInvitations: boolean;
  fmpaReminders: boolean;
  fmpaCancellations: boolean;
  messageNotifications: boolean;
  participationUpdates: boolean;
}

export default function NotificationPreferencesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    fmpaInvitations: true,
    fmpaReminders: true,
    fmpaCancellations: true,
    messageNotifications: true,
    participationUpdates: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await fetch("/api/settings/notifications");
      const data = await response.json();

      if (response.ok && data.preferences) {
        setPreferences(data.preferences);
      }
    } catch (error) {
      console.error("Erreur chargement préférences:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/settings/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        toast({
          title: "Préférences enregistrées",
          description: "Vos préférences de notifications ont été mises à jour",
        });
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'enregistrer les préférences",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erreur sauvegarde préférences:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Préférences de notifications</h1>
        <p className="text-muted-foreground">
          Gérez vos préférences de notifications
        </p>
      </div>

      {/* Notifications générales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications générales
          </CardTitle>
          <CardDescription>
            Activez ou désactivez les notifications globales
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email">Notifications par email</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des emails pour les événements importants
              </p>
            </div>
            <Switch
              id="email"
              checked={preferences.emailNotifications}
              onCheckedChange={() => handleToggle("emailNotifications")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push">Notifications push</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des notifications en temps réel dans l&apos;application
              </p>
            </div>
            <Switch
              id="push"
              checked={preferences.pushNotifications}
              onCheckedChange={() => handleToggle("pushNotifications")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications FMPA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Notifications FMPA
          </CardTitle>
          <CardDescription>
            Gérez les notifications liées aux FMPA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="invitations">Nouvelles FMPA</Label>
              <p className="text-sm text-muted-foreground">
                Être notifié des nouvelles FMPA disponibles
              </p>
            </div>
            <Switch
              id="invitations"
              checked={preferences.fmpaInvitations}
              onCheckedChange={() => handleToggle("fmpaInvitations")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reminders">Rappels FMPA</Label>
              <p className="text-sm text-muted-foreground">
                Recevoir des rappels 24h avant une FMPA
              </p>
            </div>
            <Switch
              id="reminders"
              checked={preferences.fmpaReminders}
              onCheckedChange={() => handleToggle("fmpaReminders")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="cancellations">Annulations FMPA</Label>
              <p className="text-sm text-muted-foreground">
                Être notifié si une FMPA est annulée
              </p>
            </div>
            <Switch
              id="cancellations"
              checked={preferences.fmpaCancellations}
              onCheckedChange={() => handleToggle("fmpaCancellations")}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="participation">Mises à jour participation</Label>
              <p className="text-sm text-muted-foreground">
                Notifications d&apos;approbation/refus de participation
              </p>
            </div>
            <Switch
              id="participation"
              checked={preferences.participationUpdates}
              onCheckedChange={() => handleToggle("participationUpdates")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notifications Messages
          </CardTitle>
          <CardDescription>
            Gérez les notifications de messagerie
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="messages">Nouveaux messages</Label>
              <p className="text-sm text-muted-foreground">
                Être notifié des nouveaux messages reçus
              </p>
            </div>
            <Switch
              id="messages"
              checked={preferences.messageNotifications}
              onCheckedChange={() => handleToggle("messageNotifications")}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={fetchPreferences} disabled={saving}>
          Annuler
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Enregistrer les préférences"
          )}
        </Button>
      </div>
    </div>
  );
}
