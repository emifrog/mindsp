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

    // Vérifier le cache
    const cacheKey = `users:${session.user.tenantId}:${search || "all"}`;
    const cached = await CacheService.get<{ users: unknown[] }>(cacheKey);
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

    const users = await prisma.user.findMany({
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
    });

    const response = { users };
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
