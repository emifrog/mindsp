import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
export const dynamic = "force-dynamic";

// Schema pour ajouter des participants
const addParticipantsSchema = z.object({
  userIds: z.array(z.string()).min(1, "Au moins un participant est requis"),
  role: z.string().optional(),
});

// Schema pour mettre à jour le statut d'un participant
const updateParticipantSchema = z.object({
  userId: z.string(),
  status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "TENTATIVE"]),
  role: z.string().optional(),
});

/**
 * POST /api/agenda/events/[id]/participants
 * Ajoute des participants à un événement
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'événement existe
    const event = await prisma.agendaEvent.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (
      event.createdById !== session.user.id &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission d'ajouter des participants" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = addParticipantsSchema.parse(body);

    // Vérifier que les utilisateurs existent et appartiennent au même tenant
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: data.userIds,
        },
        tenantId: session.user.tenantId,
      },
    });

    if (users.length !== data.userIds.length) {
      return NextResponse.json(
        { error: "Certains utilisateurs n'ont pas été trouvés" },
        { status: 400 }
      );
    }

    // Récupérer les participants existants
    const existingParticipants = await prisma.agendaEventParticipant.findMany({
      where: {
        eventId: params.id,
        userId: {
          in: data.userIds,
        },
      },
    });

    const existingUserIds = existingParticipants.map((p) => p.userId);
    const newUserIds = data.userIds.filter(
      (id) => !existingUserIds.includes(id)
    );

    if (newUserIds.length === 0) {
      return NextResponse.json(
        { error: "Tous les utilisateurs sont déjà participants" },
        { status: 400 }
      );
    }

    // Ajouter les nouveaux participants
    const participants = await prisma.$transaction(
      newUserIds.map((userId) =>
        prisma.agendaEventParticipant.create({
          data: {
            eventId: params.id,
            userId,
            status: "PENDING",
            role: data.role,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        })
      )
    );

    // TODO: Envoyer des notifications aux nouveaux participants

    return NextResponse.json(
      {
        message: `${participants.length} participant(s) ajouté(s)`,
        participants,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de l'ajout des participants:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/agenda/events/[id]/participants
 * Met à jour le statut d'un participant
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que l'événement existe
    const event = await prisma.agendaEvent.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data = updateParticipantSchema.parse(body);

    // Vérifier que le participant existe
    const participant = await prisma.agendaEventParticipant.findUnique({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: data.userId,
        },
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: "Participant non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    // Un utilisateur peut modifier son propre statut
    // Le créateur ou un admin peut modifier n'importe quel participant
    const canUpdate =
      data.userId === session.user.id ||
      event.createdById === session.user.id ||
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN";

    if (!canUpdate) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de modifier ce participant" },
        { status: 403 }
      );
    }

    // Mettre à jour le participant
    const updatedParticipant = await prisma.agendaEventParticipant.update({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: data.userId,
        },
      },
      data: {
        status: data.status,
        ...(data.role !== undefined && { role: data.role }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // TODO: Notifier le créateur du changement de statut

    return NextResponse.json(updatedParticipant);
  } catch (error) {
    console.error("Erreur lors de la mise à jour du participant:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * DELETE /api/agenda/events/[id]/participants
 * Retire un participant d'un événement
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 });
    }

    // Vérifier que l'événement existe
    const event = await prisma.agendaEvent.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    const canDelete =
      userId === session.user.id ||
      event.createdById === session.user.id ||
      session.user.role === "ADMIN" ||
      session.user.role === "SUPER_ADMIN";

    if (!canDelete) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de retirer ce participant" },
        { status: 403 }
      );
    }

    // Supprimer le participant
    await prisma.agendaEventParticipant.delete({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId,
        },
      },
    });

    return NextResponse.json(
      { message: "Participant retiré avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression du participant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
