import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth-config";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET /api/portal-documents - Liste des documents
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const where: Prisma.PortalDocumentWhereInput = {
      tenantId: session.user.tenantId,
    };

    if (category) {
      where.category = category as any;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search } },
      ];
    }

    // Filtrer par permissions
    if (!["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      where.OR = [
        { isPublic: true },
        { allowedRoles: { has: session.user.role } },
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.portalDocument.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.portalDocument.count({ where }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/portal-documents:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des documents" },
      { status: 500 }
    );
  }
}

// POST /api/portal-documents - Upload un document
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    if (!["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      fileName,
      fileUrl,
      fileSize,
      mimeType,
      category,
      tags,
      description,
      isPublic,
      requiresAuth,
      allowedRoles,
    } = body;

    if (!name || !fileName || !fileUrl || !fileSize || !mimeType || !category) {
      return NextResponse.json(
        { error: "Informations du fichier incomplètes" },
        { status: 400 }
      );
    }

    const document = await prisma.portalDocument.create({
      data: {
        tenantId: session.user.tenantId,
        uploadedById: session.user.id,
        name,
        fileName,
        fileUrl,
        fileSize,
        mimeType,
        category,
        tags: tags || [],
        description,
        isPublic: isPublic ?? false,
        requiresAuth: requiresAuth ?? true,
        allowedRoles: allowedRoles || [],
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/portal-documents:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'upload du document" },
      { status: 500 }
    );
  }
}
