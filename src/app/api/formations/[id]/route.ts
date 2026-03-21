import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// GET /api/formations/[id] - Détails formation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const formation = await prisma.formation.findUnique({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
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
            email: true,
          },
        },
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            registeredAt: "desc",
          },
        },
      },
    });

    if (!formation) {
      return NextResponse.json(
        { error: "Formation introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ formation });
  } catch (error) {
    console.error("Erreur GET /api/formations/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la formation" },
      { status: 500 }
    );
  }
}

// PATCH /api/formations/[id] - Modifier formation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions
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

    // Vérifier que la formation existe et appartient au tenant
    const existing = await prisma.formation.findUnique({
      where: { id: params.id },
    });

    if (!existing || existing.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: "Formation introuvable" },
        { status: 404 }
      );
    }

    const formation = await prisma.formation.update({
      where: {
        id: params.id,
      },
      data: {
        title: body.title,
        description: body.description,
        duration: body.duration,
        prerequisites: body.prerequisites,
        validityYears: body.validityYears,
        category: body.category,
        level: body.level,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        location: body.location,
        maxParticipants: body.maxParticipants,
        minParticipants: body.minParticipants,
        price: body.price,
        instructorId: body.instructorId,
        status: body.status,
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

    return NextResponse.json({ formation });
  } catch (error) {
    console.error("Erreur PATCH /api/formations/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de la formation" },
      { status: 500 }
    );
  }
}

// DELETE /api/formations/[id] - Supprimer formation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    // Vérifier que la formation existe et appartient au tenant
    const existing = await prisma.formation.findUnique({
      where: { id: params.id },
      include: {
        registrations: true,
      },
    });

    if (!existing || existing.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: "Formation introuvable" },
        { status: 404 }
      );
    }

    // Logger l'audit avant suppression
    const { logDeletion, AuditEntity } = await import("@/lib/audit");
    await logDeletion(
      session.user.id,
      session.user.tenantId,
      AuditEntity.FORMATION,
      params.id,
      existing
    );

    // Supprimer la formation
    await prisma.formation.delete({
      where: {
        id: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/formations/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la formation" },
      { status: 500 }
    );
  }
}
