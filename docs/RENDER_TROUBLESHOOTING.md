# 🔧 Guide de Dépannage Render

Solutions aux problèmes courants lors du déploiement sur Render.

## 🎯 Diagnostic Rapide

### Comment identifier votre problème ?

```
┌─────────────────────────────────────────────────────┐
│  État du Déploiement                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ❌ Build échoue                                   │
│     → Section 1 : Erreurs de Build                │
│                                                     │
│  ❌ Déploiement réussit mais app ne charge pas    │
│     → Section 2 : Erreurs Runtime                 │
│                                                     │
│  ❌ Socket.IO ne se connecte pas                  │
│     → Section 3 : Problèmes Socket.IO             │
│                                                     │
│  ❌ Base de données inaccessible                  │
│     → Section 4 : Problèmes PostgreSQL            │
│                                                     │
│  ❌ Lenteur / Performance                         │
│     → Section 5 : Optimisation Performance        │
└─────────────────────────────────────────────────────┘
```

---

## 1️⃣ Erreurs de Build

### ❌ Erreur : "Prisma generate failed"

**Symptômes** :
```
Error: Generator error:
Error: Cannot find module '@prisma/client'
```

**Solution** :
```bash
# Le build command doit inclure prisma generate
# Vérifiez dans render.yaml :
buildCommand: npm ci && npx prisma generate --no-engine && npx prisma migrate deploy && npm run build
```

**Actions** :
1. Dashboard Render → Service → Settings
2. Vérifiez "Build Command"
3. Doit contenir `npx prisma generate --no-engine`

---

### ❌ Erreur : "Migration failed"

**Symptômes** :
```
Error: P1001: Can't reach database server
Migration failed
```

**Causes possibles** :
- DATABASE_URL non défini
- Base de données pas créée
- Connexion réseau bloquée

**Solution** :
```bash
# 1. Vérifier DATABASE_URL
Dashboard → Environment → DATABASE_URL
# Doit être de la forme : postgresql://user:pass@host/db

# 2. Vérifier que la base existe
Dashboard → mindsp-db → Status: ● Available

# 3. Vérifier la connexion
Dashboard → Shell → Tester :
echo $DATABASE_URL
```

**Si DATABASE_URL est vide** :
```yaml
# Dans render.yaml, vérifiez :
envVars:
  - key: DATABASE_URL
    fromDatabase:
      name: mindsp-db
      property: connectionString
```

---

### ❌ Erreur : "npm ci failed"

**Symptômes** :
```
npm ERR! Cannot read property 'match' of undefined
npm ci exited with code 1
```

**Solution** :
```bash
# 1. Vérifier que package-lock.json existe et est commité
git status
# Si manquant :
npm install
git add package-lock.json
git commit -m "Add package-lock.json"
git push

# 2. Vérifier Node version
# Dans package.json :
"engines": {
  "node": ">=20.0.0"
}
```

---

### ❌ Erreur : "Out of memory during build"

**Symptômes** :
```
FATAL ERROR: Reached heap limit Allocation failed
JavaScript heap out of memory
```

**Solution** :
```bash
# Option 1 : Augmenter la mémoire de build
# Dashboard → Settings → Build Command :
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Option 2 : Upgrader le plan
# Starter : 512MB (parfois insuffisant)
# Standard : 2GB (recommandé)
```

---

## 2️⃣ Erreurs Runtime

### ❌ Erreur : "Application Timeout"

**Symptômes** :
```
Application failed to respond
Health check failed
```

**Solution 1 - Vérifier Health Check** :
```bash
# Test manuel du endpoint
curl https://votre-app.onrender.com/api/health

# Doit répondre :
{
  "status": "ok",
  "database": "connected"
}

# Si erreur 404, vérifier que le fichier existe :
src/app/api/health/route.ts
```

**Solution 2 - Vérifier le Port** :
```javascript
// server.js doit écouter sur process.env.PORT
const port = parseInt(process.env.PORT || "3000", 10);

// Dans render.yaml, PORT doit être 10000
envVars:
  - key: PORT
    value: 10000
```

**Solution 3 - Augmenter le timeout** :
```yaml
# Dans render.yaml
services:
  - type: web
    healthCheckPath: /api/health
    # Augmenter si nécessaire
```

---

### ❌ Erreur : "Cannot find module"

**Symptômes** :
```
Error: Cannot find module '@/lib/prisma'
Module not found: Can't resolve 'socket.io'
```

**Solution** :
```bash
# 1. Vérifier que le module est dans dependencies (pas devDependencies)
# package.json :
"dependencies": {
  "socket.io": "^4.8.1",
  "@prisma/client": "^5.20.0"
}

# 2. Clean install
git commit -am "Fix dependencies"
git push

# 3. Clear build cache dans Render
Dashboard → Manual Deploy → Clear build cache & deploy
```

---

### ❌ Erreur : "NEXTAUTH_URL is not set"

**Symptômes** :
```
[next-auth][error][MISSING_NEXTAUTH_URL]
https://next-auth.js.org/errors#missing_nextauth_url
```

**Solution** :
```bash
# Dashboard Render → Environment → Ajouter
NEXTAUTH_URL=https://votre-app.onrender.com

# Puis redéployer
Dashboard → Manual Deploy → Deploy latest commit
```

---

## 3️⃣ Problèmes Socket.IO

### ❌ Socket.IO : Connection refused

**Symptômes** :
```javascript
// Console navigateur :
WebSocket connection failed
Error: connect ECONNREFUSED
```

**Solution 1 - Vérifier ALLOWED_ORIGINS** :
```bash
# Dashboard → Environment
ALLOWED_ORIGINS=https://votre-app.onrender.com

# Pas de virgule finale !
# Pas de http:// pour https:// apps
```

**Solution 2 - Utiliser WSS en production** :
```javascript
// Client Socket.IO
const socket = io("wss://votre-app.onrender.com", {
  path: "/api/socket",
  secure: true, // Important !
  transports: ["websocket", "polling"]
});
```

**Solution 3 - Vérifier CSP** :
```javascript
// next.config.js doit autoriser les WebSockets
connect-src 'self' wss://*.onrender.com
```

---

### ❌ Socket.IO : Handshake error

**Symptômes** :
```
Error: xhr poll error
Transport error
```

**Solution** :
```javascript
// Vérifier le chemin Socket.IO
// Client :
path: "/api/socket"  // Avec slash au début

// Serveur (server.js) :
const io = new Server(httpServer, {
  path: "/api/socket"
});
```

---

### ❌ Socket.IO : CORS error

**Symptômes** :
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution** :
```javascript
// server.js - Configuration CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS.split(","),
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Vérifier ALLOWED_ORIGINS dans Render
Dashboard → Environment → ALLOWED_ORIGINS
```

---

## 4️⃣ Problèmes PostgreSQL

### ❌ Database : Connection timeout

**Symptômes** :
```
Error: P1001: Can't reach database server
Connection timeout
```

**Solution 1 - Vérifier DATABASE_URL** :
```bash
# Dashboard → Shell
echo $DATABASE_URL
# Doit afficher : postgresql://...

# Tester la connexion
psql $DATABASE_URL -c "SELECT 1"
```

**Solution 2 - Redémarrer la base** :
```bash
# Dashboard → mindsp-db
Actions → Restart Database
```

**Solution 3 - Vérifier les connexions** :
```sql
-- Dans le shell PostgreSQL
SELECT count(*) FROM pg_stat_activity;
-- Starter plan = max 97 connexions
-- Si proche de 97, des connexions ne se ferment pas
```

---

### ❌ Database : Too many connections

**Symptômes** :
```
Error: P1000: Authentication failed
FATAL: sorry, too many clients already
```

**Solution** :
```javascript
// Limiter les connexions Prisma
// Dans prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Ajouter :
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
  relationMode = "prisma"
}

// Configurer connection pooling
// .env ou Render Environment
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=20"
```

---

### ❌ Database : Migration failed

**Symptômes** :
```
Error: P3014: Prisma Migrate could not create the shadow database
```

**Solution** :
```bash
# Appliquer les migrations manuellement
# Dashboard → Shell
npx prisma migrate deploy

# Si erreurs persistent, reset (DANGER en prod !)
# En dev uniquement :
npx prisma migrate reset
```

---

## 5️⃣ Optimisation Performance

### ⚠️ Lenteur : Temps de réponse > 2s

**Diagnostic** :
```bash
# Test de latence
curl -w "@-" -o /dev/null -s https://votre-app.onrender.com/api/health <<'EOF'
time_total: %{time_total}s
EOF

# Si > 2s, problème de performance
```

**Solutions** :

**1. Activer le cache Redis** :
```javascript
// Vérifier que UPSTASH_REDIS_REST_URL est défini
// Dashboard → Environment
```

**2. Optimiser les requêtes Prisma** :
```javascript
// Utiliser include/select au lieu de requêtes multiples
const users = await prisma.user.findMany({
  include: {
    tenant: true // Au lieu de 2 requêtes
  }
});
```

**3. Upgrader le plan** :
```
Starter (512MB) → Standard (2GB)
$7/mois → $25/mois
+300% performance
```

---

### ⚠️ Lenteur : Cold start

**Symptômes** :
```
Première requête : 5-10 secondes
Requêtes suivantes : < 1 seconde
```

**Cause** :
Render met les services en veille après 15 min d'inactivité (plan Starter).

**Solutions** :

**1. Upgrader vers Standard** (pas de veille) :
```
$25/mois
Toujours actif
```

**2. Ping régulier** (plan Starter) :
```bash
# Service externe de monitoring
# Ping toutes les 5 minutes
# Ex: UptimeRobot, Cron-Job.org (gratuits)

# URL à pinger :
https://votre-app.onrender.com/api/health
```

---

### ⚠️ Haute utilisation mémoire

**Symptômes** :
```
Memory usage: 90%+ de 512MB
Service crash ou restart
```

**Solution 1 - Identifier les leaks** :
```javascript
// Ajouter monitoring mémoire
// server.js
setInterval(() => {
  const used = process.memoryUsage();
  console.log(JSON.stringify({
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`
  }));
}, 60000); // Toutes les minutes
```

**Solution 2 - Upgrader** :
```
Starter : 512MB → Standard : 2GB
```

---

## 🔍 Debugging Avancé

### Activer les logs détaillés

```bash
# Dashboard → Environment → Ajouter
DEBUG=*
NODE_ENV=development # Temporairement

# Pour Socket.IO uniquement :
DEBUG=socket.io*

# Puis consulter :
Dashboard → Logs → Rechercher les détails
```

### Accéder au Shell Render

```bash
# Dashboard → Shell → Connect
# Puis tester :

# Vérifier variables
env | grep -E "DATABASE|REDIS|NEXTAUTH"

# Tester Prisma
npx prisma db execute --stdin < /dev/null

# Tester connexion Redis
node -e "console.log(process.env.UPSTASH_REDIS_REST_URL)"
```

### Vérifier les logs en temps réel

```bash
# Installer Render CLI
npm install -g render-cli

# Login
render login

# Tail logs
render logs -s mindsp-web --tail
```

---

## 📊 Checklist de Diagnostic

Avant de demander de l'aide, vérifiez :

- [ ] Les logs de build (Dashboard → Logs)
- [ ] Les variables d'environnement (Dashboard → Environment)
- [ ] Le health check (`/api/health`)
- [ ] La connexion PostgreSQL (Dashboard → mindsp-db)
- [ ] Les versions Node.js et npm (package.json engines)
- [ ] Le statut Render (https://status.render.com)

---

## 🆘 Obtenir de l'Aide

### Documentation

1. [Guide Complet](DEPLOYMENT_RENDER.md)
2. [Commandes](RENDER_COMMANDS.md)
3. [Render Docs](https://render.com/docs)

### Support

1. **Render Community** : https://community.render.com
2. **Render Discord** : https://discord.gg/render
3. **Render Support** : help@render.com (plans payants)

### Préparer votre question

Incluez toujours :
- Description du problème
- Logs complets (Dashboard → Logs)
- Variables d'environnement (masquez les secrets)
- Étapes pour reproduire

---

## 🎯 Problèmes Résolus ?

Une fois résolu, consultez :
- [Best Practices Production](RENDER_PRODUCTION.md)
- [Optimisations Performance](RENDER_PRODUCTION.md#performance)

---

💡 **Astuce** : 90% des problèmes sont liés aux variables d'environnement. Vérifiez-les en premier !
