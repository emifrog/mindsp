import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { CacheService, CACHE_TTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

// GET /api/users - Liste des utilisateurs du tenant
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

    // Vérifier le cache
    const cacheKey = `users:${session.user.tenantId}:${search || "all"}:${page}:${limit}`;
    const cached = await CacheService.get<{ users: unknown[]; pagination: unknown }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const where: Prisma.UserWhereInput = {
      tenantId: session.user.tenantId,
      status: "ACTIVE",
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true,
          role: true,
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const response = {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
    await CacheService.set(cacheKey, response, { ttl: CACHE_TTL.LIST_SHORT });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur GET /api/users:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}
