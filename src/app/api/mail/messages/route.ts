import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { NotificationService } from "@/lib/notification-service";
export const dynamic = "force-dynamic";

// POST /api/mail/messages - Envoyer un nouveau message
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const {
      subject,
      bodyContent,
      body: bodyText, // Support pour "body" aussi
      to,
      cc,
      bcc,
      isDraft,
      isImportant,
      attachments,
    } = body;

    // Support des deux formats : bodyContent ou body
    const messageBody = bodyContent || bodyText;

    // Validation
    if (!subject || !messageBody) {
      return NextResponse.json(
        { error: "Sujet et contenu requis" },
        { status: 400 }
      );
    }

    // Convertir les emails en IDs si nécessaire
    const convertEmailsToIds = async (
      emails: string | string[] | undefined
    ) => {
      if (!emails) return [];

      const emailArray =
        typeof emails === "string"
          ? emails
              .split(",")
              .map((e) => e.trim())
              .filter((e) => e)
          : emails;

      if (emailArray.length === 0) return [];

      const users = await prisma.user.findMany({
        where: {
          email: { in: emailArray },
          tenantId: session.user.tenantId,
        },
        select: { id: true },
      });

      return users.map((u) => u.id);
    };

    const toIds = await convertEmailsToIds(to);
    const ccIds = await convertEmailsToIds(cc);
    const bccIds = await convertEmailsToIds(bcc);

    if (!isDraft && toIds.length === 0) {
      return NextResponse.json(
        { error: "Au moins un destinataire valide requis" },
        { status: 400 }
      );
    }

    // Créer le message
    const message = await prisma.mailMessage.create({
      data: {
        subject,
        body: messageBody,
        fromId: session.user.id,
        tenantId: session.user.tenantId,
        isDraft: isDraft || false,
        isImportant: isImportant || false,
        recipients: {
          create: [
            // Destinataires TO
            ...toIds.map((userId: string) => ({
              userId,
              type: "TO" as const,
              folder: "INBOX" as const,
            })),
            // Destinataires CC
            ...ccIds.map((userId: string) => ({
              userId,
              type: "CC" as const,
              folder: "INBOX" as const,
            })),
            // Destinataires BCC
            ...bccIds.map((userId: string) => ({
              userId,
              type: "BCC" as const,
              folder: "INBOX" as const,
            })),
          ],
        },
        attachments: attachments
          ? {
              create: attachments,
            }
          : undefined,
      },
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
        _count: {
          select: {
            recipients: true,
            attachments: true,
          },
        },
      },
    });

    // Envoyer notifications aux destinataires (sauf si brouillon)
    if (!isDraft && message.recipients.length > 0) {
      const recipientIds = message.recipients.map((r) => r.userId);

      await NotificationService.notifyMailReceived(
        session.user.tenantId,
        message.id,
        session.user.id,
        `${message.from.firstName} ${message.from.lastName}`,
        subject,
        recipientIds,
        isImportant || false
      );
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/mail/messages:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 }
    );
  }
}
