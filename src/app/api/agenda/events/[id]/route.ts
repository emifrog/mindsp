import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
export const dynamic = "force-dynamic";

// Schema de validation pour la mise à jour
const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  type: z
    .enum([
      "GARDE",
      "FMPA",
      "FORMATION",
      "PROTOCOLE",
      "ENTRETIEN",
      "PERSONNEL",
      "REUNION",
      "AUTRE",
    ])
    .optional(),
  status: z
    .enum(["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED"])
    .optional(),
  location: z.string().optional(),
  color: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
});

/**
 * GET /api/agenda/events/[id]
 * Récupère les détails d'un événement
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const event = await prisma.agendaEvent.findFirst({
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
            avatar: true,
            badge: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
                badge: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        reminders: {
          orderBy: {
            timing: "desc",
          },
        },
        parentEvent: {
          select: {
            id: true,
            title: true,
            startDate: true,
          },
        },
        childEvents: {
          select: {
            id: true,
            title: true,
            startDate: true,
            endDate: true,
            status: true,
          },
          orderBy: {
            startDate: "asc",
          },
          take: 10,
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("Erreur lors de la récupération de l'événement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PATCH /api/agenda/events/[id]
 * Met à jour un événement
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

    // Vérifier que l'événement existe et appartient au tenant
    const existingEvent = await prisma.agendaEvent.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions (seul le créateur ou un admin peut modifier)
    if (
      existingEvent.createdById !== session.user.id &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de modifier cet événement" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = updateEventSchema.parse(body);

    // Validation des dates si modifiées
    if (data.startDate || data.endDate) {
      const startDate = data.startDate
        ? new Date(data.startDate)
        : existingEvent.startDate;
      const endDate = data.endDate
        ? new Date(data.endDate)
        : existingEvent.endDate;

      if (endDate <= startDate) {
        return NextResponse.json(
          { error: "La date de fin doit être après la date de début" },
          { status: 400 }
        );
      }
    }

    // Mise à jour de l'événement
    const updatedEvent = await prisma.agendaEvent.update({
      where: {
        id: params.id,
      },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.allDay !== undefined && { allDay: data.allDay }),
        ...(data.type && { type: data.type }),
        ...(data.status && { status: data.status }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.isRecurring !== undefined && {
          isRecurring: data.isRecurring,
        }),
        ...(data.recurrenceRule !== undefined && {
          recurrenceRule: data.recurrenceRule,
        }),
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        participants: {
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
        },
        reminders: true,
      },
    });

    // TODO: Notifier les participants du changement

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'événement:", error);

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
 * DELETE /api/agenda/events/[id]
 * Supprime un événement
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

    // Vérifier que l'événement existe et appartient au tenant
    const existingEvent = await prisma.agendaEvent.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        childEvents: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les permissions (seul le créateur ou un admin peut supprimer)
    if (
      existingEvent.createdById !== session.user.id &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Vous n'avez pas la permission de supprimer cet événement" },
        { status: 403 }
      );
    }

    // Vérifier si c'est un événement récurrent avec des occurrences
    const { searchParams } = new URL(request.url);
    const deleteAll = searchParams.get("deleteAll") === "true";

    if (existingEvent.isRecurring && existingEvent.childEvents.length > 0) {
      if (deleteAll) {
        // Supprimer toutes les occurrences
        await prisma.agendaEvent.deleteMany({
          where: {
            OR: [{ id: params.id }, { parentEventId: params.id }],
          },
        });
      } else {
        // Supprimer uniquement cette occurrence
        await prisma.agendaEvent.delete({
          where: {
            id: params.id,
          },
        });
      }
    } else {
      // Suppression simple
      await prisma.agendaEvent.delete({
        where: {
          id: params.id,
        },
      });
    }

    // TODO: Notifier les participants de l'annulation

    return NextResponse.json(
      { message: "Événement supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de l'événement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
