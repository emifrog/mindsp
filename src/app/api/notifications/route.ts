import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { NotificationService } from "@/lib/notification-service";
import type { NotificationType } from "@/types/notification";
import { parsePaginationParams, getPaginationParams } from "@/lib/pagination";
import {
  getCachedNotificationList,
  cacheNotificationList,
  invalidateNotificationCache,
} from "@/lib/cache";

// GET /api/notifications - Liste des notifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const types = searchParams.get("types")?.split(",");

    // Pagination
    const { page, limit } = parsePaginationParams(searchParams);
    const { skip } = getPaginationParams(page, limit);

    // Essayer de récupérer du cache
    const cacheKey = { unreadOnly, types, page, limit };
    const cached = await getCachedNotificationList(session.user.id, cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Si pas en cache, récupérer via le service
    const result = await NotificationService.getUserNotifications(
      session.user.id,
      {
        unreadOnly,
        limit,
        offset: skip,
        types: types as NotificationType[] | undefined,
      }
    );

    // Mettre en cache
    await cacheNotificationList(session.user.id, cacheKey, result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur GET /api/notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications" },
      { status: 500 }
    );
  }
}

// POST /api/notifications/mark-all-read - Marquer toutes comme lues
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    await NotificationService.markAllAsRead(session.user.id);

    // Invalider le cache notifications
    await invalidateNotificationCache(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur POST /api/notifications:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des notifications" },
      { status: 500 }
    );
  }
}
