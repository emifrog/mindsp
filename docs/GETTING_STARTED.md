# 🚀 Getting Started - MindSP

Guide de démarrage rapide pour le projet MindSP.

## 📋 Prérequis

- **Node.js** 20+ LTS
- **npm** 10+ ou **pnpm** 8+
- **PostgreSQL** 16+ (ou Docker)
- **Redis** 7+ (optionnel pour dev)
- **Git**

## 🛠️ Installation

### 1. Cloner le repository

```bash
git clone <repository-url>
cd mindsp
```

### 2. Installer les dépendances

```bash
npm install
# ou
pnpm install
```

### 3. Configuration de l'environnement

Copier le fichier `.env.example` vers `.env.local` :

```bash
cp .env.example .env.local
```

Éditer `.env.local` avec vos configurations :

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mindsp"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<générer avec: openssl rand -base64 32>"

# Redis (optionnel pour dev)
REDIS_URL="redis://localhost:6379"
```

### 4. Base de données

#### Option A : PostgreSQL local

```bash
# Créer la base de données
createdb mindsp

# Générer le client Prisma
npm run db:generate

# Appliquer les migrations
npm run db:migrate

# (Optionnel) Seed data
npm run db:seed
```

#### Option B : Docker

```bash
# Démarrer PostgreSQL avec Docker
docker run --name mindsp-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mindsp \
  -p 5432:5432 \
  -d postgres:16

# Puis suivre les étapes de migration ci-dessus
```

### 5. Initialiser Husky

```bash
npm run prepare
```

### 6. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 📁 Structure du Projet

```
mindsp/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # Composants React
│   ├── lib/              # Utilitaires et services
│   ├── hooks/            # Custom hooks
│   ├── stores/           # Zustand stores
│   └── types/            # TypeScript types
├── prisma/
│   ├── schema.prisma     # Schéma de base de données
│   └── seed/             # Seed data
├── public/               # Assets statiques
└── docs/                 # Documentation
```

## 🧪 Commandes Disponibles

### Développement

```bash
npm run dev          # Démarrer le serveur de dev
npm run build        # Build pour production
npm run start        # Démarrer en mode production
npm run lint         # Linter le code
npm run lint:fix     # Fix automatique des erreurs lint
npm run format       # Formater avec Prettier
npm run type-check   # Vérifier les types TypeScript
```

### Base de données

```bash
npm run db:generate  # Générer le client Prisma
npm run db:push      # Push le schéma (dev rapide)
npm run db:migrate   # Créer et appliquer une migration
npm run db:studio    # Ouvrir Prisma Studio
npm run db:seed      # Seed la base de données
```

## 🔐 Authentification (Phase 2)

L'authentification sera configurée dans la Phase 2 avec NextAuth.js.

## 🏗️ Développement

### Conventions de commit

Le projet utilise [Conventional Commits](https://www.conventionalcommits.org/) :

```bash
feat: ajouter le module FMPA
fix: corriger le bug d'authentification
docs: mettre à jour le README
style: formater le code
refactor: restructurer le service utilisateur
test: ajouter tests unitaires
chore: mettre à jour les dépendances
```

### Workflow Git

1. Créer une branche depuis `main`
2. Faire vos modifications
3. Commit avec un message conventionnel
4. Push et créer une Pull Request
5. Attendre la review et les tests CI

### Linting automatique

Le projet utilise Husky pour exécuter automatiquement :

- **pre-commit** : Lint et format du code
- **commit-msg** : Validation du message de commit

## 📚 Documentation

- [Architecture](./docs/architecture.md)
- [Spécifications Techniques](./SPECS_TECHNIQUE.md)
- [Roadmap](./roadmap.md)

## 🐛 Problèmes Courants

### Erreur de connexion PostgreSQL

Vérifier que PostgreSQL est démarré :

```bash
# Linux/Mac
sudo service postgresql status

# Windows
# Vérifier dans les Services Windows
```

### Erreur Prisma Client

Régénérer le client :

```bash
npm run db:generate
```

### Port 3000 déjà utilisé

Changer le port :

```bash
PORT=3001 npm run dev
```

## 🤝 Contributing

Voir [CONTRIBUTING.md](./README.md#contributing) pour les guidelines de contribution.

## 📞 Support

Pour toute question, ouvrir une issue sur GitHub.

---

**Phase actuelle : Phase 0 - Structure du projet ✅**

Prochaine étape : Phase 1 - Foundation (Next.js + UI + DB)
