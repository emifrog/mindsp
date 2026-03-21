"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const navigation = [
  { name: "Tableau de bord", href: "/", icon: Icons.nav.dashboard },
  { name: "FMPA", href: "/fmpa", icon: Icons.pompier.feu },
  { name: "Agenda", href: "/agenda", icon: Icons.nav.calendar },
  { name: "Chat", href: "/chat", icon: "💬" },
  { name: "Mailbox", href: "/mailbox", icon: "📨" },
  { name: "Formations", href: "/formations", icon: Icons.nav.formations },
  { name: "TTA", href: "/tta", icon: Icons.nav.tta },
  { name: "Personnel", href: "/personnel", icon: Icons.nav.personnel },
  { name: "Portails", href: "/portails", icon: "🚪" },
  { name: "Actualités", href: "/actualites", icon: Icons.info.info },
  { name: "Documents", href: "/documents", icon: Icons.nav.documents },
  { name: "Design", href: "/showcase", icon: "🎨" },
  { name: "Paramètres", href: "/settings/notifications", icon: Icons.nav.settings },
];

function SidebarContent({ collapsed, onNavClick }: { collapsed: boolean; onNavClick?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b px-3">
        <Link href="/" className="flex items-center" onClick={onNavClick}>
          {collapsed ? (
            <Image
              src="/logo2.png"
              alt="MindSP Logo"
              width={40}
              height={40}
              priority
              className="h-10 w-10"
            />
          ) : (
            <Image
              src="/logo-banner.png"
              alt="MindSP Logo"
              width={150}
              height={150}
              priority
              className="h-auto w-auto"
            />
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon name={item.icon} size="lg" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t p-4">
          <div className="text-xs text-muted-foreground">
            <p>Version 1.0.0</p>
            <p>A venir : Phase 7 - CI/CD & DevOps</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { isCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();

  return (
    <>
      {/* Sidebar desktop - cachee sur mobile */}
      <div
        className={cn(
          "hidden md:flex h-full flex-col border-r bg-card transition-all duration-300",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent collapsed={isCollapsed} />
      </div>

      {/* Sidebar mobile - Sheet overlay */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent
            collapsed={false}
            onNavClick={() => setIsMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
