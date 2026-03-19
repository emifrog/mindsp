import { NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/onboarding - Check onboarding status
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
      select: { onboardingCompleted: true },
    });

    return NextResponse.json({
      completed: settings?.onboardingCompleted ?? false,
    });
  } catch (error) {
    console.error("Erreur GET /api/onboarding:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/onboarding - Mark onboarding as completed
export async function POST() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    await prisma.userSettings.upsert({
      where: { userId: session.user.id },
      update: { onboardingCompleted: true },
      create: {
        userId: session.user.id,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({ completed: true });
  } catch (error) {
    console.error("Erreur POST /api/onboarding:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
