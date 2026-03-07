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
  getCachedFormationList,
  cacheFormationList,
  invalidateFormationCache,
} from "@/lib/cache";

// GET /api/formations - Liste des formations
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Pagination
    const { page, limit } = parsePaginationParams(searchParams);
    const { skip, take } = getPaginationParams(page, limit);

    const where: Prisma.FormationWhereInput = {
      tenantId: session.user.tenantId,
    };

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    // Essayer de récupérer du cache
    const cacheKey = { category, status, search, page, limit };
    const cached = await getCachedFormationList(
      session.user.tenantId,
      cacheKey
    );
    if (cached) {
      return NextResponse.json(cached);
    }

    // Si pas en cache, récupérer de la DB
    const [formations, total] = await Promise.all([
      prisma.formation.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
        orderBy: {
          startDate: "asc",
        },
        skip,
        take,
      }),
      prisma.formation.count({ where }),
    ]);

    const response = {
      formations,
      pagination: createPaginationMeta(page, limit, total),
    };

    // Mettre en cache
    await cacheFormationList(session.user.tenantId, cacheKey, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur GET /api/formations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des formations" },
      { status: 500 }
    );
  }
}

// POST /api/formations - Créer une formation
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions (admin ou manager)
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPER_ADMIN" &&
      session.user.role !== "MANAGER"
    ) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      code,
      title,
      description,
      duration,
      prerequisites,
      validityYears,
      category,
      level,
      startDate,
      endDate,
      location,
      maxParticipants,
      minParticipants,
      price,
      instructorId,
    } = body;

    // Validation
    if (!code || !title || !startDate || !endDate || !location || !category) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    // Vérifier que le code n'existe pas déjà
    const existing = await prisma.formation.findUnique({
      where: {
        tenantId_code: {
          tenantId: session.user.tenantId,
          code,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ce code de formation existe déjà" },
        { status: 400 }
      );
    }

    const formation = await prisma.formation.create({
      data: {
        tenantId: session.user.tenantId,
        code,
        title,
        description,
        duration,
        prerequisites,
        validityYears,
        category,
        level: level || "CONTINUE",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        maxParticipants,
        minParticipants,
        price,
        instructorId,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Invalider le cache formations
    await invalidateFormationCache(session.user.tenantId);

    return NextResponse.json({ formation }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/formations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la formation" },
      { status: 500 }
    );
  }
}
