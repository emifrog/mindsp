import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

// GET /api/portals - Liste des portails avec pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "20", 10),
      100
    );
    const skip = (page - 1) * limit;

    const where = {
      tenantId: session.user.tenantId,
      ...(status && { status: status as any }),
    };

    const [portals, total] = await Promise.all([
      prisma.portal.findMany({
        where,
        include: {
          _count: {
            select: {
              pages: true,
              news: true,
            },
          },
        },
        orderBy: [{ order: "asc" }, { name: "asc" }],
        take: limit,
        skip,
      }),
      prisma.portal.count({ where }),
    ]);

    return NextResponse.json({
      portals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + portals.length < total,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/portals:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des portails" },
      { status: 500 }
    );
  }
}

// POST /api/portals - Créer un portail
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions (admin uniquement)
    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const {
      slug,
      name,
      description,
      icon,
      color,
      isPublic,
      requiresAuth,
      order,
    } = body;

    if (!slug || !name) {
      return NextResponse.json(
        { error: "Slug et nom requis" },
        { status: 400 }
      );
    }

    const portal = await prisma.portal.create({
      data: {
        tenantId: session.user.tenantId,
        slug,
        name,
        description,
        icon,
        color,
        isPublic: isPublic ?? false,
        requiresAuth: requiresAuth ?? true,
        order: order ?? 0,
        status: "DRAFT",
      },
    });

    return NextResponse.json({ portal }, { status: 201 });
  } catch (error: any) {
    console.error("Erreur POST /api/portals:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Un portail avec ce slug existe déjà" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la création du portail" },
      { status: 500 }
    );
  }
}
