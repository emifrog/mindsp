# 🚀 Déploiement Render - Guide Rapide

## ⚡ Déploiement en 5 minutes

### 1️⃣ Préparez Upstash Redis (Gratuit)

```bash
# Allez sur https://upstash.com
# Créez un compte et une base Redis gratuite
# Copiez les credentials :
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

### 2️⃣ Générez les VAPID Keys

```bash
npx web-push generate-vapid-keys
```

Copiez les clés générées.

### 3️⃣ Déployez sur Render

1. **Connectez-vous à [Render](https://render.com)**

2. **Nouveau Blueprint**
   - Cliquez sur "New +" → "Blueprint"
   - Sélectionnez votre repo GitHub `mindsp`
   - Render détecte automatiquement `render.yaml` ✅

3. **Configurez les variables d'environnement**

   Render vous demandera de remplir :

   ```bash
   # Après le premier déploiement, Render vous donnera une URL
   # Revenez ici et mettez à jour ces 3 variables :
   NEXTAUTH_URL=https://votre-app.onrender.com
   NEXT_PUBLIC_APP_URL=https://votre-app.onrender.com
   ALLOWED_ORIGINS=https://votre-app.onrender.com

   # Upstash (de l'étape 1)
   UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=xxxxx

   # VAPID (de l'étape 2)
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=xxxxx
   VAPID_PRIVATE_KEY=xxxxx
   ```

4. **Cliquez sur "Apply"** 🎉

### 4️⃣ Attendez le build (5-10 min)

Render va automatiquement :
- ✅ Créer une base PostgreSQL gratuite
- ✅ Installer les dépendances
- ✅ Appliquer les migrations Prisma
- ✅ Builder Next.js
- ✅ Démarrer le serveur avec Socket.IO

### 5️⃣ Mise à jour post-déploiement

Une fois déployé, **récupérez votre URL** (ex: `https://mindsp-web.onrender.com`)

Puis **mettez à jour ces 3 variables** dans Render Dashboard :

```bash
NEXTAUTH_URL=https://mindsp-web.onrender.com
NEXT_PUBLIC_APP_URL=https://mindsp-web.onrender.com
ALLOWED_ORIGINS=https://mindsp-web.onrender.com
```

Sauvegardez → Render redéploie automatiquement ✨

---

## ✅ C'est terminé !

Votre application est live sur : `https://votre-app.onrender.com`

Socket.IO : `wss://votre-app.onrender.com/api/socket`

---

## 📚 Documentation complète

Pour plus de détails : [docs/DEPLOYMENT_RENDER.md](docs/DEPLOYMENT_RENDER.md)

## 💰 Coût

- **PostgreSQL** : Gratuit ✅
- **Web Service** : $7/mois (90 jours gratuits d'abord)
- **Upstash Redis** : Gratuit ✅

**Total : $7/mois** après 90 jours gratuits

---

## 🆘 Problèmes ?

### Build échoue
```bash
# Vérifiez que DATABASE_URL est bien défini
# Render le remplit automatiquement via le Blueprint
```

### Socket.IO ne marche pas
```bash
# Vérifiez ALLOWED_ORIGINS contient votre URL Render
# Utilisez wss:// pas ws:// en production
```

### Variables manquantes
```bash
# Dashboard Render → Service → Environment
# Ajoutez les variables manquantes
```

---

🎉 **Bon déploiement !**
