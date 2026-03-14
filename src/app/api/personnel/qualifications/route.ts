import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const createQualificationSchema = z.object({
  personnelFileId: z.string(),
  name: z.string(),
  type: z.enum(["FORMATION", "SPECIALITE", "PERMIS", "HABILITATION", "AUTRE"]),
  level: z.string().optional(),
  obtainedDate: z.string(),
  validUntil: z.string().optional(),
  renewable: z.boolean().default(true),
  organization: z.string().optional(),
  certificateNumber: z.string().optional(),
  documentUrl: z.string().optional(),
});

// GET /api/personnel/qualifications
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const personnelFileId = searchParams.get("personnelFileId");
    const status = searchParams.get("status");

    const where: Prisma.QualificationWhereInput = {};
    if (personnelFileId) where.personnelFileId = personnelFileId;
    if (status) where.status = status as any;

    const qualifications = await prisma.qualification.findMany({
      where,
      include: {
        personnelFile: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                badge: true,
              },
            },
          },
        },
      },
      orderBy: { validUntil: "asc" },
    });

    return NextResponse.json({ qualifications });
  } catch (error) {
    console.error("Erreur GET /api/personnel/qualifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/personnel/qualifications
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const data = createQualificationSchema.parse(body);

    const qualification = await prisma.qualification.create({
      data: {
        personnelFileId: data.personnelFileId,
        name: data.name,
        type: data.type,
        level: data.level,
        obtainedDate: new Date(data.obtainedDate),
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        renewable: data.renewable,
        organization: data.organization,
        certificateNumber: data.certificateNumber,
        documentUrl: data.documentUrl,
      },
      include: {
        personnelFile: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ qualification }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur POST /api/personnel/qualifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
