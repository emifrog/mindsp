import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { dailyFMPAReminders } from "@/lib/fmpa-reminders";
export const dynamic = "force-dynamic";

// POST /api/fmpa/reminders - Déclencher l'envoi des rappels (admin seulement)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions (admin uniquement)
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent déclencher les rappels" },
        { status: 403 }
      );
    }

    // Déclencher l'envoi des rappels
    await dailyFMPAReminders();

    return NextResponse.json({
      message: "Rappels envoyés avec succès",
    });
  } catch (error) {
    console.error("Erreur POST /api/fmpa/reminders:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des rappels" },
      { status: 500 }
    );
  }
}
