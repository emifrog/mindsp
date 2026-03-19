import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { exportTeamStatistics } from "@/lib/fmpa-exports";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

// GET /api/fmpa/team-stats?period=month|year&format=json|excel
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") || "month") as "month" | "year";
    const format = searchParams.get("format") || "json";

    if (format === "excel") {
      const workbook = await exportTeamStatistics(
        session.user.tenantId,
        period
      );
      const excelBuffer = XLSX.write(workbook, {
        type: "buffer",
        bookType: "xlsx",
      });

      return new NextResponse(excelBuffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="statistiques-equipe-${period}.xlsx"`,
        },
      });
    }

    // Format JSON (pour affichage dans l'interface)
    const workbook = await exportTeamStatistics(session.user.tenantId, period);
    const worksheet = workbook.Sheets["Statistiques Équipe"];
    const data = XLSX.utils.sheet_to_json(worksheet);

    return NextResponse.json({ data, period });
  } catch (error) {
    console.error("Erreur GET /api/fmpa/team-stats:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erreur lors de la récupération des statistiques",
      },
      { status: 500 }
    );
  }
}
