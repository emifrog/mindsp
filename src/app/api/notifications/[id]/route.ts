import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { NotificationService } from "@/lib/notification-service";
export const dynamic = "force-dynamic";

// PATCH /api/notifications/[id] - Marquer comme lu
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const notification = await NotificationService.markAsRead(
      params.id,
      session.user.id
    );

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Erreur PATCH /api/notifications/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la notification" },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Supprimer une notification
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    await NotificationService.delete(params.id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/notifications/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la notification" },
      { status: 500 }
    );
  }
}
