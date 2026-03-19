import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { getQueueStats } from "@/lib/queue";

export const dynamic = "force-dynamic";

// GET /api/admin/queues/stats - Stats des queues
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const stats = await getQueueStats();

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Erreur GET /api/admin/queues/stats:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
