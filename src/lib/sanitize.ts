/**
 * Service de sanitisation des inputs
 * Protection contre XSS et injection
 */

/**
 * Sanitiser une chaîne de caractères basique
 * Supprime les caractères dangereux
 */
export function sanitizeString(input: string): string {
  if (!input) return "";

  return input
    .trim()
    .replace(/[<>]/g, "") // Supprime < et >
    .slice(0, 1000); // Limite longueur
}

/**
 * Sanitiser un email
 */
export function sanitizeEmail(email: string): string {
  if (!email) return "";

  return email.toLowerCase().trim().slice(0, 255);
}

/**
 * Sanitiser un contenu HTML (pour descriptions, messages, etc.)
 * Autorise uniquement les balises sûres
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // Liste blanche des balises autorisées
  const allowedTags = [
    "p",
    "br",
    "strong",
    "em",
    "u",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "a",
    "blockquote",
    "code",
    "pre",
  ];

  // Liste blanche des attributs autorisés
  const allowedAttributes: Record<string, string[]> = {
    a: ["href", "title"],
  };

  // Supprimer les scripts
  let sanitized = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // Supprimer les event handlers
    .replace(/javascript:/gi, "");

  // Limiter la longueur
  sanitized = sanitized.slice(0, 10000);

  return sanitized;
}

/**
 * Sanitiser un tableau d'IDs
 */
export function sanitizeIds(ids: unknown): string[] {
  if (!Array.isArray(ids)) return [];

  return ids
    .filter((id): id is string => typeof id === "string")
    .map((id) => id.trim())
    .filter((id) => id.length > 0 && id.length <= 100)
    .slice(0, 1000); // Max 1000 IDs
}

/**
 * Sanitiser un numéro de téléphone
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return "";

  return phone
    .replace(/[^\d+\-\s()]/g, "") // Garde uniquement chiffres et caractères téléphone
    .trim()
    .slice(0, 20);
}

/**
 * Sanitiser une URL
 */
export function sanitizeUrl(url: string): string {
  if (!url) return "";

  try {
    const parsed = new URL(url);

    // Autoriser uniquement http et https
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return "";
    }

    return parsed.toString().slice(0, 2000);
  } catch {
    return "";
  }
}

/**
 * Sanitiser un slug (pour URLs)
 */
export function sanitizeSlug(slug: string): string {
  if (!slug) return "";

  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-") // Remplace caractères non autorisés par -
    .replace(/-+/g, "-") // Remplace multiples - par un seul
    .replace(/^-|-$/g, "") // Supprime - au début/fin
    .slice(0, 100);
}

/**
 * Sanitiser un nom de fichier
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return "";

  // Extraire l'extension
  const parts = filename.split(".");
  const ext = parts.length > 1 ? parts.pop() || "" : "";
  const name = parts.join(".");

  // Sanitiser le nom
  const sanitizedName = name
    .trim()
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .slice(0, 200);

  // Sanitiser l'extension
  const sanitizedExt = ext
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);

  return sanitizedExt ? `${sanitizedName}.${sanitizedExt}` : sanitizedName;
}

/**
 * Sanitiser un objet JSON (récursif)
 */
export function sanitizeJson(obj: unknown, maxDepth: number = 5): unknown {
  if (maxDepth <= 0) return null;

  if (obj === null || obj === undefined) return null;

  if (typeof obj === "string") {
    return sanitizeString(obj);
  }

  if (typeof obj === "number" || typeof obj === "boolean") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .slice(0, 1000) // Max 1000 éléments
      .map((item) => sanitizeJson(item, maxDepth - 1));
  }

  if (typeof obj === "object") {
    const sanitized: Record<string, unknown> = {};
    const keys = Object.keys(obj).slice(0, 100); // Max 100 clés

    for (const key of keys) {
      const sanitizedKey = sanitizeString(key);
      sanitized[sanitizedKey] = sanitizeJson((obj as Record<string, unknown>)[key], maxDepth - 1);
    }

    return sanitized;
  }

  return null;
}

/**
 * Valider et sanitiser un montant (prix, salaire, etc.)
 */
export function sanitizeAmount(amount: unknown): number {
  if (typeof amount === "number") {
    return Math.max(0, Math.min(amount, 999999999)); // Max 999M
  }

  if (typeof amount === "string") {
    const parsed = parseFloat(amount);
    if (isNaN(parsed)) return 0;
    return Math.max(0, Math.min(parsed, 999999999));
  }

  return 0;
}

/**
 * Valider et sanitiser une date
 */
export function sanitizeDate(date: unknown): Date | null {
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }

  if (typeof date === "string") {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

/**
 * Sanitiser un badge/matricule
 */
export function sanitizeBadge(badge: string): string {
  if (!badge) return "";

  return badge
    .toUpperCase()
    .trim()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 20);
}

/**
 * Sanitiser un code postal
 */
export function sanitizePostalCode(code: string): string {
  if (!code) return "";

  return code.trim().replace(/[^\d]/g, "").slice(0, 10);
}

/**
 * Sanitiser un IBAN
 */
export function sanitizeIban(iban: string): string {
  if (!iban) return "";

  return iban
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 34); // IBAN max 34 caractères
}

/**
 * Sanitiser un BIC/SWIFT
 */
export function sanitizeBic(bic: string): string {
  if (!bic) return "";

  return bic
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 11); // BIC max 11 caractères
}
