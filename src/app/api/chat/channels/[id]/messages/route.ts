import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/chat/channels/[id]/messages - Messages d'un canal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const channelId = params.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const before = searchParams.get("before"); // Cursor pour pagination

    // Vérifier que l'utilisateur est membre du canal
    const membership = await prisma.chatChannelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Vous n'êtes pas membre de ce canal" },
        { status: 403 }
      );
    }

    const where: Prisma.ChatMessageWhereInput = {
      channelId,
      deletedAt: null,
      parentId: null, // Seulement les messages principaux (pas les réponses)
    };

    if (before) {
      where.createdAt = {
        lt: new Date(before),
      };
    }

    const messages = await prisma.chatMessage.findMany({
      where,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        reactions: {
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
        attachments: true,
        mentions: {
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
        _count: {
          select: {
            replies: true,
          },
        },
      },
    });

    // Inverser pour avoir l'ordre chronologique
    const messagesOrdered = messages.reverse();

    // Mettre à jour lastReadAt
    await prisma.chatChannelMember.update({
      where: {
        channelId_userId: {
          channelId,
          userId: session.user.id,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json({
      messages: messagesOrdered,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error("Erreur GET /api/chat/channels/[id]/messages:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des messages" },
      { status: 500 }
    );
  }
}
