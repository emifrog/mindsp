import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const validateSchema = z.object({
  status: z.enum(["CONFIRMED", "PRESENT", "ABSENT", "EXCUSED"]),
  excuseReason: z.string().optional(),
});

// PATCH /api/fmpa/[id]/participants/[participantId]/validate - Valider une participation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; participantId: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions (admin ou chef)
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "CHEF"].includes(
      session.user.role
    );

    if (!isAdmin) {
      return NextResponse.json(
        {
          error:
            "Seuls les chefs et administrateurs peuvent valider les présences",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = validateSchema.parse(body);

    // Vérifier que la participation existe
    const participation = await prisma.participation.findFirst({
      where: {
        id: params.participantId,
        fmpaId: params.id,
      },
      include: {
        fmpa: {
          select: {
            tenantId: true,
          },
        },
      },
    });

    if (!participation) {
      return NextResponse.json(
        { error: "Participation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier le tenant
    if (participation.fmpa.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Mettre à jour la participation
    const updateData: Prisma.ParticipationUpdateInput = {
      status: data.status,
      validatedBy: session.user.id,
      validatedAt: new Date(),
    };

    if (data.status === "EXCUSED" && data.excuseReason) {
      updateData.excuseReason = data.excuseReason;
    }

    if (data.status === "PRESENT" && !participation.checkInTime) {
      updateData.checkInTime = new Date();
    }

    const updatedParticipation = await prisma.participation.update({
      where: { id: params.participantId },
      data: updateData,
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
    });

    return NextResponse.json(updatedParticipation);
  } catch (error) {
    console.error(
      "Erreur PATCH /api/fmpa/[id]/participants/[participantId]/validate:",
      error
    );

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la validation" },
      { status: 500 }
    );
  }
}
