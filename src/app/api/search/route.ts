import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { CacheService, CACHE_TTL } from "@/lib/cache";

// GET /api/search - Recherche globale avancée
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const type = searchParams.get("type"); // chat, mail, fmpa, formation, document, all
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!query || query.length < 2) {
      return NextResponse.json({
        results: {
          chat: [],
          mail: [],
          fmpa: [],
          formations: [],
          documents: [],
        },
        total: 0,
      });
    }

    // Vérifier le cache
    const cacheKey = `search:${session.user.tenantId}:${query}:${type || "all"}:${dateFrom || ""}:${dateTo || ""}:${limit}`;
    const cached = await CacheService.get<{ results: Record<string, unknown[]>; total: number; query: string }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    interface SearchResult {
      id: string;
      type: string;
      title: string;
      content: string;
      author: string;
      date: Date;
      url: string;
    }

    const results: Record<string, SearchResult[]> = {
      chat: [],
      mail: [],
      fmpa: [],
      formations: [],
      documents: [],
      personnel: [],
    };

    // Recherche dans Chat
    if (!type || type === "all" || type === "chat") {
      try {
        const chatMessages = await prisma.chatMessage.findMany({
          where: {
            channel: {
              tenantId: session.user.tenantId,
            },
            content: {
              contains: query,
              mode: "insensitive",
            },
            ...(dateFrom && dateTo
              ? {
                  createdAt: {
                    gte: new Date(dateFrom),
                    lte: new Date(dateTo),
                  },
                }
              : dateFrom
                ? { createdAt: { gte: new Date(dateFrom) } }
                : dateTo
                  ? { createdAt: { lte: new Date(dateTo) } }
                  : {}),
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
            channel: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        });

        results.chat = chatMessages.map((msg) => ({
          id: msg.id,
          type: "chat",
          title: `#${msg.channel.name}`,
          content: msg.content,
          author: `${msg.user.firstName} ${msg.user.lastName}`,
          date: msg.createdAt,
          url: `/chat?channel=${msg.channelId}`,
        }));
      } catch (error) {
        console.error("Erreur recherche Chat:", error);
        results.chat = [];
      }
    }

    // Recherche dans Mailbox
    if (!type || type === "all" || type === "mail") {
      try {
        const mailMessages = await prisma.mailMessage.findMany({
          where: {
            tenantId: session.user.tenantId,
            OR: [
              { subject: { contains: query, mode: "insensitive" } },
              { body: { contains: query, mode: "insensitive" } },
            ],
            ...(dateFrom && dateTo
              ? {
                  createdAt: {
                    gte: new Date(dateFrom),
                    lte: new Date(dateTo),
                  },
                }
              : dateFrom
                ? { createdAt: { gte: new Date(dateFrom) } }
                : dateTo
                  ? { createdAt: { lte: new Date(dateTo) } }
                  : {}),
          },
          include: {
            from: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        });

        results.mail = mailMessages.map((mail) => ({
          id: mail.id,
          type: "mail",
          title: mail.subject,
          content: mail.body.substring(0, 200),
          author: `${mail.from.firstName} ${mail.from.lastName}`,
          date: mail.createdAt,
          url: `/mailbox?message=${mail.id}`,
        }));
      } catch (error) {
        console.error("Erreur recherche Mail:", error);
        results.mail = [];
      }
    }

    // Recherche dans FMPA
    if (!type || type === "all" || type === "fmpa") {
      try {
        const fmpas = await prisma.fMPA.findMany({
          where: {
            tenantId: session.user.tenantId,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
              { location: { contains: query, mode: "insensitive" } },
            ],
            ...(dateFrom && dateTo
              ? {
                  startDate: {
                    gte: new Date(dateFrom),
                    lte: new Date(dateTo),
                  },
                }
              : dateFrom
                ? { startDate: { gte: new Date(dateFrom) } }
                : dateTo
                  ? { startDate: { lte: new Date(dateTo) } }
                  : {}),
          },
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { startDate: "desc" },
          take: limit,
        });

        results.fmpa = fmpas.map((fmpa) => ({
          id: fmpa.id,
          type: "fmpa",
          title: fmpa.title,
          content: fmpa.description || "",
          author: `${fmpa.createdBy.firstName} ${fmpa.createdBy.lastName}`,
          date: fmpa.startDate,
          url: `/fmpa/${fmpa.id}`,
        }));
      } catch (error) {
        console.error("Erreur recherche FMPA:", error);
        results.fmpa = [];
      }
    }

    // Recherche dans Formations
    if (!type || type === "all" || type === "formation") {
      try {
        const formations = await prisma.formation.findMany({
          where: {
            tenantId: session.user.tenantId,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
            ...(dateFrom && dateTo
              ? {
                  startDate: {
                    gte: new Date(dateFrom),
                    lte: new Date(dateTo),
                  },
                }
              : dateFrom
                ? { startDate: { gte: new Date(dateFrom) } }
                : dateTo
                  ? { startDate: { lte: new Date(dateTo) } }
                  : {}),
          },
          orderBy: { startDate: "desc" },
          take: limit,
        });

        results.formations = formations.map((formation) => ({
          id: formation.id,
          type: "formation",
          title: formation.title,
          content: formation.description || "",
          author: "Formation",
          date: formation.startDate,
          url: `/formations/${formation.id}`,
        }));
      } catch (error) {
        console.error("Erreur recherche Formations:", error);
        results.formations = [];
      }
    }

    // Recherche dans Documents (si le modèle existe)
    if (!type || type === "all" || type === "document") {
      try {
        const documents = await prisma.portalDocument.findMany({
          where: {
            tenantId: session.user.tenantId,
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
            ...(dateFrom && dateTo
              ? {
                  createdAt: {
                    gte: new Date(dateFrom),
                    lte: new Date(dateTo),
                  },
                }
              : dateFrom
                ? { createdAt: { gte: new Date(dateFrom) } }
                : dateTo
                  ? { createdAt: { lte: new Date(dateTo) } }
                  : {}),
          },
          include: {
            uploadedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: limit,
        });

        results.documents = documents.map((doc) => ({
          id: doc.id,
          type: "document",
          title: doc.name,
          content: doc.description || "",
          author: "Document",
          date: doc.createdAt,
          url: `/documents/${doc.id}`,
        }));
      } catch (error) {
        // Si le modèle n'existe pas encore
        results.documents = [];
      }
    }

    // Recherche dans Personnel
    if (!type || type === "all" || type === "personnel") {
      try {
        const users = await prisma.user.findMany({
          where: {
            tenantId: session.user.tenantId,
            OR: [
              { firstName: { contains: query, mode: "insensitive" } },
              { lastName: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
            createdAt: true,
          },
          orderBy: { lastName: "asc" },
          take: limit,
        });

        results.personnel = users.map((user) => ({
          id: user.id,
          type: "personnel",
          title: `${user.firstName} ${user.lastName}`,
          content: user.email,
          author: user.role,
          date: user.createdAt,
          url: `/personnel/${user.id}`,
        }));
      } catch (error) {
        console.error("Erreur recherche Personnel:", error);
        results.personnel = [];
      }
    }

    const total =
      results.chat.length +
      results.mail.length +
      results.fmpa.length +
      results.formations.length +
      results.documents.length +
      results.personnel.length;

    const response = { results, total, query };

    // Mettre en cache (5 minutes)
    await CacheService.set(cacheKey, response, { ttl: CACHE_TTL.LIST_SHORT });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur recherche:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
}
