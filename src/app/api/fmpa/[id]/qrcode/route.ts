import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { generateFMPAQRCode } from "@/lib/qrcode";

// GET /api/fmpa/[id]/qrcode - Générer le QR code d'une FMPA
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que la FMPA existe
    const fmpa = await prisma.fMPA.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!fmpa) {
      return NextResponse.json({ error: "FMPA introuvable" }, { status: 404 });
    }

    // Générer le QR code
    const qrCodeDataURL = await generateFMPAQRCode(fmpa.id, fmpa.qrCode || fmpa.id);

    return NextResponse.json({
      qrCode: qrCodeDataURL,
      fmpaId: fmpa.id,
      code: fmpa.qrCode,
    });
  } catch (error) {
    console.error("Erreur GET /api/fmpa/[id]/qrcode:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du QR code" },
      { status: 500 }
    );
  }
}
