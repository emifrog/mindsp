# MindSP - Plateforme SaaS de Gestion SDIS

Solution SaaS multi-tenant pour la gestion des Services Departementaux d'Incendie et de Secours (SDIS).

**Version** : 2.2.0
**Statut** : Production (deploye sur Vercel)
**Derniere mise a jour** : Mars 2026

---

## Etat du Projet

- **283 fichiers** source TypeScript/TSX
- **~43 500 lignes** de code
- **59 modeles** Prisma + **49 enums**
- **72 API routes**
- **94 composants** React
- **46 pages** Next.js
- **8 modules metier** complets
- **3 connecteurs** d'integration externes

---

## Stack Technique

### Frontend

- **Framework** : Next.js 14.2 (App Router)
- **UI** : React 18.3 + TypeScript 5.6
- **Styling** : TailwindCSS + Radix UI + shadcn/ui
- **State** : Zustand + SWR (cache client + deduplication)
- **Forms** : React Hook Form + Zod
- **Temps reel** : Supabase Realtime + Socket.IO
- **Upload** : UploadThing
- **PDF** : jsPDF + html2canvas
- **Dates** : date-fns
- **Icons** : Lucide React
- **Animations** : Framer Motion

### Backend

- **Runtime** : Node.js 20+
- **Framework** : Next.js 14 API Routes
- **ORM** : Prisma 5.22 (59 modeles)
- **Database** : PostgreSQL (Prisma Accelerate)
- **Cache** : Upstash Redis (TTL 5-60 min, invalidation cascade)
- **Auth** : NextAuth.js v5 (JWT, multi-tenant)
- **Rate Limiting** : Upstash Ratelimit (4 niveaux : API, Auth, Register, Sensitive)
- **Email** : Resend (bienvenue, reset password, rappels FMPA)
- **Monitoring** : Sentry (error tracking + Session Replay on error)

### Infrastructure

- **Frontend + API** : Vercel (region cdg1 - Paris)
- **Socket.IO** : Render (Frankfurt, Node.js)
- **Database** : PostgreSQL (Prisma Accelerate)
- **Temps reel** : Supabase Realtime + Socket.IO (Render)
- **Cache** : Upstash Redis (Frankfurt)
- **Storage** : UploadThing
- **CDN** : Vercel Edge Network
- **CI/CD** : GitHub Actions (tsc + build sur chaque push)
- **Monitoring** : Sentry + slow query logging (>500ms)

### Integrations Externes

- **Antibia** : Gestion operationnelle (interventions, gardes, disponibilites)
- **LGTP** : Gestion des temps et plannings (heures, compteurs)
- **Microsoft 365** : Outlook Mail, Calendar, Teams, OneDrive, Azure AD (SSO)

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

- Chat temps reel via Supabase Realtime + Socket.IO
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
- Integration FMPA et Formations
- Sync bidirectionnelle Outlook Calendar (via connecteur Microsoft 365)
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
- Sync avec LGTP (via connecteur)

### 7. Portails & Communication

- Portails SDIS et specialistes
- Actualites avec 7 categories
- Documents partages avec recherche
- Sync OneDrive/SharePoint (via connecteur Microsoft 365)
- Gestion permissions et visibilite

### 8. Notifications

- Notifications push temps reel (Web Push API)
- 10+ types de notifications
- 4 niveaux de priorite (LOW, NORMAL, HIGH, URGENT)
- Groupement temporel intelligent
- Alertes Teams (via connecteur Microsoft 365)
- Actions personnalisees

---

## Connecteurs d'Integration

Architecture modulaire dans `src/lib/integrations/` avec retry automatique, timeout, et error tracking.

| Connecteur | Editeur | Donnees synchronisees |
|---|---|---|
| **Antibia** | Antibia/Masternaut | Interventions, gardes, disponibilites → Agenda + TTA |
| **LGTP** | LGTP | Temps de travail, plannings, compteurs → TTA + Personnel |
| **Microsoft 365** | Microsoft | Outlook Mail, Calendar, Teams, OneDrive, Azure AD → Tous modules |

Le mapping agent se fait via le matricule (champ `badge` sur le modele User).

Voir [docs/CONNECTEURS_API.md](docs/CONNECTEURS_API.md) pour la documentation complete.

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
|---|---|
| First Load JS shared | ~158 KB (dont ~70 KB Sentry) |
| API Response | ~100ms (cache hit) |
| DB Queries | Optimisees (groupBy, indexes composes, N+1 resolus) |
| Cache | Redis TTL 5-60 min, 9 endpoints caches, invalidation cascade |
| Slow queries | Logging auto >500ms |
| Index DB | 22 (12 B-tree composes + 10 GIN trigram) |
| Erreurs TypeScript | 0 |

**45 optimisations implementees** — voir [OPTIMISATIONS.md](OPTIMISATIONS.md) pour le detail.

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

# Synchroniser la base de donnees
npx prisma db push

# Creer un compte demo (optionnel)
npx tsx prisma/seed-demo-complete.ts

# Lancer le serveur de developpement
npm run dev
```

### Compte Demo

```
Organisation : SDIS 06 - Alpes-Maritimes
Email        : demo@sdis06.fr
Mot de passe : Demo2026!
Role         : ADMIN (acces complet)
```

Donnees demo incluses : 11 utilisateurs, 12 FMPA, 5 formations, 10 fiches personnel, 4 canaux chat, 3 mails, 5 actualites, 60 entrees TTA.

### Variables d'environnement essentielles

```env
# Database
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."
DIRECT_URL="postgres://...@db.prisma.io:5432/postgres"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Auth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Socket.IO (Render)
NEXT_PUBLIC_SOCKET_URL="https://mindsp-socket.onrender.com"

# Email (Resend)
RESEND_API_KEY="..."
EMAIL_FROM="MindSP <noreply@mindsp.fr>"

# Monitoring (Sentry)
NEXT_PUBLIC_SENTRY_DSN="..."
SENTRY_ORG="..."
SENTRY_PROJECT="..."

# Integrations (optionnel)
# ANTIBIA_API_URL, ANTIBIA_API_KEY, ANTIBIA_SDIS_ID
# LGTP_API_URL, LGTP_API_KEY, LGTP_SDIS_ID
# MS365_TENANT_ID, MS365_CLIENT_ID, MS365_CLIENT_SECRET
```

### Deploiement

**Vercel** (frontend + API) :
```bash
prisma generate --no-engine && next build
```

**Render** (Socket.IO) :
- Build Command : `npm install`
- Start Command : `node socket-server/server.js`

Configurer les variables d'environnement dans les dashboards respectifs.

### Health Check

```
GET /api/health     → Status app + DB + Redis
GET /health         → Status Socket.IO (Render)
```

---

## CI/CD

Pipeline GitHub Actions (`.github/workflows/ci.yml`) :
- Declenche sur push main et PR
- `prisma generate` + `tsc --noEmit` + `next build`
- TypeScript strict (0 erreur toleree)
- Auto-deploy Vercel sur push main
- Auto-deploy Render sur push main

---

## API Routes (72)

### Auth
- POST /api/auth/register
- GET/POST /api/auth/[...nextauth]

### FMPA (13 routes)
- GET/POST /api/fmpa
- GET/PATCH/DELETE /api/fmpa/[id]
- POST /api/fmpa/[id]/register
- GET /api/fmpa/[id]/export
- GET /api/fmpa/[id]/qrcode
- GET /api/fmpa/[id]/stats
- POST /api/fmpa/[id]/meal
- POST /api/emargement/[id]
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
- GET /api/messaging/directory
- GET /api/messaging/favorites

### Calendrier (5 routes)
- GET/POST /api/calendar/events
- PATCH/DELETE /api/calendar/events/[id]
- POST /api/calendar/events/[id]/respond
- GET /api/calendar/availability

### Formations (5 routes)
- GET/POST /api/formations
- GET /api/formations/[id]
- POST /api/formations/[id]/register
- POST /api/formations/registrations/[id]/validate
- GET /api/formations/registrations/[id]/certificate

### Mail (4 routes)
- GET /api/mail/inbox
- GET/POST /api/mail/messages
- GET/DELETE /api/mail/messages/[id]
- GET /api/mail/stats

### Personnel (4 routes)
- GET /api/personnel/alerts
- GET/POST /api/personnel/files
- GET/PATCH/DELETE /api/personnel/files/[id]
- GET/POST /api/personnel/qualifications

### TTA (4 routes)
- GET/POST /api/tta/entries
- PUT /api/tta/entries/[id]/validate
- GET /api/tta/export

### Notifications (6 routes)
- GET/POST /api/notifications
- GET /api/notifications/[id]
- PATCH /api/notifications/[id]/read
- POST /api/notifications/read-all
- GET /api/notifications/stats

### Autres
- GET /api/users
- GET /api/search
- GET/POST /api/news
- GET /api/portals
- GET /api/health
- GET/POST /api/onboarding
- GET/POST /api/settings/notifications
- POST /api/push/subscribe
- GET /api/audit
- GET /api/admin/queues/stats

---

## Documentation

| Fichier | Contenu |
|---|---|
| [README.md](README.md) | Ce fichier |
| [OPTIMISATIONS.md](OPTIMISATIONS.md) | 45 optimisations implementees |
| [PLAN_ACTION_PERF.md](PLAN_ACTION_PERF.md) | Plan d'action performance |
| [PlanAction.md](PlanAction.md) | Plan d'action general |
| [roadmap.md](roadmap.md) | Roadmap complete par phase |
| [SPECS_TECHNIQUE.md](SPECS_TECHNIQUE.md) | Specifications techniques |
| [docs/CONNECTEURS_API.md](docs/CONNECTEURS_API.md) | Documentation connecteurs (Antibia, LGTP, Microsoft 365) |

---

## License

Proprietaire - Tous droits reserves

---

## Equipe

Developpe pour les SDIS de France
