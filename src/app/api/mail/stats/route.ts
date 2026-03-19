import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/mail/stats - Statistiques mailbox
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const [inbox, unread, sent, drafts, archived, starred] = await Promise.all([
      // Inbox
      prisma.mailRecipient.count({
        where: {
          userId: session.user.id,
          folder: "INBOX",
          deletedAt: null,
        },
      }),
      // Unread
      prisma.mailRecipient.count({
        where: {
          userId: session.user.id,
          folder: "INBOX",
          deletedAt: null,
          isRead: false,
        },
      }),
      // Sent
      prisma.mailMessage.count({
        where: {
          fromId: session.user.id,
          isDraft: false,
        },
      }),
      // Drafts
      prisma.mailMessage.count({
        where: {
          fromId: session.user.id,
          isDraft: true,
        },
      }),
      // Archived
      prisma.mailRecipient.count({
        where: {
          userId: session.user.id,
          folder: "ARCHIVE",
          deletedAt: null,
        },
      }),
      // Starred
      prisma.mailRecipient.count({
        where: {
          userId: session.user.id,
          isStarred: true,
          deletedAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      inbox,
      unread,
      sent,
      drafts,
      archived,
      starred,
    });
  } catch (error) {
    console.error("Erreur GET /api/mail/stats:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
