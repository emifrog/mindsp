import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// GET /api/mail/messages/[id] - Détails d'un message
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const messageId = params.id;

    const message = await prisma.mailMessage.findUnique({
      where: { id: messageId },
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
        recipients: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
                email: true,
              },
            },
          },
        },
        attachments: true,
        labels: true,
        _count: {
          select: {
            recipients: true,
            attachments: true,
          },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est expéditeur ou destinataire
    const isRecipient = message.recipients.some(
      (r) => r.userId === session.user.id
    );
    const isSender = message.fromId === session.user.id;

    if (!isRecipient && !isSender) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Marquer comme lu si destinataire
    if (isRecipient) {
      const recipient = message.recipients.find(
        (r) => r.userId === session.user.id
      );
      if (recipient && !recipient.isRead) {
        await prisma.mailRecipient.update({
          where: { id: recipient.id },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Erreur GET /api/mail/messages/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du message" },
      { status: 500 }
    );
  }
}

// DELETE /api/mail/messages/[id] - Supprimer un message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const messageId = params.id;

    const message = await prisma.mailMessage.findUnique({
      where: { id: messageId },
      include: {
        recipients: true,
      },
    });

    if (!message) {
      return NextResponse.json(
        { error: "Message non trouvé" },
        { status: 404 }
      );
    }

    // Si brouillon, seul l'expéditeur peut supprimer
    if (message.isDraft) {
      if (message.fromId !== session.user.id) {
        return NextResponse.json(
          { error: "Accès non autorisé" },
          { status: 403 }
        );
      }

      await prisma.mailMessage.delete({
        where: { id: messageId },
      });

      return NextResponse.json({ success: true });
    }

    // Sinon, marquer comme supprimé pour le destinataire
    const recipient = message.recipients.find(
      (r) => r.userId === session.user.id
    );

    if (!recipient) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    await prisma.mailRecipient.update({
      where: { id: recipient.id },
      data: {
        deletedAt: new Date(),
        folder: "TRASH",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/mail/messages/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du message" },
      { status: 500 }
    );
  }
}
