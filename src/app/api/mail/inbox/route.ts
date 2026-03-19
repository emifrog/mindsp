import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { CacheService, CACHE_TTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

// GET /api/mail/inbox - Boîte de réception
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const cacheKey = `mail:inbox:${session.user.tenantId}:${session.user.id}:${page}:${limit}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const where: Prisma.MailRecipientWhereInput = {
      userId: session.user.id,
      folder: "INBOX",
      deletedAt: null,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const [recipients, total, unreadCount] = await Promise.all([
      prisma.mailRecipient.findMany({
        where,
        include: {
          message: {
            include: {
              from: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  attachments: true,
                  recipients: true,
                },
              },
            },
          },
        },
        orderBy: {
          message: {
            createdAt: "desc",
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.mailRecipient.count({ where }),
      prisma.mailRecipient.count({
        where: {
          userId: session.user.id,
          folder: "INBOX",
          deletedAt: null,
          isRead: false,
        },
      }),
    ]);

    // Transformer pour retourner les messages
    const messages = recipients.map((r) => ({
      ...r.message,
      recipientInfo: {
        isRead: r.isRead,
        readAt: r.readAt,
        isStarred: r.isStarred,
        recipientId: r.id,
      },
    }));

    const response = {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    };
    await CacheService.set(cacheKey, response, { ttl: CACHE_TTL.LIST_SHORT });
    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur GET /api/mail/inbox:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la boîte de réception" },
      { status: 500 }
    );
  }
}
