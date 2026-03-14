import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const toggleFavoriteSchema = z.object({
  userId: z.string(),
});

// POST /api/messaging/favorites - Ajouter/Retirer un favori
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const data = toggleFavoriteSchema.parse(body);

    // Vérifier que l'utilisateur existe et est du même tenant
    const targetUser = await prisma.user.findFirst({
      where: {
        id: data.userId,
        tenantId: session.user.tenantId,
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si déjà en favori
    const existing = await prisma.userFavorite.findUnique({
      where: {
        userId_favoriteId: {
          userId: session.user.id,
          favoriteId: data.userId,
        },
      },
    });

    if (existing) {
      // Retirer des favoris
      await prisma.userFavorite.delete({
        where: {
          id: existing.id,
        },
      });

      return NextResponse.json({ isFavorite: false });
    } else {
      // Ajouter aux favoris
      await prisma.userFavorite.create({
        data: {
          userId: session.user.id,
          favoriteId: data.userId,
        },
      });

      return NextResponse.json({ isFavorite: true });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur POST /api/messaging/favorites:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
