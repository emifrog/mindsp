import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

// POST /api/push/unsubscribe - Se désabonner des notifications push
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint requis" }, { status: 400 });
    }

    // Désactiver l'abonnement (soft delete)
    // @ts-expect-error - PushSubscription model will be available after prisma generate
    await prisma.pushSubscription.updateMany({
      where: {
        endpoint,
        userId: session.user.id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur POST /api/push/unsubscribe:", error);
    return NextResponse.json(
      { error: "Erreur lors du désabonnement push" },
      { status: 500 }
    );
  }
}
