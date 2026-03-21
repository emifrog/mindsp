import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

// POST /api/formations/registrations/[id]/certificate - Générer une attestation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions (admin ou manager)
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPER_ADMIN" &&
      session.user.role !== "MANAGER"
    ) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { attended, passed, score } = body;

    // Récupérer l'inscription
    const registration = await prisma.formationRegistration.findUnique({
      where: { id: params.id },
    });

    if (!registration || registration.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: "Inscription introuvable" },
        { status: 404 }
      );
    }

    // Récupérer les données complètes
    const [user, formation, tenant] = await Promise.all([
      prisma.user.findUnique({
        where: { id: registration.userId },
        select: { firstName: true, lastName: true },
      }),
      prisma.formation.findUnique({
        where: { id: registration.formationId },
        include: {
          instructor: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      prisma.tenant.findUnique({
        where: { id: registration.tenantId },
        select: { name: true },
      }),
    ]);

    if (!user || !formation || !tenant) {
      return NextResponse.json(
        { error: "Données introuvables" },
        { status: 404 }
      );
    }

    // Vérifier que la formation est terminée
    if (formation.endDate > new Date()) {
      return NextResponse.json(
        { error: "La formation n'est pas encore terminée" },
        { status: 400 }
      );
    }

    // Mettre à jour l'inscription avec les résultats
    const updatedRegistration = await prisma.formationRegistration.update({
      where: { id: params.id },
      data: {
        attended: attended !== undefined ? attended : true,
        passed: passed !== undefined ? passed : true,
        score: score !== undefined ? score : null,
        status: "COMPLETED",
      },
    });

    // Retourner les données pour générer le certificat côté client
    return NextResponse.json({
      success: true,
      certificateData: {
        participantName: `${user.firstName} ${user.lastName}`,
        formationTitle: formation.title,
        formationCode: formation.code,
        startDate: formation.startDate,
        endDate: formation.endDate,
        duration: formation.duration || 0,
        instructorName: formation.instructor
          ? `${formation.instructor.firstName} ${formation.instructor.lastName}`
          : undefined,
        tenantName: tenant.name,
        score: updatedRegistration.score || undefined,
        validityYears: formation.validityYears || undefined,
      },
    });
  } catch (error) {
    console.error(
      "Erreur POST /api/formations/registrations/[id]/certificate:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'attestation" },
      { status: 500 }
    );
  }
}

// GET /api/formations/registrations/[id]/certificate - Télécharger une attestation existante
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const registration = await prisma.formationRegistration.findUnique({
      where: { id: params.id },
    });

    if (!registration || registration.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: "Inscription introuvable" },
        { status: 404 }
      );
    }

    // Récupérer les données complètes
    const [user, formation, tenant] = await Promise.all([
      prisma.user.findUnique({
        where: { id: registration.userId },
        select: { id: true, firstName: true, lastName: true },
      }),
      prisma.formation.findUnique({
        where: { id: registration.formationId },
        include: {
          instructor: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      prisma.tenant.findUnique({
        where: { id: registration.tenantId },
        select: { name: true },
      }),
    ]);

    if (!user || !formation || !tenant) {
      return NextResponse.json(
        { error: "Données introuvables" },
        { status: 404 }
      );
    }

    // Vérifier les permissions (l'utilisateur lui-même ou admin)
    if (
      user.id !== session.user.id &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUPER_ADMIN" &&
      session.user.role !== "MANAGER"
    ) {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    // Vérifier que l'attestation existe (formation complétée)
    if (registration.status !== "COMPLETED" || !registration.passed) {
      return NextResponse.json(
        { error: "Attestation non disponible" },
        { status: 404 }
      );
    }

    // Retourner les données pour régénérer le certificat
    return NextResponse.json({
      certificateData: {
        participantName: `${user.firstName} ${user.lastName}`,
        formationTitle: formation.title,
        formationCode: formation.code,
        startDate: formation.startDate,
        endDate: formation.endDate,
        duration: formation.duration || 0,
        instructorName: formation.instructor
          ? `${formation.instructor.firstName} ${formation.instructor.lastName}`
          : undefined,
        tenantName: tenant.name,
        score: registration.score || undefined,
        validityYears: formation.validityYears || undefined,
      },
    });
  } catch (error) {
    console.error(
      "Erreur GET /api/formations/registrations/[id]/certificate:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'attestation" },
      { status: 500 }
    );
  }
}
