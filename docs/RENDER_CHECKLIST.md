# ✅ Checklist de déploiement Render

Utilisez cette checklist pour vous assurer que tout est configuré correctement.

## 📋 Avant de commencer

- [ ] Code poussé sur GitHub
- [ ] Compte Render.com créé (gratuit)
- [ ] Compte Upstash créé (gratuit)

## 🔧 Configuration Upstash Redis

- [ ] Base Redis créée sur Upstash
- [ ] `UPSTASH_REDIS_REST_URL` copié
- [ ] `UPSTASH_REDIS_REST_TOKEN` copié

## 🔑 VAPID Keys générées

```bash
npx web-push generate-vapid-keys
```

- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY` copié
- [ ] `VAPID_PRIVATE_KEY` copié

## 🚀 Déploiement Render

### Blueprint

- [ ] Render Dashboard → "New +" → "Blueprint"
- [ ] Repo GitHub `mindsp` sélectionné
- [ ] Blueprint détecté automatiquement (`render.yaml` ✅)

### Variables d'environnement configurées

#### Obligatoires (à définir maintenant)

- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- [ ] `VAPID_PRIVATE_KEY`

#### À définir après le 1er déploiement

- [ ] `NEXTAUTH_URL` (avec l'URL Render)
- [ ] `NEXT_PUBLIC_APP_URL` (avec l'URL Render)
- [ ] `ALLOWED_ORIGINS` (avec l'URL Render)

### Déploiement

- [ ] Cliquez sur "Apply"
- [ ] Build en cours (5-10 min)
- [ ] PostgreSQL créé ✅
- [ ] Web Service créé ✅
- [ ] Build réussi ✅
- [ ] Déploiement réussi ✅

## 🔄 Post-déploiement

- [ ] URL Render obtenue : `https://__________.onrender.com`
- [ ] Variables mises à jour :
  - [ ] `NEXTAUTH_URL`
  - [ ] `NEXT_PUBLIC_APP_URL`
  - [ ] `ALLOWED_ORIGINS`
- [ ] Redéploiement automatique terminé

## ✅ Vérifications

- [ ] Site accessible : `https://votre-app.onrender.com`
- [ ] Health check OK : `https://votre-app.onrender.com/api/health`
- [ ] Socket.IO connecté : `wss://votre-app.onrender.com/api/socket`
- [ ] Login fonctionne
- [ ] Base de données accessible
- [ ] Messages temps réel fonctionnent

## 🎯 Optimisations (optionnel)

- [ ] Domaine personnalisé configuré
- [ ] SSL/TLS activé (automatique sur Render)
- [ ] Backups PostgreSQL activés
- [ ] Monitoring configuré
- [ ] Logs consultés

## 🐛 En cas de problème

### Build échoue
```
✅ Vérifier DATABASE_URL (auto-rempli par Blueprint)
✅ Vérifier Node.js version >= 20
✅ Consulter les logs de build
```

### Socket.IO ne marche pas
```
✅ Vérifier ALLOWED_ORIGINS
✅ Utiliser wss:// (pas ws://)
✅ Vérifier les logs du serveur
```

### Erreur 503
```
✅ Vérifier /api/health
✅ Vérifier connexion PostgreSQL
✅ Consulter les logs d'exécution
```

## 📊 Monitoring

- [ ] Dashboard Render → Logs consultés
- [ ] Métriques CPU/RAM consultées
- [ ] Temps de réponse vérifiés

## 💰 Coûts confirmés

- PostgreSQL : **Gratuit** ✅
- Web Service : **$7/mois** (90 jours gratuits)
- Upstash Redis : **Gratuit** ✅

---

## 🎉 Déploiement terminé !

Votre application MindSP est maintenant en production sur Render !

**URL de production** : `https://__________________.onrender.com`

**Date de déploiement** : `____/____/202_`

---

## 📚 Ressources

- [Guide complet](DEPLOYMENT_RENDER.md)
- [Guide rapide](../RENDER_QUICKSTART.md)
- [Documentation Render](https://render.com/docs)
