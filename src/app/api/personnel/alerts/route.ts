import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { addDays, isBefore, isAfter } from "date-fns";

export const dynamic = "force-dynamic";

// GET /api/personnel/alerts - Récupérer les alertes d'expiration
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const now = new Date();
    const in30Days = addDays(now, 30);
    const in15Days = addDays(now, 15);
    const in7Days = addDays(now, 7);

    // Aptitudes médicales expirantes
    const medicalAlerts = await prisma.medicalStatus.findMany({
      where: {
        personnelFile: {
          tenantId: session.user.tenantId,
        },
        OR: [
          { validUntil: { lte: in30Days, gte: now } },
          { nextCheckup: { lte: in30Days, gte: now } },
        ],
      },
      include: {
        personnelFile: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                badge: true,
              },
            },
          },
        },
      },
    });

    // Qualifications expirantes
    const qualificationAlerts = await prisma.qualification.findMany({
      where: {
        personnelFile: {
          tenantId: session.user.tenantId,
        },
        validUntil: {
          lte: in30Days,
          gte: now,
        },
        renewable: true,
      },
      include: {
        personnelFile: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                badge: true,
              },
            },
          },
        },
      },
    });

    // Équipements à contrôler
    const equipmentAlerts = await prisma.equipment.findMany({
      where: {
        personnelFile: {
          tenantId: session.user.tenantId,
        },
        nextCheck: {
          lte: in30Days,
          gte: now,
        },
        status: "ASSIGNED",
      },
      include: {
        personnelFile: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                badge: true,
              },
            },
          },
        },
      },
    });

    // Classifier par urgence
    const classifyUrgency = (date: Date) => {
      if (isBefore(date, in7Days)) return "URGENT";
      if (isBefore(date, in15Days)) return "HIGH";
      return "MEDIUM";
    };

    const alerts = {
      medical: medicalAlerts.map((m) => ({
        id: m.id,
        type: "MEDICAL",
        user: m.personnelFile.user,
        description: `Aptitude médicale expire le ${m.validUntil.toLocaleDateString()}`,
        expiryDate: m.validUntil,
        urgency: classifyUrgency(m.validUntil),
        status: m.status,
      })),
      qualifications: qualificationAlerts.map((q) => ({
        id: q.id,
        type: "QUALIFICATION",
        user: q.personnelFile.user,
        description: `${q.name} expire le ${q.validUntil?.toLocaleDateString()}`,
        expiryDate: q.validUntil,
        urgency: classifyUrgency(q.validUntil!),
        qualificationType: q.type,
      })),
      equipment: equipmentAlerts.map((e) => ({
        id: e.id,
        type: "EQUIPMENT",
        user: e.personnelFile.user,
        description: `${e.name} à contrôler le ${e.nextCheck?.toLocaleDateString()}`,
        expiryDate: e.nextCheck,
        urgency: classifyUrgency(e.nextCheck!),
        equipmentType: e.type,
      })),
    };

    const totalAlerts =
      alerts.medical.length +
      alerts.qualifications.length +
      alerts.equipment.length;

    return NextResponse.json({
      alerts,
      summary: {
        total: totalAlerts,
        medical: alerts.medical.length,
        qualifications: alerts.qualifications.length,
        equipment: alerts.equipment.length,
        urgent: [
          ...alerts.medical,
          ...alerts.qualifications,
          ...alerts.equipment,
        ].filter((a) => a.urgency === "URGENT").length,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/personnel/alerts:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
