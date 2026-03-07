import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  differenceInHours,
} from "date-fns";

// GET /api/fmpa/statistics - Statistiques globales FMPA
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const period = searchParams.get("period") || "month"; // month, year, all
    const type = searchParams.get("type"); // FORMATION, MANOEUVRE, etc.

    // Calculer les dates de début et fin selon la période
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case "month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "year":
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = new Date(0); // Depuis le début
        endDate = now;
    }

    // Construire les filtres
    const fmpaFilter: Prisma.FMPAWhereInput = {
      tenantId: session.user.tenantId,
      status: "COMPLETED",
      startDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (type) {
      fmpaFilter.type = type;
    }

    // 1. Taux de participation par personne (optimisé, pas de N+1)
    const [participationsByUser, presentByUser] = await Promise.all([
      prisma.participation.groupBy({
        by: ["userId"],
        where: {
          fmpa: fmpaFilter,
        },
        _count: {
          id: true,
        },
      }),
      prisma.participation.groupBy({
        by: ["userId"],
        where: {
          fmpa: fmpaFilter,
          status: "PRESENT",
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Récupérer tous les users en une seule query
    const userIds = participationsByUser.map((p) => p.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // Créer des maps pour accès rapide
    const userMap = new Map(users.map((u) => [u.id, u]));
    const presentMap = new Map(
      presentByUser.map((p) => [p.userId, p._count.id])
    );

    // Construire les stats sans N+1
    const userParticipationRates = participationsByUser.map((userStat) => {
      const user = userMap.get(userStat.userId);
      const presentCount = presentMap.get(userStat.userId) || 0;
      const rate =
        userStat._count.id > 0
          ? Math.round((presentCount / userStat._count.id) * 100)
          : 0;

      return {
        user,
        totalParticipations: userStat._count.id,
        presentCount,
        rate,
      };
    });

    // 2. Taux de présence par FMPA
    const fmpas = await prisma.fMPA.findMany({
      where: fmpaFilter,
      include: {
        _count: {
          select: {
            participations: true,
          },
        },
      },
    });

    const fmpaAttendanceRates = await Promise.all(
      fmpas.map(async (fmpa) => {
        const presentCount = await prisma.participation.count({
          where: {
            fmpaId: fmpa.id,
            status: "PRESENT",
          },
        });

        const rate =
          fmpa._count.participations > 0
            ? Math.round((presentCount / fmpa._count.participations) * 100)
            : 0;

        return {
          fmpa: {
            id: fmpa.id,
            title: fmpa.title,
            type: fmpa.type,
            startDate: fmpa.startDate,
          },
          totalParticipants: fmpa._count.participations,
          presentCount,
          rate,
        };
      })
    );

    // 3. Heures de formation par personne
    const trainingHoursByUser = await Promise.all(
      participationsByUser.map(async (userStat) => {
        const user = await prisma.user.findUnique({
          where: { id: userStat.userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        });

        const participations = await prisma.participation.findMany({
          where: {
            userId: userStat.userId,
            status: "PRESENT",
            fmpa: {
              ...fmpaFilter,
              type: "FORMATION",
            },
          },
          include: {
            fmpa: {
              select: {
                startDate: true,
                endDate: true,
              },
            },
          },
        });

        const totalHours = participations.reduce((sum, p) => {
          const hours = differenceInHours(
            new Date(p.fmpa.endDate),
            new Date(p.fmpa.startDate)
          );
          return sum + hours;
        }, 0);

        return {
          user,
          totalHours,
          formationsCount: participations.length,
        };
      })
    );

    // 4. Statistiques globales
    const totalFMPAs = await prisma.fMPA.count({
      where: fmpaFilter,
    });

    const totalParticipations = await prisma.participation.count({
      where: {
        fmpa: fmpaFilter,
      },
    });

    const totalPresent = await prisma.participation.count({
      where: {
        fmpa: fmpaFilter,
        status: "PRESENT",
      },
    });

    const globalAttendanceRate =
      totalParticipations > 0
        ? Math.round((totalPresent / totalParticipations) * 100)
        : 0;

    // Statistiques par type
    const statsByType = await prisma.fMPA.groupBy({
      by: ["type"],
      where: fmpaFilter,
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      period: {
        type: period,
        startDate,
        endDate,
      },
      global: {
        totalFMPAs,
        totalParticipations,
        totalPresent,
        attendanceRate: globalAttendanceRate,
        byType: statsByType,
      },
      userParticipationRates: userParticipationRates.sort(
        (a, b) => b.rate - a.rate
      ),
      fmpaAttendanceRates: fmpaAttendanceRates.sort((a, b) => b.rate - a.rate),
      trainingHoursByUser: trainingHoursByUser.sort(
        (a, b) => b.totalHours - a.totalHours
      ),
    });
  } catch (error) {
    console.error("Erreur GET /api/fmpa/statistics:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
