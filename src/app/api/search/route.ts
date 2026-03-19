import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { CacheService, CACHE_TTL } from "@/lib/cache";

export const dynamic = "force-dynamic";

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

    // Construire le filtre de dates réutilisable
    const dateFilter = (field: string) =>
      dateFrom && dateTo
        ? { [field]: { gte: new Date(dateFrom), lte: new Date(dateTo) } }
        : dateFrom
          ? { [field]: { gte: new Date(dateFrom) } }
          : dateTo
            ? { [field]: { lte: new Date(dateTo) } }
            : {};

    const shouldSearch = (t: string) => !type || type === "all" || type === t;

    // Lancer toutes les recherches en parallèle
    const [chatResults, mailResults, fmpaResults, formationResults, documentResults, personnelResults] = await Promise.all([
      // Chat
      shouldSearch("chat")
        ? prisma.chatMessage.findMany({
            where: {
              channel: { tenantId: session.user.tenantId },
              content: { contains: query, mode: "insensitive" },
              ...dateFilter("createdAt"),
            },
            include: {
              user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
              channel: { select: { id: true, name: true, type: true } },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
          }).catch(() => [])
        : Promise.resolve([]),

      // Mail
      shouldSearch("mail")
        ? prisma.mailMessage.findMany({
            where: {
              tenantId: session.user.tenantId,
              OR: [
                { subject: { contains: query, mode: "insensitive" } },
                { body: { contains: query, mode: "insensitive" } },
              ],
              ...dateFilter("createdAt"),
            },
            include: {
              from: { select: { id: true, firstName: true, lastName: true, avatar: true } },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
          }).catch(() => [])
        : Promise.resolve([]),

      // FMPA
      shouldSearch("fmpa")
        ? prisma.fMPA.findMany({
            where: {
              tenantId: session.user.tenantId,
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
                { location: { contains: query, mode: "insensitive" } },
              ],
              ...dateFilter("startDate"),
            },
            include: {
              createdBy: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { startDate: "desc" },
            take: limit,
          }).catch(() => [])
        : Promise.resolve([]),

      // Formations
      shouldSearch("formation")
        ? prisma.formation.findMany({
            where: {
              tenantId: session.user.tenantId,
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
              ...dateFilter("startDate"),
            },
            orderBy: { startDate: "desc" },
            take: limit,
          }).catch(() => [])
        : Promise.resolve([]),

      // Documents
      shouldSearch("document")
        ? prisma.portalDocument.findMany({
            where: {
              tenantId: session.user.tenantId,
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
              ...dateFilter("createdAt"),
            },
            include: {
              uploadedBy: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
          }).catch(() => [])
        : Promise.resolve([]),

      // Personnel
      shouldSearch("personnel")
        ? prisma.user.findMany({
            where: {
              tenantId: session.user.tenantId,
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            },
            select: { id: true, firstName: true, lastName: true, email: true, avatar: true, role: true, createdAt: true },
            orderBy: { lastName: "asc" },
            take: limit,
          }).catch(() => [])
        : Promise.resolve([]),
    ]);

    // Transformer les résultats
    const results: Record<string, SearchResult[]> = {
      chat: (chatResults as any[]).map((msg) => ({
        id: msg.id, type: "chat", title: `#${msg.channel.name}`,
        content: msg.content, author: `${msg.user.firstName} ${msg.user.lastName}`,
        date: msg.createdAt, url: `/chat?channel=${msg.channelId}`,
      })),
      mail: (mailResults as any[]).map((mail) => ({
        id: mail.id, type: "mail", title: mail.subject,
        content: mail.body.substring(0, 200), author: `${mail.from.firstName} ${mail.from.lastName}`,
        date: mail.createdAt, url: `/mailbox?message=${mail.id}`,
      })),
      fmpa: (fmpaResults as any[]).map((fmpa) => ({
        id: fmpa.id, type: "fmpa", title: fmpa.title,
        content: fmpa.description || "", author: `${fmpa.createdBy.firstName} ${fmpa.createdBy.lastName}`,
        date: fmpa.startDate, url: `/fmpa/${fmpa.id}`,
      })),
      formations: (formationResults as any[]).map((f) => ({
        id: f.id, type: "formation", title: f.title,
        content: f.description || "", author: "Formation",
        date: f.startDate, url: `/formations/${f.id}`,
      })),
      documents: (documentResults as any[]).map((doc) => ({
        id: doc.id, type: "document", title: doc.name,
        content: doc.description || "", author: "Document",
        date: doc.createdAt, url: `/documents/${doc.id}`,
      })),
      personnel: (personnelResults as any[]).map((user) => ({
        id: user.id, type: "personnel", title: `${user.firstName} ${user.lastName}`,
        content: user.email, author: user.role,
        date: user.createdAt, url: `/personnel/${user.id}`,
      })),
    };

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
