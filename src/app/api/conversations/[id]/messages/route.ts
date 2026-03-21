import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import {
  createMessageSchema,
  formatZodErrors,
  paginationSchema,
} from "@/lib/validation-schemas";
import { sanitizeString } from "@/lib/sanitize";
export const dynamic = "force-dynamic";

// GET /api/conversations/[id]/messages - Liste des messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Validation pagination
    const paginationValidation = paginationSchema.safeParse({
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
    });

    const { page, limit } = paginationValidation.success
      ? paginationValidation.data
      : { page: 1, limit: 50 };

    // Vérifier que l'utilisateur est membre de la conversation
    const member = await prisma.conversationMember.findFirst({
      where: {
        conversationId: params.id,
        userId: session.user.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          conversationId: params.id,
          deletedAt: null,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatar: true,
            },
          },
          reads: {
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
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({
        where: {
          conversationId: params.id,
          deletedAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      messages: messages.reverse(), // Inverser pour avoir les plus anciens en premier
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/conversations/[id]/messages:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages" },
      { status: 500 }
    );
  }
}

// POST /api/conversations/[id]/messages - Envoyer un message (fallback HTTP)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est membre
    const member = await prisma.conversationMember.findFirst({
      where: {
        conversationId: params.id,
        userId: session.user.id,
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();

    // Validation avec Zod
    const validation = createMessageSchema.safeParse({
      conversationId: params.id,
      content: body.content,
      type: body.type,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Données invalides",
          details: formatZodErrors(validation.error),
        },
        { status: 400 }
      );
    }

    const { content, type } = validation.data;

    // Sanitiser le contenu
    const sanitizedContent = sanitizeString(content);

    const message = await prisma.message.create({
      data: {
        conversationId: params.id,
        senderId: session.user.id,
        tenantId: session.user.tenantId,
        content: sanitizedContent,
        type,
        status: "SENT",
      },
      include: {
        sender: {
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

    // Mettre à jour lastMessageAt
    await prisma.conversation.update({
      where: { id: params.id },
      data: { lastMessageAt: new Date() },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/conversations/[id]/messages:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
