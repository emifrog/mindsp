# MindSP - Plateforme SaaS de Gestion SDIS

Solution SaaS multi-tenant pour la gestion des Services Departementaux d'Incendie et de Secours (SDIS).

**Version** : 2.0.0
**Statut** : Production
**Derniere mise a jour** : Mars 2026

---

## Etat du Projet

- **263 fichiers** source TypeScript/TSX
- **~40 300 lignes** de code
- **59 modeles** Prisma
- **69 API routes**
- **93 composants** React
- **42 pages** Next.js
- **8 modules metier** complets

---

## Stack Technique

### Frontend

- **Framework** : Next.js 14 (App Router)
- **UI** : React 18 + TypeScript 5.6
- **Styling** : TailwindCSS + Radix UI + shadcn/ui
- **State** : Zustand
- **Forms** : React Hook Form + Zod
- **Temps reel** : Supabase Realtime
- **Upload** : UploadThing
- **PDF** : jsPDF + html2canvas
- **Dates** : date-fns
- **Icons** : Lucide React

### Backend

- **Runtime** : Node.js 20+
- **Framework** : Next.js 14 API Routes
- **ORM** : Prisma 5 (59 modeles)
- **Database** : PostgreSQL (Supabase)
- **Cache** : Upstash Redis
- **Auth** : NextAuth.js v5 (JWT)
- **Queue** : BullMQ (optionnel)
- **Rate Limiting** : Upstash Ratelimit (4 niveaux)
- **Email** : Resend (pret)

### Infrastructure

- **Frontend + API** : Vercel
- **Database** : PostgreSQL (Supabase)
- **Temps reel** : Supabase Realtime
- **Cache** : Upstash Redis
- **Storage** : UploadThing
- **CDN** : Vercel Edge Network

---

## Modules

### 1. FMPA - Formation, Manoeuvre, Presence Active

- Gestion complete des activites operationnelles (7 types)
- Inscriptions en ligne avec quotas
- Gestion repas et regimes speciaux
- Validation presences par chef
- Rappels automatiques (J-7, J-3, J-1)
- Exports PDF/Excel (feuilles emargement, rapports)
- QR codes pour emargement automatique
- Statistiques avancees

### 2. Messagerie & Chat

- Chat temps reel via Supabase Realtime
- Canaux publics/prives/directs
- Typing indicators et presence en ligne
- Reactions emoji et threads
- Mailbox email interne (5 dossiers)
- Pieces jointes (UploadThing)
- Listes de diffusion

### 3. Agenda

- Calendrier multi-activites (mois/semaine/jour)
- Gestion disponibilites (Available, Unavailable, Partial)
- 7 types d'evenements
- Systeme d'invitations avec reponses
- Export iCal
- Integration FMPA et Formations

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

- Notifications push temps reel
- 10+ types de notifications
- 4 niveaux de priorite (LOW, NORMAL, HIGH, URGENT)
- Groupement temporel intelligent
- Actions personnalisees

---

## Securite

- Authentification NextAuth.js avec JWT
- Multi-tenancy avec isolation complete des donnees
- Protection routes avec middleware
- Validation Zod sur toutes les entrees
- Content Security Policy (CSP)
- Rate limiting (API, Auth, Register, Sensitive)
- Audit logs
- Sanitisation inputs (XSS, injection)
- Chiffrement bcrypt pour mots de passe
- HSTS en production

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

# Initialiser la base de donnees
npx prisma migrate dev
npx prisma db seed

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
```

### Deploiement Vercel

```bash
# Build
prisma generate --no-engine && next build

# Deployer
vercel --prod
```

Configurer les variables d'environnement dans Vercel Dashboard > Settings > Environment Variables.

---

## Performance

| Metrique     | Valeur |
| ------------ | ------ |
| API Response | ~100ms |
| DB Queries   | Optimisees (indexes composes, N+1 resolus) |
| Bundle Size  | ~280KB |
| Cache        | Redis TTL 5-60min selon type |

- Pagination universelle sur toutes les routes
- Cache Redis avec invalidation automatique
- Lazy loading des composants lourds
- 12 indexes composes sur 6 modeles

---

## License

Proprietaire - Tous droits reserves

---

## Equipe

Developpe pour les SDIS de France
