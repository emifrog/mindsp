import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// POST /api/formations/[id]/register - S'inscrire à une formation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que la formation existe
    const formation = await prisma.formation.findUnique({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        _count: {
          select: {
            registrations: {
              where: {
                status: {
                  in: ["PENDING", "APPROVED"],
                },
              },
            },
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

    // Vérifier que la formation est ouverte
    if (formation.status !== "OPEN" && formation.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Les inscriptions sont fermées pour cette formation" },
        { status: 400 }
      );
    }

    // Vérifier qu'il reste de la place
    if (
      formation.maxParticipants &&
      formation._count.registrations >= formation.maxParticipants
    ) {
      return NextResponse.json(
        { error: "Cette formation est complète" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur n'est pas déjà inscrit
    const existing = await prisma.formationRegistration.findUnique({
      where: {
        formationId_userId: {
          formationId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Vous êtes déjà inscrit à cette formation" },
        { status: 400 }
      );
    }

    // Créer l'inscription
    const registration = await prisma.formationRegistration.create({
      data: {
        formationId: params.id,
        userId: session.user.id,
        tenantId: session.user.tenantId,
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

    return NextResponse.json({ registration }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/formations/[id]/register:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'inscription" },
      { status: 500 }
    );
  }
}

// DELETE /api/formations/[id]/register - Se désinscrire
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const registration = await prisma.formationRegistration.findUnique({
      where: {
        formationId_userId: {
          formationId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: "Inscription introuvable" },
        { status: 404 }
      );
    }

    // Ne peut se désinscrire que si en attente
    if (registration.status !== "PENDING") {
      return NextResponse.json(
        { error: "Impossible de se désinscrire (inscription déjà validée)" },
        { status: 400 }
      );
    }

    await prisma.formationRegistration.delete({
      where: {
        id: registration.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/formations/[id]/register:", error);
    return NextResponse.json(
      { error: "Erreur lors de la désinscription" },
      { status: 500 }
    );
  }
}
