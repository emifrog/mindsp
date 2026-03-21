import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { generateCSV } from "@/lib/export/csv-generator";
import { generateSEPA } from "@/lib/export/sepa-generator";
export const dynamic = "force-dynamic";

// POST /api/tta/export - Créer un export
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions (admin uniquement)
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { month, year, format } = body;

    // Validation
    if (!month || !year || !format) {
      return NextResponse.json(
        { error: "Champs requis manquants" },
        { status: 400 }
      );
    }

    // Récupérer les entrées validées pour le mois
    const entries = await prisma.tTAEntry.findMany({
      where: {
        tenantId: session.user.tenantId,
        month: parseInt(month),
        year: parseInt(year),
        status: "VALIDATED",
        exported: false,
      },
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
      orderBy: [{ user: { lastName: "asc" } }, { date: "asc" }],
    });

    if (entries.length === 0) {
      return NextResponse.json(
        { error: "Aucune entrée à exporter" },
        { status: 400 }
      );
    }

    // Calculer les stats
    const totalAmount = entries.reduce((sum, e) => sum + e.totalAmount, 0);
    const uniqueUsers = new Set(entries.map((e) => e.userId)).size;

    let fileContent: string;
    let fileName: string;
    let mimeType: string;

    // Générer le fichier selon le format
    if (format === "CSV") {
      fileContent = generateCSV(entries);
      fileName = `TTA_${year}_${month.toString().padStart(2, "0")}.csv`;
      mimeType = "text/csv";
    } else if (format === "SEPA_XML") {
      fileContent = generateSEPA(entries, {
        month,
        year,
        tenantId: session.user.tenantId,
      });
      fileName = `TTA_SEPA_${year}_${month.toString().padStart(2, "0")}.xml`;
      mimeType = "application/xml";
    } else {
      return NextResponse.json(
        { error: "Format non supporté" },
        { status: 400 }
      );
    }

    // Créer l'export dans la DB
    const exportRecord = await prisma.tTAExport.create({
      data: {
        tenantId: session.user.tenantId,
        month: parseInt(month),
        year: parseInt(year),
        format,
        fileUrl: `/exports/tta/${fileName}`, // À adapter selon votre stockage
        fileName,
        totalEntries: entries.length,
        totalAmount,
        totalUsers: uniqueUsers,
        createdBy: session.user.id,
      },
    });

    // Logger l'audit de l'export
    const { logExport } = await import("@/lib/audit");
    await logExport(session.user.id, session.user.tenantId, `TTA_${format}`, {
      month,
      year,
      entriesCount: entries.length,
      totalAmount,
    });

    // Marquer les entrées comme exportées
    await prisma.tTAEntry.updateMany({
      where: {
        id: {
          in: entries.map((e) => e.id),
        },
      },
      data: {
        exported: true,
        exportedAt: new Date(),
        exportId: exportRecord.id,
        status: "EXPORTED",
      },
    });

    // Retourner le fichier
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Erreur POST /api/tta/export:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export" },
      { status: 500 }
    );
  }
}

// GET /api/tta/export - Liste des exports
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier les permissions
    if (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Permissions insuffisantes" },
        { status: 403 }
      );
    }

    const exports = await prisma.tTAExport.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ exports });
  } catch (error) {
    console.error("Erreur GET /api/tta/export:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des exports" },
      { status: 500 }
    );
  }
}
