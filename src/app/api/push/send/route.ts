import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { WebPushService } from "@/lib/web-push-server";

// POST /api/push/send - Envoyer une notification push (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions (admin uniquement)
    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, userIds, title, message, url, icon } = body;

    if (!title || !message) {
      return NextResponse.json(
        { error: "Titre et message requis" },
        { status: 400 }
      );
    }

    // Déterminer les utilisateurs cibles
    const targetUserIds: string[] = userIds || (userId ? [userId] : []);

    if (targetUserIds.length === 0) {
      return NextResponse.json(
        { error: "Au moins un utilisateur cible requis" },
        { status: 400 }
      );
    }

    // Envoyer les notifications via le service
    const result = await WebPushService.sendToUsers(targetUserIds, {
      title,
      body: message,
      icon: icon || "/icon-192x192.png",
      badge: "/icon-96x96.png",
      data: { url },
    });

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
    });
  } catch (error) {
    console.error("Erreur POST /api/push/send:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi des notifications push" },
      { status: 500 }
    );
  }
}
