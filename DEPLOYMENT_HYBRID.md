# 🚀 Déploiement Hybride - Vercel + Railway

Guide complet pour déployer MindSP avec une architecture hybride :
- **Frontend + API Routes** : Vercel (gratuit)
- **Socket.IO Server** : Railway ($5/mois)
- **PostgreSQL** : Railway (inclus)
- **Redis** : Upstash (gratuit)

## 💰 Coûts

| Service | Hébergeur | Prix |
|---------|-----------|------|
| Frontend + API | Vercel | **GRATUIT** ✅ |
| Socket.IO | Railway | **$5/mois** 💰 |
| PostgreSQL | Railway | **Inclus dans les $5** ✅ |
| Redis | Upstash | **GRATUIT** ✅ |
| **TOTAL** | | **$5/mois** 🎉 |

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────┐
│               UTILISATEURS                      │
│          🌍 Internet / Navigateurs              │
└─────────────────────────────────────────────────┘
                      │
          ┌───────────┴────────────┐
          │                        │
          ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│   VERCEL (CDN)   │    │  RAILWAY         │
│   Frontend       │    │  Socket.IO       │
│                  │    │                  │
│ • Next.js App    │    │ • WebSockets     │
│ • API Routes     │    │ • Real-time      │
│ • SSR/ISR        │    │ • Notifications  │
│                  │    │                  │
│ GRATUIT ✅       │    │ $5/mois 💰       │
└──────────────────┘    └──────────────────┘
          │                        │
          └───────────┬────────────┘
                      │
          ┌───────────┴────────────┐
          │                        │
          ▼                        ▼
┌──────────────────┐    ┌──────────────────┐
│  PostgreSQL      │    │  Upstash Redis   │
│  (Railway)       │    │  (Global)        │
│                  │    │                  │
│ • User data      │    │ • Cache          │
│ • Messages       │    │ • Rate limiting  │
│ • FMPA data      │    │ • Sessions       │
│                  │    │                  │
│ Inclus ✅        │    │ GRATUIT ✅       │
└──────────────────┘    └──────────────────┘
```

---

## 🎯 Étape 1 : Préparation (10 min)

### 1.1 Créer les comptes nécessaires

- [ ] **Vercel** : https://vercel.com (gratuit, connexion GitHub)
- [ ] **Railway** : https://railway.app (gratuit 500h/mois, puis $5/mois)
- [ ] **Upstash** : https://upstash.com (gratuit)

### 1.2 Créer Upstash Redis

1. Allez sur https://upstash.com
2. Créez un compte gratuit
3. Créez une base Redis
   - **Name** : `mindsp-redis`
   - **Region** : EU-West-1 (Ireland)
4. Copiez les credentials :
   ```
   UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AYTgA_xxxxx
   ```

### 1.3 Générer VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Copiez les deux clés générées.

---

## 🚂 Étape 2 : Déployer Socket.IO sur Railway (15 min)

### 2.1 Créer un nouveau projet Railway

1. Allez sur https://railway.app/new
2. **Nouveau Projet** → **Deploy from GitHub repo**
3. Connectez votre repo GitHub `mindsp`
4. Railway détecte automatiquement le monorepo

### 2.2 Configurer le service Socket.IO

Dans Railway Dashboard :

1. **Add Service** → **From Repo**
2. Sélectionnez votre repo
3. **Root Directory** : `socket-server`
4. **Start Command** : `npm start`

### 2.3 Ajouter PostgreSQL

1. Dans le même projet Railway
2. **New** → **Database** → **PostgreSQL**
3. Railway crée automatiquement la base

### 2.4 Configurer les variables d'environnement

Dans Railway → Service Socket.IO → Variables :

```bash
# Database (connecté automatiquement si dans le même projet)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# CORS (mettez votre domaine Vercel plus tard)
ALLOWED_ORIGINS=https://your-app.vercel.app

# Node
NODE_ENV=production
```

**Note** : Laissez `ALLOWED_ORIGINS` vide pour l'instant, nous le mettrons à jour après le déploiement Vercel.

### 2.5 Déployer

1. Railway build et déploie automatiquement
2. Attendez que le déploiement soit terminé (~5 min)
3. Récupérez l'URL publique : `https://your-socket-server.up.railway.app`
4. Testez : `https://your-socket-server.up.railway.app/health`

---

## ⚡ Étape 3 : Déployer Frontend sur Vercel (10 min)

### 3.1 Connecter le repo à Vercel

1. Allez sur https://vercel.com/new
2. **Import Git Repository**
3. Sélectionnez votre repo `mindsp`
4. Vercel détecte automatiquement Next.js

### 3.2 Configurer les variables d'environnement

Dans Vercel → Project Settings → Environment Variables :

```bash
# Database (même que Railway)
DATABASE_URL=postgresql://user:pass@host/db

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=xxx (généré automatiquement ou via openssl rand -base64 32)

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AYTgA_xxxxx

# Socket.IO Server (URL Railway)
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.up.railway.app

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_NAME=MindSP
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_OFFLINE=true

# VAPID Keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEg4F_xxxxx
VAPID_PRIVATE_KEY=abc789_xxxxx
VAPID_SUBJECT=mailto:admin@mindsp.fr

# Prisma
PRISMA_HIDE_UPDATE_MESSAGE=true
```

### 3.3 Déployer

1. **Deploy** → Vercel build et déploie (~5 min)
2. Une fois terminé, récupérez l'URL : `https://your-app.vercel.app`

### 3.4 Mettre à jour CORS sur Railway

Maintenant que vous avez l'URL Vercel :

1. Retournez sur Railway → Service Socket.IO → Variables
2. Mettez à jour `ALLOWED_ORIGINS` :
   ```bash
   ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main.vercel.app
   ```
3. Redéployez le service Socket.IO

---

## 🔄 Étape 4 : Appliquer les Migrations (5 min)

### 4.1 Depuis votre machine locale

```bash
# Connectez-vous à la base Railway
DATABASE_URL="postgresql://..." npx prisma migrate deploy

# Ou générez et seed
DATABASE_URL="postgresql://..." npx prisma db push
DATABASE_URL="postgresql://..." npm run db:seed
```

### 4.2 Depuis Railway CLI (alternative)

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link au projet
railway link

# Exécuter migrations
railway run npx prisma migrate deploy
```

---

## ✅ Étape 5 : Vérifications

### 5.1 Tester le Frontend (Vercel)

```bash
# Ouvrir dans le navigateur
https://your-app.vercel.app

# Devrait afficher la page de connexion ✅
```

### 5.2 Tester Socket.IO (Railway)

```bash
# Test health check
curl https://your-socket-server.up.railway.app/health

# Devrait retourner :
# {"status":"ok","service":"socket-server"}
```

### 5.3 Tester la connexion WebSocket

Ouvrez la console du navigateur sur votre app Vercel :

```javascript
// Devrait se connecter automatiquement
// Vérifiez dans les logs réseau (Network → WS)
```

---

## 🔧 Configuration Client Socket.IO

Le client Socket.IO doit pointer vers Railway. Créez/modifiez ce fichier :

### src/lib/socket.ts

```typescript
import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      transports: ["websocket", "polling"],
    });
  }

  return socket;
};

export const connectSocket = (userId: string, tenantId: string) => {
  const socket = getSocket();

  if (!socket.connected) {
    socket.connect();

    socket.once("connect", () => {
      socket.emit("authenticate", { userId, tenantId });
    });
  }
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};
```

---

## 📊 Monitoring et Logs

### Vercel Logs

```bash
# Dashboard Vercel → Project → Logs
# Ou via CLI :
vercel logs
```

### Railway Logs

```bash
# Dashboard Railway → Service → Logs
# Ou via CLI :
railway logs
```

---

## 🔒 Sécurité

### Variables d'environnement

✅ Toutes stockées dans Vercel/Railway (pas dans le code)
✅ HTTPS automatique sur Vercel et Railway
✅ CORS configuré strictement

### CORS Important

Dans `socket-server/server.js`, assurez-vous que CORS autorise Vercel :

```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [];

// Dans Socket.IO config :
origin: (origin, callback) => {
  if (!origin) return callback(null, true);

  // Autoriser Vercel
  if (allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
    callback(null, true);
  } else {
    callback(new Error("Origin non autorisée"));
  }
}
```

---

## 🚀 Déploiement Continu (CI/CD)

### Auto-Deploy

✅ **Vercel** : Deploy automatique sur push vers `main`
✅ **Railway** : Deploy automatique sur push vers `main`

### Preview Deployments (Vercel)

Chaque PR crée automatiquement une preview URL :
- `https://your-app-git-feature-branch.vercel.app`

N'oubliez pas d'ajouter ces URLs dans `ALLOWED_ORIGINS` Railway pour tester Socket.IO sur les previews.

---

## 💡 Optimisations

### Edge Functions (Vercel)

Pour les API Routes ultra-rapides :

```typescript
// src/app/api/some-route/route.ts
export const runtime = 'edge';

export async function GET() {
  // API ultra-rapide
}
```

### Caching (Upstash Redis)

Le cache Redis est déjà configuré dans l'app pour :
- ✅ Sessions
- ✅ Rate limiting
- ✅ Query results

---

## 🆘 Problèmes Courants

### Socket.IO ne se connecte pas

**Vérifiez :**
1. `NEXT_PUBLIC_SOCKET_URL` dans Vercel pointe vers Railway
2. `ALLOWED_ORIGINS` dans Railway inclut votre URL Vercel
3. Les logs Railway pour voir les tentatives de connexion

```bash
# Railway logs
railway logs --service socket-server
```

### Base de données inaccessible

**Vérifiez :**
1. `DATABASE_URL` est la même sur Vercel ET Railway
2. PostgreSQL Railway est bien démarré
3. Les migrations sont appliquées

```bash
# Tester la connexion
DATABASE_URL="postgresql://..." npx prisma db execute --stdin <<< "SELECT 1"
```

### Erreur CORS

```
Access-Control-Allow-Origin missing
```

**Solution :**
Ajoutez votre domaine Vercel dans Railway `ALLOWED_ORIGINS` :

```bash
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-git-main.vercel.app
```

---

## 📚 Structure des Fichiers

```
mindsp/
├── vercel.json                  ⚙️ Config Vercel
│
├── socket-server/               📁 Serveur Socket.IO (Railway)
│   ├── server.js               🔌 Serveur principal
│   ├── package.json            📦 Dependencies
│   ├── railway.json            🚂 Config Railway
│   ├── Procfile                ⚙️ Start command
│   └── .env.example            🔐 Variables template
│
└── src/
    └── lib/socket.ts           🔧 Client Socket.IO
```

---

## 🎉 Résumé

### ✅ Ce que vous avez déployé

- **Frontend Vercel** : Next.js app avec API Routes (GRATUIT)
- **Socket.IO Railway** : Serveur WebSocket temps réel ($5/mois)
- **PostgreSQL Railway** : Base de données (inclus dans les $5)
- **Redis Upstash** : Cache et rate limiting (GRATUIT)

### 💰 Coût Total : $5/mois

### 🚀 Prochaines Étapes

1. Configurez un domaine personnalisé sur Vercel
2. Activez les backups PostgreSQL sur Railway
3. Configurez le monitoring (Sentry)
4. Testez toutes les fonctionnalités

---

## 📞 Support

- **Vercel** : https://vercel.com/docs
- **Railway** : https://docs.railway.app
- **Upstash** : https://docs.upstash.com

---

🎉 **Votre application MindSP est maintenant déployée avec succès !**

**Frontend** : `https://your-app.vercel.app`
**Socket.IO** : `https://your-socket-server.up.railway.app`
