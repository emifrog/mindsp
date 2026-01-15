import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { seedFMPA } from "./fmpa-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Début du seeding...");

  // Nettoyer la base de données
  console.log("🧹 Nettoyage de la base de données...");
  await prisma.participation.deleteMany();
  await prisma.fMPA.deleteMany();
  await prisma.messageRead.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.formationRegistration.deleteMany();
  await prisma.formation.deleteMany();
  await prisma.eventParticipation.deleteMany();
  await prisma.event.deleteMany();
  await prisma.document.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // Créer les tenants
  console.log("🏢 Création des tenants...");
  const tenant1 = await prisma.tenant.create({
    data: {
      slug: "sdis13",
      name: "SDIS des Bouches-du-Rhône",
      domain: "sdis13.mindsp.fr",
      status: "ACTIVE",
      primaryColor: "#1e40af",
      config: {
        features: {
          fmpa: true,
          messaging: true,
          formations: true,
          agenda: true,
        },
      },
    },
  });

  const tenant2 = await prisma.tenant.create({
    data: {
      slug: "sdis06",
      name: "SDIS des Alpes-Maritimes",
      domain: "sdis06.mindsp.fr",
      status: "ACTIVE",
      primaryColor: "#059669",
      config: {
        features: {
          fmpa: true,
          messaging: true,
          formations: true,
          agenda: true,
        },
      },
    },
  });

  console.log(`✅ Tenants créés: ${tenant1.name}, ${tenant2.name}`);

  // Hash du mot de passe par défaut
  const passwordHash = await bcrypt.hash("Password123!", 10);

  // Créer les utilisateurs pour SDIS13
  console.log("👥 Création des utilisateurs SDIS13...");
  const admin1 = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      email: "admin@sdis13.fr",
      passwordHash,
      firstName: "Jean",
      lastName: "Dupont",
      role: "ADMIN",
      status: "ACTIVE",
      badge: "ADM-001",
      permissions: ["all"],
    },
  });

  const manager1 = await prisma.user.create({
    data: {
      tenantId: tenant1.id,
      email: "manager@sdis13.fr",
      passwordHash,
      firstName: "Marie",
      lastName: "Martin",
      role: "MANAGER",
      status: "ACTIVE",
      badge: "MGR-001",
      permissions: ["fmpa.manage", "formations.manage"],
    },
  });

  const users1 = await Promise.all([
    prisma.user.create({
      data: {
        tenantId: tenant1.id,
        email: "pierre.bernard@sdis13.fr",
        passwordHash,
        firstName: "Pierre",
        lastName: "Bernard",
        role: "USER",
        status: "ACTIVE",
        badge: "SPV-001",
        permissions: ["fmpa.view", "formations.view"],
      },
    }),
    prisma.user.create({
      data: {
        tenantId: tenant1.id,
        email: "sophie.dubois@sdis13.fr",
        passwordHash,
        firstName: "Sophie",
        lastName: "Dubois",
        role: "USER",
        status: "ACTIVE",
        badge: "SPV-002",
        permissions: ["fmpa.view", "formations.view"],
      },
    }),
    prisma.user.create({
      data: {
        tenantId: tenant1.id,
        email: "luc.petit@sdis13.fr",
        passwordHash,
        firstName: "Luc",
        lastName: "Petit",
        role: "USER",
        status: "ACTIVE",
        badge: "SPV-003",
        permissions: ["fmpa.view"],
      },
    }),
  ]);

  // Créer les utilisateurs pour SDIS06
  console.log("👥 Création des utilisateurs SDIS06...");
  const admin2 = await prisma.user.create({
    data: {
      tenantId: tenant2.id,
      email: "admin@sdis06.fr",
      passwordHash,
      firstName: "Paul",
      lastName: "Moreau",
      role: "ADMIN",
      status: "ACTIVE",
      badge: "ADM-001",
      permissions: ["all"],
    },
  });

  const users2 = await Promise.all([
    prisma.user.create({
      data: {
        tenantId: tenant2.id,
        email: "claire.laurent@sdis06.fr",
        passwordHash,
        firstName: "Claire",
        lastName: "Laurent",
        role: "USER",
        status: "ACTIVE",
        badge: "SPV-001",
        permissions: ["fmpa.view", "formations.view"],
      },
    }),
    prisma.user.create({
      data: {
        tenantId: tenant2.id,
        email: "thomas.simon@sdis06.fr",
        passwordHash,
        firstName: "Thomas",
        lastName: "Simon",
        role: "USER",
        status: "ACTIVE",
        badge: "SPV-002",
        permissions: ["fmpa.view"],
      },
    }),
  ]);

  console.log(`✅ ${5 + 3} utilisateurs créés`);

  // Créer des FMPA réalistes avec le fichier de seed dédié
  const fmpas = await seedFMPA(prisma, tenant1.id, admin1.id);

  // Créer des participations pour quelques FMPA
  console.log("✍️ Création des participations...");
  const participations = [];

  // Ajouter des participations aux 5 premières FMPA
  for (let i = 0; i < Math.min(5, fmpas.length); i++) {
    const fmpa = fmpas[i];

    // 2-3 participants par FMPA
    const numParticipants = Math.floor(Math.random() * 2) + 2;
    for (let j = 0; j < numParticipants; j++) {
      const user = users1[j % users1.length];
      const statuses = ["REGISTERED", "CONFIRMED", "CONFIRMED"] as const;
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      participations.push(
        prisma.participation.create({
          data: {
            fmpaId: fmpa.id,
            userId: user.id,
            status,
            confirmedAt: status === "CONFIRMED" ? new Date() : null,
          },
        })
      );
    }
  }

  await Promise.all(participations);
  console.log(`✅ ${participations.length} participations créées`);

  // Créer des formations
  console.log("🎓 Création des formations...");
  const now = new Date();
  await prisma.formation.create({
    data: {
      tenantId: tenant1.id,
      code: "FOR-2025-001",
      title: "Formation Chef d'Agrès",
      description: "Formation pour devenir chef d'agrès tout engin",
      startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      location: "ENSOSP Aix-en-Provence",
      maxParticipants: 12,
      minParticipants: 6,
      price: 0,
      instructorId: admin1.id,
      status: "OPEN",
      createdById: admin1.id,
    },
  });

  console.log(`✅ Formations créées`);

  console.log("\n🎉 Seeding terminé avec succès !");
  console.log("\n📊 Résumé:");
  console.log(`   - 2 tenants (SDIS13, SDIS06)`);
  console.log(`   - 8 utilisateurs (2 admins, 1 manager, 5 users)`);
  console.log(
    `   - ${fmpas.length} FMPA (15 formations, 10 manœuvres, 5 présences actives)`
  );
  console.log(`   - ${participations.length} participations`);
  console.log(`   - 1 formation`);
  console.log("\n🔐 Identifiants de connexion:");
  console.log(`   SDIS13 Admin: admin@sdis13.fr / Password123!`);
  console.log(`   SDIS06 Admin: admin@sdis06.fr / Password123!`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur lors du seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
