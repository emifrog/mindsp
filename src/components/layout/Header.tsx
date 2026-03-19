"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/contexts/SidebarContext";
import { MenuIcon } from "@/components/ui/menu-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function Header() {
  const { data: session } = useSession();
  const { toggleSidebar } = useSidebar();

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadge = (role?: string) => {
    const roleMap: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" }
    > = {
      SUPER_ADMIN: { label: "Super Admin", variant: "destructive" },
      ADMIN: { label: "Admin", variant: "default" },
      MANAGER: { label: "Manager", variant: "secondary" },
      USER: { label: "Utilisateur", variant: "secondary" },
    };
    return roleMap[role || "USER"] || roleMap.USER;
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/auth/login" });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-3 md:px-6">
      <div className="flex items-center gap-4">
        {/* Bouton Toggle Sidebar */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="h-10 w-10 md:h-9 md:w-9"
        >
          <MenuIcon size={24} />
          <span className="sr-only">Toggle sidebar</span>
        </Button>

        <h1 className="text-lg font-semibold">Tableau de bord</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Recherche */}
        <Link href="/search">
          <Button variant="ghost" size="icon" className="h-10 w-10 md:h-9 md:w-9">
            <Icon name="🔍" size="lg" />
            <span className="sr-only">Recherche</span>
          </Button>
        </Link>

        {/* Notifications */}
        <NotificationBell />

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {getInitials(session?.user?.name)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline">
                {session?.user?.name || "Utilisateur"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session?.user?.name}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
                <div className="mt-2">
                  <Badge
                    variant={getRoleBadge(session?.user?.role).variant}
                    className="text-xs"
                  >
                    {getRoleBadge(session?.user?.role).label}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Paramètres</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={handleSignOut}
            >
              <Icon name={Icons.ui.logout} size="sm" className="mr-2" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
