import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import {
  generateAttendanceSheet,
  exportParticipantsToExcel,
  generateManeuverReport,
} from "@/lib/fmpa-exports";
import * as XLSX from "xlsx";

// GET /api/fmpa/[id]/export?type=attendance|participants|report
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const exportType = searchParams.get("type") || "participants";

    // Logger l'audit de l'export
    const { logExport } = await import("@/lib/audit");
    await logExport(
      session.user.id,
      session.user.tenantId,
      `FMPA_${exportType.toUpperCase()}`,
      { fmpaId: params.id, exportType }
    );

    switch (exportType) {
      case "attendance":
        // Feuille d'émargement (données JSON pour générer PDF côté client)
        const attendanceData = await generateAttendanceSheet(params.id);
        return NextResponse.json(attendanceData);

      case "participants":
        // Liste participants Excel
        const workbook = await exportParticipantsToExcel(params.id);
        const excelBuffer = XLSX.write(workbook, {
          type: "buffer",
          bookType: "xlsx",
        });

        return new NextResponse(excelBuffer, {
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="participants-${params.id}.xlsx"`,
          },
        });

      case "report":
        // Rapport de manœuvre
        const reportData = await generateManeuverReport(params.id);
        return NextResponse.json(reportData);

      default:
        return NextResponse.json(
          { error: "Type d'export invalide" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Erreur GET /api/fmpa/[id]/export:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de l'export" },
      { status: 500 }
    );
  }
}
