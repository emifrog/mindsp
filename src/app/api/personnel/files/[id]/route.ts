import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const updateFileSchema = z.object({
  engagementDate: z.string().optional(),
  reengagementDate: z.string().optional(),
  currentGrade: z.string().optional(),
  gradeDate: z.string().optional(),
});

// GET /api/personnel/files/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const file = await prisma.personnelFile.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            badge: true,
            avatar: true,
            role: true,
            phone: true,
          },
        },
        medicalStatus: true,
        qualifications: {
          orderBy: { validUntil: "asc" },
        },
        equipments: {
          orderBy: { assignedDate: "desc" },
        },
        gradeHistory: {
          orderBy: { effectiveDate: "desc" },
        },
        medals: {
          orderBy: { awardDate: "desc" },
        },
        documents: {
          orderBy: { createdAt: "desc" },
          include: {
            uploader: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "Fiche non trouvée" }, { status: 404 });
    }

    // Vérifier les permissions
    const isOwn = file.userId === session.user.id;
    const isAdmin =
      session.user.role === "ADMIN" || session.user.role === "MANAGER";

    if (!isOwn && !isAdmin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    return NextResponse.json({ file });
  } catch (error) {
    console.error("Erreur GET /api/personnel/files/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH /api/personnel/files/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const data = updateFileSchema.parse(body);

    const updateData: Prisma.PersonnelFileUpdateInput = {};
    if (data.engagementDate)
      updateData.engagementDate = new Date(data.engagementDate);
    if (data.reengagementDate)
      updateData.reengagementDate = new Date(data.reengagementDate);
    if (data.currentGrade) updateData.currentGrade = data.currentGrade;
    if (data.gradeDate) updateData.gradeDate = new Date(data.gradeDate);

    const file = await prisma.personnelFile.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            badge: true,
          },
        },
      },
    });

    return NextResponse.json({ file });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur PATCH /api/personnel/files/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/personnel/files/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Récupérer les données avant suppression pour l'audit
    const personnelFile = await prisma.personnelFile.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        medicalStatus: true,
        qualifications: true,
        equipments: true,
      },
    });

    if (!personnelFile) {
      return NextResponse.json(
        { error: "Fiche personnel introuvable" },
        { status: 404 }
      );
    }

    // Logger l'audit
    const { logDeletion, AuditEntity } = await import("@/lib/audit");
    await logDeletion(
      session.user.id,
      session.user.tenantId,
      AuditEntity.PERSONNEL,
      params.id,
      personnelFile
    );

    // Supprimer la fiche
    await prisma.personnelFile.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur DELETE /api/personnel/files/[id]:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
