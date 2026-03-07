import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Schema de validation pour créer un événement
const createEventSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  allDay: z.boolean().default(false),
  type: z.enum([
    "GARDE",
    "FMPA",
    "FORMATION",
    "PROTOCOLE",
    "ENTRETIEN",
    "PERSONNEL",
    "REUNION",
    "AUTRE",
  ]),
  status: z
    .enum(["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED"])
    .default("SCHEDULED"),
  location: z.string().optional(),
  color: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().optional(),
  participantIds: z.array(z.string()).optional(),
});

// Schema de validation pour les filtres
const filterSchema = z.object({
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
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  userId: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

/**
 * GET /api/agenda/events
 * Récupère la liste des événements avec filtres optionnels
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = filterSchema.parse({
      type: searchParams.get("type") || undefined,
      status: searchParams.get("status") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      userId: searchParams.get("userId") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "50",
    });

    const page = parseInt(filters.page || "1");
    const limit = parseInt(filters.limit || "50");
    const skip = (page - 1) * limit;

    // Construction des filtres Prisma
    const where: Prisma.AgendaEventWhereInput = {
      tenantId: session.user.tenantId,
    };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.AND = [];

      if (filters.startDate) {
        where.AND.push({
          endDate: {
            gte: new Date(filters.startDate),
          },
        });
      }

      if (filters.endDate) {
        where.AND.push({
          startDate: {
            lte: new Date(filters.endDate),
          },
        });
      }
    }

    // Filtrer par utilisateur (événements où l'utilisateur est participant ou créateur)
    if (filters.userId) {
      where.OR = [
        { createdById: filters.userId },
        {
          participants: {
            some: {
              userId: filters.userId,
            },
          },
        },
      ];
    }

    // Récupération des événements
    const [events, total] = await Promise.all([
      prisma.agendaEvent.findMany({
        where,
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
          _count: {
            select: {
              participants: true,
            },
          },
        },
        orderBy: {
          startDate: "asc",
        },
        skip,
        take: limit,
      }),
      prisma.agendaEvent.count({ where }),
    ]);

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Paramètres invalides", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/agenda/events
 * Crée un nouvel événement
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const data = createEventSchema.parse(body);

    // Validation des dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: "La date de fin doit être après la date de début" },
        { status: 400 }
      );
    }

    // Validation de la récurrence
    if (data.isRecurring && !data.recurrenceRule) {
      return NextResponse.json(
        {
          error:
            "La règle de récurrence est requise pour un événement récurrent",
        },
        { status: 400 }
      );
    }

    // Création de l'événement
    const event = await prisma.agendaEvent.create({
      data: {
        title: data.title,
        description: data.description,
        startDate,
        endDate,
        allDay: data.allDay,
        type: data.type,
        status: data.status,
        location: data.location,
        color: data.color,
        isRecurring: data.isRecurring,
        recurrenceRule: data.recurrenceRule,
        createdById: session.user.id,
        tenantId: session.user.tenantId,
        // Ajouter les participants si fournis
        ...(data.participantIds && data.participantIds.length > 0
          ? {
              participants: {
                create: data.participantIds.map((userId) => ({
                  userId,
                  status: "PENDING",
                })),
              },
            }
          : {}),
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

    // TODO: Créer les notifications pour les participants
    // TODO: Si récurrent, créer les occurrences futures

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'événement:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
