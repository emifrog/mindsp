import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const respondSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED", "TENTATIVE"]),
  message: z.string().optional(),
});

// POST /api/messaging/invitations/[id]/respond - Répondre à une invitation
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
    const data = respondSchema.parse(body);

    // Vérifier que l'invitation existe
    const invitation = await prisma.messageEventInvitation.findUnique({
      where: { id: params.id },
      include: {
        event: true,
        message: {
          include: {
            from: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation non trouvée" },
        { status: 404 }
      );
    }

    // Créer ou mettre à jour la réponse
    const response = await prisma.invitationResponse.upsert({
      where: {
        invitationId_userId: {
          invitationId: params.id,
          userId: session.user.id,
        },
      },
      create: {
        invitationId: params.id,
        userId: session.user.id,
        status: data.status,
        message: data.message,
      },
      update: {
        status: data.status,
        message: data.message,
        respondedAt: new Date(),
      },
    });

    // Si accepté, ajouter comme participant à l'événement
    if (data.status === "ACCEPTED") {
      await prisma.agendaEventParticipant.upsert({
        where: {
          eventId_userId: {
            eventId: invitation.event.id,
            userId: session.user.id,
          },
        },
        create: {
          eventId: invitation.event.id,
          userId: session.user.id,
          status: "ACCEPTED",
        },
        update: {
          status: "ACCEPTED",
        },
      });

      // Créer une notification pour l'organisateur
      const notifType =
        data.status === "ACCEPTED"
          ? "INVITATION_ACCEPTED"
          : data.status === "DECLINED"
            ? "INVITATION_DECLINED"
            : "INVITATION_TENTATIVE";

      const notifMessages = {
        ACCEPTED: "a accepté votre invitation",
        DECLINED: "a décliné votre invitation",
        TENTATIVE: 'a répondu "Peut-être" à votre invitation',
      };

      await prisma.notification.create({
        data: {
          userId: invitation.message.from.id,
          tenantId: session.user.tenantId,
          type: notifType,
          title: `Réponse à votre invitation - ${invitation.event.title}`,
          message: `${(session.user as any).firstName} ${(session.user as any).lastName} ${notifMessages[data.status]}`,
          linkUrl: `/agenda/events/${invitation.event.id}`,
          priority: "NORMAL",
        },
      });
    } else if (data.status === "DECLINED" || data.status === "TENTATIVE") {
      // Notification pour les autres réponses aussi
      const notifType =
        data.status === "DECLINED"
          ? "INVITATION_DECLINED"
          : "INVITATION_TENTATIVE";
      const notifMessages = {
        DECLINED: "a décliné votre invitation",
        TENTATIVE: 'a répondu "Peut-être" à votre invitation',
      };

      await prisma.notification.create({
        data: {
          userId: invitation.message.from.id,
          tenantId: session.user.tenantId,
          type: notifType,
          title: `Réponse à votre invitation - ${invitation.event.title}`,
          message: `${(session.user as any).firstName} ${(session.user as any).lastName} ${notifMessages[data.status]}`,
          linkUrl: `/agenda/events/${invitation.event.id}`,
          priority: "NORMAL",
        },
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error(
      "Erreur POST /api/messaging/invitations/[id]/respond:",
      error
    );
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
