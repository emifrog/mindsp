import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { CacheService } from "@/lib/cache";
export const dynamic = "force-dynamic";

// GET /api/calendar/events/[id] - Détails événement
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const event = await prisma.calendarEvent.findUnique({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
                avatar: true,
              },
            },
          },
        },
        fmpa: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Événement introuvable" },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Erreur GET /api/calendar/events/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'événement" },
      { status: 500 }
    );
  }
}

// PATCH /api/calendar/events/[id] - Modifier événement
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();

    // Vérifier que l'événement existe et appartient au tenant
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Événement introuvable" },
        { status: 404 }
      );
    }

    // Vérifier les permissions (créateur ou admin)
    if (
      existingEvent.createdBy !== session.user.id &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const event = await prisma.calendarEvent.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        location: body.location,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        allDay: body.allDay,
        type: body.type,
        color: body.color,
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Invalider le cache calendrier du tenant
    await CacheService.deletePattern(`calendar:${session.user.tenantId}:*`);

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Erreur PATCH /api/calendar/events/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification de l'événement" },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/events/[id] - Supprimer événement
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'événement existe
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "Événement introuvable" },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    if (
      existingEvent.createdBy !== session.user.id &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    await prisma.calendarEvent.delete({
      where: { id: params.id },
    });

    // Invalider le cache calendrier du tenant
    await CacheService.deletePattern(`calendar:${session.user.tenantId}:*`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/calendar/events/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'événement" },
      { status: 500 }
    );
  }
}
