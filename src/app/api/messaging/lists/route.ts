import { NextRequest, NextResponse } from "next/server";
import getServerSession from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Schéma de validation pour création de liste
const createListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(["STATIC", "DYNAMIC"]).default("STATIC"),
  criteria: z.record(z.any()).optional(), // Pour listes dynamiques
  isPublic: z.boolean().default(false),
  memberIds: z.array(z.string()).optional(), // Pour listes statiques
});

// GET /api/messaging/lists - Liste toutes les listes de diffusion
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const onlyPublic = searchParams.get("public") === "true";
    const onlyMine = searchParams.get("mine") === "true";

    const where: Prisma.MailingListWhereInput = {
      tenantId: session.user.tenantId,
    };

    if (type) {
      where.type = type;
    }

    if (onlyPublic) {
      where.isPublic = true;
    }

    if (onlyMine) {
      where.createdById = session.user.id;
    } else if (!onlyPublic) {
      // Si pas "public only", montrer les listes publiques + celles créées par l'utilisateur
      where.OR = [{ isPublic: true }, { createdById: session.user.id }];
    }

    const lists = await prisma.mailingList.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ lists });
  } catch (error) {
    console.error("Erreur GET /api/messaging/lists:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/messaging/lists - Créer une liste de diffusion
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const data = createListSchema.parse(body);

    // Créer la liste
    const list = await prisma.mailingList.create({
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        criteria: data.criteria,
        isPublic: data.isPublic,
        tenantId: session.user.tenantId,
        createdById: session.user.id,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Si liste statique avec membres initiaux
    if (data.type === "STATIC" && data.memberIds && data.memberIds.length > 0) {
      await prisma.mailingListMember.createMany({
        data: data.memberIds.map((userId) => ({
          listId: list.id,
          userId,
          addedById: session.user.id,
        })),
      });
    }

    // Récupérer la liste avec le compte de membres
    const listWithCount = await prisma.mailingList.findUnique({
      where: { id: list.id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return NextResponse.json(listWithCount, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur POST /api/messaging/lists:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
