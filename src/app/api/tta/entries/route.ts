import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  parsePaginationParams,
  getPaginationParams,
  createPaginationMeta,
} from "@/lib/pagination";
import {

  getCachedTTAList,
  cacheTTAList,
  invalidateTTACache,
} from "@/lib/cache";

// Taux horaires (à configurer selon les besoins)
const HOURLY_RATES = {
  base: 15, // €/heure
  night: 5, // Bonus nuit
  sunday: 7.5, // Bonus dimanche
  holiday: 10, // Bonus jour férié
};

function calculateAmounts(
  hours: number,
  nightHours: number = 0,
  sundayHours: number = 0,
  holidayHours: number = 0
) {
  const baseAmount = hours * HOURLY_RATES.base;
  const nightBonus = nightHours * HOURLY_RATES.night;
  const sundayBonus = sundayHours * HOURLY_RATES.sunday;
  const holidayBonus = holidayHours * HOURLY_RATES.holiday;
  const totalAmount = baseAmount + nightBonus + sundayBonus + holidayBonus;

  return {
    baseAmount,
    nightBonus,
    sundayBonus,
    holidayBonus,
    totalAmount,
  };
}

// GET /api/tta/entries - Liste des entrées TTA
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");

    const where: Prisma.TTAEntryWhereInput = {
      tenantId: session.user.tenantId,
    };

    // Filtrer par mois/année
    if (month && year) {
      where.month = parseInt(month);
      where.year = parseInt(year);
    }

    // Filtrer par utilisateur (admin peut voir tous, user voit les siens)
    if (
      userId &&
      (session.user.role === "ADMIN" ||
        session.user.role === "SUPER_ADMIN" ||
        session.user.role === "MANAGER")
    ) {
      where.userId = userId;
    } else {
      where.userId = session.user.id;
    }

    // Filtrer par statut
    if (status) {
      where.status = status as any;
    }

    // Pagination
    const { page, limit } = parsePaginationParams(searchParams);
    const { skip, take } = getPaginationParams(page, limit);

    // Essayer de récupérer du cache
    const cacheKey = { month, year, userId, status, page, limit };
    const cached = await getCachedTTAList(session.user.tenantId, cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Si pas en cache, récupérer de la DB
    const [entries, total] = await Promise.all([
      prisma.tTAEntry.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          fmpa: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          date: "desc",
        },
        skip,
        take,
      }),
      prisma.tTAEntry.count({ where }),
    ]);

    const response = {
      entries,
      pagination: createPaginationMeta(page, limit, total),
    };

    // Mettre en cache
    await cacheTTAList(session.user.tenantId, cacheKey, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur GET /api/tta/entries:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des entrées" },
      { status: 500 }
    );
  }
}

// POST /api/tta/entries - Créer une entrée TTA
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const {
      date,
      activityType,
      fmpaId,
      description,
      hours,
      nightHours,
      sundayHours,
      holidayHours,
    } = body;

    // Validation
    if (!date || !activityType || !hours) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const entryDate = new Date(date);
    const month = entryDate.getMonth() + 1;
    const year = entryDate.getFullYear();

    // Calculer les montants
    const amounts = calculateAmounts(
      hours,
      nightHours || 0,
      sundayHours || 0,
      holidayHours || 0
    );

    const entry = await prisma.tTAEntry.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        date: entryDate,
        month,
        year,
        activityType,
        fmpaId,
        description,
        hours,
        nightHours: nightHours || 0,
        sundayHours: sundayHours || 0,
        holidayHours: holidayHours || 0,
        ...amounts,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        fmpa: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Invalider le cache TTA
    await invalidateTTACache(session.user.tenantId);

    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/tta/entries:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'entrée" },
      { status: 500 }
    );
  }
}
