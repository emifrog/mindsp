# 🏭 Production Best Practices sur Render

Guide des meilleures pratiques pour déployer MindSP en production sur Render.

## 🔒 Sécurité

### 1. Variables d'environnement

#### ❌ À ne JAMAIS commiter

```bash
# Ne jamais commiter ces valeurs dans .env
NEXTAUTH_SECRET
DATABASE_URL
REDIS_URL
UPSTASH_REDIS_REST_TOKEN
VAPID_PRIVATE_KEY
SMTP_PASSWORD
```

#### ✅ Toujours utiliser le Dashboard Render

Render Dashboard → Environment → Add Secret File ou Environment Variable

### 2. Secrets forts

```bash
# Générer un secret fort pour NEXTAUTH_SECRET
openssl rand -base64 32

# Régénérer après chaque leak potentiel
```

### 3. CORS strict

```bash
# Dans render.yaml ou Dashboard
ALLOWED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com

# Jamais en production :
ALLOWED_ORIGINS=*  # ❌ Dangereux !
```

### 4. Rate limiting

Votre app utilise déjà Upstash pour le rate limiting ✅

Vérifiez la configuration dans `src/lib/rate-limit.ts`

### 5. HTTPS uniquement

```javascript
// Socket.IO en production
const socket = io({
  secure: true, // ✅ HTTPS uniquement
  transports: ["websocket", "polling"]
});
```

### 6. Headers de sécurité

Votre `next.config.js` inclut déjà :
- ✅ Content-Security-Policy
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Strict-Transport-Security

## 📊 Monitoring

### 1. Logs structurés

Utilisez un format structuré pour les logs :

```typescript
// ✅ Bon
console.log(JSON.stringify({
  level: "error",
  message: "User authentication failed",
  userId: user.id,
  timestamp: new Date().toISOString()
}));

// ❌ Mauvais
console.log("User authentication failed");
```

### 2. Health checks

Endpoint `/api/health` déjà créé ✅

Render vérifie automatiquement toutes les 30s.

### 3. Alertes

Configurez des alertes dans Render :
1. Dashboard → Service → "Settings"
2. "Notifications" → Ajouter webhook Slack/Discord
3. Alertes sur :
   - Déploiement échoué
   - Health check échoué
   - CPU > 80%
   - Mémoire > 80%

### 4. Métriques à surveiller

- **Temps de réponse** : < 500ms
- **Taux d'erreur** : < 1%
- **Utilisation mémoire** : < 80% de 512MB
- **Connexions Socket.IO** : surveiller les pics
- **Requêtes/minute** : détecter les anomalies

## 🚀 Performance

### 1. Plan Render adapté

| Plan | RAM | CPU | Prix | Recommandation |
|------|-----|-----|------|----------------|
| Starter | 512MB | 0.5 | $7/mois | Démo/Staging |
| Standard | 2GB | 1.0 | $25/mois | **Production** ✅ |
| Pro | 4GB | 2.0 | $85/mois | Forte charge |

**Pour production, upgrader vers Standard** pour de meilleures performances.

### 2. Base de données

| Plan | Storage | Connections | Prix | Recommandation |
|------|---------|-------------|------|----------------|
| Starter | 1GB | 97 | Gratuit | Démo |
| Starter Plus | 10GB | 97 | $7/mois | **Production** ✅ |
| Standard | 100GB | 397 | $20/mois | Forte charge |

### 3. Caching avec Upstash

Utilisez Redis pour :
- ✅ Sessions utilisateurs
- ✅ Rate limiting (déjà fait)
- ✅ Cache des requêtes fréquentes
- ✅ État des workers BullMQ

### 4. Next.js optimisations

#### Image optimization

```typescript
// Utiliser next/image
import Image from "next/image";

<Image
  src="/avatar.jpg"
  width={50}
  height={50}
  alt="Avatar"
  loading="lazy"
  quality={75}
/>
```

#### ISR (Incremental Static Regeneration)

```typescript
// Pour les pages statiques avec données dynamiques
export const revalidate = 3600; // 1 heure
```

#### Edge Functions

```typescript
// Pour les API ultra-rapides
export const runtime = 'edge';

export async function GET(request: Request) {
  // ...
}
```

### 5. Socket.IO optimisations

```javascript
// server.js
const io = new Server(httpServer, {
  pingTimeout: 60000,      // 60s
  pingInterval: 25000,     // 25s
  maxHttpBufferSize: 1e6,  // 1MB

  // Activer la compression
  perMessageDeflate: {
    threshold: 1024,        // Compresser si > 1KB
  },

  // Connection pooling
  transports: ['websocket', 'polling'],

  // Adapter Redis pour scaling horizontal (optionnel)
  // adapter: createAdapter(pubClient, subClient)
});
```

## 🔄 CI/CD

### 1. Auto-deploy sur push

```yaml
# render.yaml (déjà configuré)
autoDeploy: true  # ✅ Deploy auto sur push main
```

### 2. Branches de staging

Créez un service Render séparé pour staging :

```yaml
# render-staging.yaml
services:
  - type: web
    name: mindsp-staging
    branch: develop  # Deploy depuis develop
    # ...
```

### 3. Tests avant deploy

Ajoutez des GitHub Actions :

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test  # Si vous avez des tests
```

### 4. Preview environments

Render supporte les Pull Request Previews :

1. Dashboard → Service → Settings
2. "Pull Request Previews" → Enable
3. Chaque PR aura son environnement temporaire

## 💾 Backups

### 1. PostgreSQL automatiques

Render fait des backups automatiques :
- **Starter** : 1 backup/jour, gardé 7 jours
- **Standard** : 1 backup/jour, gardé 30 jours

### 2. Backups manuels avant migration

```bash
# Avant une grosse migration
# Dashboard → Database → Backups → Create backup
```

### 3. Backup strategy

- ✅ Backup automatique quotidien (Render)
- ✅ Backup manuel avant chaque migration majeure
- ✅ Tester la restauration 1x/mois
- ✅ Exporter les backups importants localement

## 🔍 Debugging en production

### 1. Logs structurés

```typescript
// lib/logger.ts
export const logger = {
  info: (message: string, meta?: object) => {
    console.log(JSON.stringify({
      level: "info",
      message,
      ...meta,
      timestamp: new Date().toISOString()
    }));
  },
  error: (message: string, error?: Error, meta?: object) => {
    console.error(JSON.stringify({
      level: "error",
      message,
      error: error?.message,
      stack: error?.stack,
      ...meta,
      timestamp: new Date().toISOString()
    }));
  }
};
```

### 2. Error tracking

Intégrez Sentry (optionnel mais recommandé) :

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

```typescript
// sentry.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% des transactions
});
```

### 3. Source maps

```javascript
// next.config.js
const nextConfig = {
  productionBrowserSourceMaps: true, // Pour debugging
  // ...
};
```

⚠️ Attention : les source maps exposent votre code. Utilisez Sentry pour les garder privées.

## 🌍 Scaling

### 1. Scaling vertical (upgrader le plan)

Quand upgrader ?
- CPU > 80% constamment
- RAM > 80% constamment
- Temps de réponse > 1s

Dashboard → Service → Settings → "Instance Type"

### 2. Scaling horizontal (plusieurs instances)

Plans Pro/Enterprise uniquement :
- Plusieurs instances derrière un load balancer
- Nécessite Redis Adapter pour Socket.IO

```javascript
// Pour scaling horizontal Socket.IO
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: process.env.REDIS_URL });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

io.adapter(createAdapter(pubClient, subClient));
```

### 3. CDN

Render inclut un CDN global pour les assets statiques ✅

Vos fichiers dans `/public` et `/_next/static` sont automatiquement distribués.

## 📱 PWA en production

### 1. Service Worker

Votre app est déjà configurée pour PWA ✅

Vérifiez dans Chrome DevTools :
- Application → Service Workers
- Application → Manifest

### 2. Offline support

```typescript
// src/lib/offline-storage.ts déjà configuré avec Dexie
```

### 3. Push notifications

Web Push déjà configuré avec VAPID ✅

Test en production :
```bash
# Vérifier VAPID
curl https://votre-app.onrender.com/api/health

# Tester un push
curl -X POST https://votre-app.onrender.com/api/push/send \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Hello"}'
```

## 🔐 Conformité RGPD

### 1. Données sensibles

- ✅ Chiffrer les données sensibles (bcrypt pour les mots de passe)
- ✅ Ne jamais logger de données personnelles
- ✅ Supprimer les données après suppression compte

### 2. Cookies

```typescript
// NextAuth configuré avec cookies sécurisés
cookies: {
  sessionToken: {
    name: `__Secure-next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: true // HTTPS uniquement
    }
  }
}
```

### 3. Logs

```typescript
// ❌ Ne jamais logger
console.log("Login", user.email, user.password); // Danger !

// ✅ Logger uniquement les IDs
console.log("Login success", { userId: user.id });
```

## 📊 Métriques business

Suivez ces métriques dans votre base de données :

```sql
-- Utilisateurs actifs quotidiens
SELECT COUNT(DISTINCT "userId")
FROM "AuditLog"
WHERE "createdAt" > NOW() - INTERVAL '1 day';

-- Messages envoyés par jour
SELECT DATE("createdAt"), COUNT(*)
FROM "Message"
GROUP BY DATE("createdAt")
ORDER BY DATE("createdAt") DESC;

-- Conversations les plus actives
SELECT "conversationId", COUNT(*) as msg_count
FROM "Message"
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY "conversationId"
ORDER BY msg_count DESC
LIMIT 10;
```

## 🎯 Checklist avant mise en production

- [ ] Variables d'environnement toutes définies
- [ ] HTTPS activé (automatique sur Render)
- [ ] Health check fonctionne
- [ ] Backups PostgreSQL activés
- [ ] Rate limiting testé
- [ ] Socket.IO fonctionne en WSS
- [ ] Logs structurés implémentés
- [ ] Monitoring configuré
- [ ] Domaine personnalisé configuré
- [ ] Tests de charge effectués
- [ ] Plan de rollback défini
- [ ] Documentation à jour

## 📞 Support

En cas de problème en production :

1. **Consulter les logs** : Dashboard → Logs
2. **Vérifier le status** : https://status.render.com
3. **Support Render** : help@render.com
4. **Community Discord** : https://discord.gg/render

---

🎉 **Votre app est prête pour la production !**
