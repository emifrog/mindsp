import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const mealRegistrationSchema = z.object({
  menuChoice: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
});

// POST /api/fmpa/[id]/meal - S'inscrire au repas
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const data = mealRegistrationSchema.parse(body);

    // Vérifier que la FMPA existe et propose des repas
    const fmpa = await prisma.fMPA.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!fmpa) {
      return NextResponse.json({ error: "FMPA introuvable" }, { status: 404 });
    }

    if (!fmpa.mealAvailable) {
      return NextResponse.json(
        { error: "Aucun repas n'est proposé pour cette FMPA" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est inscrit à la FMPA
    const participation = await prisma.participation.findFirst({
      where: {
        fmpaId: params.id,
        userId: session.user.id,
      },
    });

    if (!participation) {
      return NextResponse.json(
        { error: "Vous devez d'abord vous inscrire à la FMPA" },
        { status: 400 }
      );
    }

    // Vérifier si déjà inscrit au repas
    const existingMeal = await prisma.fMPAMealRegistration.findUnique({
      where: {
        participationId: participation.id,
      },
    });

    if (existingMeal) {
      return NextResponse.json(
        { error: "Vous êtes déjà inscrit au repas" },
        { status: 400 }
      );
    }

    // Créer l'inscription repas
    const mealRegistration = await prisma.fMPAMealRegistration.create({
      data: {
        participationId: participation.id,
        menuChoice: data.menuChoice,
        dietaryRestrictions: data.dietaryRestrictions,
        confirmed: false,
      },
    });

    return NextResponse.json(mealRegistration, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/fmpa/[id]/meal:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de l'inscription au repas" },
      { status: 500 }
    );
  }
}

// PUT /api/fmpa/[id]/meal - Modifier son inscription repas
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const data = mealRegistrationSchema.parse(body);

    // Trouver la participation
    const participation = await prisma.participation.findFirst({
      where: {
        fmpaId: params.id,
        userId: session.user.id,
      },
      include: {
        mealRegistration: true,
      },
    });

    if (!participation) {
      return NextResponse.json(
        { error: "Vous n'êtes pas inscrit à cette FMPA" },
        { status: 404 }
      );
    }

    if (!participation.mealRegistration) {
      return NextResponse.json(
        { error: "Vous n'êtes pas inscrit au repas" },
        { status: 404 }
      );
    }

    // Mettre à jour l'inscription repas
    const mealRegistration = await prisma.fMPAMealRegistration.update({
      where: {
        id: participation.mealRegistration.id,
      },
      data: {
        menuChoice: data.menuChoice,
        dietaryRestrictions: data.dietaryRestrictions,
      },
    });

    return NextResponse.json(mealRegistration);
  } catch (error) {
    console.error("Erreur PUT /api/fmpa/[id]/meal:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la modification" },
      { status: 500 }
    );
  }
}

// DELETE /api/fmpa/[id]/meal - Annuler son inscription repas
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Trouver la participation
    const participation = await prisma.participation.findFirst({
      where: {
        fmpaId: params.id,
        userId: session.user.id,
      },
      include: {
        mealRegistration: true,
      },
    });

    if (!participation) {
      return NextResponse.json(
        { error: "Vous n'êtes pas inscrit à cette FMPA" },
        { status: 404 }
      );
    }

    if (!participation.mealRegistration) {
      return NextResponse.json(
        { error: "Vous n'êtes pas inscrit au repas" },
        { status: 404 }
      );
    }

    // Supprimer l'inscription repas
    await prisma.fMPAMealRegistration.delete({
      where: {
        id: participation.mealRegistration.id,
      },
    });

    return NextResponse.json({ message: "Inscription repas annulée" });
  } catch (error) {
    console.error("Erreur DELETE /api/fmpa/[id]/meal:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation" },
      { status: 500 }
    );
  }
}
