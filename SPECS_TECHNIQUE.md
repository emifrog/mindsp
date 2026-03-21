# Specifications Techniques - MindSP

**Version :** 3.0
**Date :** 21 Mars 2026
**Projet :** Solution SaaS multi-tenant de gestion SDIS

---

## 1. Architecture Generale

### 1.1 Stack Technique

```yaml
Frontend:
  - Framework: Next.js 14.2 (App Router)
  - Language: TypeScript 5.6
  - UI Library: React 18.3
  - Styling: TailwindCSS 3.4 + Shadcn/ui + Radix UI
  - State: SWR 2.4 (cache client, deduplication 30s, mutations optimistes)
  - Forms: React Hook Form + Zod 3.25
  - Temps reel: Supabase Realtime (WebSocket)
  - Animations: Framer Motion 12
  - Icons: Lucide React + Emojis Unicode
  - PDF: jsPDF + html2canvas

Backend:
  - Runtime: Node.js 20+ LTS
  - Framework: Next.js 14 API Routes (72 routes)
  - ORM: Prisma 5.22 (59 modeles, 49 enums)
  - Database: PostgreSQL (Supabase)
  - Cache: Upstash Redis (TTL 5-60 min, invalidation cascade)
  - Auth: NextAuth.js v5 beta.22 (JWT, multi-tenant)
  - Rate Limiting: Upstash Ratelimit (4 niveaux)
  - Email: Resend
  - Monitoring: Sentry 10.45 (error tracking + replays)
  - Search: PostgreSQL pg_trgm (10 index GIN trigram)

Infrastructure:
  - Hosting App: Vercel (region cdg1 - Paris)
  - Hosting Socket: Render (Web Service Node.js)
  - Database: PostgreSQL (Supabase)
  - Cache/Rate Limit: Upstash Redis (Frankfurt)
  - Storage: UploadThing
  - CI/CD: GitHub Actions
  - Monitoring: Sentry (region EU - Frankfurt)
```

### 1.2 Architecture Systeme

```
+-----------------------------------------------------------+
|                    Client Browser / PWA                     |
|  Next.js 14 (React 18) + TailwindCSS + SWR + Sentry      |
+------------+----------------------------+-----------------+
             |                            |
             | HTTPS/REST                | Supabase Realtime
             |                            |
+------------v----------------------------v-----------------+
|              Next.js App Router (Vercel - cdg1)            |
|  +----------------+  +---------------+  +---------------+ |
|  | 72 API Routes  |  | Middleware    |  | Supabase      | |
|  | (force-dynamic)|  | - Auth (JWT) |  | Realtime      | |
|  |                |  | - Tenant     |  | (Chat, notif) | |
|  |                |  | - Rate Limit |  |               | |
|  +-------+--------+  +-------+-------+  +---------------+ |
+-----------+-------------------+----------------------------+
            |                   |
+-----------v----------+  +----v---------------------------+
|  Prisma 5.22         |  |   Upstash Redis (Frankfurt)    |
|  59 modeles          |  |   - Cache 9 endpoints (5-60m)  |
|  Slow query >500ms   |  |   - Rate Limiting (4 niveaux)  |
+-----------+----------+  +--------------------------------+
            |
+-----------v--------------------------------------------------+
|              PostgreSQL (Supabase)                             |
|  - Multi-tenant (tenantId sur chaque modele)                  |
|  - 12 index composes B-tree sur 6 modeles                     |
|  - 10 index GIN pg_trgm pour recherche ILIKE                  |
|  - JSONB pour config flexible                                 |
+---------------------------------------------------------------+

Services externes:
  - Resend (emails transactionnels)
  - Sentry (error tracking + session replay)
  - UploadThing (file storage)
  - Render (Socket.IO server)
```

---

## 2. Base de Donnees

### 2.1 Vue d'ensemble

- **59 modeles** Prisma, **49 enums**
- Schema complet : `prisma/schema.prisma`
- Multi-tenant : chaque modele porte un `tenantId`
- Migrations : `prisma/migrations/`

### 2.2 Modeles par module

| Module | Modeles |
|--------|---------|
| **Core** | Tenant, User, UserSettings, UserPresence, RefreshToken, AuditLog, PushSubscription |
| **FMPA** | FMPA, Participation, FMPAMealRegistration |
| **Formations** | Formation, FormationRegistration, TrainingRegistration |
| **Personnel** | PersonnelFile, Qualification, MedicalStatus, Equipment, GradeHistory, Medal, PersonnelDocument |
| **Chat** | ChatChannel, ChatChannelMember, ChatMessage, ChatAttachment, ChatReaction, ChatMention |
| **Messaging** | Message, MessageRead, Conversation, ConversationMember, MessagePoll, PollOption, PollResponse, MessageEventInvitation, InvitationResponse, MessageTrainingProposal, MailingList, MailingListMember, UserFavorite |
| **Mail** | MailMessage, MailRecipient, MailAttachment, MailLabel |
| **Calendrier** | CalendarEvent, EventParticipant, AgendaEvent, AgendaEventParticipant, AgendaEventReminder, Availability, Event, EventParticipation |
| **Contenu** | NewsArticle, Portal, PortalPage, PortalDocument, Document, Notification |
| **TTA** | TTAEntry, TTAExport |

### 2.3 Enums principales

| Enum | Valeurs |
|------|---------|
| UserRole | SUPER_ADMIN, ADMIN, MANAGER, USER |
| TenantStatus | ACTIVE, SUSPENDED, TRIAL, CANCELLED |
| FMPAType | FORMATION, MANOEUVRE, EXERCICE, PRESENCE_ACTIVE, CEREMONIE |
| FMPAStatus | DRAFT, PUBLISHED, IN_PROGRESS, COMPLETED, CANCELLED |
| FormationCategory | INCENDIE, SECOURS, TECHNIQUE, MANAGEMENT, REGLEMENTAIRE |
| ParticipationStatus | REGISTERED, CONFIRMED, PRESENT, ABSENT, EXCUSED |
| CalendarEventType | FMPA, FORMATION, MEETING, INTERVENTION, GARDE |
| ActivityType | FMPA, INTERVENTION, FORMATION, GARDE, ASTREINTE |
| NotificationType | 15+ types (CHAT_MESSAGE, MAIL_RECEIVED, FMPA_REMINDER, etc.) |
| QualificationType | FORMATION, SPECIALITE, PERMIS, HABILITATION, AUTRE |
| AptitudeStatus | APT, INAPT_TEMP, INAPT_DEF, RESTRICTIONS |

### 2.4 Index

- **12 index composes B-tree** sur User, FMPA, Participation, Formation, ChatMessage, Notification
- **10 index GIN pg_trgm** pour recherches `ILIKE %query%` sur User, FMPA, Formation, ChatMessage, MailMessage, NewsArticle, PersonnelFile, ChatChannel, PortalDocument, Qualification

---

## 3. Structure de Fichiers

```
mindsp/
  prisma/
    schema.prisma          # 59 modeles, 49 enums
    migrations/            # 3 migrations
    seed/                  # Seed data
    seed-demo-complete.ts  # Seed complet demo sdis06
  src/
    app/
      (dashboard)/         # 40 pages protegees
        page.tsx           # Dashboard principal
        fmpa/              # Gestion FMPA (6 pages)
        formations/        # Formations (5 pages)
        personnel/         # Fiches personnel (2 pages)
        chat/              # Chat temps reel
        mailbox/           # Messagerie interne
        messages/          # Conversations (3 pages)
        messaging/         # Listes, sondages (2 pages)
        agenda/            # Agenda/calendrier (5 pages)
        actualites/        # News articles
        tta/               # Tableau temps activite (4 pages)
        notifications/     # Centre notifications
        portails/          # Portails d'info
        documents/         # GED
        settings/          # Profil + notifications
        search/            # Recherche globale
        admin/             # Administration
      auth/
        login/             # Connexion (Suspense + searchParams)
        register/          # Inscription
        logout/            # Deconnexion auto
        error/             # Erreur auth
      api/                 # 72 routes API
      error.tsx            # Error boundary global
      not-found.tsx        # Page 404
      layout.tsx           # Layout racine (Sentry, PWA, theme)
    components/            # 94 composants
      layout/              # Header, Sidebar, Footer
      ui/                  # Shadcn/ui (Button, Card, Badge, etc.)
      chat/                # ChatLayout, MessageList, ChannelList
      fmpa/                # FMPATable, FMPACalendar, FMPAStats
      formations/          # FormationsCalendar, FormationCard
      personnel/           # CareerTimeline, QualificationsList
      mailbox/             # MessageList, ComposeDialog
      notifications/       # NotificationBell
      theme/               # ThemeToggle, ThemeProvider
      cookie/              # CookieConsent (RGPD)
    hooks/                 # 5 hooks custom
      use-toast.ts
      use-notifications.ts # SWR + mutations optimistes
      use-debounce.ts
    lib/                   # 36 modules
      prisma.ts            # Client Prisma + slow query middleware
      auth.ts              # Config NextAuth (callbacks, JWT)
      auth-config.ts       # Export auth(), signIn, signOut
      cache.ts             # CacheService Redis (getOrSet, invalidation)
      rate-limit.ts        # 4 niveaux rate limiting (Proxy lazy)
      email.ts             # Service email Resend
      notification-service.ts # NotificationService (create, push, batch)
      socket-client.ts     # Socket.IO client (optionnel)
      supabase.ts          # Supabase client (Proxy lazy)
      icons.ts             # Registre emojis Unicode
      fetcher.ts           # SWR fetcher
    contexts/              # SidebarContext
    types/                 # 6 fichiers types
  public/
    logo.png, logo-banner.png, favicon.ico
    manifest.json          # PWA manifest
    sw.js                  # Service worker
    icons/                 # App icons
  socket-server/
    server.js              # Serveur Socket.IO (Render)
  sentry.client.config.ts
  sentry.server.config.ts
  sentry.edge.config.ts
  next.config.js           # withSentryConfig + CSP + optimizePackageImports
  middleware.ts            # Auth + tenant + rate limiting
```

### 3.1 Statistiques du code

| Metrique | Valeur |
|----------|--------|
| Fichiers source (ts/tsx) | 278 |
| Lignes de code | 42 484 |
| API Routes | 72 |
| Composants React | 94 |
| Pages | 46 |
| Hooks custom | 5 |
| Modules lib/ | 36 |
| Types | 6 |

---

## 4. API Routes (72)

### 4.1 Authentification

| Methode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/[...nextauth] | NextAuth handlers (login, session, etc.) |
| POST | /api/auth/register | Inscription utilisateur |

### 4.2 FMPA (12 routes)

| Methode | Route | Description |
|---------|-------|-------------|
| GET/POST | /api/fmpa | Liste / Creer FMPA |
| GET/PATCH/DELETE | /api/fmpa/[id] | Detail / Modifier / Supprimer |
| GET | /api/fmpa/[id]/export | Export Excel |
| POST | /api/fmpa/[id]/meal | Inscription repas |
| PATCH | /api/fmpa/[id]/participants/[pid]/validate | Valider presence |
| GET | /api/fmpa/[id]/qrcode | Generer QR Code |
| POST | /api/fmpa/[id]/register | Inscription participant |
| GET | /api/fmpa/[id]/stats | Stats par FMPA (groupBy) |
| GET | /api/fmpa/participations/history | Historique participations |
| POST | /api/fmpa/reminders | Envoi rappels J-1 |
| GET | /api/fmpa/statistics | Stats globales FMPA |
| GET | /api/fmpa/team-stats | Stats equipe (export) |

### 4.3 Formations (5 routes)

| Methode | Route | Description |
|---------|-------|-------------|
| GET/POST | /api/formations | Liste / Creer |
| GET/PATCH/DELETE | /api/formations/[id] | Detail / Modifier / Supprimer |
| POST | /api/formations/[id]/register | Inscription |
| GET | /api/formations/registrations/[id]/certificate | Generer certificat |
| PATCH | /api/formations/registrations/[id]/validate | Valider inscription |

### 4.4 Personnel (4 routes)

| Methode | Route | Description |
|---------|-------|-------------|
| GET | /api/personnel/alerts | Alertes qualifications/aptitudes |
| GET/POST | /api/personnel/files | Liste / Creer fiche |
| GET/PATCH | /api/personnel/files/[id] | Detail / Modifier |
| GET/POST | /api/personnel/qualifications | Liste / Creer |

### 4.5 Messagerie (11 routes)

| Methode | Route | Description |
|---------|-------|-------------|
| GET/POST | /api/conversations | Conversations |
| GET/POST | /api/conversations/[id]/messages | Messages conversation |
| GET | /api/messaging/directory | Annuaire |
| GET/POST | /api/messaging/favorites | Favoris |
| POST | /api/messaging/invitations/[id]/respond | Repondre invitation |
| GET/POST | /api/messaging/lists | Listes de diffusion |
| GET/PATCH/DELETE | /api/messaging/lists/[id] | Detail liste |
| POST/DELETE | /api/messaging/lists/[id]/members | Membres liste |
| POST/GET | /api/messaging/polls/[id]/vote | Voter / Resultats sondage |
| POST | /api/messaging/training-proposals/[id]/register | Inscription formation via message |

### 4.6 Chat (2 routes)

| Methode | Route | Description |
|---------|-------|-------------|
| GET/POST | /api/chat/channels | Canaux chat |
| GET/POST | /api/chat/channels/[id]/messages | Messages canal |

### 4.7 Mail (4 routes)

| Methode | Route | Description |
|---------|-------|-------------|
| GET | /api/mail/inbox | Boite de reception |
| GET/POST | /api/mail/messages | Liste / Envoyer mail |
| GET/PATCH/DELETE | /api/mail/messages/[id] | Detail / Modifier / Supprimer |
| GET | /api/mail/stats | Stats mail |

### 4.8 Calendrier (7 routes)

| Methode | Route | Description |
|---------|-------|-------------|
| GET/POST | /api/agenda/events | Evenements agenda |
| GET/PATCH/DELETE | /api/agenda/events/[id] | Detail evenement |
| POST/DELETE | /api/agenda/events/[id]/participants | Participants |
| GET/POST | /api/calendar/availability | Disponibilites |
| GET/POST | /api/calendar/events | Evenements calendrier (cache Redis) |
| GET/PATCH/DELETE | /api/calendar/events/[id] | Detail (invalide cache) |
| POST | /api/calendar/events/[id]/respond | Repondre invitation |

### 4.9 Contenu (8 routes)

| Methode | Route | Description |
|---------|-------|-------------|
| GET/POST | /api/news | Actualites (cache Redis) |
| GET/POST | /api/portals | Portails |
| GET/PATCH/DELETE | /api/portals/[id] | Detail portail |
| GET/POST | /api/portal-documents | Documents portail |
| GET | /api/search | Recherche globale (6 sources, Promise.all, cache) |
| GET | /api/users | Utilisateurs (pagine, cache Redis) |
| GET | /api/audit | Journal audit |
| POST | /api/uploadthing | Upload fichiers |

### 4.10 Notifications (6 routes)

| Methode | Route | Description |
|---------|-------|-------------|
| GET | /api/notifications | Liste notifications |
| DELETE | /api/notifications/[id] | Supprimer |
| PATCH | /api/notifications/[id]/read | Marquer lu |
| POST | /api/notifications/read-all | Tout marquer lu |
| GET | /api/notifications/stats | Stats (cache Redis) |
| POST/DELETE | /api/push/subscribe | Inscription push |
| POST | /api/push/send | Envoyer push |
| DELETE | /api/push/unsubscribe | Desinscription push |

### 4.11 TTA (4 routes)

| Methode | Route | Description |
|---------|-------|-------------|
| GET/POST | /api/tta/entries | Entrees TTA |
| GET/PATCH/DELETE | /api/tta/entries/[id] | Detail entree |
| PATCH | /api/tta/entries/[id]/validate | Valider entree |
| GET | /api/tta/export | Export TTA |

### 4.12 Settings & Admin (5 routes)

| Methode | Route | Description |
|---------|-------|-------------|
| GET/PATCH | /api/settings/profile | Profil utilisateur |
| GET/PATCH | /api/settings/notifications | Preferences notifications |
| GET/PATCH | /api/onboarding | Onboarding status |
| GET | /api/health | Health check |
| GET | /api/admin/queues/stats | Stats BullMQ |
| GET | /api/emargement/[id] | Feuille emargement |

---

## 5. Authentification & Securite

### 5.1 NextAuth v5

```typescript
// src/lib/auth.ts
- Provider: Credentials (email + password + tenantSlug)
- Strategy: JWT (30 jours)
- Token custom: id, role, tenantId, tenantSlug
- Session: user.id, user.role, user.tenantId, user.tenantSlug
- Pages: /auth/login, /auth/logout, /auth/error
```

### 5.2 Middleware (src/middleware.ts)

1. **Rate limiting** sur toutes les routes API (100 req/min)
2. **Auth check** : redirige vers /auth/login si pas de token JWT
3. **Tenant extraction** : sous-domaine en production (sdis13.mindsp.fr)
4. **Headers injection** : x-tenant-id, x-tenant-slug, x-user-id, x-user-role

### 5.3 Rate Limiting (4 niveaux)

| Limiter | Limite | Usage |
|---------|--------|-------|
| apiLimiter | 100 req/min | Toutes les API |
| authLimiter | 5 req/15 min | Login/register |
| registerLimiter | 3 req/heure | Creation compte |
| sensitiveLimiter | 10 req/min | Actions sensibles |

### 5.4 Headers de securite (next.config.js)

- Content-Security-Policy (connect-src whitelist Sentry, Supabase, Upstash)
- Strict-Transport-Security (HSTS 2 ans, preload)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy (camera, microphone, geolocation desactives)
- worker-src 'self' blob: (pour Sentry)

---

## 6. Multi-Tenancy

### 6.1 Architecture

- Chaque modele Prisma porte un `tenantId` (FK vers Tenant)
- Isolation via `where: { tenantId: session.user.tenantId }` dans chaque route
- Sous-domaine routing en production : `sdis13.mindsp.fr` → tenant sdis13
- Middleware verifie coherence sous-domaine / token JWT

### 6.2 Tenants disponibles

| Slug | Nom | Status |
|------|-----|--------|
| sdis13 | SDIS des Bouches-du-Rhone | ACTIVE |
| sdis06 | SDIS des Alpes-Maritimes | ACTIVE (demo) |

### 6.3 Roles utilisateur

| Role | Permissions |
|------|------------|
| SUPER_ADMIN | Tout |
| ADMIN | Gestion tenant complete |
| MANAGER | Gestion equipe, FMPA, formations |
| USER | Consultation, participation |

---

## 7. Cache & Performance

### 7.1 Cache Redis (9 endpoints)

| Endpoint | TTL | Cle |
|----------|-----|-----|
| /api/users | 5 min | users:{tenantId}:{search}:{page}:{limit} |
| /api/search | 5 min | search:{tenantId}:{query}:{type}:{dates}:{limit} |
| /api/calendar/events | 5 min | calendar:{tenantId}:{start}:{end}:{type} |
| /api/news | 5 min | news:{tenantId}:{page}:{limit}:{filters} |
| /api/mail/inbox | 5 min | mail:{tenantId}:{userId}:{page} |
| /api/portals | 15 min | portals:{tenantId} |
| /api/fmpa/[id]/stats | 5 min | fmpa:stats:{id} |
| /api/fmpa/team-stats | 15 min | stats:team:{tenantId} |
| /api/notifications/stats | 5 min | notif:stats:{userId} |

### 7.2 Invalidation cascade

- POST/PATCH/DELETE calendar/events → `deletePattern(calendar:{tenantId}:*)`
- POST news → `deletePattern(news:{tenantId}:*)`

### 7.3 Optimisations queries

- N+1 elimines dans /api/fmpa/statistics (groupBy + findMany batch)
- createMany avec skipDuplicates (messaging/lists/members, polls/vote)
- Promise.all 6 sources paralleles (/api/search)
- Slow query logging >500ms (Prisma middleware)

### 7.4 Optimisations frontend

- SWR cache client (deduplication 30s, mutations optimistes)
- useMemo sur 5 composants calendrier/stats
- React.memo sur 4 composants liste (Message, ParticipantItem, etc.)
- optimizePackageImports: lucide-react, date-fns, framer-motion

---

## 8. PWA & Offline

### 8.1 Configuration

```json
// public/manifest.json
{
  "name": "MindSP - Gestion SDIS",
  "short_name": "MindSP",
  "theme_color": "#1e40af",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "scope": "/"
}
```

### 8.2 Service Worker

- Fichier : `public/sw.js`
- Charge en lazy (`strategy="lazyOnload"`)
- Push notifications via Web Push API
- Page offline : `/offline`

### 8.3 Push Notifications

- Modele : PushSubscription (userId, endpoint, keys)
- API : /api/push/subscribe, /api/push/send, /api/push/unsubscribe
- Service : WebPushService (VAPID keys)

---

## 9. Monitoring & Observabilite

### 9.1 Sentry

```typescript
// sentry.client.config.ts
- tracesSampleRate: 0.1 (10% des transactions)
- replaysSessionSampleRate: 0 (pas de replay normal)
- replaysOnErrorSampleRate: 1.0 (replay sur erreur)
- ignoreErrors: ResizeObserver, Non-Error promise, Load failed
```

### 9.2 Health Check

- Endpoint : GET /api/health
- Verifie : connexion DB, uptime, version

### 9.3 Audit Log

- Modele : AuditLog (action, entity, entityId, changes, metadata)
- API : GET /api/audit

---

## 10. Deploiement

### 10.1 Vercel

```json
// vercel.json
{
  "buildCommand": "prisma generate --no-engine && next build",
  "framework": "nextjs",
  "regions": ["cdg1"]
}
```

### 10.2 Variables d'environnement requises

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string (pooler) |
| DIRECT_URL | PostgreSQL direct connection (migrations) |
| NEXTAUTH_URL | URL de l'app (sans / final) |
| NEXTAUTH_SECRET | Secret JWT (base64 32 bytes) |
| UPSTASH_REDIS_REST_URL | Upstash Redis endpoint |
| UPSTASH_REDIS_REST_TOKEN | Upstash Redis token (read-write) |
| NEXT_PUBLIC_SENTRY_DSN | Sentry DSN |
| SENTRY_ORG | Organisation Sentry |
| SENTRY_PROJECT | Projet Sentry |
| SENTRY_AUTH_TOKEN | Token auth Sentry |
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anon key |
| NEXT_PUBLIC_SOCKET_URL | Socket.IO server URL (Render) |
| RESEND_API_KEY | Cle API Resend |
| UPLOADTHING_SECRET | Secret UploadThing |
| UPLOADTHING_APP_ID | App ID UploadThing |
| ALLOWED_ORIGINS | Origines autorisees (comma-separated) |

### 10.3 Build

```
TypeScript: ignoreBuildErrors = false (strict)
ESLint: ignoreDuringBuilds = false (strict)
@ts-nocheck: 0 fichiers
First Load JS shared: ~158 KB (dont ~70 KB Sentry)
```

---

## 11. Compte Demo

```
Tenant: sdis06 (SDIS des Alpes-Maritimes)
Email: demo@sdis06.fr
Mot de passe: Demo2026!
Role: ADMIN (acces complet)
```

Donnees de demo : 11 utilisateurs, 12 FMPA, formations, fiches personnel, actualites, notifications.
