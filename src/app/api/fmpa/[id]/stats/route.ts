import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { CacheService, CACHE_TTL } from "@/lib/cache";
export const dynamic = "force-dynamic";

// GET /api/fmpa/[id]/stats - Statistiques d'une FMPA
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const cacheKey = `fmpa:stats:${params.id}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Vérifier que la FMPA existe
    const fmpa = await prisma.fMPA.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!fmpa) {
      return NextResponse.json({ error: "FMPA introuvable" }, { status: 404 });
    }

    // Récupérer les statistiques de manière optimisée (1 query au lieu de 7)
    const [participationsByStatus, mealCount] = await Promise.all([
      prisma.participation.groupBy({
        by: ["status"],
        where: { fmpaId: params.id },
        _count: true,
      }),
      prisma.fMPAMealRegistration.count({
        where: {
          participation: {
            fmpaId: params.id,
          },
        },
      }),
    ]);

    // Créer un map pour accès rapide
    const statusMap = new Map(
      participationsByStatus.map((item) => [item.status, item._count])
    );

    // Extraire les counts par status
    const totalParticipations = participationsByStatus.reduce(
      (sum, item) => sum + item._count,
      0
    );
    const registeredCount = statusMap.get("REGISTERED") || 0;
    const confirmedCount = statusMap.get("CONFIRMED") || 0;
    const presentCount = statusMap.get("PRESENT") || 0;
    const absentCount = statusMap.get("ABSENT") || 0;
    const excusedCount = statusMap.get("EXCUSED") || 0;
    const cancelledCount = statusMap.get("CANCELLED") || 0;

    // Calculer les taux
    const attendanceRate =
      totalParticipations > 0
        ? ((presentCount / totalParticipations) * 100).toFixed(1)
        : 0;

    const confirmationRate =
      totalParticipations > 0
        ? (
            ((confirmedCount + presentCount) / totalParticipations) *
            100
          ).toFixed(1)
        : 0;

    const mealRate =
      totalParticipations > 0
        ? ((mealCount / totalParticipations) * 100).toFixed(1)
        : 0;

    // Récupérer les inscriptions repas par menu
    const mealsByMenu = await prisma.fMPAMealRegistration.groupBy({
      by: ["menuChoice"],
      where: {
        participation: {
          fmpaId: params.id,
        },
      },
      _count: true,
    });

    const response = {
      total: totalParticipations,
      byStatus: {
        registered: registeredCount,
        confirmed: confirmedCount,
        present: presentCount,
        absent: absentCount,
        excused: excusedCount,
        cancelled: cancelledCount,
      },
      meals: {
        total: mealCount,
        byMenu: mealsByMenu.map((m) => ({
          menu: m.menuChoice || "Non spécifié",
          count: m._count,
        })),
      },
      rates: {
        attendance: parseFloat(String(attendanceRate)),
        confirmation: parseFloat(String(confirmationRate)),
        meal: parseFloat(String(mealRate)),
      },
      capacity: {
        max: fmpa.maxParticipants,
        available: fmpa.maxParticipants
          ? fmpa.maxParticipants - totalParticipations
          : null,
        isFull: fmpa.maxParticipants
          ? totalParticipations >= fmpa.maxParticipants
          : false,
      },
    };
    await CacheService.set(cacheKey, response, { ttl: CACHE_TTL.LIST_SHORT });
    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur GET /api/fmpa/[id]/stats:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
