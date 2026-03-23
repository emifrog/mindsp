/**
 * Context Builder — Construit le contexte tenant injecté dans le prompt IA
 *
 * Détecte l'intention de la question et récupère les données pertinentes
 * pour les injecter dans le system prompt de Claude.
 */

import { prisma } from "@/lib/prisma";
import { CONTEXT_HEADER } from "./prompts";

type Intent =
  | "FMPA"
  | "PERSONNEL"
  | "FORMATION"
  | "TTA"
  | "AGENDA"
  | "STATS"
  | "GENERAL";

const INTENT_KEYWORDS: Record<Intent, string[]> = {
  FMPA: [
    "fmpa", "manoeuvre", "manœuvre", "exercice", "présence active",
    "participation", "émargement", "inscription", "opérationnel",
  ],
  PERSONNEL: [
    "personnel", "agent", "pompier", "sapeur", "qualification",
    "aptitude", "médical", "grade", "matricule", "effectif",
    "expir", "EPI", "équipement",
  ],
  FORMATION: [
    "formation", "catalogue", "attestation", "recyclage",
    "PSE", "instructeur", "certificat", "inscription",
  ],
  TTA: [
    "tta", "heures", "indemnité", "temps de travail",
    "garde", "astreinte", "nuit", "dimanche", "férié",
    "export", "sepa", "compteur",
  ],
  AGENDA: [
    "agenda", "calendrier", "événement", "réunion", "planning",
    "semaine", "disponibilité", "garde",
  ],
  STATS: [
    "statistique", "stats", "taux", "pourcentage", "tendance",
    "comparaison", "bilan", "résumé", "résume", "combien",
    "total", "moyenne",
  ],
  GENERAL: [],
};

/**
 * Détecter les intentions à partir de la question
 */
function detectIntents(question: string): Intent[] {
  const q = question.toLowerCase();
  const intents: Intent[] = [];

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intent === "GENERAL") continue;
    if (keywords.some((kw) => q.includes(kw))) {
      intents.push(intent as Intent);
    }
  }

  // Si aucune intention détectée, envoyer un contexte général
  if (intents.length === 0) {
    intents.push("STATS");
  }

  return intents;
}

/**
 * Construire le contexte pour le prompt
 */
export async function buildContext(
  tenantId: string,
  question: string
): Promise<string> {
  const intents = detectIntents(question);
  const sections: string[] = [];

  for (const intent of intents) {
    try {
      switch (intent) {
        case "FMPA":
          sections.push(await buildFMPAContext(tenantId));
          break;
        case "PERSONNEL":
          sections.push(await buildPersonnelContext(tenantId));
          break;
        case "FORMATION":
          sections.push(await buildFormationContext(tenantId));
          break;
        case "TTA":
          sections.push(await buildTTAContext(tenantId));
          break;
        case "AGENDA":
          sections.push(await buildAgendaContext(tenantId));
          break;
        case "STATS":
          sections.push(await buildStatsContext(tenantId));
          break;
      }
    } catch (error) {
      console.error(`[AI] Erreur construction contexte ${intent}:`, error);
    }
  }

  if (sections.length === 0) return "";

  return CONTEXT_HEADER + sections.join("\n\n");
}

// ═══════════════════════════════════════════
// Builders par module
// ═══════════════════════════════════════════

async function buildFMPAContext(tenantId: string): Promise<string> {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [upcoming, stats] = await Promise.all([
    prisma.fMPA.findMany({
      where: {
        tenantId,
        startDate: { gte: now, lte: weekFromNow },
        status: { in: ["PUBLISHED", "IN_PROGRESS"] },
      },
      include: {
        _count: { select: { participations: true } },
      },
      orderBy: { startDate: "asc" },
      take: 10,
    }),
    prisma.fMPA.groupBy({
      by: ["status"],
      where: { tenantId },
      _count: true,
    }),
  ]);

  let context = "### FMPA\n";

  // Stats globales
  const statusCounts = stats.map((s) => `${s.status}: ${s._count}`).join(", ");
  context += `Répartition: ${statusCounts}\n\n`;

  // FMPA à venir
  if (upcoming.length > 0) {
    context += "FMPA à venir (7 prochains jours):\n";
    context += "| Titre | Type | Date | Inscrits | Statut |\n|---|---|---|---|---|\n";
    for (const f of upcoming) {
      context += `| ${f.title} | ${f.type} | ${f.startDate.toLocaleDateString("fr-FR")} | ${f._count.participations}/${f.maxParticipants || "∞"} | ${f.status} |\n`;
    }
  } else {
    context += "Aucun FMPA prévu dans les 7 prochains jours.\n";
  }

  return context;
}

async function buildPersonnelContext(tenantId: string): Promise<string> {
  const now = new Date();
  const in30days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [userCount, expiringQuals, expiringMedical] = await Promise.all([
    prisma.user.count({
      where: { tenantId, status: "ACTIVE" },
    }),
    prisma.qualification.findMany({
      where: {
        personnelFile: { tenantId },
        validUntil: { gte: now, lte: in30days },
      },
      include: {
        personnelFile: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      take: 20,
    }),
    prisma.medicalStatus.findMany({
      where: {
        personnelFile: { tenantId },
        validUntil: { gte: now, lte: in30days },
      },
      include: {
        personnelFile: {
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
      take: 10,
    }),
  ]);

  let context = "### Personnel\n";
  context += `Agents actifs: **${userCount}**\n\n`;

  if (expiringQuals.length > 0) {
    context += "Qualifications expirant dans 30 jours:\n";
    context += "| Agent | Qualification | Expire le |\n|---|---|---|\n";
    for (const q of expiringQuals) {
      const user = q.personnelFile.user;
      context += `| ${user.firstName} ${user.lastName} | ${q.name} | ${q.validUntil?.toLocaleDateString("fr-FR") || "?"} |\n`;
    }
    context += "\n";
  }

  if (expiringMedical.length > 0) {
    context += "Aptitudes médicales expirant dans 30 jours:\n";
    context += "| Agent | Statut | Expire le |\n|---|---|---|\n";
    for (const m of expiringMedical) {
      const user = m.personnelFile.user;
      context += `| ${user.firstName} ${user.lastName} | ${m.status} | ${m.validUntil.toLocaleDateString("fr-FR")} |\n`;
    }
  }

  return context;
}

async function buildFormationContext(tenantId: string): Promise<string> {
  const [openFormations, stats] = await Promise.all([
    prisma.formation.findMany({
      where: {
        tenantId,
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
      include: {
        _count: { select: { registrations: true } },
      },
      orderBy: { startDate: "asc" },
      take: 10,
    }),
    prisma.formation.groupBy({
      by: ["category"],
      where: { tenantId },
      _count: true,
    }),
  ]);

  let context = "### Formations\n";

  const catCounts = stats.map((s) => `${s.category}: ${s._count}`).join(", ");
  context += `Par catégorie: ${catCounts}\n\n`;

  if (openFormations.length > 0) {
    context += "Formations ouvertes:\n";
    context += "| Titre | Catégorie | Date | Inscrits/Max | Durée |\n|---|---|---|---|---|\n";
    for (const f of openFormations) {
      context += `| [${f.title}](/formations/${f.id}) | ${f.category} | ${f.startDate?.toLocaleDateString("fr-FR") || "?"} | ${f._count.registrations}/${f.maxParticipants || "∞"} | ${f.duration || "?"}h |\n`;
    }
  }

  return context;
}

async function buildTTAContext(tenantId: string): Promise<string> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [entries, pendingValidation] = await Promise.all([
    prisma.tTAEntry.groupBy({
      by: ["activityType"],
      where: {
        tenantId,
        month: currentMonth,
        year: currentYear,
      },
      _count: true,
      _sum: { hours: true },
    }),
    prisma.tTAEntry.count({
      where: {
        tenantId,
        month: currentMonth,
        year: currentYear,
        status: "PENDING",
      },
    }),
  ]);

  let context = "### TTA — Temps de Travail Additionnel\n";
  context += `Mois en cours: ${currentMonth}/${currentYear}\n`;
  context += `Entrées en attente de validation: **${pendingValidation}**\n\n`;

  if (entries.length > 0) {
    context += "Résumé par type d'activité:\n";
    context += "| Type | Nb entrées | Total heures |\n|---|---|---|\n";
    for (const e of entries) {
      context += `| ${e.activityType} | ${e._count} | ${(e._sum as any).hours || 0}h |\n`;
    }
  }

  return context;
}

async function buildAgendaContext(tenantId: string): Promise<string> {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const events = await prisma.calendarEvent.findMany({
    where: {
      tenantId,
      startDate: { gte: now, lte: weekFromNow },
    },
    include: {
      creator: { select: { firstName: true, lastName: true } },
      _count: { select: { participants: true } },
    },
    orderBy: { startDate: "asc" },
    take: 15,
  });

  let context = "### Agenda (7 prochains jours)\n";

  if (events.length > 0) {
    context += "| Date | Événement | Type | Lieu | Participants |\n|---|---|---|---|---|\n";
    for (const e of events) {
      const date = e.startDate.toLocaleDateString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      const time = e.allDay
        ? "Journée"
        : e.startDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      context += `| ${date} ${time} | [${e.title}](/agenda) | ${e.type} | ${e.location || "-"} | ${e._count.participants} |\n`;
    }
  } else {
    context += "Aucun événement prévu dans les 7 prochains jours.\n";
  }

  return context;
}

async function buildStatsContext(tenantId: string): Promise<string> {
  const [users, fmpas, formations, notifications] = await Promise.all([
    prisma.user.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.fMPA.count({ where: { tenantId } }),
    prisma.formation.count({ where: { tenantId } }),
    prisma.notification.count({ where: { tenantId, read: false } }),
  ]);

  let context = "### Statistiques générales\n";
  context += `- Agents actifs: **${users}**\n`;
  context += `- FMPA total: **${fmpas}**\n`;
  context += `- Formations total: **${formations}**\n`;
  context += `- Notifications non lues: **${notifications}**\n`;

  return context;
}
