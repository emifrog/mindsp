import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
export const dynamic = "force-dynamic";

const registerSchema = z.object({
  message: z.string().optional(),
});

// POST /api/messaging/training-proposals/[id]/register - S'inscrire à une formation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const data = registerSchema.parse(body);

    // Vérifier que la proposition existe
    const proposal = await prisma.messageTrainingProposal.findUnique({
      where: { id: params.id },
      include: {
        message: {
          include: {
            from: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        registrations: true,
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposition non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier si déjà inscrit
    const existingRegistration = await prisma.trainingRegistration.findUnique({
      where: {
        proposalId_userId: {
          proposalId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: "Vous êtes déjà inscrit" },
        { status: 400 }
      );
    }

    // Vérifier le nombre max de participants
    if (
      proposal.maxParticipants &&
      proposal.registrations.length >= proposal.maxParticipants
    ) {
      // Ajouter en liste d'attente
      const registration = await prisma.trainingRegistration.create({
        data: {
          proposalId: params.id,
          userId: session.user.id,
          status: "WAITLIST",
          message: data.message,
        },
      });

      return NextResponse.json({
        ...registration,
        waitlist: true,
      });
    }

    // Créer l'inscription
    const registration = await prisma.trainingRegistration.create({
      data: {
        proposalId: params.id,
        userId: session.user.id,
        status: "PENDING",
        message: data.message,
      },
    });

    // Créer une notification pour l'organisateur
    await prisma.notification.create({
      data: {
        userId: proposal.message.from.id,
        tenantId: session.user.tenantId,
        type: "TRAINING_REGISTERED",
        title: `Nouvelle inscription - ${proposal.title}`,
        message: `${(session.user as any).firstName} ${(session.user as any).lastName} s'est inscrit à la formation`,
        linkUrl: `/messaging/training-proposals/${params.id}`,
        priority: "NORMAL",
      },
    });

    return NextResponse.json(registration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error(
      "Erreur POST /api/messaging/training-proposals/[id]/register:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/messaging/training-proposals/[id]/register - Annuler son inscription
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Supprimer l'inscription
    await prisma.trainingRegistration.delete({
      where: {
        proposalId_userId: {
          proposalId: params.id,
          userId: session.user.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "Erreur DELETE /api/messaging/training-proposals/[id]/register:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
