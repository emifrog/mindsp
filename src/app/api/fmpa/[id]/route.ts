import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { updateFMPASchema } from "@/lib/validations/fmpa";

// GET /api/fmpa/[id] - Détails d'une FMPA
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const fmpa = await prisma.fMPA.findFirst({
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
            email: true,
            badge: true,
          },
        },
        participations: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                badge: true,
              },
            },
          },
          orderBy: {
            registeredAt: "desc",
          },
        },
      },
    });

    if (!fmpa) {
      return NextResponse.json({ error: "FMPA introuvable" }, { status: 404 });
    }

    return NextResponse.json(fmpa);
  } catch (error) {
    console.error("Erreur GET /api/fmpa/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la FMPA" },
      { status: 500 }
    );
  }
}

// PUT /api/fmpa/[id] - Mettre à jour une FMPA
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que la FMPA existe et appartient au tenant
    const existingFmpa = await prisma.fMPA.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingFmpa) {
      return NextResponse.json({ error: "FMPA introuvable" }, { status: 404 });
    }

    // Vérifier les permissions (admin ou créateur)
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);
    const isCreator = existingFmpa.createdById === session.user.id;

    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateFMPASchema.parse(body);

    const updateData: Prisma.FMPAUpdateInput = { ...validatedData };

    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate);
    }

    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate);
    }

    const fmpa = await prisma.fMPA.update({
      where: { id: params.id },
      data: updateData,
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
    });

    return NextResponse.json(fmpa);
  } catch (error) {
    console.error("Erreur PUT /api/fmpa/[id]:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Données invalides", details: (error as any).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la FMPA" },
      { status: 500 }
    );
  }
}

// DELETE /api/fmpa/[id] - Supprimer une FMPA
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Rate limiting pour actions sensibles (10 suppressions/min par utilisateur)
    const { sensitiveLimiter, checkRateLimit, rateLimitResponse } =
      await import("@/lib/rate-limit");
    const { success, remaining, reset } = await checkRateLimit(
      sensitiveLimiter,
      session.user.id
    );

    if (!success) {
      return rateLimitResponse(remaining, reset);
    }

    // Vérifier que la FMPA existe et appartient au tenant
    const existingFmpa = await prisma.fMPA.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingFmpa) {
      return NextResponse.json({ error: "FMPA introuvable" }, { status: 404 });
    }

    // Seuls les admins peuvent supprimer
    const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(session.user.role);

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Seuls les administrateurs peuvent supprimer une FMPA" },
        { status: 403 }
      );
    }

    // Logger l'audit avant suppression
    const { logDeletion, AuditEntity } = await import("@/lib/audit");
    await logDeletion(
      session.user.id,
      session.user.tenantId,
      AuditEntity.FMPA,
      params.id,
      existingFmpa
    );

    // Supprimer les participations d'abord puis la FMPA (transaction)
    await prisma.$transaction([
      prisma.participation.deleteMany({
        where: { fmpaId: params.id },
      }),
      prisma.fMPA.delete({
        where: { id: params.id },
      }),
    ]);

    return NextResponse.json({ message: "FMPA supprimée avec succès" });
  } catch (error) {
    console.error("Erreur DELETE /api/fmpa/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la FMPA" },
      { status: 500 }
    );
  }
}
