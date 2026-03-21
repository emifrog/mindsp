import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { markNotificationAsRead } from "@/lib/notifications";
export const dynamic = "force-dynamic";

// POST /api/notifications/[id]/read - Marquer comme lu
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const success = await markNotificationAsRead(params.id);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Notification introuvable" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Erreur POST /api/notifications/[id]/read:", error);
    return NextResponse.json(
      { error: "Erreur lors du marquage" },
      { status: 500 }
    );
  }
}
