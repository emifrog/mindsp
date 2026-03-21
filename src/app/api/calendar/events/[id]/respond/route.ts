import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// POST /api/calendar/events/[id]/respond - Répondre à une invitation
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
    const { status, response } = body;

    // Validation
    if (!status || !["ACCEPTED", "DECLINED", "TENTATIVE"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    // Vérifier que l'événement existe
    const event = await prisma.calendarEvent.findUnique({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement introuvable" },
        { status: 404 }
      );
    }

    // Mettre à jour ou créer la participation
    const participant = await prisma.eventParticipant.upsert({
      where: {
        eventId_userId: {
          eventId: params.id,
          userId: session.user.id,
        },
      },
      create: {
        eventId: params.id,
        userId: session.user.id,
        status,
        response,
        respondedAt: new Date(),
      },
      update: {
        status,
        response,
        respondedAt: new Date(),
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

    return NextResponse.json({ participant });
  } catch (error) {
    console.error("Erreur POST /api/calendar/events/[id]/respond:", error);
    return NextResponse.json(
      { error: "Erreur lors de la réponse à l'invitation" },
      { status: 500 }
    );
  }
}
