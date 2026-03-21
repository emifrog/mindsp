import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed complet demo sdis06...\n");

  // Trouver le tenant sdis06
  const tenant = await prisma.tenant.findUnique({ where: { slug: "sdis06" } });
  if (!tenant) {
    console.error("❌ Tenant sdis06 introuvable");
    process.exit(1);
  }
  const tenantId = tenant.id;

  // Nettoyer les donnees demo existantes (sauf les users)
  console.log("🧹 Nettoyage des donnees demo existantes...");
  await prisma.tTAEntry.deleteMany({ where: { tenantId } });
  await prisma.notification.deleteMany({ where: { tenantId } });
  await prisma.chatMessage.deleteMany({ where: { channel: { tenantId } } });
  await prisma.chatChannelMember.deleteMany({ where: { channel: { tenantId } } });
  await prisma.chatChannel.deleteMany({ where: { tenantId } });
  await prisma.messageRead.deleteMany({ where: { message: { tenantId } } });
  await prisma.message.deleteMany({ where: { tenantId } });
  await prisma.conversationMember.deleteMany({ where: { conversation: { tenantId } } });
  await prisma.conversation.deleteMany({ where: { tenantId } });
  await prisma.mailRecipient.deleteMany({ where: { message: { tenantId } } });
  await prisma.mailMessage.deleteMany({ where: { tenantId } });
  await prisma.newsArticle.deleteMany({ where: { tenantId } });
  await prisma.calendarEvent.deleteMany({ where: { tenantId } });
  await prisma.formationRegistration.deleteMany({ where: { tenantId } });
  await prisma.formation.deleteMany({ where: { tenantId } });
  await prisma.participation.deleteMany({ where: { fmpa: { tenantId } } });
  await prisma.fMPA.deleteMany({ where: { tenantId } });
  await prisma.equipment.deleteMany({ where: { personnelFile: { tenantId } } });
  await prisma.qualification.deleteMany({ where: { personnelFile: { tenantId } } });
  await prisma.medicalStatus.deleteMany({ where: { personnelFile: { tenantId } } });
  await prisma.personnelFile.deleteMany({ where: { tenantId } });
  await prisma.userSettings.deleteMany({ where: { user: { tenantId } } }).catch(() => {});
  console.log("   ✅ Nettoyage termine");

  // Trouver ou creer le compte demo
  const passwordHash = await bcrypt.hash("Demo2026!", 10);
  const defaultHash = await bcrypt.hash("Password123!", 10);

  const demoUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId, email: "demo@sdis06.fr" } },
    update: {},
    create: {
      tenantId,
      email: "demo@sdis06.fr",
      passwordHash,
      firstName: "Compte",
      lastName: "Demo",
      role: "ADMIN",
      status: "ACTIVE",
      badge: "ADM-DEMO",
      permissions: ["all"],
    },
  });

  // ═══════════════════════════════════════════
  // 1. UTILISATEURS (10 agents)
  // ═══════════════════════════════════════════
  console.log("👥 Creation des utilisateurs...");

  const usersData = [
    { email: "capitaine.martinez@sdis06.fr", firstName: "Lucas", lastName: "Martinez", role: "MANAGER" as const, badge: "CAP-001", phone: "06 12 34 56 78" },
    { email: "lieutenant.roux@sdis06.fr", firstName: "Emma", lastName: "Roux", role: "MANAGER" as const, badge: "LTN-001", phone: "06 23 45 67 89" },
    { email: "adjudant.garcia@sdis06.fr", firstName: "Hugo", lastName: "Garcia", role: "USER" as const, badge: "ADJ-001", phone: "06 34 56 78 90" },
    { email: "sergent.leroy@sdis06.fr", firstName: "Lea", lastName: "Leroy", role: "USER" as const, badge: "SGT-001", phone: "06 45 67 89 01" },
    { email: "caporal.moreau@sdis06.fr", firstName: "Nathan", lastName: "Moreau", role: "USER" as const, badge: "CPL-001", phone: "06 56 78 90 12" },
    { email: "sapeur.dubois@sdis06.fr", firstName: "Chloe", lastName: "Dubois", role: "USER" as const, badge: "SPV-001", phone: "06 67 89 01 23" },
    { email: "sapeur.bernard@sdis06.fr", firstName: "Louis", lastName: "Bernard", role: "USER" as const, badge: "SPV-002", phone: "06 78 90 12 34" },
    { email: "sapeur.petit@sdis06.fr", firstName: "Camille", lastName: "Petit", role: "USER" as const, badge: "SPV-003", phone: "06 89 01 23 45" },
    { email: "sapeur.robert@sdis06.fr", firstName: "Antoine", lastName: "Robert", role: "USER" as const, badge: "SPV-004", phone: "06 90 12 34 56" },
    { email: "sapeur.richard@sdis06.fr", firstName: "Julie", lastName: "Richard", role: "USER" as const, badge: "SPV-005", phone: "06 01 23 45 67" },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId, email: u.email } },
      update: {},
      create: {
        tenantId,
        email: u.email,
        passwordHash: defaultHash,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: "ACTIVE",
        badge: u.badge,
        phone: u.phone,
        permissions: [],
      },
    });
    users.push(user);
  }
  const allUsers = [demoUser, ...users];
  console.log(`   ✅ ${allUsers.length} utilisateurs`);

  // ═══════════════════════════════════════════
  // 2. FMPA (12 seances)
  // ═══════════════════════════════════════════
  console.log("🔥 Creation des FMPA...");

  const now = new Date();
  const day = 24 * 60 * 60 * 1000;
  const hour = 60 * 60 * 1000;

  const fmpasData = [
    { type: "MANOEUVRE" as const, title: "Manoeuvre incendie urbain", description: "Exercice d'attaque de feu en milieu urbain avec deploiement de lances", location: "Centre de secours Nice-Ouest", startDate: new Date(now.getTime() + 1 * day + 8 * hour), endDate: new Date(now.getTime() + 1 * day + 12 * hour), status: "PUBLISHED" as const },
    { type: "FORMATION" as const, title: "Formation ARI niveau 2", description: "Formation a l'utilisation des appareils respiratoires isolants en conditions degradees", location: "Plateau technique Antibes", startDate: new Date(now.getTime() + 3 * day + 9 * hour), endDate: new Date(now.getTime() + 3 * day + 17 * hour), status: "PUBLISHED" as const },
    { type: "EXERCICE" as const, title: "Exercice evacuation ERP", description: "Simulation d'evacuation d'un etablissement recevant du public", location: "Centre commercial Cap 3000", startDate: new Date(now.getTime() + 5 * day + 14 * hour), endDate: new Date(now.getTime() + 5 * day + 18 * hour), status: "PUBLISHED" as const },
    { type: "MANOEUVRE" as const, title: "Manoeuvre secours routier", description: "Desincarceration et prise en charge des victimes sur accident de la route", location: "Aire de manoeuvre Grasse", startDate: new Date(now.getTime() + 7 * day + 8 * hour), endDate: new Date(now.getTime() + 7 * day + 12 * hour), status: "PUBLISHED" as const },
    { type: "FORMATION" as const, title: "Formation risques chimiques", description: "Identification et intervention sur incident chimique - niveau operationnel", location: "Centre de secours Cannes", startDate: new Date(now.getTime() + 10 * day + 9 * hour), endDate: new Date(now.getTime() + 10 * day + 17 * hour), status: "DRAFT" as const },
    { type: "PRESENCE_ACTIVE" as const, title: "Presence active caserne Antibes", description: "Garde operationnelle de 24h", location: "Centre de secours Antibes", startDate: new Date(now.getTime() + 2 * day + 7 * hour), endDate: new Date(now.getTime() + 3 * day + 7 * hour), status: "PUBLISHED" as const },
    // FMPA passes (pour les stats)
    { type: "MANOEUVRE" as const, title: "Manoeuvre feux de forets", description: "Deploiement GIFF et attaque de feu de vegetation", location: "Massif de l'Esterel", startDate: new Date(now.getTime() - 5 * day + 8 * hour), endDate: new Date(now.getTime() - 5 * day + 16 * hour), status: "COMPLETED" as const },
    { type: "FORMATION" as const, title: "Formation secourisme PSE2", description: "Recyclage Premiers Secours en Equipe niveau 2", location: "Centre de secours Nice-Nord", startDate: new Date(now.getTime() - 10 * day + 9 * hour), endDate: new Date(now.getTime() - 10 * day + 17 * hour), status: "COMPLETED" as const },
    { type: "EXERCICE" as const, title: "Exercice NRBC", description: "Exercice de decontamination et prise en charge NRBC", location: "Plateau technique departamental", startDate: new Date(now.getTime() - 15 * day + 8 * hour), endDate: new Date(now.getTime() - 15 * day + 12 * hour), status: "COMPLETED" as const },
    { type: "MANOEUVRE" as const, title: "Manoeuvre sauvetage aquatique", description: "Exercice de sauvetage en mer et eaux interieures", location: "Plage de la Croisette", startDate: new Date(now.getTime() - 20 * day + 7 * hour), endDate: new Date(now.getTime() - 20 * day + 13 * hour), status: "COMPLETED" as const },
    { type: "FORMATION" as const, title: "Formation conduite engins", description: "Conduite defensive et techniques de pilotage d'urgence", location: "Circuit de Mougins", startDate: new Date(now.getTime() - 25 * day + 8 * hour), endDate: new Date(now.getTime() - 25 * day + 16 * hour), status: "COMPLETED" as const },
    { type: "CEREMONIE" as const, title: "Ceremonie Sainte-Barbe", description: "Celebration de la Sainte-Barbe, patronne des pompiers", location: "Prefecture des Alpes-Maritimes", startDate: new Date(now.getTime() - 30 * day + 10 * hour), endDate: new Date(now.getTime() - 30 * day + 13 * hour), status: "COMPLETED" as const },
  ];

  const fmpas = [];
  for (const f of fmpasData) {
    const fmpa = await prisma.fMPA.create({
      data: {
        tenantId,
        createdById: demoUser.id,
        type: f.type,
        title: f.title,
        description: f.description,
        location: f.location,
        startDate: f.startDate,
        endDate: f.endDate,
        status: f.status,
        maxParticipants: 15,
      },
    });
    fmpas.push(fmpa);
  }
  console.log(`   ✅ ${fmpas.length} FMPA`);

  // Participations
  console.log("   ✍️ Participations...");
  let participationCount = 0;
  for (const fmpa of fmpas) {
    const numParticipants = 4 + Math.floor(Math.random() * 6); // 4-9
    const shuffled = [...users].sort(() => Math.random() - 0.5);
    for (let j = 0; j < Math.min(numParticipants, shuffled.length); j++) {
      const isCompleted = fmpa.status === "COMPLETED";
      const statuses = isCompleted
        ? (["PRESENT", "PRESENT", "PRESENT", "ABSENT", "EXCUSED"] as const)
        : (["REGISTERED", "CONFIRMED", "CONFIRMED"] as const);
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      await prisma.participation.create({
        data: {
          fmpaId: fmpa.id,
          userId: shuffled[j].id,
          status,
          confirmedAt: status === "CONFIRMED" || status === "PRESENT" ? new Date() : null,
        },
      });
      participationCount++;
    }
  }
  console.log(`   ✅ ${participationCount} participations`);

  // ═══════════════════════════════════════════
  // 3. FORMATIONS (5)
  // ═══════════════════════════════════════════
  console.log("🎓 Creation des formations...");

  const formationsData = [
    { code: "FOR-2026-001", title: "Formation Chef d'Agres", category: "MANAGEMENT" as const, description: "Formation pour devenir chef d'agres tout engin. Module theorique et pratique.", duration: 80, startDate: new Date(now.getTime() + 14 * day), endDate: new Date(now.getTime() + 28 * day), location: "ENSOSP Aix-en-Provence", status: "OPEN" as const, maxParticipants: 12 },
    { code: "FOR-2026-002", title: "Recyclage PSE2", category: "SECOURS" as const, description: "Recyclage annuel Premiers Secours en Equipe niveau 2", duration: 8, startDate: new Date(now.getTime() + 7 * day), endDate: new Date(now.getTime() + 7 * day + 8 * hour), location: "Centre de secours Nice", status: "OPEN" as const, maxParticipants: 20 },
    { code: "FOR-2026-003", title: "Formation risques technologiques", category: "TECHNIQUE" as const, description: "Module RCH2 - Risques chimiques niveau 2", duration: 40, startDate: new Date(now.getTime() + 21 * day), endDate: new Date(now.getTime() + 25 * day), location: "Plateau technique SDIS06", status: "DRAFT" as const, maxParticipants: 15 },
    { code: "FOR-2026-004", title: "Preparation concours caporal", category: "REGLEMENTAIRE" as const, description: "Preparation aux epreuves ecrites et orales du concours de caporal", duration: 24, startDate: new Date(now.getTime() - 7 * day), endDate: new Date(now.getTime() - 4 * day), location: "SDIS06 - Salle de formation", status: "COMPLETED" as const, maxParticipants: 25 },
    { code: "FOR-2026-005", title: "Formation feux de forets", category: "INCENDIE" as const, description: "Formation GIFF - Groupe d'Intervention Feux de Forets", duration: 16, startDate: new Date(now.getTime() - 14 * day), endDate: new Date(now.getTime() - 12 * day), location: "Massif de l'Esterel", status: "COMPLETED" as const, maxParticipants: 18 },
  ];

  for (const f of formationsData) {
    const formation = await prisma.formation.upsert({
      where: { tenantId_code: { tenantId, code: f.code } },
      update: {},
      create: {
        tenantId,
        code: f.code,
        title: f.title,
        category: f.category,
        description: f.description,
        duration: f.duration,
        startDate: f.startDate,
        endDate: f.endDate,
        location: f.location,
        status: f.status,
        maxParticipants: f.maxParticipants,
        minParticipants: 4,
        price: 0,
        instructorId: users[0].id,
        createdById: demoUser.id,
      },
    });

    // Inscriptions
    const numRegistrations = 3 + Math.floor(Math.random() * 5);
    const shuffled = [...users].sort(() => Math.random() - 0.5);
    for (let j = 0; j < Math.min(numRegistrations, shuffled.length); j++) {
      await prisma.formationRegistration.create({
        data: {
          formationId: formation.id,
          userId: shuffled[j].id,
          tenantId,
          status: f.status === "COMPLETED" ? "COMPLETED" : "APPROVED",
        },
      });
    }
  }
  console.log(`   ✅ 5 formations + inscriptions`);

  // ═══════════════════════════════════════════
  // 4. FICHES PERSONNEL + QUALIFICATIONS
  // ═══════════════════════════════════════════
  console.log("📋 Creation des fiches personnel...");

  const grades = ["Sapeur", "Caporal", "Sergent", "Adjudant", "Lieutenant", "Capitaine"];
  const qualNames = ["PSE2", "ARI", "COD2", "RCH1", "SAL", "FDF1", "Permis PL", "SSIAP1"];

  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const gradeIndex = Math.min(i < 2 ? 5 - i : Math.floor(i / 2), grades.length - 1);
    const engagementYears = 3 + Math.floor(Math.random() * 15);

    const file = await prisma.personnelFile.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        tenantId,
        engagementDate: new Date(now.getTime() - engagementYears * 365 * day),
        currentGrade: grades[gradeIndex],
        gradeDate: new Date(now.getTime() - (1 + Math.floor(Math.random() * 3)) * 365 * day),
      },
    });

    // Aptitude medicale
    const validMonths = Math.floor(Math.random() * 12) - 2; // -2 a 10 mois
    await prisma.medicalStatus.upsert({
      where: { personnelFileId: file.id },
      update: {},
      create: {
        personnelFileId: file.id,
        status: validMonths < 0 ? "INAPT_TEMP" : "APT",
        validFrom: new Date(now.getTime() - 10 * 30 * day),
        validUntil: new Date(now.getTime() + validMonths * 30 * day),
        lastCheckup: new Date(now.getTime() - 10 * 30 * day),
        nextCheckup: new Date(now.getTime() + (validMonths - 1) * 30 * day),
        doctor: "Dr. Lambert",
        restrictions: validMonths < 0 ? "Aptitude expiree - Visite de renouvellement requise" : null,
      },
    });

    // 2-4 qualifications
    const numQuals = 2 + Math.floor(Math.random() * 3);
    const shuffledQuals = [...qualNames].sort(() => Math.random() - 0.5);
    for (let q = 0; q < numQuals; q++) {
      const validYears = Math.floor(Math.random() * 4) - 1; // -1 a 3 ans
      const types = ["FORMATION", "SPECIALITE", "PERMIS", "HABILITATION"] as const;
      await prisma.qualification.create({
        data: {
          personnelFileId: file.id,
          name: shuffledQuals[q],
          type: types[q % types.length],
          obtainedDate: new Date(now.getTime() - (3 + Math.floor(Math.random() * 5)) * 365 * day),
          validUntil: new Date(now.getTime() + validYears * 365 * day),
          renewable: true,
          organization: "SDIS 06",
          status: validYears < 0 ? "EXPIRED" : validYears < 1 ? "EXPIRING_SOON" : "VALID",
        },
      });
    }

    // 1-2 equipements
    const epiNames = ["Veste d'intervention", "Casque F2", "Bottes Haix", "Gants cuir", "Ceinturon", "ARI"];
    const numEquip = 1 + Math.floor(Math.random() * 2);
    for (let e = 0; e < numEquip; e++) {
      await prisma.equipment.create({
        data: {
          personnelFileId: file.id,
          name: epiNames[(i * 2 + e) % epiNames.length],
          type: "EPI",
          serialNumber: `EPI-${String(i * 10 + e).padStart(4, "0")}`,
          assignedDate: new Date(now.getTime() - Math.floor(Math.random() * 2) * 365 * day),
          status: "ASSIGNED",
          condition: "BON",
          nextCheck: new Date(now.getTime() + (Math.floor(Math.random() * 6) - 1) * 30 * day),
        },
      });
    }
  }
  console.log(`   ✅ 10 fiches personnel + medicales + qualifications + equipements`);

  // ═══════════════════════════════════════════
  // 5. CALENDRIER
  // ═══════════════════════════════════════════
  console.log("📅 Creation des evenements calendrier...");

  const calendarEvents = [
    { title: "Reunion chefs de centre", type: "MEETING" as const, startDate: new Date(now.getTime() + 2 * day + 14 * hour), endDate: new Date(now.getTime() + 2 * day + 16 * hour), location: "Etat-major SDIS06" },
    { title: "Garde 24h - Equipe A", type: "GARDE" as const, startDate: new Date(now.getTime() + 4 * day + 7 * hour), endDate: new Date(now.getTime() + 5 * day + 7 * hour), location: "Centre de secours Antibes", allDay: true },
    { title: "Commission de securite", type: "MEETING" as const, startDate: new Date(now.getTime() + 6 * day + 9 * hour), endDate: new Date(now.getTime() + 6 * day + 11 * hour), location: "Mairie de Cannes" },
    { title: "Visite prevention ERP", type: "INTERVENTION" as const, startDate: new Date(now.getTime() + 8 * day + 10 * hour), endDate: new Date(now.getTime() + 8 * day + 12 * hour), location: "Hotel Negresco Nice" },
  ];

  for (const e of calendarEvents) {
    await prisma.calendarEvent.create({
      data: {
        tenantId,
        title: e.title,
        type: e.type,
        startDate: e.startDate,
        endDate: e.endDate,
        location: e.location,
        allDay: e.allDay || false,
        createdBy: demoUser.id,
      },
    });
  }
  console.log(`   ✅ ${calendarEvents.length} evenements calendrier`);

  // ═══════════════════════════════════════════
  // 6. ACTUALITES
  // ═══════════════════════════════════════════
  console.log("📰 Creation des actualites...");

  const newsData = [
    { title: "Bilan operationnel du mois de mars", slug: "bilan-mars-2026", content: "Le SDIS 06 a realise 1 247 interventions au mois de mars 2026, dont 68% de secours a personnes, 12% d'incendies et 20% d'operations diverses. Le delai moyen d'intervention est de 8 minutes 30 secondes. 3 interventions notables ont ete realisees cette periode.", category: "INTERVENTION" as const, isPublished: true, isPinned: true },
    { title: "Nouvelle caserne de Valbonne inauguree", slug: "caserne-valbonne", content: "La nouvelle caserne de Valbonne-Sophia Antipolis a ete inauguree le 15 mars 2026 en presence du president du Conseil departemental. Ce centre de secours moderne dispose de 4 remises, d'un plateau technique et d'une salle de formation de 80 places.", category: "GENERAL" as const, isPublished: true, isPinned: false },
    { title: "Campagne prevention feux de forets 2026", slug: "prevention-fdf-2026", content: "La campagne de prevention des feux de forets demarre le 1er juin. Tous les agents affectes aux GIFF doivent avoir suivi le recyclage FDF avant cette date. Les plannings de formation sont disponibles dans le module Formations.", category: "PREVENTION" as const, isPublished: true, isPinned: false },
    { title: "Mise a jour du reglement operationnel", slug: "maj-reglement-2026", content: "Le nouveau reglement operationnel departemental entre en vigueur le 1er avril 2026. Les principales modifications concernent les procedures d'engagement sur feux de vegetation et les protocoles NRBC. Un document de synthese est disponible dans les documents.", category: "GENERAL" as const, isPublished: true, isPinned: false },
    { title: "Reception de 3 nouveaux VSAV", slug: "nouveaux-vsav", content: "Le SDIS 06 a receptionne 3 nouveaux Vehicules de Secours et d'Assistance aux Victimes qui seront affectes aux centres de Nice-Ouest, Cannes et Menton. Ces vehicules sont equipes du nouveau materiel de monitorage.", category: "MATERIEL" as const, isPublished: true, isPinned: false },
  ];

  for (const n of newsData) {
    await prisma.newsArticle.create({
      data: {
        tenantId,
        authorId: demoUser.id,
        title: n.title,
        slug: n.slug,
        content: n.content,
        category: n.category,
        isPublished: n.isPublished,
        isPinned: n.isPinned,
        publishedAt: new Date(now.getTime() - Math.floor(Math.random() * 15) * day),
        tags: [],
      },
    });
  }
  console.log(`   ✅ ${newsData.length} actualites`);

  // ═══════════════════════════════════════════
  // 7. CHAT (canaux)
  // ═══════════════════════════════════════════
  console.log("💬 Creation des canaux chat...");

  const channels = [
    { name: "general", description: "Canal general du SDIS 06", type: "PUBLIC" as const, icon: "📢" },
    { name: "operations", description: "Retours d'experience operationnels", type: "PUBLIC" as const, icon: "🚒" },
    { name: "formation", description: "Echanges sur les formations", type: "PUBLIC" as const, icon: "🎓" },
    { name: "chefs-de-centre", description: "Canal reserve aux chefs de centre", type: "PRIVATE" as const, icon: "⭐" },
  ];

  for (const ch of channels) {
    const channel = await prisma.chatChannel.create({
      data: {
        name: ch.name,
        description: ch.description,
        type: ch.type,
        icon: ch.icon,
        tenantId,
        createdById: demoUser.id,
      },
    });

    // Ajouter les membres
    const members = ch.type === "PRIVATE" ? [demoUser, users[0], users[1]] : allUsers;
    for (const member of members) {
      await prisma.chatChannelMember.create({
        data: { channelId: channel.id, userId: member.id, role: member.id === demoUser.id ? "ADMIN" : "MEMBER" },
      });
    }

    // Quelques messages
    const messages = [
      { content: "Bienvenue sur le canal " + ch.name + " !", userId: demoUser.id },
      { content: "Merci pour la creation de ce canal", userId: users[0].id },
      { content: "Parfait, ca va faciliter la communication", userId: users[1].id },
    ];
    for (const msg of messages) {
      await prisma.chatMessage.create({
        data: { channelId: channel.id, userId: msg.userId, content: msg.content },
      });
    }
  }
  console.log(`   ✅ ${channels.length} canaux + messages`);

  // ═══════════════════════════════════════════
  // 8. MESSAGERIE (conversations)
  // ═══════════════════════════════════════════
  console.log("✉️ Creation des conversations...");

  // Conversation directe
  const conv1 = await prisma.conversation.create({
    data: {
      tenantId,
      type: "DIRECT",
      lastMessageAt: new Date(),
      members: {
        create: [
          { userId: demoUser.id },
          { userId: users[0].id },
        ],
      },
    },
  });
  await prisma.message.create({ data: { conversationId: conv1.id, senderId: users[0].id, tenantId, content: "Bonjour, la manoeuvre de demain est maintenue ?", type: "TEXT", status: "SENT" } });
  await prisma.message.create({ data: { conversationId: conv1.id, senderId: demoUser.id, tenantId, content: "Oui c'est confirme. RDV a 8h au centre.", type: "TEXT", status: "SENT" } });

  // Conversation groupe
  const conv2 = await prisma.conversation.create({
    data: {
      tenantId,
      type: "GROUP",
      name: "Equipe intervention",
      lastMessageAt: new Date(),
      members: {
        create: [
          { userId: demoUser.id },
          { userId: users[0].id },
          { userId: users[2].id },
          { userId: users[3].id },
        ],
      },
    },
  });
  await prisma.message.create({ data: { conversationId: conv2.id, senderId: demoUser.id, tenantId, content: "Rappel: briefing operationnel vendredi 9h", type: "TEXT", status: "SENT" } });
  await prisma.message.create({ data: { conversationId: conv2.id, senderId: users[2].id, tenantId, content: "Bien recu, je serai present", type: "TEXT", status: "SENT" } });
  console.log(`   ✅ 2 conversations + messages`);

  // ═══════════════════════════════════════════
  // 9. MAILBOX
  // ═══════════════════════════════════════════
  console.log("📧 Creation des mails...");

  const mails = [
    { subject: "Convocation FMPA du 25 mars", body: "Vous etes convoque a la manoeuvre incendie urbain prevue le 25 mars au centre de secours Nice-Ouest. Tenue de feu obligatoire. Merci de confirmer votre presence.", fromId: demoUser.id, toIds: [users[0].id, users[2].id, users[3].id, users[5].id], isImportant: true },
    { subject: "Compte-rendu intervention autoroute A8", body: "Suite a l'intervention du 18 mars sur l'A8 (accident 3 VL), veuillez trouver ci-joint le compte-rendu. Points positifs: delai d'intervention 7 min. Points a ameliorer: coordination avec les forces de l'ordre.", fromId: users[0].id, toIds: [demoUser.id, users[1].id], isImportant: false },
    { subject: "Planning gardes avril 2026", body: "Le planning des gardes pour le mois d'avril est disponible. Merci de signaler tout conflit avant le 28 mars. Les permutations sont possibles sous reserve de validation par le chef de centre.", fromId: users[1].id, toIds: allUsers.map((u) => u.id), isImportant: false },
  ];

  for (const m of mails) {
    const mail = await prisma.mailMessage.create({
      data: {
        tenantId,
        fromId: m.fromId,
        subject: m.subject,
        body: m.body,
        isImportant: m.isImportant,
      },
    });
    for (const toId of m.toIds) {
      await prisma.mailRecipient.create({
        data: { messageId: mail.id, userId: toId, type: "TO" },
      });
    }
  }
  console.log(`   ✅ ${mails.length} mails`);

  // ═══════════════════════════════════════════
  // 10. NOTIFICATIONS
  // ═══════════════════════════════════════════
  console.log("🔔 Creation des notifications...");

  const notifications = [
    { type: "FMPA_CREATED" as const, title: "Nouvelle FMPA planifiee", message: "Manoeuvre incendie urbain - 25 mars a 8h00", priority: "NORMAL" as const, linkUrl: "/fmpa" },
    { type: "FORMATION_REMINDER" as const, title: "Rappel formation", message: "Formation ARI niveau 2 dans 3 jours", priority: "HIGH" as const, linkUrl: "/formations" },
    { type: "CHAT_MESSAGE" as const, title: "Nouveau message", message: "Cap. Martinez: La manoeuvre est maintenue", priority: "NORMAL" as const, linkUrl: "/messages" },
    { type: "FMPA_REMINDER" as const, title: "Qualification expirante", message: "Votre qualification PSE2 expire dans 15 jours", priority: "HIGH" as const, linkUrl: "/personnel" },
    { type: "MAIL_RECEIVED" as const, title: "Nouveau mail important", message: "Convocation FMPA du 25 mars", priority: "HIGH" as const, linkUrl: "/mailbox" },
    { type: "MAIL_IMPORTANT" as const, title: "Bienvenue sur MindSP", message: "Votre compte a ete cree avec succes. Decouvrez les fonctionnalites.", priority: "LOW" as const, linkUrl: "/" },
  ];

  for (const n of notifications) {
    await prisma.notification.create({
      data: {
        tenantId,
        userId: demoUser.id,
        type: n.type,
        title: n.title,
        message: n.message,
        priority: n.priority,
        linkUrl: n.linkUrl,
        read: false,
      },
    });
  }
  console.log(`   ✅ ${notifications.length} notifications`);

  // ═══════════════════════════════════════════
  // 11. TTA (Tableau des Temps d'Activite)
  // ═══════════════════════════════════════════
  console.log("⏱️ Creation des entrees TTA...");

  let ttaCount = 0;
  for (const u of users.slice(0, 6)) {
    const activityTypes = ["FMPA", "INTERVENTION", "FORMATION", "GARDE", "ASTREINTE"] as const;
    for (let d = 0; d < 10; d++) {
      const date = new Date(now.getTime() - d * day);
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const hours = type === "GARDE" ? 24 : type === "ASTREINTE" ? 12 : 4 + Math.floor(Math.random() * 5);

      await prisma.tTAEntry.create({
        data: {
          userId: u.id,
          tenantId,
          date,
          month: date.getMonth() + 1,
          year: date.getFullYear(),
          activityType: type,
          hours,
          baseAmount: hours * 10,
          totalAmount: hours * 10,
          description: `${type} - ${date.toLocaleDateString("fr-FR")}`,
          status: d < 3 ? "PENDING" : "VALIDATED",
          validatedBy: d >= 3 ? demoUser.id : null,
          validatedAt: d >= 3 ? new Date() : null,
        },
      });
      ttaCount++;
    }
  }
  console.log(`   ✅ ${ttaCount} entrees TTA`);

  // ═══════════════════════════════════════════
  // 12. SETTINGS ONBOARDING
  // ═══════════════════════════════════════════
  await prisma.userSettings.upsert({
    where: { userId: demoUser.id },
    update: { onboardingCompleted: true },
    create: { userId: demoUser.id, onboardingCompleted: true, theme: "dark", language: "fr" },
  }).catch(() => console.log("   ⚠️ Table user_settings non disponible (migration requise)"));

  // ═══════════════════════════════════════════
  console.log("\n🎉 Seed demo complet !");
  console.log("\n📊 Resume:");
  console.log(`   - 11 utilisateurs (1 admin demo, 2 managers, 8 agents)`);
  console.log(`   - 12 FMPA (6 a venir, 6 termines)`);
  console.log(`   - ${participationCount} participations`);
  console.log(`   - 5 formations`);
  console.log(`   - 10 fiches personnel + medicales + qualifications + equipements`);
  console.log(`   - 4 evenements calendrier`);
  console.log(`   - 5 actualites`);
  console.log(`   - 4 canaux chat + messages`);
  console.log(`   - 2 conversations + messages`);
  console.log(`   - 3 mails`);
  console.log(`   - 6 notifications`);
  console.log(`   - ${ttaCount} entrees TTA`);
  console.log("\n🔐 Connexion demo:");
  console.log(`   Tenant:   sdis06`);
  console.log(`   Email:    demo@sdis06.fr`);
  console.log(`   Password: Demo2026!`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
