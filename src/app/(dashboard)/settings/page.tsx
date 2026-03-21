"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Bell, ChevronRight } from "lucide-react";

const settingsItems = [
  {
    title: "Profil",
    description: "Modifier vos informations personnelles et votre mot de passe",
    href: "/settings/profile",
    icon: User,
  },
  {
    title: "Notifications",
    description: "Configurer vos preferences de notifications",
    href: "/settings/notifications",
    icon: Bell,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Parametres</h1>
        <p className="text-muted-foreground mt-1">
          Gerez votre compte et vos preferences
        </p>
      </div>

      <div className="space-y-3">
        {settingsItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4 py-4">
                <div className="rounded-lg bg-primary/10 p-2">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {item.description}
                  </CardDescription>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
