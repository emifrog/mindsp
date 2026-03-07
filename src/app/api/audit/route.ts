import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { getTenantAuditLogs, getUserAuditLogs } from "@/lib/audit";

// GET /api/audit - Récupérer les logs d'audit
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Seuls les admins peuvent voir tous les logs
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "50");

    let logs;

    if (userId) {
      // Logs d'un utilisateur spécifique
      if (!isAdmin && userId !== session.user.id) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }
      logs = await getUserAuditLogs(userId, limit);
    } else if (isAdmin) {
      // Tous les logs du tenant (admin uniquement)
      logs = await getTenantAuditLogs(session.user.tenantId, limit);
    } else {
      // Utilisateur normal : seulement ses propres logs
      logs = await getUserAuditLogs(session.user.id, limit);
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Erreur GET /api/audit:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
