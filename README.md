# MindSP - Plateforme SaaS de Gestion SDIS

Solution SaaS multi-tenant pour la gestion des Services Departementaux d'Incendie et de Secours (SDIS).

**Version** : 2.1.0
**Statut** : Production-ready
**Derniere mise a jour** : Mars 2026

---

## Etat du Projet

- **271 fichiers** source TypeScript/TSX
- **~41 400 lignes** de code
- **59 modeles** Prisma + **49 enums**
- **71 API routes**
- **94 composants** React
- **43 pages** Next.js
- **8 modules metier** complets

---

## Stack Technique

### Frontend

- **Framework** : Next.js 14.2 (App Router)
- **UI** : React 18.3 + TypeScript 5.6
- **Styling** : TailwindCSS + Radix UI + shadcn/ui
- **State** : Zustand + SWR (cache client + deduplication)
- **Forms** : React Hook Form + Zod
- **Temps reel** : Supabase Realtime
- **Upload** : UploadThing
- **PDF** : jsPDF + html2canvas
- **Dates** : date-fns
- **Icons** : Lucide React
- **Animations** : Framer Motion

### Backend

- **Runtime** : Node.js 20+
- **Framework** : Next.js 14 API Routes
- **ORM** : Prisma 5 (59 modeles)
- **Database** : PostgreSQL (Supabase)
- **Cache** : Upstash Redis (TTL 5-60 min, invalidation cascade)
- **Auth** : NextAuth.js v5 (JWT, multi-tenant)
- **Queue** : BullMQ (optionnel)
- **Rate Limiting** : Upstash Ratelimit (4 niveaux : API, Auth, Register, Sensitive)
- **Email** : Resend (bienvenue, reset password, rappels FMPA)
- **Monitoring** : Sentry (error tracking, 10% transactions)

### Infrastructure

- **Frontend + API** : Vercel (region cdg1 - Paris)
- **Database** : PostgreSQL (Supabase)
- **Temps reel** : Supabase Realtime
- **Cache** : Upstash Redis
- **Storage** : UploadThing
- **CDN** : Vercel Edge Network
- **CI/CD** : GitHub Actions (tsc + build sur chaque PR)
- **Monitoring** : Sentry + slow query logging (>500ms)

---

## Modules

### 1. FMPA - Formation, Manoeuvre, Presence Active

- Gestion complete des activites operationnelles (7 types)
- Inscriptions en ligne avec quotas
- Gestion repas et regimes speciaux
- Validation presences par chef
- Rappels automatiques (J-7, J-3, J-1) par email
- Exports PDF/Excel (feuilles emargement, rapports)
- QR codes pour emargement automatique
- Statistiques avancees (groupBy optimise, 0 N+1)

### 2. Messagerie & Chat

- Chat temps reel via Supabase Realtime
- Canaux publics/prives/directs
- Typing indicators et presence en ligne
- Reactions emoji et threads
- Mailbox email interne (5 dossiers)
- Pieces jointes (UploadThing)
- Listes de diffusion (createMany batch)
- Sondages avec votes

### 3. Agenda

- Calendrier multi-activites (mois/semaine/jour)
- Gestion disponibilites (Available, Unavailable, Partial)
- 7 types d'evenements
- Systeme d'invitations avec reponses
- Export iCal
- Integration FMPA et Formations
- Cache Redis avec invalidation sur creation/modification

### 4. Personnel

- Fiches personnel completes (7 modeles DB)
- Aptitudes medicales avec alertes expiration
- Qualifications et competences
- Equipements individuels (EPI)
- Timeline carriere interactive
- Historique grades, promotions, medailles
- Dashboard alertes (30j, 15j, 7j)

### 5. Formations

- Catalogue formations avec filtres
- 6 categories et 4 niveaux
- Calendrier mensuel formations
- Workflow inscriptions complet
- Validation hierarchique
- Generation attestations PDF
- Suivi presences et resultats

### 6. TTA - Temps de Travail Additionnel

- Saisie heures (normales, nuit, dimanche, ferie)
- Calcul automatique indemnites et majorations
- Validation heures par chef de centre
- Calendrier mensuel TTA avec statistiques
- Export SEPA XML (pain.001.001.03) et CSV/Excel

### 7. Portails & Communication

- Portails SDIS et specialistes
- Actualites avec 7 categories
- Documents partages avec recherche
- Gestion permissions et visibilite

### 8. Notifications

- Notifications push temps reel (Web Push API)
- 10+ types de notifications
- 4 niveaux de priorite (LOW, NORMAL, HIGH, URGENT)
- Groupement temporel intelligent
- Actions personnalisees

---

## Securite

- Authentification NextAuth.js v5 avec JWT
- Multi-tenancy avec isolation complete des donnees (tenantId sur chaque modele)
- Protection routes avec middleware (public routes, rate limiting, tenant headers)
- Validation Zod sur toutes les entrees
- Content Security Policy (CSP) strict
- Rate limiting 4 niveaux (API 100/min, Auth 5/15min, Register 3/h, Sensitive 10/min)
- Audit logs complets
- Sanitisation inputs (XSS, injection)
- Chiffrement bcrypt pour mots de passe
- HSTS 2 ans avec preload
- TypeScript strict (0 erreur, 0 @ts-nocheck, ignoreBuildErrors: false)
- Bandeau consentement cookies RGPD

---

## Performance

| Metrique | Valeur |
| ------------ | ------ |
| First Load JS shared | ~158 KB (dont ~70 KB Sentry) |
| API Response | ~100ms |
| DB Queries | Optimisees (groupBy, indexes composes, N+1 resolus) |
| Cache | Redis TTL 5-60 min selon type, invalidation cascade |
| Slow queries | Logging auto >500ms |

- Pagination sur toutes les routes API
- Cache Redis avec invalidation automatique parent-enfant
- SWR cote client (deduplication 30s, mutations optimistes)
- useMemo sur calculs couteux (5 composants calendrier/stats)
- React.memo sur items de listes (4 composants)
- optimizePackageImports: lucide-react, date-fns, framer-motion
- Requetes search parallelisees (Promise.all 6 sources)
- createMany batch pour insertions multiples

---

## Demarrage Rapide

### Prerequis

Node.js 20+, PostgreSQL 14+

### Installation

```bash
# Cloner le repo
git clone https://github.com/emifrog/mindsp.git
cd mindsp

# Installer les dependances
npm install

# Configurer les variables d'environnement
cp .env.example .env

# Generer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

# Creer un compte demo (optionnel)
npx tsx prisma/seed-demo.ts

# Lancer le serveur de developpement
npm run dev
```

### Variables d'environnement essentielles

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Email (Resend)
RESEND_API_KEY="..."
EMAIL_FROM="MindSP <noreply@mindsp.fr>"

# Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN="..."
SENTRY_ORG="..."
SENTRY_PROJECT="..."
```

### Deploiement Vercel

```bash
# Build
prisma generate --no-engine && next build

# Deployer
vercel --prod
```

Configurer les variables d'environnement dans Vercel Dashboard > Settings > Environment Variables.

### Health Check

```
GET /api/health
```

Retourne le status DB + Redis, uptime, version, latence.

---

## CI/CD

Pipeline GitHub Actions (`.github/workflows/ci.yml`) :
- Declenche sur push main et PR
- `prisma generate` + `tsc --noEmit` + `next build`
- TypeScript strict (0 erreur toleree)

---

## API Routes (71)

### Auth
- POST /api/auth/register
- GET/POST /api/auth/[...nextauth]

### FMPA (12 routes)
- GET/POST /api/fmpa
- GET/PATCH/DELETE /api/fmpa/[id]
- POST /api/fmpa/[id]/register
- GET /api/fmpa/[id]/export
- GET /api/fmpa/[id]/stats
- GET /api/fmpa/statistics
- GET /api/fmpa/team-stats
- GET /api/fmpa/participations/history
- POST /api/fmpa/reminders

### Messagerie (10 routes)
- GET/POST /api/conversations
- GET/POST /api/conversations/[id]/messages
- GET/POST /api/chat/channels
- GET/POST /api/chat/channels/[id]/messages
- GET/POST /api/messaging/lists
- POST /api/messaging/lists/[id]/members
- POST /api/messaging/polls/[id]/vote

### Calendrier (5 routes)
- GET/POST /api/calendar/events
- PATCH/DELETE /api/calendar/events/[id]
- POST /api/calendar/events/[id]/respond

### Formations (5 routes)
- GET/POST /api/formations
- GET /api/formations/[id]
- POST /api/formations/[id]/register
- POST /api/formations/registrations/[id]/validate

### Mail (4 routes)
- GET /api/mail/inbox
- GET/POST /api/mail/messages
- GET /api/mail/stats

### Personnel (4 routes)
- GET /api/personnel/alerts
- GET/POST /api/personnel/files
- GET/POST /api/personnel/qualifications

### TTA (4 routes)
- GET/POST /api/tta/entries
- PUT /api/tta/entries/[id]/validate
- GET /api/tta/export

### Autres
- GET /api/users
- GET /api/search
- GET/POST /api/notifications
- GET /api/news
- GET /api/portals
- GET /api/health
- GET/POST /api/onboarding
- POST /api/push/subscribe

---

## License

Proprietaire - Tous droits reserves

---

## Equipe

Developpe pour les SDIS de France
