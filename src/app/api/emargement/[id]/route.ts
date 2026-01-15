import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";

// POST /api/emargement/[id] - Émarger à une FMPA
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
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "Code QR manquant" }, { status: 400 });
    }

    // Vérifier que la FMPA existe et que le code est correct
    const fmpa = await prisma.fMPA.findFirst({
      where: {
        id: params.id,
        qrCode: code,
        tenantId: session.user.tenantId,
      },
    });

    if (!fmpa) {
      return NextResponse.json(
        { error: "FMPA introuvable ou code invalide" },
        { status: 404 }
      );
    }

    // Vérifier que la FMPA est en cours ou publiée
    if (fmpa.status !== "PUBLISHED" && fmpa.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Cette FMPA n'est pas encore ouverte à l'émargement" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est inscrit
    const participation = await prisma.participation.findFirst({
      where: {
        fmpaId: params.id,
        userId: session.user.id,
      },
    });

    if (!participation) {
      return NextResponse.json(
        { error: "Vous n'êtes pas inscrit à cette FMPA" },
        { status: 403 }
      );
    }

    // Vérifier si déjà émargé
    if (participation.status === "PRESENT") {
      return NextResponse.json(
        { error: "Vous avez déjà émargé pour cette FMPA" },
        { status: 400 }
      );
    }

    // Marquer la présence
    await prisma.participation.update({
      where: { id: participation.id },
      data: {
        status: "PRESENT",
        checkInTime: new Date(),
      },
    });

    return NextResponse.json({
      message: "Émargement réussi",
      fmpa: {
        id: fmpa.id,
        title: fmpa.title,
        type: fmpa.type,
        location: fmpa.location,
        startDate: fmpa.startDate,
      },
    });
  } catch (error) {
    console.error("Erreur POST /api/emargement/[id]:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'émargement" },
      { status: 500 }
    );
  }
}
