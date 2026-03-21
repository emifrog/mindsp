import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// POST /api/formations/registrations/[id]/validate - Valider/Rejeter une inscription
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { status, rejectionReason } = body;

    // Validation
    if (!status || !["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    if (status === "REJECTED" && !rejectionReason) {
      return NextResponse.json(
        { error: "Raison de rejet requise" },
        { status: 400 }
      );
    }

    const registration = await prisma.formationRegistration.update({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      data: {
        status,
        validatedBy: session.user.id,
        validatedAt: new Date(),
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        formation: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({ registration });
  } catch (error) {
    console.error(
      "Erreur POST /api/formations/registrations/[id]/validate:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la validation" },
      { status: 500 }
    );
  }
}
