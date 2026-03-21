import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// POST /api/tta/entries/[id]/validate - Valider/Rejeter une entrée
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
    if (!status || !["VALIDATED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    if (status === "REJECTED" && !rejectionReason) {
      return NextResponse.json(
        { error: "Raison de rejet requise" },
        { status: 400 }
      );
    }

    const entry = await prisma.tTAEntry.findUnique({
      where: { id: params.id },
    });

    if (!entry || entry.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: "Entrée introuvable" },
        { status: 404 }
      );
    }

    const updatedEntry = await prisma.tTAEntry.update({
      where: { id: params.id },
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
          },
        },
      },
    });

    return NextResponse.json({ entry: updatedEntry });
  } catch (error) {
    console.error("Erreur POST /api/tta/entries/[id]/validate:", error);
    return NextResponse.json(
      { error: "Erreur lors de la validation" },
      { status: 500 }
    );
  }
}
