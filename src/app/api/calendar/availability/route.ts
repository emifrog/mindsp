import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/calendar/availability - Liste des disponibilités
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId") || session.user.id;
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const where: Prisma.AvailabilityWhereInput = {
      tenantId: session.user.tenantId,
      userId,
    };

    // Filtrer par période
    if (start && end) {
      where.AND = [
        { startDate: { lte: new Date(end) } },
        { endDate: { gte: new Date(start) } },
      ];
    }

    const availabilities = await prisma.availability.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    });

    return NextResponse.json({ availabilities });
  } catch (error) {
    console.error("Erreur GET /api/calendar/availability:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des disponibilités" },
      { status: 500 }
    );
  }
}

// POST /api/calendar/availability - Créer une disponibilité
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate, type, reason, isRecurring, recurrence } = body;

    // Validation
    if (!startDate || !endDate || !type) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const availability = await prisma.availability.create({
      data: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type,
        reason,
        isRecurring: isRecurring || false,
        recurrence,
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

    return NextResponse.json({ availability }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/calendar/availability:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la disponibilité" },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/availability/[id] - Supprimer disponibilité
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID manquant" }, { status: 400 });
    }

    // Vérifier que la disponibilité appartient à l'utilisateur
    const availability = await prisma.availability.findUnique({
      where: { id },
    });

    if (!availability) {
      return NextResponse.json(
        { error: "Disponibilité introuvable" },
        { status: 404 }
      );
    }

    if (availability.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    await prisma.availability.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/calendar/availability:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la disponibilité" },
      { status: 500 }
    );
  }
}
