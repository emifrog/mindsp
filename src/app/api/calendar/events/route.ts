import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/calendar/events - Liste des événements
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const type = searchParams.get("type");

    const where: Prisma.CalendarEventWhereInput = {
      tenantId: session.user.tenantId,
    };

    // Filtrer par période
    if (start && end) {
      where.AND = [
        { startDate: { gte: new Date(start) } },
        { endDate: { lte: new Date(end) } },
      ];
    }

    // Filtrer par type
    if (type) {
      where.type = type;
    }

    const events = await prisma.calendarEvent.findMany({
      where,
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
        fmpa: {
          select: {
            id: true,
            title: true,
            type: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Erreur GET /api/calendar/events:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des événements" },
      { status: 500 }
    );
  }
}

// POST /api/calendar/events - Créer un événement
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      location,
      startDate,
      endDate,
      allDay,
      type,
      color,
      participantIds,
      fmpaId,
    } = body;

    // Validation
    if (!title || !startDate || !endDate || !type) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    // Créer l'événement
    const event = await prisma.calendarEvent.create({
      data: {
        tenantId: session.user.tenantId,
        title,
        description,
        location,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        allDay: allDay || false,
        type,
        color,
        createdBy: session.user.id,
        fmpaId,
        participants: participantIds
          ? {
              create: participantIds.map((userId: string) => ({
                userId,
              })),
            }
          : undefined,
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

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/calendar/events:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'événement" },
      { status: 500 }
    );
  }
}
