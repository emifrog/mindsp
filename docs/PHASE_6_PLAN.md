# 📋 Phase 6 : Modules Complémentaires - Plan d'Action

## 🎯 Objectif

Implémenter les modules complémentaires essentiels pour une gestion complète des pompiers :

- **Agenda** : Calendrier et planning
- **Export TTA** : Calcul et export des indemnités
- **Formation** : Gestion des formations
- **Portails** : Portails SDIS et spécialités

## 📊 Priorisation

### 🔥 Priorité 1 : Module Agenda (Essentiel)

Le calendrier est crucial pour la planification des interventions et FMPA.

### 🔥 Priorité 2 : Module Formation (Important)

Gestion des formations obligatoires et certifications.

### 🟡 Priorité 3 : Module Export TTA (Moyen)

Calcul des indemnités et exports administratifs.

### 🟡 Priorité 4 : Module Portails (Moyen)

Portails d'information et documentation.

## 🚀 Phase 6.1 : Module Agenda

### Objectifs

- Calendrier mensuel/hebdomadaire/journalier
- Gestion des disponibilités
- Planning des FMPA
- Export PDF du planning

### Schéma DB

```prisma
model Availability {
  id          String   @id @default(uuid())
  userId      String
  tenantId    String

  // Période
  startDate   DateTime
  endDate     DateTime

  // Type
  type        AvailabilityType // AVAILABLE, UNAVAILABLE, PARTIAL
  reason      String?

  // Récurrence
  isRecurring Boolean  @default(false)
  recurrence  Json?    // Pattern de récurrence

  // Relations
  user        User     @relation(fields: [userId], references: [id])
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([tenantId])
  @@index([startDate, endDate])
}

enum AvailabilityType {
  AVAILABLE
  UNAVAILABLE
  PARTIAL
}

model CalendarEvent {
  id          String   @id @default(uuid())
  tenantId    String

  // Contenu
  title       String
  description String?  @db.Text
  location    String?

  // Dates
  startDate   DateTime
  endDate     DateTime
  allDay      Boolean  @default(false)

  // Type
  type        EventType
  color       String?

  // Participants
  participants EventParticipant[]

  // Relations
  fmpaId      String?  @unique
  fmpa        FMPA?    @relation(fields: [fmpaId], references: [id])

  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([startDate, endDate])
}

enum EventType {
  FMPA
  FORMATION
  MEETING
  INTERVENTION
  OTHER
}

model EventParticipant {
  id          String   @id @default(uuid())
  eventId     String
  userId      String

  status      ParticipantStatus @default(PENDING)

  event       CalendarEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id])

  @@unique([eventId, userId])
  @@index([userId])
}

enum ParticipantStatus {
  PENDING
  ACCEPTED
  DECLINED
  TENTATIVE
}
```

### Pages à Créer

1. `/agenda` - Vue calendrier principale
2. `/agenda/disponibilites` - Gestion disponibilités
3. `/agenda/planning` - Planning équipe

### Composants

- `Calendar` - Composant calendrier (react-big-calendar ou FullCalendar)
- `AvailabilityForm` - Formulaire disponibilités
- `EventModal` - Modal détails événement
- `PlanningView` - Vue planning équipe

### APIs

- `GET/POST /api/calendar/events` - CRUD événements
- `GET/POST /api/calendar/availability` - Disponibilités
- `GET /api/calendar/planning` - Planning équipe
- `GET /api/calendar/export` - Export PDF

## 🎓 Phase 6.2 : Module Formation

### Objectifs

- Catalogue de formations
- Workflow d'inscription
- Validation hiérarchique
- Génération d'attestations
- Suivi des présences

### Schéma DB

```prisma
model Formation {
  id          String   @id @default(uuid())
  tenantId    String

  // Informations
  title       String
  description String   @db.Text
  code        String   // Ex: FOR1, INC2

  // Durée et prérequis
  duration    Int      // en heures
  prerequisites String? @db.Text

  // Validité
  validityYears Int?   // Durée de validité (ex: 3 ans)

  // Catégorie
  category    FormationCategory
  level       FormationLevel

  // Capacité
  maxParticipants Int?

  // Statut
  isActive    Boolean  @default(true)

  // Sessions
  sessions    FormationSession[]

  // Relations
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([category])
}

enum FormationCategory {
  INCENDIE
  SECOURS
  TECHNIQUE
  MANAGEMENT
  REGLEMENTAIRE
}

enum FormationLevel {
  INITIALE
  CONTINUE
  PERFECTIONNEMENT
  SPECIALISATION
}

model FormationSession {
  id          String   @id @default(uuid())
  formationId String
  tenantId    String

  // Dates
  startDate   DateTime
  endDate     DateTime

  // Lieu
  location    String
  address     String?

  // Formateur
  instructorId String?
  instructor  User?    @relation("FormationInstructor", fields: [instructorId], references: [id])

  // Capacité
  maxParticipants Int
  currentParticipants Int @default(0)

  // Statut
  status      SessionStatus @default(PLANNED)

  // Inscriptions
  registrations FormationRegistration[]

  // Relations
  formation   Formation @relation(fields: [formationId], references: [id])
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([formationId])
  @@index([tenantId])
  @@index([startDate])
}

enum SessionStatus {
  PLANNED
  OPEN
  FULL
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model FormationRegistration {
  id          String   @id @default(uuid())
  sessionId   String
  userId      String
  tenantId    String

  // Workflow
  status      RegistrationStatus @default(PENDING)
  validatedBy String?
  validatedAt DateTime?

  // Présence
  attended    Boolean?
  attendanceRate Float?

  // Résultat
  passed      Boolean?
  score       Float?
  certificateUrl String?

  // Relations
  session     FormationSession @relation(fields: [sessionId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  validator   User?    @relation("FormationValidator", fields: [validatedBy], references: [id])
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([sessionId, userId])
  @@index([userId])
  @@index([tenantId])
}

enum RegistrationStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
  COMPLETED
}
```

### Pages à Créer

1. `/formations` - Catalogue formations
2. `/formations/[id]` - Détails formation
3. `/formations/sessions/[id]` - Détails session
4. `/formations/mes-formations` - Mes formations
5. `/formations/admin` - Admin formations (créer, gérer)

### Composants

- `FormationCard` - Carte formation
- `SessionCard` - Carte session
- `RegistrationForm` - Formulaire inscription
- `AttendanceSheet` - Feuille de présence
- `CertificateGenerator` - Générateur attestation

### APIs

- `GET/POST /api/formations` - CRUD formations
- `GET/POST /api/formations/sessions` - Sessions
- `POST /api/formations/register` - Inscription
- `POST /api/formations/validate` - Validation
- `GET /api/formations/certificate/[id]` - Télécharger attestation

## 💰 Phase 6.3 : Module Export TTA

### Objectifs

- Calcul automatique des indemnités
- Validation des heures
- Export SEPA XML
- Export CSV
- Historique des exports

### Schéma DB

```prisma
model TTAEntry {
  id          String   @id @default(uuid())
  userId      String
  tenantId    String

  // Période
  date        DateTime
  month       Int
  year        Int

  // Activité
  activityType ActivityType
  fmpaId      String?

  // Heures
  hours       Float
  nightHours  Float?   @default(0)
  sundayHours Float?   @default(0)
  holidayHours Float?  @default(0)

  // Indemnités
  baseAmount  Float
  nightBonus  Float?   @default(0)
  sundayBonus Float?   @default(0)
  holidayBonus Float?  @default(0)
  totalAmount Float

  // Validation
  status      TTAStatus @default(PENDING)
  validatedBy String?
  validatedAt DateTime?

  // Export
  exportId    String?
  exported    Boolean  @default(false)
  exportedAt  DateTime?

  // Relations
  user        User     @relation(fields: [userId], references: [id])
  fmpa        FMPA?    @relation(fields: [fmpaId], references: [id])
  validator   User?    @relation("TTAValidator", fields: [validatedBy], references: [id])
  export      TTAExport? @relation(fields: [exportId], references: [id])
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([tenantId])
  @@index([month, year])
  @@index([status])
}

enum ActivityType {
  FMPA
  INTERVENTION
  FORMATION
  GARDE
  ASTREINTE
}

enum TTAStatus {
  PENDING
  VALIDATED
  REJECTED
  EXPORTED
}

model TTAExport {
  id          String   @id @default(uuid())
  tenantId    String

  // Période
  month       Int
  year        Int

  // Export
  format      ExportFormat
  fileUrl     String
  fileName    String

  // Stats
  totalEntries Int
  totalAmount Float

  // Créateur
  createdBy   String
  creator     User     @relation(fields: [createdBy], references: [id])

  // Entrées
  entries     TTAEntry[]

  // Relations
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  createdAt   DateTime @default(now())

  @@index([tenantId])
  @@index([month, year])
}

enum ExportFormat {
  SEPA_XML
  CSV
  EXCEL
  PDF
}
```

### Pages à Créer

1. `/tta` - Vue d'ensemble TTA
2. `/tta/saisie` - Saisie heures
3. `/tta/validation` - Validation (managers)
4. `/tta/export` - Export (admin)
5. `/tta/historique` - Historique exports

### Composants

- `TTAForm` - Formulaire saisie
- `TTATable` - Tableau heures
- `ValidationPanel` - Panel validation
- `ExportForm` - Formulaire export
- `TTASummary` - Résumé mensuel

### APIs

- `GET/POST /api/tta/entries` - CRUD entrées
- `POST /api/tta/validate` - Validation
- `POST /api/tta/export` - Générer export
- `GET /api/tta/exports` - Liste exports
- `GET /api/tta/calculate` - Calculer indemnités

## 🌐 Phase 6.4 : Module Portails

### Objectifs

- Portail SDIS (actualités, documents)
- Portails spécialités (INC, SAP, etc.)
- Gestion de contenu
- Base documentaire

### Schéma DB

```prisma
model Portal {
  id          String   @id @default(uuid())
  tenantId    String

  // Informations
  name        String
  slug        String   @unique
  description String?  @db.Text

  // Type
  type        PortalType

  // Visibilité
  isPublic    Boolean  @default(false)
  allowedRoles String[] // JSON array of roles

  // Contenu
  articles    Article[]
  documents   Document[]

  // Relations
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId])
  @@index([slug])
}

enum PortalType {
  SDIS
  INCENDIE
  SECOURS
  TECHNIQUE
  FORMATION
}

model Article {
  id          String   @id @default(uuid())
  portalId    String
  tenantId    String

  // Contenu
  title       String
  slug        String
  content     String   @db.Text
  excerpt     String?

  // Média
  coverImage  String?

  // Auteur
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])

  // Publication
  status      ArticleStatus @default(DRAFT)
  publishedAt DateTime?

  // SEO
  metaTitle   String?
  metaDescription String?

  // Relations
  portal      Portal   @relation(fields: [portalId], references: [id])
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([portalId, slug])
  @@index([portalId])
  @@index([tenantId])
  @@index([status])
}

enum ArticleStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Document {
  id          String   @id @default(uuid())
  portalId    String?
  tenantId    String

  // Fichier
  title       String
  fileName    String
  fileUrl     String
  fileSize    Int
  mimeType    String

  // Catégorie
  category    DocumentCategory
  tags        String[] // JSON array

  // Description
  description String?  @db.Text

  // Uploader
  uploadedBy  String
  uploader    User     @relation(fields: [uploadedBy], references: [id])

  // Visibilité
  isPublic    Boolean  @default(false)

  // Relations
  portal      Portal?  @relation(fields: [portalId], references: [id])
  tenant      Tenant   @relation(fields: [tenantId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([portalId])
  @@index([tenantId])
  @@index([category])
}

enum DocumentCategory {
  PROCEDURE
  GUIDE
  FORMULAIRE
  RAPPORT
  REGLEMENTATION
  AUTRE
}
```

### Pages à Créer

1. `/portails` - Liste portails
2. `/portails/[slug]` - Portail spécifique
3. `/portails/[slug]/articles/[articleSlug]` - Article
4. `/portails/admin` - Admin portails
5. `/documents` - Base documentaire

### Composants

- `PortalCard` - Carte portail
- `ArticleCard` - Carte article
- `ArticleEditor` - Éditeur article (Tiptap ou similaire)
- `DocumentUploader` - Upload documents
- `DocumentViewer` - Visionneuse documents

### APIs

- `GET/POST /api/portals` - CRUD portails
- `GET/POST /api/portals/[slug]/articles` - Articles
- `GET/POST /api/documents` - Documents
- `GET /api/documents/[id]/download` - Télécharger

## 📅 Planning Suggéré

### Semaine 1-2 : Module Agenda

- Schéma DB + migrations
- APIs calendrier
- Composant calendrier
- Pages agenda
- Tests

### Semaine 3-4 : Module Formation

- Schéma DB + migrations
- APIs formations
- Catalogue + inscriptions
- Workflow validation
- Génération attestations

### Semaine 5 : Module TTA

- Schéma DB + migrations
- APIs TTA
- Saisie + validation
- Export SEPA/CSV

### Semaine 6 : Module Portails

- Schéma DB + migrations
- APIs portails
- CMS basique
- Base documentaire

## 🎯 Critères de Succès

### Module Agenda

- ✅ Calendrier fonctionnel (mois/semaine/jour)
- ✅ Gestion disponibilités
- ✅ Intégration FMPA
- ✅ Export PDF

### Module Formation

- ✅ Catalogue complet
- ✅ Workflow inscription/validation
- ✅ Génération attestations PDF
- ✅ Suivi présences

### Module TTA

- ✅ Calcul automatique indemnités
- ✅ Workflow validation
- ✅ Export SEPA XML
- ✅ Historique

### Module Portails

- ✅ Portails fonctionnels
- ✅ CMS articles
- ✅ Upload/download documents
- ✅ Gestion permissions

## 🚀 Démarrage

Par quel module souhaitez-vous commencer ?

1. **Agenda** (Recommandé - Essentiel pour la planification)
2. **Formation** (Important - Gestion des compétences)
3. **TTA** (Administratif - Indemnités)
4. **Portails** (Communication - Information)

---

_Phase 6 - Modules Complémentaires_
_Démarrage : 07 Octobre 2025_
