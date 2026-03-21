import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// GET /api/portals/[id] - Détails d'un portail
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const portal = await prisma.portal.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        pages: {
          where: { isPublished: true },
          orderBy: { order: "asc" },
        },
        news: {
          where: { isPublished: true },
          orderBy: { publishedAt: "desc" },
          take: 5,
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!portal) {
      return NextResponse.json(
        { error: "Portail non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ portal });
  } catch (error) {
    console.error("Erreur GET /api/portals/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du portail" },
      { status: 500 }
    );
  }
}

// PATCH /api/portals/[id] - Modifier un portail
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      icon,
      color,
      isPublic,
      requiresAuth,
      order,
      status,
    } = body;

    const portal = await prisma.portal.update({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color && { color }),
        ...(isPublic !== undefined && { isPublic }),
        ...(requiresAuth !== undefined && { requiresAuth }),
        ...(order !== undefined && { order }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ portal });
  } catch (error) {
    console.error("Erreur PATCH /api/portals/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification du portail" },
      { status: 500 }
    );
  }
}

// DELETE /api/portals/[id] - Supprimer un portail
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    await prisma.portal.delete({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/portals/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du portail" },
      { status: 500 }
    );
  }
}
