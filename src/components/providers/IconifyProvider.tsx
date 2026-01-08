"use client";

import { useEffect } from "react";
import { initIconify } from "@/lib/iconify-setup";

let initialized = false;

export function IconifyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!initialized) {
      initialized = true;
      initIconify();
    }
  }, []);

  return <>{children}</>;
}
