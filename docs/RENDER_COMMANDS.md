# 🔧 Commandes utiles sur Render

Guide des commandes pour gérer votre application MindSP sur Render.

## 🖥️ Accéder au Shell Render

1. Render Dashboard → Votre service `mindsp-web`
2. Onglet "Shell" (en haut à droite)
3. Cliquez sur "Connect"

Vous aurez accès à un terminal interactif directement sur le serveur.

## 📊 Base de données

### Vérifier la connexion

```bash
npx prisma db execute --stdin < /dev/null
```

### Voir le schéma de la base

```bash
npx prisma db pull
```

### Appliquer des migrations

```bash
npx prisma migrate deploy
```

### Forcer la génération du client Prisma

```bash
npx prisma generate
```

### Seed la base de données

```bash
npm run db:seed
```

### Ouvrir Prisma Studio (pas disponible sur Render)

Pour accéder aux données, utilisez plutôt :

```bash
# Se connecter à PostgreSQL directement
psql $DATABASE_URL
```

Puis :

```sql
-- Lister les tables
\dt

-- Voir les utilisateurs
SELECT * FROM "User" LIMIT 10;

-- Voir les tenants
SELECT * FROM "Tenant";

-- Compter les messages
SELECT COUNT(*) FROM "Message";
```

## 🔍 Logs et Debugging

### Voir les logs en temps réel

Dashboard → Votre service → "Logs" (onglet)

Ou via CLI :

```bash
# Installer Render CLI
npm install -g render-cli

# Login
render login

# Tail logs
render logs -s mindsp-web --tail
```

### Rechercher dans les logs

```bash
# Dans le Dashboard Render
# Logs → Rechercher "error" ou "Socket.IO"
```

## ⚙️ Gestion du service

### Redémarrer le service

Dashboard → Service → "Manual Deploy" → "Clear build cache & deploy"

Ou via Shell :

```bash
# Pas de commande directe de restart
# Utilisez "Manual Deploy" dans le Dashboard
```

### Vérifier les variables d'environnement

```bash
env | grep -E "DATABASE|REDIS|NEXTAUTH"
```

### Tester le health check

```bash
curl https://votre-app.onrender.com/api/health
```

## 🗄️ Redis (Upstash)

### Vérifier la connexion Redis

Dans le Shell Render :

```bash
node -e "
const redis = require('redis');
const client = redis.createClient({
  url: process.env.UPSTASH_REDIS_REST_URL
});
client.connect().then(() => {
  console.log('✅ Redis connecté');
  client.quit();
}).catch(err => {
  console.error('❌ Erreur Redis:', err);
});
"
```

### Lister les clés Redis

```bash
# Via le Dashboard Upstash (recommandé)
# https://console.upstash.com
```

## 📦 NPM et dépendances

### Vérifier les dépendances installées

```bash
npm list --depth=0
```

### Vérifier la version Node.js

```bash
node --version
# Devrait afficher >= 20.0.0
```

### Vérifier la version npm

```bash
npm --version
```

## 🔐 Sécurité

### Régénérer NEXTAUTH_SECRET

```bash
# Sur votre machine locale
openssl rand -base64 32
```

Puis copiez dans Render Dashboard → Environment

### Régénérer VAPID Keys

```bash
# Sur votre machine locale
npx web-push generate-vapid-keys
```

Puis copiez dans Render Dashboard → Environment

## 🚀 Déploiement

### Déclencher un déploiement manuel

Dashboard → Service → "Manual Deploy" → "Deploy latest commit"

### Déclencher un redéploiement sans cache

Dashboard → Service → "Manual Deploy" → "Clear build cache & deploy"

### Annuler un déploiement en cours

Dashboard → Service → "Cancel deploy" (pendant le build)

## 📊 Monitoring et performances

### Voir l'utilisation mémoire/CPU

Dashboard → Service → "Metrics" (onglet)

### Vérifier le temps de réponse

```bash
curl -w "@-" -o /dev/null -s https://votre-app.onrender.com/api/health <<'EOF'
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_starttransfer:  %{time_starttransfer}\n
time_total:  %{time_total}\n
EOF
```

### Tester Socket.IO

```bash
# Sur votre machine locale
npm install -g wscat

# Se connecter
wscat -c "wss://votre-app.onrender.com/api/socket"
```

## 🗃️ Backups

### Backup manuel PostgreSQL

Dashboard → Database `mindsp-db` → "Backups" → "Create backup"

### Télécharger un backup

Dashboard → Database → "Backups" → Cliquez sur "..." → "Download"

### Restaurer un backup

```bash
# Télécharger le backup
# Puis depuis votre machine locale :

psql $DATABASE_URL < backup.sql
```

## 🔄 Migrations

### Créer une nouvelle migration (en dev)

```bash
# Sur votre machine locale (pas sur Render !)
npm run db:migrate
```

### Appliquer les migrations en production

```bash
# Sur Render Shell
npx prisma migrate deploy
```

### Voir l'historique des migrations

```bash
npx prisma migrate status
```

## 🌐 Domaine personnalisé

### Configurer un domaine

Dashboard → Service → "Settings" → "Custom Domain" → "Add"

Puis configurer vos DNS :

```
Type: CNAME
Name: mindsp (ou www)
Value: votre-app.onrender.com
```

## 🐛 Debug Socket.IO

### Activer les logs Socket.IO

Ajouter cette variable d'environnement :

```
DEBUG=socket.io*
```

Puis redéployer et consulter les logs.

### Tester la connexion Socket.IO

```javascript
// Dans la console du navigateur
const socket = io("wss://votre-app.onrender.com", {
  path: "/api/socket",
  transports: ["websocket"]
});

socket.on("connect", () => {
  console.log("✅ Connecté:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Erreur:", err.message);
});
```

## 📱 Web Push

### Tester les notifications push

Dans le Shell Render :

```bash
node -e "
const webpush = require('web-push');
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
console.log('✅ VAPID configuré correctement');
"
```

## 🔍 Vérifications pré-production

Avant de mettre en production, exécutez ces commandes :

```bash
# 1. Vérifier la connexion DB
npx prisma db execute --stdin < /dev/null

# 2. Vérifier les variables d'env critiques
env | grep -E "DATABASE_URL|NEXTAUTH|UPSTASH|VAPID"

# 3. Tester le health check
curl https://votre-app.onrender.com/api/health

# 4. Vérifier la version Node
node --version

# 5. Lister les processus
ps aux | grep node
```

## 📚 Ressources

- [Render CLI](https://render.com/docs/cli)
- [Render Shell Access](https://render.com/docs/shell-access)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Custom Domains](https://render.com/docs/custom-domains)

---

💡 **Astuce** : Utilisez toujours le Dashboard Render pour les opérations sensibles (redémarrage, variables d'environnement, etc.)
