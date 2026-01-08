"use client";
/**
 * Configuration Iconify pour charger les icônes localement
 * Évite les erreurs Fetch API en pré-chargeant les packs d'icônes
 */

// Import des packs d'icônes installés localement
import fluentEmoji from "@iconify-json/fluent-emoji/icons.json";
import noto from "@iconify-json/noto/icons.json";
import solar from "@iconify-json/solar/icons.json";

// Fonction d'initialisation appelée côté client
export async function initIconify() {
  const { addCollection } = await import("@iconify/react");
  addCollection(fluentEmoji as Parameters<typeof addCollection>[0]);
  addCollection(noto as Parameters<typeof addCollection>[0]);
  addCollection(solar as Parameters<typeof addCollection>[0]);
}
