# 🔧 Scripts de Déploiement

Ce dossier contient les scripts nécessaires pour le déploiement et la gestion de MindSP.

## 📁 Contenu

### [render-build.sh](render-build.sh)

Script de build optimisé pour Render.com.

**Utilisation** :
```bash
# Render l'exécute automatiquement via render.yaml
# Vous n'avez pas besoin de l'exécuter manuellement
```

**Ce que fait le script** :
1. ✅ Installe les dépendances npm (production uniquement)
2. ✅ Génère le client Prisma
3. ✅ Applique les migrations de base de données
4. ✅ Build Next.js

**Configuration dans render.yaml** :
```yaml
buildCommand: npm ci && npx prisma generate --no-engine && npx prisma migrate deploy && npm run build
```

## 🚀 Déploiement

Le script est automatiquement exécuté par Render lors du déploiement.

Pour un déploiement manuel local (développement) :
```bash
chmod +x scripts/render-build.sh
./scripts/render-build.sh
```

## 📝 Notes

- Le script utilise `npm ci` pour des installations déterministes
- Les migrations sont appliquées automatiquement avec `prisma migrate deploy`
- Le build Next.js est optimisé pour la production

## 🔍 Debugging

Si le build échoue, vérifiez les logs Render :
1. Dashboard Render → Service → Logs
2. Recherchez les erreurs dans la sortie du script
3. Vérifiez que DATABASE_URL est défini

## 📚 Documentation

Pour plus d'informations sur le déploiement :
- [Guide Rapide](../RENDER_QUICKSTART.md)
- [Guide Complet](../docs/DEPLOYMENT_RENDER.md)
- [Commandes](../docs/RENDER_COMMANDS.md)
