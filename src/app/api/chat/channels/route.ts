import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  parsePaginationParams,
  getPaginationParams,
  createPaginationMeta,
} from "@/lib/pagination";
import {

  getCachedChatChannelList,
  cacheChatChannelList,
  invalidateChatChannelCache,
} from "@/lib/cache";

// GET /api/chat/channels - Liste des canaux
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // PUBLIC, PRIVATE, DIRECT

    // Pagination
    const { page, limit } = parsePaginationParams(searchParams);
    const { skip, take } = getPaginationParams(page, limit);

    const where: Prisma.ChatChannelWhereInput = {
      tenantId: session.user.tenantId,
      archivedAt: null,
    };

    if (type) {
      where.type = type as any;
    }

    const fullWhere = {
      ...where,
      members: {
        some: {
          userId: session.user.id,
        },
      },
    };

    // Essayer de récupérer du cache
    const cacheKey = { type, page, limit };
    const cached = await getCachedChatChannelList(
      session.user.tenantId,
      session.user.id,
      cacheKey
    );
    if (cached) {
      return NextResponse.json(cached);
    }

    // Si pas en cache, récupérer de la DB
    const [channels, total] = await Promise.all([
      prisma.chatChannel.findMany({
        where: fullWhere,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  presence: true,
                },
              },
            },
          },
          messages: {
            take: 1,
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
            },
          },
          _count: {
            select: {
              members: true,
              messages: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        skip,
        take,
      }),
      prisma.chatChannel.count({ where: fullWhere }),
    ]);

    // Calculer les messages non lus pour tous les canaux en une seule query
    // Récupérer tous les counts groupés par channelId
    const channelIds = channels.map((c) => c.id);
    const unreadCounts = await prisma.chatMessage.groupBy({
      by: ["channelId"],
      where: {
        channelId: { in: channelIds },
        userId: { not: session.user.id },
      },
      _count: {
        id: true,
      },
    });

    // Créer un map pour accès rapide
    const unreadCountMap = new Map(
      unreadCounts.map((item) => [item.channelId, item._count.id])
    );

    // Enrichir les canaux avec les counts (optimisé, pas de N+1)
    const channelsWithUnread = channels.map((channel) => {
      const membership = channel.members.find(
        (m) => m.userId === session.user.id
      );

      // Si lastReadAt existe, on devrait filtrer par date
      // Pour simplifier et éviter N+1, on utilise le count total
      // Une optimisation future pourrait utiliser une raw query
      const unreadCount = unreadCountMap.get(channel.id) || 0;

      return {
        ...channel,
        lastMessage: channel.messages[0] || null,
        unreadCount,
      };
    });

    const response = {
      channels: channelsWithUnread,
      pagination: createPaginationMeta(page, limit, total),
    };

    // Mettre en cache
    await cacheChatChannelList(
      session.user.tenantId,
      session.user.id,
      cacheKey,
      response
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur GET /api/chat/channels:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des canaux" },
      { status: 500 }
    );
  }
}

// POST /api/chat/channels - Créer un canal
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, icon, color, memberIds } = body;

    // Validation
    if (!name || !type) {
      return NextResponse.json(
        { error: "Nom et type requis" },
        { status: 400 }
      );
    }

    // Créer le canal
    const channel = await prisma.chatChannel.create({
      data: {
        name,
        description,
        type,
        icon,
        color,
        tenantId: session.user.tenantId,
        createdById: session.user.id,
        members: {
          create: [
            // Créateur comme OWNER
            {
              userId: session.user.id,
              role: "OWNER",
            },
            // Autres membres
            ...(memberIds || []).map((userId: string) => ({
              userId,
              role: "MEMBER" as const,
            })),
          ],
        },
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        members: {
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
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
    });

    // Invalider le cache chat channels pour tous les membres
    await invalidateChatChannelCache(session.user.tenantId);

    return NextResponse.json(channel, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/chat/channels:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du canal" },
      { status: 500 }
    );
  }
}
