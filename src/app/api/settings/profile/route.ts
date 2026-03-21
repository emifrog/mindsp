import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import * as bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

// GET /api/settings/profile - Récupérer le profil
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        badge: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
      select: { theme: true, language: true },
    });

    return NextResponse.json({ user, settings });
  } catch (error) {
    console.error("Erreur GET /api/settings/profile:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/settings/profile - Modifier le profil
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();

    // Changement de mot de passe
    if (body.currentPassword && body.newPassword) {
      const data = changePasswordSchema.parse(body);

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true },
      });

      if (!user) {
        return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
      }

      const isValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
      }

      const newHash = await bcrypt.hash(data.newPassword, 12);
      await prisma.user.update({
        where: { id: session.user.id },
        data: { passwordHash: newHash },
      });

      return NextResponse.json({ success: true, message: "Mot de passe modifié" });
    }

    // Mise à jour du profil
    const data = updateProfileSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        badge: true,
        role: true,
      },
    });

    // Mise à jour des settings (thème, langue)
    if (body.theme || body.language) {
      await prisma.userSettings.upsert({
        where: { userId: session.user.id },
        update: {
          ...(body.theme && { theme: body.theme }),
          ...(body.language && { language: body.language }),
        },
        create: {
          userId: session.user.id,
          ...(body.theme && { theme: body.theme }),
          ...(body.language && { language: body.language }),
        },
      });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur PATCH /api/settings/profile:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
