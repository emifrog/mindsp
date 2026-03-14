import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { createFMPASchema } from "@/lib/validations/fmpa";
import {
  parsePaginationParams,
  getPaginationParams,
  createPaginationMeta,
} from "@/lib/pagination";
import {
  getCachedFMPAList,
  cacheFMPAList,
  invalidateFMPACache,
} from "@/lib/cache";

// GET /api/fmpa - Liste des FMPA
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    // Pagination avec helper
    const { page, limit } = parsePaginationParams(searchParams);
    const { skip, take } = getPaginationParams(page, limit);

    const where: Prisma.FMPAWhereInput = {
      tenantId: session.user.tenantId,
    };

    if (status) {
      where.status = status as any;
    }

    if (type) {
      where.type = type as any;
    }

    // Essayer de récupérer du cache
    const cacheKey = { status, type, page, limit };
    const cached = await getCachedFMPAList(session.user.tenantId, cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Si pas en cache, récupérer de la DB
    const [fmpas, total] = await Promise.all([
      prisma.fMPA.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              participations: true,
            },
          },
        },
        orderBy: {
          startDate: "asc",
        },
        skip,
        take,
      }),
      prisma.fMPA.count({ where }),
    ]);

    const response = {
      fmpas,
      pagination: createPaginationMeta(page, limit, total),
    };

    // Mettre en cache
    await cacheFMPAList(session.user.tenantId, cacheKey, response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur GET /api/fmpa:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des FMPA" },
      { status: 500 }
    );
  }
}

// POST /api/fmpa - Créer une FMPA
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createFMPASchema.parse(body);

    // Générer un QR code unique
    const qrCode = `FMPA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const fmpa = await prisma.fMPA.create({
      data: {
        ...validatedData,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        tenantId: session.user.tenantId,
        createdById: session.user.id,
        qrCode,
        status: "DRAFT",
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Invalider le cache FMPA
    await invalidateFMPACache(session.user.tenantId);

    return NextResponse.json(fmpa, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/fmpa:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Données invalides", details: error instanceof z.ZodError ? error.errors : [] },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la création de la FMPA" },
      { status: 500 }
    );
  }
}
