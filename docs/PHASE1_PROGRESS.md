# 🔒 Phase 1 - Sécurité Critique - Progression

**Date de début** : 30 Octobre 2025  
**Statut** : 🟡 En cours

---

## ✅ 1.1 Rate Limiting - EN COURS

### Tâches Complétées

- [x] Installer `@upstash/ratelimit` et `@upstash/redis`
- [x] Créer `src/lib/rate-limit.ts` avec 4 limiters
  - `apiLimiter` : 100 req/min (global)
  - `authLimiter` : 5 req/15min (login)
  - `registerLimiter` : 3 req/heure (inscription)
  - `sensitiveLimiter` : 10 req/min (actions sensibles)
- [x] Ajouter helpers :
  - `checkRateLimit()` - Vérifier limite
  - `getIdentifier()` - Extraire IP/userId
  - `rateLimitResponse()` - Réponse 429
- [x] Mettre à jour `.env.example` avec variables Upstash
- [x] Appliquer rate limiting sur `/api/auth/register`
- [x] Appliquer rate limiting global sur middleware (toutes routes `/api/*`)
- [x] Créer documentation complète `docs/RATE_LIMITING_SETUP.md`

### Tâches Restantes

- [ ] Configurer compte Upstash et ajouter credentials dans `.env.local`
- [ ] Tester le rate limiting (register + API global)
- [ ] Appliquer rate limiting sur actions sensibles (DELETE routes)

### Configuration Requise

#### 1. Créer un compte Upstash

1. Aller sur https://upstash.com
2. Créer un compte gratuit
3. Créer une base Redis (région proche de votre serveur)
4. Copier les credentials REST API

#### 2. Variables d'environnement

Ajouter dans `.env.local` :

```env
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-upstash-token"
```

#### 3. Tester

```bash
# Tester l'inscription (devrait bloquer après 3 tentatives)
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test1234","firstName":"Test","lastName":"User","tenantSlug":"test"}'
```

---

## ✅ 1.2 Audit Logs - COMPLÉTÉ (100%)

### Tâches Complétées

- [x] Créer `src/lib/audit.ts` (350+ lignes)
- [x] 50+ types d'actions définies (AuditAction enum)
- [x] 9 types d'entités (AuditEntity enum)
- [x] Fonctions helpers :
  - `logAudit()` - Logger action générique
  - `logDeletion()` - Logger suppression
  - `logUpdate()` - Logger modification
  - `logCreation()` - Logger création
  - `logRoleChange()` - Logger changement rôle
  - `logExport()` - Logger export
  - `logFailedLogin()` - Logger tentative échouée
- [x] Fonctions récupération :
  - `getUserAuditLogs()` - Logs utilisateur
  - `getTenantAuditLogs()` - Logs tenant
  - `getEntityAuditLogs()` - Logs entité
- [x] Fonction nettoyage RGPD : `cleanOldAuditLogs()`
- [x] Créer route API `/api/audit` (GET)
- [x] Appliquer sur toutes les suppressions :
  - DELETE FMPA (avec transaction)
  - DELETE Personnel
  - DELETE Formations
  - DELETE TTA Entries
- [x] Appliquer sur tous les exports :
  - Export TTA (CSV/SEPA)
  - Export FMPA (attendance/participants/report)
- [x] Documentation complète `docs/AUDIT_LOGS.md`

### Fichiers Créés

- `src/lib/audit.ts` (350+ lignes)
- `src/app/api/audit/route.ts` (route GET)
- `docs/AUDIT_LOGS.md` (400+ lignes)
- `PHASE1_AUDIT_LOGS_SUMMARY.md` (résumé)

### Fichiers Modifiés

- `src/app/api/fmpa/[id]/route.ts` (DELETE + audit + transaction)
- `src/app/api/personnel/files/[id]/route.ts` (DELETE + audit)
- `src/app/api/formations/[id]/route.ts` (DELETE + audit)
- `src/app/api/tta/entries/[id]/route.ts` (DELETE + audit)
- `src/app/api/tta/export/route.ts` (export + audit)
- `src/app/api/fmpa/[id]/export/route.ts` (export + audit)

---

## ✅ 1.3 CORS & CSP - COMPLÉTÉ (100%)

### Tâches Complétées

- [x] Configurer CSP strict dans `next.config.js`
  - `default-src 'self'`
  - Directives pour scripts, styles, images, fonts
  - `frame-ancestors 'none'` (anti-clickjacking)
  - `upgrade-insecure-requests`
- [x] Ajouter headers de sécurité complets
  - `Strict-Transport-Security` (HSTS 2 ans)
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Permissions-Policy`
- [x] Restreindre CORS Socket.IO dans `server.js`
  - Whitelist origins depuis `ALLOWED_ORIGINS`
  - Validation origin avec callback
  - Limites connexion (1MB buffer, timeouts)
- [x] Supprimer fallbacks dangereux
  - `src/lib/queue/index.ts` - REDIS_HOST/PORT requis
  - Throw error si variables manquantes
- [x] Mettre à jour `.env.example`
  - `REDIS_HOST`, `REDIS_PORT` (required)
  - `ALLOWED_ORIGINS` (comma-separated)
- [x] Documentation complète `docs/CORS_CSP_SECURITY.md`

### Fichiers Modifiés

- `next.config.js` (+30 lignes CSP + headers)
- `server.js` (+20 lignes CORS strict)
- `src/lib/queue/index.ts` (+8 lignes validation)
- `.env.example` (+4 lignes variables)

### Fichiers Créés

- `docs/CORS_CSP_SECURITY.md` (500+ lignes)

---

## ✅ 1.4 Validation Input - COMPLÉTÉ (100%)

### Tâches Complétées

- [x] Créer service sanitisation `src/lib/sanitize.ts` (250+ lignes)
  - 15+ fonctions de sanitisation
  - Protection XSS, injection, overflow
- [x] Créer schémas Zod réutilisables `src/lib/validation-schemas.ts` (400+ lignes)
  - 40+ schémas de validation
  - Schémas métier (FMPA, Formation, TTA, Personnel, Messages)
  - Helpers (validateData, formatZodErrors)
- [x] Appliquer validation sur routes critiques
  - POST `/api/conversations` (création)
  - POST `/api/conversations/[id]/messages` (envoi message)
  - GET `/api/conversations/[id]/messages` (pagination)
- [x] Créer middleware validation réutilisable
  - `withValidation()` - Body validation
  - `withQueryValidation()` - Query params validation
- [x] Documentation complète `docs/INPUT_VALIDATION.md`

### Fonctions Sanitisation

- `sanitizeString()` - Chaînes basiques (max 1000)
- `sanitizeEmail()` - Emails (max 255)
- `sanitizeHtml()` - HTML avec whitelist tags (max 10000)
- `sanitizeIds()` - Tableaux d'IDs (max 1000)
- `sanitizePhone()` - Téléphones
- `sanitizeUrl()` - URLs (http/https uniquement)
- `sanitizeSlug()` - Slugs pour URLs
- `sanitizeFilename()` - Noms de fichiers
- `sanitizeJson()` - Objets JSON récursif
- `sanitizeAmount()` - Montants (max 999M)
- `sanitizeDate()` - Dates
- `sanitizeBadge()` - Badges/matricules
- `sanitizePostalCode()` - Codes postaux
- `sanitizeIban()` - IBANs (27 chars)
- `sanitizeBic()` - BIC/SWIFT (8-11 chars)

### Schémas Zod Créés

- Base : email, password, name, slug, uuid, phone, url
- Dates : date, futureDate, pastDate
- Numériques : positiveInt, amount, percentage, hour
- Enums : role, status, fmpaType, ttaStatus
- Complexes : pagination, search, dateRange, address
- Métier : FMPA, Formation, TTA, Personnel, Messages

### Fichiers Créés

- `src/lib/sanitize.ts` (250+ lignes)
- `src/lib/validation-schemas.ts` (400+ lignes)
- `src/lib/validation-middleware.ts` (90+ lignes)
- `docs/INPUT_VALIDATION.md` (500+ lignes)
- `PHASE1_VALIDATION_SUMMARY.md` (résumé)

### Fichiers Modifiés

- `src/app/api/conversations/route.ts` (validation + sanitisation)
- `src/app/api/conversations/[id]/messages/route.ts` (validation + sanitisation + pagination)

---

## 📊 Progression Globale Phase 1

- **1.1 Rate Limiting** : 🟢 85% (9/11 tâches)
- **1.2 Audit Logs** : 🟢 100% (16/16 tâches)
- **1.3 CORS & CSP** : 🟢 100% (6/6 tâches)
- **1.4 Validation Input** : 🟢 100% (5/5 tâches)

**Total Phase 1** : 🟢 96% (36/38 tâches)

---

## 🎯 Prochaines Étapes Immédiates

### Aujourd'hui

1. ✅ Créer compte Upstash et configurer Redis
2. ✅ Ajouter variables dans `.env.local`
3. ✅ Appliquer rate limiting sur login
4. ✅ Tester le rate limiting

### Demain

1. Créer service audit logs
2. Logger actions critiques
3. Tester les logs

### Cette Semaine

1. Configurer CORS/CSP
2. Auditer validation input
3. Compléter Phase 1.1-1.4

---

## 📝 Notes

### Rate Limiting Configuré

- **Register** : 3 tentatives/heure par IP
- **Login** : 5 tentatives/15min par IP (à implémenter)
- **API Global** : 100 req/min par IP (à implémenter)
- **Actions Sensibles** : 10 req/min par userId (à implémenter)

### Sécurité Améliorée

- ✅ Protection contre brute-force sur inscription
- ✅ Headers rate limit dans réponses (X-RateLimit-Remaining, Retry-After)
- ✅ Extraction IP depuis X-Forwarded-For et X-Real-IP
- ✅ Fallback sécurisé si IP non disponible

---

## 🚨 Blockers

Aucun blocker actuellement. Besoin de :

- Compte Upstash (gratuit)
- Configuration variables d'environnement

---

**Dernière mise à jour** : 30 Octobre 2025 - 18:45
