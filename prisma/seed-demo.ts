import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Trouver le tenant sdis06
  const tenant = await prisma.tenant.findUnique({
    where: { slug: "sdis06" },
  });

  if (!tenant) {
    console.error("❌ Tenant sdis06 introuvable. Créez-le d'abord.");
    process.exit(1);
  }

  const email = "demo@sdis06.fr";
  const password = "Demo2026!";
  const passwordHash = await bcrypt.hash(password, 10);

  // Upsert pour éviter les doublons
  const user = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email,
      },
    },
    update: {
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      firstName: "Compte",
      lastName: "Démo",
    },
    create: {
      tenantId: tenant.id,
      email,
      passwordHash,
      firstName: "Compte",
      lastName: "Démo",
      role: "ADMIN",
      status: "ACTIVE",
      permissions: [],
    },
  });

  console.log("✅ Compte démo créé :");
  console.log(`   Tenant:   sdis06 (${tenant.name})`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Rôle:     ADMIN`);
  console.log(`   ID:       ${user.id}`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
