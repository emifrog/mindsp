import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

// POST /api/push/subscribe - S'abonner aux notifications push
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Données d'abonnement invalides" },
        { status: 400 }
      );
    }

    // Upsert: créer ou mettre à jour l'abonnement
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      create: {
        userId: session.user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: request.headers.get("user-agent") || undefined,
        isActive: true,
        lastUsedAt: new Date(),
      },
      update: {
        userId: session.user.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: request.headers.get("user-agent") || undefined,
        isActive: true,
        lastUsedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
    });
  } catch (error) {
    console.error("Erreur POST /api/push/subscribe:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'abonnement push" },
      { status: 500 }
    );
  }
}

// GET /api/push/subscribe - Vérifier l'état de l'abonnement
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      select: {
        id: true,
        endpoint: true,
        deviceName: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      subscriptions,
      count: subscriptions.length,
    });
  } catch (error) {
    console.error("Erreur GET /api/push/subscribe:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des abonnements" },
      { status: 500 }
    );
  }
}
