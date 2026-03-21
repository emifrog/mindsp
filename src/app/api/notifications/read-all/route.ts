import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { markAllNotificationsAsRead } from "@/lib/notifications";
export const dynamic = "force-dynamic";

// POST /api/notifications/read-all - Marquer toutes comme lues
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const success = await markAllNotificationsAsRead(session.user.id);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Erreur lors du marquage" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur POST /api/notifications/read-all:", error);
    return NextResponse.json(
      { error: "Erreur lors du marquage" },
      { status: 500 }
    );
  }
}
