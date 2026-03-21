"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  useEffect(() => {
    signOut({ redirect: true, callbackUrl: "/auth/login" });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <p className="text-muted-foreground">Deconnexion en cours...</p>
    </div>
  );
}
