import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/fmpa/participations/history - Historique des participations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const limit = parseInt(searchParams.get("limit") || "10");

    // Vérifier les permissions (seulement son propre historique sauf admin)
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
    if (userId !== session.user.id && !isAdmin) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer les participations
    const participations = await prisma.participation.findMany({
      where: {
        userId,
        fmpa: {
          tenantId: session.user.tenantId,
        },
      },
      include: {
        fmpa: {
          select: {
            id: true,
            title: true,
            type: true,
            startDate: true,
            endDate: true,
            location: true,
            status: true,
          },
        },
      },
      orderBy: {
        registeredAt: "desc",
      },
      take: limit,
    });

    // Calculer les statistiques
    const allParticipations = await prisma.participation.findMany({
      where: {
        userId,
        fmpa: {
          tenantId: session.user.tenantId,
          status: "COMPLETED", // Seulement les FMPA terminées
        },
      },
      select: {
        status: true,
      },
    });

    const total = allParticipations.length;
    const present = allParticipations.filter(
      (p) => p.status === "PRESENT"
    ).length;
    const absent = allParticipations.filter(
      (p) => p.status === "ABSENT"
    ).length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return NextResponse.json({
      participations,
      stats: {
        total,
        present,
        absent,
        rate,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/fmpa/participations/history:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique" },
      { status: 500 }
    );
  }
}
