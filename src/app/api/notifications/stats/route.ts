import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { NotificationService } from "@/lib/notification-service";

export const dynamic = "force-dynamic";

// GET /api/notifications/stats - Statistiques des notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const stats = await NotificationService.getStats(session.user.id);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erreur GET /api/notifications/stats:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
