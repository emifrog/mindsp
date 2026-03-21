import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// POST /api/fmpa/[id]/register - S'inscrire à une FMPA
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { notes } = body;

    // Vérifier que la FMPA existe
    const fmpa = await prisma.fMPA.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: {
            participations: true,
          },
        },
      },
    });

    if (!fmpa) {
      return NextResponse.json({ error: "FMPA introuvable" }, { status: 404 });
    }

    // Vérifier que la FMPA est publiée
    if (fmpa.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Cette FMPA n'est pas encore ouverte aux inscriptions" },
        { status: 400 }
      );
    }

    // Vérifier le nombre maximum de participants
    if (
      fmpa.maxParticipants &&
      fmpa._count.participations >= fmpa.maxParticipants
    ) {
      return NextResponse.json(
        { error: "Le nombre maximum de participants est atteint" },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur est déjà inscrit
    const existingParticipation = await prisma.participation.findFirst({
      where: {
        fmpaId: params.id,
        userId: session.user.id,
      },
    });

    if (existingParticipation) {
      return NextResponse.json(
        { error: "Vous êtes déjà inscrit à cette FMPA" },
        { status: 400 }
      );
    }

    // Créer la participation
    const participation = await prisma.participation.create({
      data: {
        fmpaId: params.id,
        userId: session.user.id,
        status: fmpa.requiresApproval ? "REGISTERED" : "CONFIRMED",
        notes,
        confirmedAt: fmpa.requiresApproval ? null : new Date(),
      },
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
        fmpa: {
          select: {
            id: true,
            title: true,
            type: true,
            startDate: true,
            endDate: true,
            location: true,
          },
        },
      },
    });

    return NextResponse.json(participation, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/fmpa/[id]/register:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}

// DELETE /api/fmpa/[id]/register - Se désinscrire d'une FMPA
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que la participation existe
    const participation = await prisma.participation.findFirst({
      where: {
        fmpaId: params.id,
        userId: session.user.id,
      },
      include: {
        fmpa: true,
      },
    });

    if (!participation) {
      return NextResponse.json(
        { error: "Vous n'êtes pas inscrit à cette FMPA" },
        { status: 404 }
      );
    }

    // Vérifier que la FMPA n'a pas encore commencé
    if (
      participation.fmpa.status === "IN_PROGRESS" ||
      participation.fmpa.status === "COMPLETED"
    ) {
      return NextResponse.json(
        {
          error: "Impossible de se désinscrire d'une FMPA en cours ou terminée",
        },
        { status: 400 }
      );
    }

    // Supprimer la participation
    await prisma.participation.delete({
      where: { id: participation.id },
    });

    return NextResponse.json({ message: "Désinscription réussie" });
  } catch (error) {
    console.error("Erreur DELETE /api/fmpa/[id]/register:", error);
    return NextResponse.json(
      { error: "Erreur lors de la désinscription" },
      { status: 500 }
    );
  }
}
