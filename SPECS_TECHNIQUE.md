# 📋 Spécifications Techniques - MindSP

**Version :** 2.1
**Date :** 19 Mars 2026
**Projet :** Solution SaaS de gestion SDIS

---

## 📚 Table des Matières

1. [Architecture Générale](#1-architecture-générale)
2. [Schéma de Base de Données](#2-schéma-de-base-de-données)
3. [Structure de Fichiers](#3-structure-de-fichiers)
4. [Spécifications API](#4-spécifications-api)
5. [Composants UI](#5-composants-ui)
6. [Authentification & Sécurité](#6-authentification--sécurité)
7. [Multi-Tenancy](#7-multi-tenancy)
8. [WebSocket & Temps Réel](#8-websocket--temps-réel)
9. [PWA & Offline](#9-pwa--offline)
10. [Seed Data](#10-seed-data)
11. [Configuration Technique](#11-configuration-technique)
12. [User Stories](#12-user-stories)
13. [Workflows Métier](#13-workflows-métier)

---

## 1. Architecture Générale

### 1.1 Stack Technique

```yaml
Frontend:
  - Framework: Next.js 14.2 (App Router)
  - Language: TypeScript 5.6
  - UI Library: React 18.3
  - Styling: TailwindCSS 3.4 + Shadcn/ui + Radix UI
  - State Management: Zustand + SWR 2.4 (cache client)
  - Forms: React Hook Form + Zod
  - HTTP Client: Fetch API native + SWR
  - Temps reel: Supabase Realtime
  - Animations: Framer Motion
  - Icons: Lucide React
  - PDF: jsPDF + html2canvas

Backend:
  - Runtime: Node.js 20+ LTS
  - Framework: Next.js 14 API Routes (71 routes)
  - ORM: Prisma 5.20 (59 modeles, 49 enums)
  - Database: PostgreSQL (Supabase)
  - Cache: Upstash Redis (TTL 5-60 min, invalidation cascade)
  - Auth: NextAuth.js v5 (JWT, multi-tenant)
  - Queue: BullMQ (optionnel)
  - Rate Limiting: Upstash Ratelimit (4 niveaux)
  - Email: Resend
  - Monitoring: Sentry (error tracking)

Infrastructure:
  - Hosting: Vercel (region cdg1 - Paris)
  - Database: PostgreSQL (Supabase)
  - Cache: Upstash Redis
  - Storage: UploadThing
  - CI/CD: GitHub Actions

```

### 1.2 Architecture Système

```
┌─────────────────────────────────────────────────────────┐
│                    Client Browser/PWA                    │
│  Next.js 14 (React 18) + TailwindCSS + SWR + Sentry   │
└────────────┬───────────────────────────┬────────────────┘
             │                           │
             │ HTTPS/REST               │ Supabase Realtime
             │                           │
┌────────────▼───────────────────────────▼────────────────┐
│              Next.js App Router (Vercel - cdg1)         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  71 API      │  │  Middleware  │  │  Supabase    │ │
│  │  Routes      │  │  - Auth     │  │  Realtime    │ │
│  │              │  │  - Tenant   │  │  (Chat, etc) │ │
│  │              │  │  - Rate Lim │  │              │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────────┘ │
└─────────┼──────────────────┼────────────────────────────┘
          │                  │
┌─────────▼──────────┐  ┌───▼────────────────────────────┐
│  Prisma 5          │  │   Upstash Redis                │
│  59 modeles        │  │   - Cache (TTL 5-60 min)       │
│  Slow query >500ms │  │   - Rate Limiting (4 niveaux)  │
└─────────┬──────────┘  │   - Session                    │
          │             └────────────────────────────────┘
┌─────────▼──────────────────────────────────────────────┐
│              PostgreSQL (Supabase)                      │
│  - Multi-tenant (tenantId sur chaque modele)           │
│  - JSONB for flexible config                           │
│  - 12 indexes composes sur 6 modeles                   │
└────────────────────────────────────────────────────────┘

Services externes:
  - Resend (emails transactionnels)
  - Sentry (error tracking + performance)
  - UploadThing (file storage)
  - GitHub Actions (CI/CD)
```

---

## 2. Schéma de Base de Données

### 2.1 Prisma Schema Complet

**Fichier :** `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ================================
// CORE MODELS
// ================================

model Tenant {
  id          String   @id @default(uuid())
  slug        String   @unique // sdis13, sdis06
  name        String
  domain      String   @unique // sdis13.mindsp.fr
  status      TenantStatus @default(ACTIVE)
  
  // Configuration
  config      Json?    // Settings flexibles
  logo        String?
  primaryColor String? @default("#1e40af")
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  users       User[]
  fmpas       FMPA[]
  messages    Message[]
  conversations Conversation[]
  formations  Formation[]
  events      Event[]
  documents   Document[]
  notifications Notification[]
  
  @@index([slug])
  @@index([domain])
  @@map("tenants")
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
  TRIAL
  CANCELLED
}

model User {
  id            String    @id @default(uuid())
  tenantId      String
  
  // Authentication
  email         String
  passwordHash  String
  emailVerified DateTime?
  
  // Profile
  firstName     String
  lastName      String
  phone         String?
  avatar        String?
  badge         String?    // Matricule
  
  // Role & Permissions
  role          UserRole   @default(USER)
  permissions   String[]   // Array of permission codes
  
  // Status
  status        UserStatus @default(ACTIVE)
  lastLoginAt   DateTime?
  
  // Refresh Tokens
  refreshTokens RefreshToken[]
  
  // Metadata
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // FMPA
  fmpasCreated  FMPA[]    @relation("FMPACreator")
  participations Participation[]
  
  // Messaging
  sentMessages  Message[] @relation("MessageSender")
  conversationMembers ConversationMember[]
  
  // Formations
  formationsCreated Formation[] @relation("FormationCreator")
  formationRegistrations FormationRegistration[]
  
  // Events
  eventsCreated Event[]   @relation("EventCreator")
  eventParticipations EventParticipation[]
  
  // Notifications
  notifications Notification[]
  
  @@unique([tenantId, email])
  @@index([tenantId])
  @@index([email])
  @@index([status])
  @@map("users")
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  MANAGER
  USER
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
  
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}

// ================================
// MODULE FMPA
// ================================

model FMPA {
  id          String   @id @default(uuid())
  tenantId    String
  
  // Content
  type        FMPAType
  title       String
  description String?  @db.Text
  
  // Schedule
  startDate   DateTime
  endDate     DateTime
  location    String
  
  // Configuration
  maxParticipants Int?
  requiresApproval Boolean @default(false)
  
  // Status
  status      FMPAStatus @default(DRAFT)
  
  // QR Code
  qrCode      String?  @unique
  
  // Creator
  createdById String
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdBy   User     @relation("FMPACreator", fields: [createdById], references: [id])
  participations Participation[]
  
  @@index([tenantId])
  @@index([status])
  @@index([startDate])
  @@index([type])
  @@map("fmpas")
}

enum FMPAType {
  FORMATION
  MANOEUVRE
  PRESENCE_ACTIVE
}

enum FMPAStatus {
  DRAFT
  PUBLISHED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model Participation {
  id          String   @id @default(uuid())
  fmpaId      String
  userId      String
  
  // Status
  status      ParticipationStatus @default(REGISTERED)
  
  // Timestamps
  registeredAt DateTime @default(now())
  confirmedAt  DateTime?
  checkInTime  DateTime?
  checkOutTime DateTime?
  
  // Notes
  notes       String?  @db.Text
  
  // Relations
  fmpa        FMPA     @relation(fields: [fmpaId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([fmpaId, userId])
  @@index([fmpaId])
  @@index([userId])
  @@index([status])
  @@map("participations")
}

enum ParticipationStatus {
  REGISTERED
  CONFIRMED
  PRESENT
  ABSENT
  CANCELLED
}

// ================================
// MODULE MESSAGING
// ================================

model Conversation {
  id          String   @id @default(uuid())
  tenantId    String
  
  // Type
  type        ConversationType @default(DIRECT)
  name        String?  // For group conversations
  avatar      String?
  
  // Metadata
  lastMessageAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  members     ConversationMember[]
  messages    Message[]
  
  @@index([tenantId])
  @@index([type])
  @@index([lastMessageAt])
  @@map("conversations")
}

enum ConversationType {
  DIRECT
  GROUP
  CHANNEL
}

model ConversationMember {
  id             String   @id @default(uuid())
  conversationId String
  userId         String
  
  // Status
  role           MemberRole @default(MEMBER)
  joinedAt       DateTime @default(now())
  lastReadAt     DateTime?
  
  // Notifications
  notificationsEnabled Boolean @default(true)
  
  // Relations
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([conversationId, userId])
  @@index([conversationId])
  @@index([userId])
  @@map("conversation_members")
}

enum MemberRole {
  OWNER
  ADMIN
  MEMBER
}

model Message {
  id             String   @id @default(uuid())
  conversationId String
  senderId       String
  tenantId       String
  
  // Content
  content        String   @db.Text
  type           MessageType @default(TEXT)
  
  // Attachments
  attachments    Json?    // Array of file metadata
  
  // Status
  status         MessageStatus @default(SENT)
  editedAt       DateTime?
  deletedAt      DateTime?
  
  // Metadata
  createdAt      DateTime @default(now())
  
  // Relations
  tenant         Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User     @relation("MessageSender", fields: [senderId], references: [id])
  reads          MessageRead[]
  
  @@index([conversationId])
  @@index([senderId])
  @@index([tenantId])
  @@index([createdAt])
  @@map("messages")
}

enum MessageType {
  TEXT
  IMAGE
  FILE
  SYSTEM
}

enum MessageStatus {
  SENT
  DELIVERED
  READ
  DELETED
}

model MessageRead {
  id        String   @id @default(uuid())
  messageId String
  userId    String
  readAt    DateTime @default(now())
  
  message   Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  
  @@unique([messageId, userId])
  @@index([messageId])
  @@map("message_reads")
}

// ================================
// MODULE FORMATIONS
// ================================

model Formation {
  id          String   @id @default(uuid())
  tenantId    String
  
  // Content
  code        String   // FOR-2025-001
  title       String
  description String?  @db.Text
  
  // Schedule
  startDate   DateTime
  endDate     DateTime
  location    String
  
  // Configuration
  maxParticipants Int?
  minParticipants Int?
  price       Float?   @default(0)
  
  // Instructor
  instructor  String?
  
  // Status
  status      FormationStatus @default(DRAFT)
  
  // Creator
  createdById String
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdBy   User     @relation("FormationCreator", fields: [createdById], references: [id])
  registrations FormationRegistration[]
  
  @@unique([tenantId, code])
  @@index([tenantId])
  @@index([status])
  @@index([startDate])
  @@map("formations")
}

enum FormationStatus {
  DRAFT
  OPEN
  FULL
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model FormationRegistration {
  id          String   @id @default(uuid())
  formationId String
  userId      String
  
  // Status
  status      RegistrationStatus @default(PENDING)
  
  // Validation
  validatedBy String?
  validatedAt DateTime?
  rejectionReason String?
  
  // Timestamps
  registeredAt DateTime @default(now())
  
  // Relations
  formation   Formation @relation(fields: [formationId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([formationId, userId])
  @@index([formationId])
  @@index([userId])
  @@index([status])
  @@map("formation_registrations")
}

enum RegistrationStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
  COMPLETED
}

// ================================
// MODULE AGENDA / EVENTS
// ================================

model Event {
  id          String   @id @default(uuid())
  tenantId    String
  
  // Content
  title       String
  description String?  @db.Text
  
  // Schedule
  startDate   DateTime
  endDate     DateTime
  allDay      Boolean  @default(false)
  location    String?
  
  // Type
  type        EventType @default(OTHER)
  color       String?  @default("#3b82f6")
  
  // Creator
  createdById String
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  createdBy   User     @relation("EventCreator", fields: [createdById], references: [id])
  participations EventParticipation[]
  
  @@index([tenantId])
  @@index([startDate])
  @@index([type])
  @@map("events")
}

enum EventType {
  GUARD_DUTY      // Garde
  TRAINING        // Formation
  MEETING         // Réunion
  INTERVENTION    // Intervention
  OTHER
}

model EventParticipation {
  id          String   @id @default(uuid())
  eventId     String
  userId      String
  
  // Response
  response    ParticipationResponse @default(NO_RESPONSE)
  respondedAt DateTime?
  
  // Relations
  event       Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([eventId, userId])
  @@index([eventId])
  @@index([userId])
  @@map("event_participations")
}

enum ParticipationResponse {
  NO_RESPONSE
  ACCEPTED
  DECLINED
  MAYBE
}

// ================================
// MODULE DOCUMENTS
// ================================

model Document {
  id          String   @id @default(uuid())
  tenantId    String
  
  // Content
  name        String
  description String?  @db.Text
  
  // File
  fileUrl     String
  fileSize    Int      // bytes
  mimeType    String
  
  // Organization
  category    String?
  tags        String[]
  
  // Access
  isPublic    Boolean  @default(false)
  
  // Uploader
  uploadedBy  String
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@index([tenantId])
  @@index([category])
  @@map("documents")
}

// ================================
// MODULE NOTIFICATIONS
// ================================

model Notification {
  id          String   @id @default(uuid())
  tenantId    String
  userId      String
  
  // Content
  type        NotificationType
  title       String
  message     String   @db.Text
  
  // Link
  linkUrl     String?
  
  // Status
  read        Boolean  @default(false)
  readAt      DateTime?
  
  // Metadata
  createdAt   DateTime @default(now())
  
  // Relations
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([tenantId])
  @@index([userId])
  @@index([read])
  @@index([createdAt])
  @@map("notifications")
}

enum NotificationType {
  FMPA_CREATED
  FMPA_UPDATED
  FMPA_CANCELLED
  FMPA_REMINDER
  MESSAGE_RECEIVED
  FORMATION_APPROVED
  FORMATION_REJECTED
  EVENT_INVITATION
  SYSTEM
}

// ================================
// AUDIT LOG
// ================================

model AuditLog {
  id          String   @id @default(uuid())
  tenantId    String?
  userId      String?
  
  // Action
  action      String   // CREATE_FMPA, UPDATE_USER, etc.
  entity      String   // FMPA, User, etc.
  entityId    String?
  
  // Data
  changes     Json?    // Before/after
  metadata    Json?    // IP, user-agent, etc.
  
  // Timestamp
  createdAt   DateTime @default(now())
  
  @@index([tenantId])
  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### 2.2 Migrations Strategy

**Commandes Prisma :**

```bash
# Générer migration
npx prisma migrate dev --name init

# Appliquer migrations (prod)
npx prisma migrate deploy

# Générer le client
npx prisma generate

# Visualiser DB
npx prisma studio
```

---

## 3. Structure de Fichiers

### 3.1 Arborescence Complète

```
mindsp/
├── .github/workflows/
│   └── ci.yml                              # GitHub Actions CI (tsc + build)
│
├── prisma/
│   ├── schema.prisma                       # 59 modeles, 49 enums
│   ├── migrations/                         # Migrations SQL
│   └── seed-demo.ts                        # Script creation compte demo
│
├── public/
│   ├── manifest.json                       # PWA manifest
│   ├── sw.js                               # Service worker
│   ├── favicon.ico, logo.png, logo-banner.png
│   └── icons/                              # App icons PWA
│
├── sentry.client.config.ts                 # Sentry client
├── sentry.server.config.ts                 # Sentry server
├── sentry.edge.config.ts                   # Sentry edge
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # Root layout (Sentry, CookieConsent, SW)
│   │   ├── error.tsx                       # Global error boundary (Sentry)
│   │   ├── not-found.tsx                   # 404 page
│   │   │
│   │   ├── auth/
│   │   │   ├── login/page.tsx              # Login (tenant select, credentials dev only)
│   │   │   ├── register/page.tsx           # Inscription
│   │   │   └── error/page.tsx
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                  # Sidebar + Header + OnboardingWizard
│   │   │   ├── page.tsx                    # Dashboard home
│   │   │   ├── error.tsx                   # Dashboard error boundary
│   │   │   ├── fmpa/                       # FMPA pages (liste, detail, calendrier, stats)
│   │   │   ├── formations/                 # Formations (liste, calendrier, nouvelle)
│   │   │   ├── messages/                   # Conversations + chat
│   │   │   ├── chat/                       # Chat temps reel (canaux)
│   │   │   ├── mailbox/                    # Email interne
│   │   │   ├── agenda/                     # Calendrier global
│   │   │   ├── personnel/                  # Fiches personnel + [id] detail
│   │   │   ├── tta/                        # TTA saisie, validation, export
│   │   │   ├── portails/                   # Portails communication
│   │   │   ├── notifications/              # Centre notifications
│   │   │   ├── search/                     # Recherche globale
│   │   │   ├── messaging/                  # Listes diffusion
│   │   │   ├── settings/                   # Parametres notifications
│   │   │   └── showcase/                   # Demo composants
│   │   │
│   │   └── api/                            # 71 API routes (voir README.md)
│   │
│   ├── components/
│   │   ├── ui/                             # 30+ composants Shadcn/ui
│   │   ├── layout/                         # Sidebar, Header
│   │   ├── fmpa/                           # FMPATable, FMPACalendar, FMPAStatistics
│   │   ├── chat/                           # ChannelList, MessageList, CreateChannelDialog
│   │   ├── mailbox/                        # MailboxLayout, MessageList, ComposeForm
│   │   ├── formations/                     # FormationsCalendar
│   │   ├── personnel/                      # CareerTimeline, AlertsDashboard
│   │   ├── notifications/                  # NotificationBell
│   │   ├── providers/                      # SessionProvider, ThemeProvider, NavigationLoader
│   │   ├── CookieConsent.tsx               # Bandeau RGPD
│   │   └── OnboardingWizard.tsx            # Wizard 3 etapes post-inscription
│   │
│   ├── lib/
│   │   ├── prisma.ts                       # Client Prisma + slow query middleware
│   │   ├── auth.ts                         # NextAuth config (satisfies NextAuthConfig)
│   │   ├── auth-config.ts                  # Export auth(), signIn(), signOut()
│   │   ├── cache.ts                        # CacheService Redis (getOrSet, invalidation)
│   │   ├── rate-limit.ts                   # 4 rate limiters (lazy Proxy)
│   │   ├── email.ts                        # Resend (welcome, reset, FMPA templates)
│   │   ├── notification-service.ts         # NotificationService (create, push, bulk)
│   │   ├── socket-client.ts                # Socket.IO client (optionnel)
│   │   ├── supabase.ts                     # Supabase client (lazy Proxy)
│   │   ├── fetcher.ts                      # SWR fetcher reutilisable
│   │   ├── icons.ts                        # Registre emojis Unicode
│   │   └── utils.ts
│   │
│   ├── hooks/
│   │   ├── use-notifications.ts            # SWR + mutations optimistes
│   │   └── use-toast.ts
│   │
│   ├── contexts/
│   │   └── SidebarContext.tsx
│   │
│   ├── types/
│   │   ├── chat.ts, notification.ts, next-auth.d.ts
│   │   └── ...
│   │
│   └── middleware.ts                       # Auth, tenant, rate limiting, headers
│
├── next.config.js                          # withSentryConfig, CSP, optimizePackageImports
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json                             # Region cdg1, build command
└── package.json                            # 56 deps, 20 devDeps
```

---

## 4. Spécifications API

### 4.1 Convention REST

**Base URL :** `https://{tenant}.mindsp.fr/api`

**Headers requis :**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Codes de réponse :**
- `200` OK - Succès
- `201` Created - Ressource créée
- `204` No Content - Succès sans contenu
- `400` Bad Request - Erreur validation
- `401` Unauthorized - Non authentifié
- `403` Forbidden - Non autorisé
- `404` Not Found - Ressource introuvable
- `409` Conflict - Conflit (ex: email existe)
- `422` Unprocessable Entity - Erreur métier
- `429` Too Many Requests - Rate limit
- `500` Internal Server Error - Erreur serveur

### 4.2 API Auth

#### POST /api/auth/register

**Description :** Créer un compte utilisateur

**Body :**
```typescript
{
  tenantSlug: string;      // "sdis13"
  email: string;           // "user@example.com"
  password: string;        // Min 8 chars, 1 maj, 1 min, 1 chiffre
  firstName: string;
  lastName: string;
  phone?: string;
}
```

**Response 201 :**
```typescript
{
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  };
  accessToken: string;
  refreshToken: string;
}
```

**Erreurs :**
- `400` : Validation failed
- `409` : Email already exists

#### POST /api/auth/login

**Body :**
```typescript
{
  email: string;
  password: string;
  tenantSlug: string;
}
```

**Response 200 :**
```typescript
{
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    tenantId: string;
  };
  accessToken: string;
  refreshToken: string;
}
```

#### POST /api/auth/refresh

**Body :**
```typescript
{
  refreshToken: string;
}
```

**Response 200 :**
```typescript
{
  accessToken: string;
  refreshToken: string;
}
```

#### POST /api/auth/logout

**Headers :** Authorization required

**Response 204**

### 4.3 API FMPA

#### GET /api/fmpa

**Description :** Liste des FMPA avec filtres

**Query Params :**
```typescript
{
  status?: FMPAStatus;         // DRAFT, PUBLISHED, etc.
  type?: FMPAType;             // FORMATION, MANOEUVRE, etc.
  startDate?: string;          // ISO date "2025-01-01"
  endDate?: string;
  search?: string;             // Recherche titre/description
  page?: number;               // Default: 1
  limit?: number;              // Default: 20, max: 100
  sortBy?: "startDate" | "createdAt" | "title";
  sortOrder?: "asc" | "desc";  // Default: desc
}
```

**Response 200 :**
```typescript
{
  data: FMPA[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

**Type FMPA :**
```typescript
{
  id: string;
  type: FMPAType;
  title: string;
  description: string | null;
  startDate: string;           // ISO date
  endDate: string;
  location: string;
  maxParticipants: number | null;
  status: FMPAStatus;
  qrCode: string | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count: {
    participations: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

#### POST /api/fmpa

**Description :** Créer une FMPA

**Body :**
```typescript
{
  type: FMPAType;              // Required
  title: string;               // Required, max 200 chars
  description?: string;
  startDate: string;           // Required, ISO date
  endDate: string;             // Required, must be > startDate
  location: string;            // Required
  maxParticipants?: number;    // Min: 1
  requiresApproval?: boolean;  // Default: false
}
```

**Validation Zod :**
```typescript
const createFmpaSchema = z.object({
  type: z.enum(['FORMATION', 'MANOEUVRE', 'PRESENCE_ACTIVE']),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  location: z.string().min(2),
  maxParticipants: z.number().int().positive().optional(),
  requiresApproval: z.boolean().optional(),
}).refine(data => new Date(data.endDate) > new Date(data.startDate), {
  message: "End date must be after start date",
  path: ["endDate"],
});
```

**Response 201 :**
```typescript
{
  id: string;
  // ... all FMPA fields
}
```

**Erreurs :**
- `400` : Validation failed
- `401` : Not authenticated
- `403` : Not authorized (requires ADMIN or MANAGER role)

#### GET /api/fmpa/[id]

**Response 200 :**
```typescript
{
  id: string;
  // ... all FMPA fields
  participations: {
    id: string;
    status: ParticipationStatus;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
    registeredAt: string;
    checkInTime: string | null;
  }[];
}
```

**Erreurs :**
- `404` : FMPA not found

#### PUT /api/fmpa/[id]

**Body :** (tous champs optionnels)
```typescript
{
  type?: FMPAType;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  maxParticipants?: number;
  status?: FMPAStatus;
}
```

**Response 200 :** FMPA mis à jour

**Erreurs :**
- `403` : Not creator or admin
- `404` : Not found
- `422` : Cannot modify completed FMPA

#### DELETE /api/fmpa/[id]

**Response 204**

**Erreurs :**
- `403` : Not creator or admin
- `404` : Not found
- `422` : Cannot delete FMPA with participants

#### POST /api/fmpa/[id]/participants

**Description :** S'inscrire à une FMPA

**Body :**
```typescript
{
  userId?: string;  // Optional, pour admin inscrivant quelqu'un d'autre
}
```

**Response 201 :**
```typescript
{
  id: string;
  fmpaId: string;
  userId: string;
  status: "REGISTERED";
  registeredAt: string;
}
```

**Erreurs :**
- `409` : Already registered
- `422` : FMPA is full
- `422` : FMPA is not published

#### DELETE /api/fmpa/[id]/participants/[userId]

**Description :** Se désinscrire ou retirer quelqu'un

**Response 204**

#### PUT /api/fmpa/[id]/participants/[participationId]/check-in

**Description :** Pointer l'arrivée (scan QR code)

**Body :**
```typescript
{
  qrCode: string;  // Pour validation
}
```

**Response 200 :**
```typescript
{
  id: string;
  status: "PRESENT";
  checkInTime: string;
}
```

#### GET /api/fmpa/[id]/export

**Description :** Exporter liste émargement PDF

**Response 200 :**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="emargement-{fmpaId}.pdf"
```

### 4.4 API Messages

#### GET /api/conversations

**Query Params :**
```typescript
{
  search?: string;
  limit?: number;
  page?: number;
}
```

**Response 200 :**
```typescript
{
  data: {
    id: string;
    type: ConversationType;
    name: string | null;
    avatar: string | null;
    lastMessage: {
      content: string;
      createdAt: string;
      sender: {
        firstName: string;
        lastName: string;
      };
    } | null;
    unreadCount: number;
    members: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    }[];
  }[];
}
```

#### POST /api/conversations

**Body :**
```typescript
{
  type: "DIRECT" | "GROUP";
  memberIds: string[];         // User IDs
  name?: string;               // Required for GROUP
}
```

**Response 201 :** Conversation créée

#### GET /api/conversations/[id]/messages

**Query Params :**
```typescript
{
  before?: string;  // Message ID for pagination
  limit?: number;   // Default: 50
}
```

**Response 200 :**
```typescript
{
  data: {
    id: string;
    content: string;
    type: MessageType;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
    createdAt: string;
    editedAt: string | null;
    reads: {
      userId: string;
      readAt: string;
    }[];
  }[];
  hasMore: boolean;
}
```

#### POST /api/conversations/[id]/messages

**Body :**
```typescript
{
  content: string;
  type?: MessageType;    // Default: TEXT
  attachments?: {
    url: string;
    name: string;
    size: number;
    mimeType: string;
  }[];
}
```

**Response 201 :** Message créé

### 4.5 API Formations

#### GET /api/formations

**Query Params :** Similaires à /api/fmpa

#### POST /api/formations

**Body :**
```typescript
{
  code: string;              // FOR-2025-001
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  maxParticipants?: number;
  minParticipants?: number;
  price?: number;
  instructor?: string;
}
```

#### POST /api/formations/[id]/registrations

**Body :**
```typescript
{
  userId?: string;  // Pour admin
}
```

**Response 201 :**
```typescript
{
  id: string;
  status: "PENDING";  // Nécessite validation
  registeredAt: string;
}
```

#### PUT /api/formations/[id]/registrations/[registrationId]/validate

**Description :** Valider/refuser une inscription (admin only)

**Body :**
```typescript
{
  action: "APPROVE" | "REJECT";
  rejectionReason?: string;
}
```

### 4.6 API Events (Agenda)

#### GET /api/events

**Query Params :**
```typescript
{
  startDate: string;   // Required
  endDate: string;     // Required
  type?: EventType;
}
```

#### POST /api/events

**Body :**
```typescript
{
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  allDay?: boolean;
  location?: string;
  type: EventType;
  participantIds?: string[];
}
```

### 4.7 API Notifications

#### GET /api/notifications

**Query Params :**
```typescript
{
  read?: boolean;      // Filter by read status
  limit?: number;
  page?: number;
}
```

#### PUT /api/notifications/[id]/mark-read

**Response 200**

#### PUT /api/notifications/mark-all-read

**Response 200**

---

## 5. Composants UI

### 5.1 Design System

**Thème :** Basé sur Shadcn/ui + TailwindCSS

**Couleurs :**
```typescript
// tailwind.config.ts
const colors = {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  // ...
};
```

### 5.2 Composants FMPA

#### FmpaCard

**Fichier :** `src/components/fmpa/FmpaCard.tsx`

**Props :**
```typescript
interface FmpaCardProps {
  fmpa: {
    id: string;
    type: FMPAType;
    title: string;
    description: string | null;
    startDate: string;
    endDate: string;
    location: string;
    status: FMPAStatus;
    _count: {
      participations: number;
    };
    maxParticipants: number | null;
  };
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}
```

**Comportement :**
- Affiche badge de type (FORMATION/MANOEUVRE/PA)
- Badge de status avec couleur appropriée
- Date en format lisible (ex: "15 Jan 2025")
- Indicateur participants (12/20)
- Actions : Voir, Modifier, Supprimer (selon permissions)
- Hover effect avec shadow

#### FmpaForm

**Props :**
```typescript
interface FmpaFormProps {
  initialData?: Partial<FMPA>;
  onSubmit: (data: CreateFmpaInput) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}
```

**Champs :**
1. Type (Select) - FORMATION, MANOEUVRE, PRESENCE_ACTIVE
2. Titre (Input)
3. Description (Textarea)
4. Date début (DatePicker)
5. Date fin (DatePicker)
6. Lieu (Input)
7. Max participants (Number Input, optional)
8. Nécessite validation (Checkbox)

**Validation :**
- Temps réel avec Zod
- Erreurs affichées sous chaque champ
- Bouton submit désactivé si invalide

#### FmpaList

**Props :**
```typescript
interface FmpaListProps {
  filters?: FmpaFilters;
  onFilterChange?: (filters: FmpaFilters) => void;
  view?: 'grid' | 'list';
}
```

**Features :**
- Affichage grid ou liste
- Filtres : status, type, dates
- Recherche
- Pagination
- Loading skeleton
- Empty state

#### ParticipantsList

**Props :**
```typescript
interface ParticipantsListProps {
  fmpaId: string;
  participants: Participation[];
  canManage: boolean;
  onCheckIn?: (participationId: string) => Promise<void>;
  onRemove?: (participationId: string) => Promise<void>;
}
```

**Features :**
- Liste avec avatar, nom, statut
- Badge statut (REGISTERED/CONFIRMED/PRESENT)
- Action check-in (bouton ou QR scan)
- Action retirer participant (admin)
- Timestamps (inscrit le, pointé à)

### 5.3 Composants Messages

#### MessageBubble

**Props :**
```typescript
interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    type: MessageType;
    createdAt: string;
    sender: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
    editedAt: string | null;
  };
  isOwn: boolean;
  showAvatar?: boolean;
}
```

**Styles :**
- Bulle alignée à droite si isOwn, sinon à gauche
- Couleur différente (bleu pour soi, gris pour autres)
- Avatar affiché si pas isOwn
- Timestamp en petit en dessous
- "(modifié)" si editedAt

#### MessageInput

**Props :**
```typescript
interface MessageInputProps {
  onSend: (content: string) => Promise<void>;
  onTyping?: () => void;
  placeholder?: string;
}
```

**Features :**
- Textarea avec auto-resize
- Bouton emoji picker
- Bouton attach file
- Bouton send
- Event typing (debounced)
- Support Enter pour envoyer
- Shift+Enter pour nouvelle ligne

### 5.4 Layout Components

#### Sidebar

**Features :**
- Logo SDIS + nom tenant
- Navigation principale :
  - Dashboard
  - FMPA
  - Messages (avec badge unread)
  - Formations
  - Agenda
  - Personnel
  - Documents
  - Settings
- User menu en bas :
  - Avatar + nom
  - Profil
  - Déconnexion
- Collapsible sur mobile

#### Header

**Features :**
- Breadcrumbs
- Search global
- Notifications dropdown (avec badge)
- User dropdown

---

## 6. Authentification & Sécurité

### 6.1 NextAuth Configuration

**Fichier :** `src/lib/auth.ts`

```typescript
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        tenantSlug: { label: "Tenant", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password || !credentials?.tenantSlug) {
          throw new Error("Missing credentials");
        }

        // Trouver le tenant
        const tenant = await prisma.tenant.findUnique({
          where: { slug: credentials.tenantSlug as string },
        });

        if (!tenant || tenant.status !== "ACTIVE") {
          throw new Error("Tenant not found or inactive");
        }

        // Trouver l'utilisateur
        const user = await prisma.user.findUnique({
          where: {
            tenantId_email: {
              tenantId: tenant.id,
              email: credentials.email as string,
            },
          },
        });

        if (!user || user.status !== "ACTIVE") {
          throw new Error("Invalid credentials");
        }

        // Vérifier password
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          tenantId: user.tenantId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string;
      }
      return session;
    },
  },
});
```

### 6.2 Middleware Protection

**Fichier :** `src/middleware.ts`

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ["/login", "/register", "/forgot-password"];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Check auth
  const session = await auth();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Extract tenant from subdomain
  const host = request.headers.get("host") || "";
  const subdomain = host.split(".")[0];

  // Verify tenant matches session
  const tenant = await prisma.tenant.findUnique({
    where: { slug: subdomain },
  });

  if (!tenant || tenant.id !== session.user.tenantId) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

### 6.3 Rate Limiting

**Librairie :** `@upstash/ratelimit`

```typescript
// lib/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 req per 10s
  analytics: true,
});

// Usage dans API route
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response("Too many requests", { status: 429 });
  }
  
  // ... suite
}
```

---

## 7. Multi-Tenancy

### 7.1 Stratégie d'Isolation

**Approche :** Row-Level par `tenantId` + Subdomain routing

**Prisma Middleware :**

```typescript
// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Middleware pour filtrer par tenantId
export function withTenant(tenantId: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query, model }) {
          // Modèles sans tenant
          const modelsWithoutTenant = ["Tenant", "RefreshToken", "AuditLog"];
          if (modelsWithoutTenant.includes(model)) {
            return query(args);
          }

          // Ajouter tenantId automatiquement
          if (args.where) {
            args.where = { ...args.where, tenantId };
          } else {
            args.where = { tenantId };
          }

          if (args.data && "tenantId" in args.data) {
            args.data.tenantId = tenantId;
          }

          return query(args);
        },
      },
    },
  });
}
```

**Usage :**

```typescript
// Dans API route
export async function GET(req: Request) {
  const session = await auth();
  const db = withTenant(session.user.tenantId);
  
  const fmpas = await db.fmpa.findMany(); // Filtre auto par tenantId
  
  return Response.json({ data: fmpas });
}
```

### 7.2 Subdomain Routing

**next.config.js :**

```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "(?<tenant>.*)\\.mindsp\\.fr",
          },
        ],
        destination: "/:path*",
      },
    ];
  },
};
```

---

## 8. Temps Réel

### 8.1 Supabase Realtime (principal)

Le projet utilise principalement **Supabase Realtime** pour le temps réel (chat, présence, notifications).
Un serveur **Socket.IO** optionnel est également disponible pour des cas d'usage avancés.

**Configuration :** `src/lib/supabase.ts` (lazy Proxy)

### 8.2 Socket.IO Server (optionnel)

**Fichier :** `src/lib/socket-client.ts`

```typescript
import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { verify } from "jsonwebtoken";

export function initSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL,
      credentials: true,
    },
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = verify(token, process.env.JWT_SECRET!);
      socket.data.userId = decoded.sub;
      socket.data.tenantId = decoded.tenantId;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const { userId, tenantId } = socket.data;

    // Join tenant room
    socket.join(`tenant:${tenantId}`);
    socket.join(`user:${userId}`);

    console.log(`User ${userId} connected to tenant ${tenantId}`);

    // Message handlers
    socket.on("message:send", async (data) => {
      // Sauvegarder message en DB
      const message = await saveMessage(data);
      
      // Broadcast to conversation
      io.to(`conversation:${data.conversationId}`).emit("message:new", message);
    });

    socket.on("message:typing", (data) => {
      socket.to(`conversation:${data.conversationId}`).emit("message:typing", {
        userId,
        conversationId: data.conversationId,
      });
    });

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
    });
  });

  return io;
}
```

### 8.2 Socket.IO Client Hook

**Fichier :** `src/hooks/use-socket.ts`

```typescript
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

export function useSocket() {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session?.accessToken) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
      auth: {
        token: session.accessToken,
      },
    });

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [session]);

  return socketRef.current;
}
```

### 8.3 Events WebSocket

**Events list :**

```typescript
// Client → Server
"message:send"           // Envoyer message
"message:typing"         // Indicateur typing
"conversation:join"      // Rejoindre conversation
"conversation:leave"     // Quitter conversation
"notification:ack"       // Accuser réception notif

// Server → Client
"message:new"            // Nouveau message
"message:typing"         // Quelqu'un tape
"message:read"           // Message lu
"notification:push"      // Nouvelle notification
"fmpa:updated"           // FMPA modifiée
"user:status"            // Statut utilisateur (online/offline)
```

---

## 9. PWA & Offline

### 9.1 PWA Configuration

**manifest.json :**

```json
{
  "name": "MindSP - Gestion SDIS",
  "short_name": "MindSP",
  "description": "Solution SaaS de gestion pour SDIS",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1e40af",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

**next.config.js (avec next-pwa) :**

```javascript
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  // ... rest of config
});
```

### 9.2 Service Worker Strategy

**Fichier :** `public/sw.js`

```javascript
// Cache strategies
const CACHE_NAME = "mindsp-v1";
const API_CACHE = "mindsp-api-v1";

// Assets to cache
const urlsToCache = [
  "/",
  "/offline",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: Network first, fallback to cache
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: Cache first
  event.respondWith(
    caches.match(request).then((response) => response || fetch(request))
  );
});
```

### 9.3 Offline Store (Dexie)

**Fichier :** `src/stores/offline.store.ts`

```typescript
import Dexie, { Table } from "dexie";

interface OfflineFmpa {
  id: string;
  data: any;
  syncStatus: "pending" | "synced" | "error";
  lastSync: Date;
}

interface OfflineAction {
  id: string;
  type: "CREATE" | "UPDATE" | "DELETE";
  entity: "fmpa" | "message" | "participation";
  entityId: string;
  payload: any;
  timestamp: Date;
}

class OfflineDB extends Dexie {
  fmpas!: Table<OfflineFmpa>;
  actions!: Table<OfflineAction>;

  constructor() {
    super("MindSPOffline");
    this.version(1).stores({
      fmpas: "id, syncStatus, lastSync",
      actions: "++id, type, entity, timestamp",
    });
  }
}

export const db = new OfflineDB();

// Sync queue
export async function queueAction(action: Omit<OfflineAction, "id" | "timestamp">) {
  await db.actions.add({
    ...action,
    timestamp: new Date(),
  });
}

export async function syncPendingActions() {
  const actions = await db.actions.toArray();
  
  for (const action of actions) {
    try {
      // Send to API
      await fetch(`/api/${action.entity}`, {
        method: action.type === "CREATE" ? "POST" : action.type === "UPDATE" ? "PUT" : "DELETE",
        body: JSON.stringify(action.payload),
      });
      
      // Delete from queue
      await db.actions.delete(action.id!);
    } catch (error) {
      console.error("Sync error:", error);
    }
  }
}
```

---

## 10. Seed Data

### 10.1 Structure Seed

**Fichier :** `prisma/seed/index.ts`

```typescript
import { PrismaClient } from "@prisma/client";
import { seedTenants } from "./tenants";
import { seedUsers } from "./users";
import { seedFmpas } from "./fmpas";
import { seedFormations } from "./formations";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // 1. Tenants
  const tenants = await seedTenants(prisma);
  console.log(`✅ Created ${tenants.length} tenants`);

  // 2. Users
  const users = await seedUsers(prisma, tenants);
  console.log(`✅ Created ${users.length} users`);

  // 3. FMPAs
  const fmpas = await seedFmpas(prisma, tenants, users);
  console.log(`✅ Created ${fmpas.length} FMPAs`);

  // 4. Formations
  const formations = await seedFormations(prisma, tenants, users);
  console.log(`✅ Created ${formations.length} formations`);

  console.log("🎉 Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### 10.2 Seed Tenants

**Fichier :** `prisma/seed/tenants.ts`

```typescript
import { PrismaClient, Tenant } from "@prisma/client";

export async function seedTenants(prisma: PrismaClient): Promise<Tenant[]> {
  const tenants = [
    {
      id: "tenant-sdis-13",
      slug: "sdis13",
      name: "SDIS des Bouches-du-Rhône",
      domain: "sdis13.mindsp.local",
      status: "ACTIVE" as const,
      primaryColor: "#dc2626",
      config: {
        features: ["fmpa", "messaging", "formations", "agenda"],
        branding: {
          logoUrl: "/logos/sdis13.png",
        },
      },
    },
    {
      id: "tenant-sdis-06",
      slug: "sdis06",
      name: "SDIS des Alpes-Maritimes",
      domain: "sdis06.mindsp.local",
      status: "ACTIVE" as const,
      primaryColor: "#2563eb",
      config: {
        features: ["fmpa", "messaging"],
      },
    },
  ];

  const created = [];
  for (const tenant of tenants) {
    const t = await prisma.tenant.upsert({
      where: { slug: tenant.slug },
      create: tenant,
      update: tenant,
    });
    created.push(t);
  }

  return created;
}
```

### 10.3 Seed Users

**Fichier :** `prisma/seed/users.ts`

```typescript
import { PrismaClient, Tenant, User } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function seedUsers(
  prisma: PrismaClient,
  tenants: Tenant[]
): Promise<User[]> {
  const password = await bcrypt.hash("Password123!", 10);

  const users = [
    // SDIS 13
    {
      tenantId: tenants[0].id,
      email: "admin@sdis13.fr",
      passwordHash: password,
      firstName: "Jean",
      lastName: "Dupont",
      role: "ADMIN" as const,
      status: "ACTIVE" as const,
      badge: "ADM-001",
    },
    {
      tenantId: tenants[0].id,
      email: "chef@sdis13.fr",
      passwordHash: password,
      firstName: "Marie",
      lastName: "Martin",
      role: "MANAGER" as const,
      status: "ACTIVE" as const,
      badge: "MGR-001",
    },
    {
      tenantId: tenants[0].id,
      email: "user1@sdis13.fr",
      passwordHash: password,
      firstName: "Pierre",
      lastName: "Durand",
      role: "USER" as const,
      status: "ACTIVE" as const,
      badge: "USR-001",
    },
    {
      tenantId: tenants[0].id,
      email: "user2@sdis13.fr",
      passwordHash: password,
      firstName: "Sophie",
      lastName: "Bernard",
      role: "USER" as const,
      status: "ACTIVE" as const,
      badge: "USR-002",
    },
    // SDIS 06
    {
      tenantId: tenants[1].id,
      email: "admin@sdis06.fr",
      passwordHash: password,
      firstName: "Luc",
      lastName: "Moreau",
      role: "ADMIN" as const,
      status: "ACTIVE" as const,
      badge: "ADM-001",
    },
    {
      tenantId: tenants[1].id,
      email: "user1@sdis06.fr",
      passwordHash: password,
      firstName: "Emma",
      lastName: "Petit",
      role: "USER" as const,
      status: "ACTIVE" as const,
      badge: "USR-001",
    },
  ];

  const created = [];
  for (const user of users) {
    const u = await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: user.tenantId,
          email: user.email,
        },
      },
      create: user,
      update: user,
    });
    created.push(u);
  }

  return created;
}
```

### 10.4 Seed FMPAs

**Fichier :** `prisma/seed/fmpas.ts`

```typescript
import { PrismaClient, Tenant, User, FMPA } from "@prisma/client";
import { addDays, addHours } from "date-fns";

export async function seedFmpas(
  prisma: PrismaClient,
  tenants: Tenant[],
  users: User[]
): Promise<FMPA[]> {
  const now = new Date();
  const adminSDIS13 = users.find(
    (u) => u.tenantId === tenants[0].id && u.role === "ADMIN"
  )!;
  const adminSDIS06 = users.find(
    (u) => u.tenantId === tenants[1].id && u.role === "ADMIN"
  )!;

  const fmpas = [
    // SDIS 13
    {
      tenantId: tenants[0].id,
      type: "FORMATION" as const,
      title: "Formation INC 1 - Équipier",
      description:
        "Formation initiale de sapeur-pompier volontaire - Module INC 1",
      startDate: addDays(now, 7),
      endDate: addDays(addHours(now, 8), 7),
      location: "Centre de formation SDIS 13 - Marseille",
      maxParticipants: 20,
      status: "PUBLISHED" as const,
      createdById: adminSDIS13.id,
      qrCode: "FMPA-FORM-001",
    },
    {
      tenantId: tenants[0].id,
      type: "MANOEUVRE" as const,
      title: "Manœuvre incendie - Feu de véhicule",
      description: "Exercice pratique sur feu de véhicule avec ARI",
      startDate: addDays(now, 3),
      endDate: addDays(addHours(now, 4), 3),
      location: "Terrain de manœuvre - Aix-en-Provence",
      maxParticipants: 15,
      status: "PUBLISHED" as const,
      createdById: adminSDIS13.id,
      qrCode: "FMPA-MANO-001",
    },
    {
      tenantId: tenants[0].id,
      type: "PRESENCE_ACTIVE" as const,
      title: "Garde weekend - CIS Marseille Nord",
      description: "Garde 24h - CIS Marseille Nord",
      startDate: addDays(now, 5),
      endDate: addDays(addHours(now, 24), 5),
      location: "CIS Marseille Nord",
      maxParticipants: 8,
      status: "PUBLISHED" as const,
      createdById: adminSDIS13.id,
      qrCode: "FMPA-PA-001",
    },
    // SDIS 06
    {
      tenantId: tenants[1].id,
      type: "FORMATION" as const,
      title: "Recyclage AFGSU Niveau 2",
      description: "Attestation de Formation aux Gestes et Soins d'Urgence",
      startDate: addDays(now, 10),
      endDate: addDays(addHours(now, 7), 10),
      location: "SDIS 06 - Nice",
      maxParticipants: 12,
      status: "PUBLISHED" as const,
      createdById: adminSDIS06.id,
      qrCode: "FMPA-FORM-002",
    },
  ];

  const created = [];
  for (const fmpa of fmpas) {
    const f = await prisma.fMPA.create({
      data: fmpa,
    });
    created.push(f);

    // Créer participations
    const tenantUsers = users.filter(
      (u) => u.tenantId === fmpa.tenantId && u.role === "USER"
    );
    
    for (let i = 0; i < Math.min(3, tenantUsers.length); i++) {
      await prisma.participation.create({
        data: {
          fmpaId: f.id,
          userId: tenantUsers[i].id,
          status: i === 0 ? "PRESENT" : "CONFIRMED",
          registeredAt: addDays(now, -2),
          confirmedAt: addDays(now, -1),
          checkInTime: i === 0 ? fmpa.startDate : null,
        },
      });
    }
  }

  return created;
}
```

---

## 11. Configuration Technique

### 11.1 Environment Variables

**Fichier :** `.env.example`

```bash
# Database (Supabase PostgreSQL)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."  # Connexion directe pour migrations

# Supabase (Realtime + Storage)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# NextAuth v5
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."  # openssl rand -base64 32

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Email (Resend)
RESEND_API_KEY="..."
EMAIL_FROM="MindSP <noreply@mindsp.fr>"

# File Upload (UploadThing)
UPLOADTHING_SECRET="..."
UPLOADTHING_APP_ID="..."

# Web Push (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="..."
VAPID_PRIVATE_KEY="..."

# Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN="..."
SENTRY_ORG="..."
SENTRY_PROJECT="..."

# Socket.IO (optionnel, serveur dedie)
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"

# CORS
ALLOWED_ORIGINS="localhost:3000"
```

### 11.3 TypeScript Configuration

**tsconfig.json :**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 12. User Stories

### 12.1 Module FMPA

#### US-FMPA-001 : Créer une FMPA
**En tant que** Chef de centre  
**Je veux** créer une formation/manœuvre/présence active  
**Afin de** planifier les activités du centre

**Critères d'acceptance :**
- [ ] Formulaire avec tous les champs (type, titre, dates, lieu, max participants)
- [ ] Validation temps réel
- [ ] Génération automatique QR code
- [ ] Status initial : DRAFT
- [ ] Email de notification aux admin/managers
- [ ] Redirect vers page détail après création

#### US-FMPA-002 : S'inscrire à une FMPA
**En tant que** Sapeur-pompier  
**Je veux** m'inscrire à une activité  
**Afin de** participer

**Critères d'acceptance :**
- [ ] Bouton "S'inscrire" visible si FMPA published
- [ ] Vérification places disponibles
- [ ] Inscription instantanée ou en attente validation
- [ ] Confirmation par email
- [ ] Apparition dans la liste des participants
- [ ] Possibilité de se désinscrire (si > 24h avant)

#### US-FMPA-003 : Pointer sa présence
**En tant que** Sapeur-pompier  
**Je veux** scanner le QR code pour pointer  
**Afin de** confirmer ma présence

**Critères d'acceptance :**
- [ ] Scan QR code via PWA
- [ ] Vérification code + inscription
- [ ] Enregistrement timestamp checkIn
- [ ] Status passe à PRESENT
- [ ] Toast de confirmation
- [ ] Impossible de pointer 2 fois

#### US-FMPA-004 : Exporter liste émargement
**En tant que** Chef de centre  
**Je veux** exporter la liste des participants en PDF  
**Afin de** avoir un document signable

**Critères d'acceptance :**
- [ ] Bouton "Exporter PDF"
- [ ] PDF avec logo SDIS, titre FMPA, date/lieu
- [ ] Tableau : Nom, Prénom, Matricule, Signature (vide)
- [ ] Horodatage du document
- [ ] Téléchargement automatique

### 12.2 Module Messagerie

#### US-MSG-001 : Envoyer un message
**En tant que** Utilisateur  
**Je veux** envoyer un message à un collègue  
**Afin de** communiquer rapidement

**Critères d'acceptance :**
- [ ] Liste des conversations à gauche
- [ ] Zone de saisie avec bouton envoyer
- [ ] Message apparaît instantanément
- [ ] Réception temps réel via WebSocket
- [ ] Support Shift+Enter pour nouvelle ligne
- [ ] Indicateur "vu" quand lu

#### US-MSG-002 : Créer conversation de groupe
**En tant que** Manager  
**Je veux** créer un groupe de discussion  
**Afin de** communiquer avec une équipe

**Critères d'acceptance :**
- [ ] Bouton "Nouveau groupe"
- [ ] Sélection multi-utilisateurs
- [ ] Champ nom du groupe
- [ ] Avatar optionnel
- [ ] Création instantanée
- [ ] Tous les membres notifiés

---

## 13. Workflows Métier

### 13.1 Workflow Inscription FMPA

```mermaid
graph TD
    A[Utilisateur voit FMPA] --> B{FMPA Published?}
    B -->|Non| C[Badge DRAFT - Pas d'inscription]
    B -->|Oui| D{Places disponibles?}
    D -->|Non| E[Badge COMPLET]
    D -->|Oui| F[Bouton S'inscrire actif]
    F --> G{Nécessite validation?}
    G -->|Oui| H[Status PENDING]
    G -->|Non| I[Status CONFIRMED]
    H --> J[Admin valide]
    J --> I
    I --> K[Email confirmation]
    K --> L[Utilisateur dans liste participants]
```

### 13.2 Workflow Check-in

```mermaid
graph TD
    A[Jour J - FMPA] --> B[Utilisateur ouvre PWA]
    B --> C[Scan QR Code]
    C --> D{Code valide?}
    D -->|Non| E[Erreur : Code invalide]
    D -->|Oui| F{Utilisateur inscrit?}
    F -->|Non| G[Erreur : Non inscrit]
    F -->|Oui| H{Déjà pointé?}
    H -->|Oui| I[Message : Déjà présent]
    H -->|Non| J[Enregistrement checkInTime]
    J --> K[Status → PRESENT]
    K --> L[Toast succès]
    L --> M[Apparaît dans liste présents]
```

### 13.3 Workflow Validation Formation

```mermaid
graph TD
    A[Utilisateur s'inscrit] --> B[Status PENDING]
    B --> C[Email notification Manager]
    C --> D[Manager examine demande]
    D --> E{Décision}
    E -->|Approuver| F[Status → APPROVED]
    E -->|Refuser| G[Status → REJECTED + motif]
    F --> H[Email confirmation utilisateur]
    G --> I[Email refus utilisateur]
    H --> J[Utilisateur dans liste participants]
    I --> K[Possibilité réinscription]
```

---

## 14. Critères d'Acceptance par Phase

### Phase 1 : Foundation

**Critères GO :**
- [ ] Next.js build sans erreur
- [ ] Prisma migrate fonctionne
- [ ] Seed data complet s'exécute
- [ ] Page d'accueil s'affiche
- [ ] Tailwind fonctionne
- [ ] Au moins 1 test unitaire passe
- [ ] Deploy staging réussi

### Phase 2 : Auth & Multi-tenancy

**Critères GO :**
- [ ] Login fonctionne avec email/password
- [ ] JWT généré et valide
- [ ] Refresh token fonctionne
- [ ] Protection routes effective
- [ ] Subdomain routing opérationnel
- [ ] Tenant isolation vérifiée (pas d'accès cross-tenant)
- [ ] Tests E2E login/logout passent

### Phase 3 : Module FMPA

**Critères GO :**
- [ ] CRUD FMPA complet
- [ ] Inscriptions fonctionnelles
- [ ] QR code généré et scannable
- [ ] Export PDF fonctionne
- [ ] Notifications envoyées
- [ ] Tests E2E workflow complet passent
- [ ] Performance < 2s pour liste 100 FMPA

### Phase 4 : Messagerie

**Critères GO :**
- [ ] WebSocket connecté et stable
- [ ] Messages temps réel (< 500ms)
- [ ] Historique messages paginé
- [ ] Indicateurs lecture fonctionnels
- [ ] Reconnexion automatique
- [ ] Tests charge 100 users simultanés
