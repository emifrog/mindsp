import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// GET /api/settings/notifications - Récupérer les préférences
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    });

    // Valeurs par défaut si pas de settings
    const preferences = settings?.notificationPreferences || {
      emailNotifications: true,
      pushNotifications: true,
      fmpaInvitations: true,
      fmpaReminders: true,
      fmpaCancellations: true,
      messageNotifications: true,
      participationUpdates: true,
    };

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error("Erreur GET /api/settings/notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des préférences" },
      { status: 500 }
    );
  }
}

// POST /api/settings/notifications - Sauvegarder les préférences
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();

    const settings = await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        notificationPreferences: body,
      },
      update: {
        notificationPreferences: body,
      },
    });

    return NextResponse.json({
      success: true,
      preferences: settings.notificationPreferences,
    });
  } catch (error) {
    console.error("Erreur POST /api/settings/notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde des préférences" },
      { status: 500 }
    );
  }
}
