import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";
import { z } from "zod";
import {

  registerLimiter,
  getIdentifier,
  checkRateLimit,
  rateLimitResponse,
} from "@/lib/rate-limit";

const registerSchema = z.object({
  tenantSlug: z.string().min(1, "Organisation requise"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
});

export async function POST(request: NextRequest) {
  try {
    // Vérifier le rate limiting (3 inscriptions par heure par IP)
    const identifier = getIdentifier(request);
    const { success, remaining, reset } = await checkRateLimit(
      registerLimiter,
      identifier
    );

    if (!success) {
      return rateLimitResponse(remaining, reset);
    }

    const body = await request.json();

    // Valider les données
    const validatedData = registerSchema.parse(body);

    // Vérifier que le tenant existe
    const tenant = await prisma.tenant.findUnique({
      where: { slug: validatedData.tenantSlug },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Organisation introuvable" },
        { status: 404 }
      );
    }

    // Vérifier que l'email n'est pas déjà utilisé
    const existingUser = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: validatedData.email,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: "USER",
        status: "ACTIVE",
        permissions: ["fmpa.view", "formations.view"],
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    return NextResponse.json(
      {
        message: "Inscription réussie",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    );
  }
}
