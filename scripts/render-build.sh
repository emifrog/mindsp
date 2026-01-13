#!/bin/bash
# Script de build pour Render.com

set -e  # Arrêter en cas d'erreur

echo "🚀 Début du build pour Render..."

# 1. Installer les dépendances
echo "📦 Installation des dépendances..."
npm ci --omit=dev --legacy-peer-deps

# 2. Générer le client Prisma
echo "🔧 Génération du client Prisma..."
npx prisma generate --no-engine

# 3. Appliquer les migrations de la base de données
echo "🗄️ Application des migrations..."
npx prisma migrate deploy

# 4. Build Next.js
echo "⚡ Build de Next.js..."
npm run build

echo "✅ Build terminé avec succès!"
