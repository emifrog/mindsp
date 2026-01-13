# 🚀 Guide de déploiement sur Render.com

Ce guide vous accompagne étape par étape pour déployer votre application MindSP sur Render.

## 📋 Prérequis

- [x] Un compte GitHub avec votre code poussé
- [x] Un compte [Render.com](https://render.com) (gratuit)
- [x] Un compte [Upstash](https://upstash.com) pour Redis (gratuit)

## 🎯 Architecture sur Render

```
┌─────────────────────────────────────┐
│   Web Service (Next.js + Socket.IO) │
│   Port: 10000                        │
│   Plan: Starter ($7/mois)            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   PostgreSQL Database                │
│   Plan: Starter (Gratuit)            │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   Upstash Redis (Rate Limit)        │
│   Plan: Free (Gratuit)               │
└─────────────────────────────────────┘
```

## 📝 Étape 1 : Créer un compte Upstash Redis (Gratuit)

Render Redis est payant ($10/mois). Utilisez Upstash à la place (gratuit) :

1. Allez sur [upstash.com](https://upstash.com)
2. Créez un compte gratuit
3. Créez une nouvelle base Redis
4. Notez :
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

## 🎨 Étape 2 : Déployer via Render Dashboard

### Option A : Déploiement Blueprint (Recommandé)

1. **Connectez votre repo GitHub à Render**
   - Allez sur [dashboard.render.com](https://dashboard.render.com)
   - Cliquez sur "New +" → "Blueprint"
   - Sélectionnez votre repo `mindsp`
   - Render détectera automatiquement le fichier `render.yaml`

2. **Configurez les variables d'environnement**

   Render vous demandera de définir les variables manquantes :

   ```bash
   # URL de votre application (sera fournie par Render)
   NEXTAUTH_URL=https://votre-app.onrender.com
   NEXT_PUBLIC_APP_URL=https://votre-app.onrender.com
   ALLOWED_ORIGINS=https://votre-app.onrender.com

   # Upstash Redis (de l'étape 1)
   UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=xxxxx

   # VAPID Keys (générez-les localement)
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxxxx
   VAPID_PRIVATE_KEY=xxxxx
   ```

3. **Générer les VAPID Keys**

   Sur votre machine locale :
   ```bash
   npx web-push generate-vapid-keys
   ```

   Copiez les clés dans les variables d'environnement Render.

4. **Déployez**
   - Cliquez sur "Apply"
   - Render va créer :
     - ✅ Base de données PostgreSQL
     - ✅ Service Web avec Node.js
   - Le premier build prendra 5-10 minutes

### Option B : Déploiement Manuel

Si vous préférez configurer manuellement :

#### 2.1 Créer la base de données PostgreSQL

1. Dashboard Render → "New +" → "PostgreSQL"
2. Nom : `mindsp-db`
3. Database : `mindsp`
4. Plan : **Starter** (Gratuit)
5. Région : **Frankfurt** (proche de la France)
6. Créez la base
7. Notez l'URL de connexion `Internal Database URL`

#### 2.2 Créer le service Web

1. Dashboard Render → "New +" → "Web Service"
2. Connectez votre repo GitHub
3. Configuration :
   - **Name** : `mindsp-web`
   - **Runtime** : `Node`
   - **Region** : `Frankfurt`
   - **Branch** : `main`
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`
   - **Plan** : `Starter` ($7/mois - gratuit 90 jours)

4. **Variables d'environnement** (voir ci-dessous)

## 🔐 Étape 3 : Configuration des variables d'environnement

Dans Render Dashboard → Votre service → "Environment" :

```bash
# Base de données (auto-rempli si Blueprint)
DATABASE_URL=[Coller l'Internal Database URL de PostgreSQL]

# Application URLs (remplacez par votre URL Render)
NEXTAUTH_URL=https://votre-app.onrender.com
NEXT_PUBLIC_APP_URL=https://votre-app.onrender.com
ALLOWED_ORIGINS=https://votre-app.onrender.com

# NextAuth Secret (générez un secret aléatoire)
NEXTAUTH_SECRET=[Généré automatiquement par Render]

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx

# Redis (pour BullMQ - utilise Upstash)
REDIS_URL=https://xxxxx.upstash.io
REDIS_HOST=xxxxx.upstash.io
REDIS_PORT=6379

# Web Push (générez avec: npx web-push generate-vapid-keys)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxxxx
VAPID_PRIVATE_KEY=xxxxx
VAPID_SUBJECT=mailto:admin@mindsp.fr

# App Config
NEXT_PUBLIC_APP_NAME=MindSP
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
NODE_ENV=production
PRISMA_HIDE_UPDATE_MESSAGE=true
```

## 🚦 Étape 4 : Health Check

Render vérifiera automatiquement `/api/health`. Créons cet endpoint :

Le fichier doit exister ici : `src/app/api/health/route.ts`

Si ce fichier n'existe pas, créez-le (je peux vous aider).

## 🎉 Étape 5 : Déployer !

1. Sauvegardez les variables d'environnement
2. Cliquez sur "Manual Deploy" → "Deploy latest commit"
3. Suivez les logs en temps réel
4. Une fois terminé, votre app sera disponible à `https://votre-app.onrender.com`

## ⚙️ Configuration Socket.IO

Votre URL Socket.IO sera :
```
wss://votre-app.onrender.com/api/socket
```

Mettez à jour dans votre client Socket.IO si nécessaire.

## 📊 Migrations de base de données

Les migrations sont automatiquement appliquées au build via `npm run build` qui exécute :
```bash
prisma generate --no-engine && prisma migrate deploy
```

## 🔄 Déploiement automatique

Render déploie automatiquement à chaque push sur `main` (configurable).

Pour désactiver : Dashboard → Settings → "Auto-Deploy" → Off

## 💰 Coûts

| Service | Plan | Prix |
|---------|------|------|
| PostgreSQL | Starter | **Gratuit** |
| Web Service | Starter | $7/mois (90 jours gratuits) |
| Upstash Redis | Free | **Gratuit** (10K requêtes/jour) |
| **Total** | | **$7/mois** après 90 jours |

## 🐛 Résolution de problèmes

### Erreur "Build failed"
- Vérifiez les logs de build dans Render Dashboard
- Assurez-vous que `DATABASE_URL` est défini
- Vérifiez que Node.js >= 20.0.0

### Socket.IO ne se connecte pas
- Vérifiez que `ALLOWED_ORIGINS` contient votre URL Render
- Utilisez `wss://` (pas `ws://`) pour la production
- Vérifiez les logs du serveur

### Base de données vide
- Les migrations sont automatiques au build
- Pour seed : Render Shell → `npm run db:seed`

### Performance lente
- Le plan Starter a 512MB RAM
- Considérez upgrader vers "Standard" ($25/mois) pour plus de performances

## 🔧 Commandes utiles

### Accéder au shell Render
Dashboard → Connect → "Shell"

### Exécuter des migrations manuellement
```bash
npx prisma migrate deploy
```

### Voir les logs
```bash
Dashboard → Logs
```

### Seed la base de données
```bash
npm run db:seed
```

## 🌐 Domaine personnalisé

1. Render Dashboard → Settings → "Custom Domain"
2. Ajoutez votre domaine : `mindsp.votredomaine.fr`
3. Configurez les DNS selon les instructions Render
4. Mettez à jour les variables d'environnement avec le nouveau domaine

## 🔒 Sécurité

- [ ] HTTPS activé automatiquement par Render ✅
- [ ] Changez `NEXTAUTH_SECRET` pour une valeur unique
- [ ] Limitez `ALLOWED_ORIGINS` à vos domaines uniquement
- [ ] Activez les "IP Allow Lists" pour PostgreSQL en production
- [ ] Configurez les backups PostgreSQL (paramètres Render)

## 📚 Ressources

- [Documentation Render](https://render.com/docs)
- [Blueprint Spec](https://render.com/docs/blueprint-spec)
- [Upstash Redis](https://docs.upstash.com/redis)
- [Next.js on Render](https://render.com/docs/deploy-nextjs-app)

## 🆘 Besoin d'aide ?

- [Render Community](https://community.render.com)
- [Discord Render](https://discord.gg/render)

---

🎉 **Félicitations !** Votre application MindSP est maintenant déployée sur Render !
