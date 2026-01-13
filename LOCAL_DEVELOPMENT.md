# 💻 Développement Local - Architecture Hybride

Guide pour développer localement avec l'architecture hybride Vercel + Railway.

## 🎯 Architecture en Développement

```
Frontend (localhost:3000)    Socket.IO (localhost:3001)
     Next.js                      Node.js
        │                            │
        └────────────┬───────────────┘
                     │
         ┌───────────┴────────────┐
         │                        │
         ▼                        ▼
    PostgreSQL               Upstash Redis
    (localhost:5432)         (cloud ou local)
```

---

## 🚀 Démarrage Rapide

### 1. Installer les dépendances

```bash
# Dépendances principales
npm install

# Dépendances Socket.IO
cd socket-server
npm install
cd ..
```

### 2. Configurer les variables d'environnement

```bash
# Copier le template
cp .env.example .env.local

# Éditez .env.local avec vos valeurs
```

**Variables minimales requises** :

```bash
# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/mindsp"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-genere"

# Socket.IO (pointe vers le serveur local)
NEXT_PUBLIC_SOCKET_URL="http://localhost:3001"

# Upstash Redis (gratuit)
UPSTASH_REDIS_REST_URL="https://xxxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxxxx"

# VAPID Keys (générez avec: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="xxxxx"
VAPID_PRIVATE_KEY="xxxxx"
```

### 3. Initialiser la base de données

```bash
# Appliquer les migrations
npx prisma migrate dev

# Seed la base (optionnel)
npm run db:seed
```

### 4. Démarrer les serveurs

**Vous avez besoin de 2 terminaux** :

#### Terminal 1 : Frontend Next.js

```bash
npm run dev
# Démarre sur http://localhost:3000
```

#### Terminal 2 : Socket.IO Server

```bash
cd socket-server
npm run dev
# Démarre sur http://localhost:3001
```

### 5. Tester

1. Ouvrez http://localhost:3000
2. Créez un compte / Connectez-vous
3. Allez dans la messagerie
4. Vérifiez dans la console : `✅ Connected to chat server`

---

## 🔧 Configuration Socket.IO Local

### socket-server/.env (créez ce fichier)

```bash
# Port
PORT=3001

# Database (même que l'app principale)
DATABASE_URL="postgresql://user:password@localhost:5432/mindsp"

# CORS (autoriser localhost)
ALLOWED_ORIGINS="http://localhost:3000"

# Node
NODE_ENV="development"
```

---

## 🐛 Debugging

### Frontend (Next.js)

Logs disponibles dans le terminal où vous avez lancé `npm run dev`.

### Socket.IO Server

Logs disponibles dans le terminal où vous avez lancé `cd socket-server && npm run dev`.

**Activer les logs Socket.IO détaillés** :

```bash
# Dans socket-server/.env
DEBUG=socket.io*
```

### PostgreSQL

Vérifier la connexion :

```bash
psql postgresql://user:password@localhost:5432/mindsp -c "SELECT 1"
```

### Upstash Redis

Tester via la console Upstash ou :

```bash
# Depuis Node.js
node -e "console.log(process.env.UPSTASH_REDIS_REST_URL)"
```

---

## 🔄 Workflow de Développement

### Modifier le Frontend

1. Éditez les fichiers dans `src/`
2. Next.js recharge automatiquement (Fast Refresh)

### Modifier Socket.IO

1. Éditez `socket-server/server.js`
2. Redémarrez manuellement : `Ctrl+C` puis `npm run dev`

### Modifier le Schéma Prisma

```bash
# 1. Modifier prisma/schema.prisma
# 2. Créer la migration
npx prisma migrate dev --name nom_migration

# 3. Prisma Client se régénère automatiquement
```

### Tester Socket.IO

**Dans la console du navigateur** :

```javascript
// Vérifier la connexion
const socket = window.socket; // Si exposé
// Ou récupérez-le via les DevTools React

// Envoyer un message test
socket.emit("send_message", {
  conversationId: "xxx",
  content: "Test message",
});

// Écouter les messages
socket.on("new_message", (msg) => {
  console.log("Message reçu:", msg);
});
```

---

## 📦 Scripts Utiles

### Package.json Principal

```bash
npm run dev          # Démarre Next.js (port 3000)
npm run build        # Build production
npm run start        # Start production
npm run lint         # Lint
npm run type-check   # TypeScript check
```

### Socket Server

```bash
cd socket-server
npm run dev          # Démarre Socket.IO (port 3001)
npm start            # Start production
```

### Database

```bash
npm run db:generate  # Génère Prisma Client
npm run db:push      # Push schema (dev rapide)
npm run db:migrate   # Créer migration
npm run db:studio    # Ouvrir Prisma Studio
npm run db:seed      # Seed la base
```

---

## 🔒 Sécurité Locale

### HTTPS Local (optionnel)

Pour tester HTTPS en local (nécessaire pour certaines features PWA) :

```bash
# Installer mkcert
brew install mkcert  # macOS
# ou chocolatey install mkcert  # Windows

# Créer certificats
mkcert -install
mkcert localhost

# Démarrer Next.js avec HTTPS
# (nécessite configuration custom server)
```

---

## 🚨 Problèmes Courants

### Socket.IO ne se connecte pas

**Vérifiez :**

```bash
# 1. Socket.IO server démarré ?
curl http://localhost:3001/health
# Doit retourner: {"status":"ok","service":"socket-server"}

# 2. NEXT_PUBLIC_SOCKET_URL correct ?
echo $NEXT_PUBLIC_SOCKET_URL
# Doit être: http://localhost:3001

# 3. CORS configuré ?
# socket-server/.env doit avoir ALLOWED_ORIGINS=http://localhost:3000
```

### Port 3001 déjà utilisé

```bash
# Trouver le processus
lsof -ti:3001

# Tuer le processus
kill -9 $(lsof -ti:3001)

# Ou changer le port dans socket-server/.env
PORT=3002
```

### Base de données inaccessible

```bash
# Vérifier PostgreSQL démarré
pg_ctl status

# Démarrer PostgreSQL (macOS Homebrew)
brew services start postgresql@14

# Ou via Docker
docker run -d \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=mindsp \
  --name mindsp-postgres \
  postgres:14
```

### Migrations échouent

```bash
# Reset la base (⚠️ supprime toutes les données)
npx prisma migrate reset

# Puis appliquer les migrations
npx prisma migrate dev
```

---

## 🎯 Checklist Développeur

Avant de commencer à coder :

- [ ] PostgreSQL démarré
- [ ] Redis configuré (Upstash ou local)
- [ ] `.env.local` configuré
- [ ] Migrations appliquées
- [ ] `npm install` dans root ET socket-server
- [ ] Frontend démarré (port 3000)
- [ ] Socket.IO démarré (port 3001)
- [ ] Health check OK : http://localhost:3001/health
- [ ] App accessible : http://localhost:3000
- [ ] Console browser : aucune erreur Socket.IO

---

## 📚 Documentation Développeur

### Structure du Projet

```
mindsp/
├── src/                       Frontend Next.js
│   ├── app/                  App Router
│   ├── components/           Composants React
│   └── lib/                  Utils & configs
│       └── socket-client.ts  Client Socket.IO
│
├── socket-server/            Serveur Socket.IO
│   ├── server.js            Serveur principal
│   └── package.json         Dependencies
│
├── prisma/                   Schéma DB
│   ├── schema.prisma
│   └── migrations/
│
└── public/                   Assets statiques
```

### APIs Importantes

**Frontend → Socket.IO** :
- Client : `src/lib/socket-client.ts`
- Usage : Dans les composants React

**Frontend → API Routes** :
- Routes : `src/app/api/**/*.ts`
- Usage : `fetch('/api/...')`

**Socket.IO → PostgreSQL** :
- Via Prisma dans `socket-server/server.js`

---

## 🔄 Hot Reload

### Frontend
✅ **Auto** : Next.js Fast Refresh

### Socket.IO
❌ **Manuel** : Redémarrer avec `Ctrl+C` + `npm run dev`

**Astuce** : Utilisez `nodemon` pour auto-reload :

```bash
# socket-server/package.json
"scripts": {
  "dev": "nodemon server.js"
}

# Installer nodemon
npm install --save-dev nodemon
```

---

## 🎉 Prêt à Développer !

Une fois tout configuré, vous pouvez :

1. ✅ Développer le frontend sur `localhost:3000`
2. ✅ Tester Socket.IO en temps réel
3. ✅ Voir les changements instantanément
4. ✅ Débugger facilement dans 2 terminaux séparés

---

**Bon développement !** 🚀

Pour déployer en production : [DEPLOYMENT_HYBRID.md](DEPLOYMENT_HYBRID.md)
