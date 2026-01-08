# 🔍 Plan de Contrôle des Fonctionnalités - Avant Phase 7

**Date** : 18 Octobre 2025  
**Version** : 1.0.0  
**Objectif** : Valider toutes les fonctionnalités avant de passer à la Phase 7 (CI/CD & DevOps)

---

## 📋 Vue d'Ensemble

### Statut Global

- ⏳ **En cours de contrôle**
- 🎯 **Objectif** : 100% des fonctionnalités validées
- 📊 **Progression** : 0/8 modules testés

### Modules à Contrôler

1. ⏳ Module FMPA
2. ⏳ Chat & Mailbox
3. ⏳ Formations
4. ⏳ TTA (Temps de Travail Additionnel)
5. ⏳ Agenda
6. ⏳ Portails (Actualités & Documents)
7. ⏳ Personnel
8. ⏳ Recherche Avancée

---

## 🎯 PRIORITÉ 1 : Tests Manuels par Module

Voir fichiers détaillés :

- `CONTROL_FMPA.md` - Tests Module FMPA
- `CONTROL_CHAT_MAILBOX.md` - Tests Chat & Mailbox
- `CONTROL_FORMATIONS.md` - Tests Formations
- `CONTROL_TTA.md` - Tests TTA
- `CONTROL_AGENDA.md` - Tests Agenda
- `CONTROL_PORTAILS.md` - Tests Portails
- `CONTROL_PERSONNEL.md` - Tests Personnel
- `CONTROL_RECHERCHE.md` - Tests Recherche

---

## 🔧 PRIORITÉ 2 : Tests Techniques

### 2.1 Performance

- [ ] Temps chargement pages < 2s
- [ ] First Contentful Paint < 1s
- [ ] Time to Interactive < 3s
- [ ] Bundle size < 200KB
- [ ] Images optimisées
- [ ] Code splitting actif
- [ ] Lazy loading composants

**Outils** :

- Lighthouse
- WebPageTest
- Chrome DevTools

### 2.2 WebSocket

- [ ] Connexion établie
- [ ] Reconnexion automatique
- [ ] Latence < 100ms
- [ ] Gestion déconnexion
- [ ] Heartbeat fonctionnel
- [ ] Messages temps réel
- [ ] Typing indicators
- [ ] Présence en ligne

**Test** :

```
1. Ouvrir DevTools Network
2. Filtrer WS (WebSocket)
3. Vérifier connexion
4. Couper réseau
5. Vérifier reconnexion
6. Mesurer latence
```

### 2.3 Base de Données

- [ ] Queries lentes identifiées
- [ ] Indexes créés
- [ ] N+1 queries évitées
- [ ] Pagination efficace
- [ ] Connection pooling
- [ ] Temps réponse < 500ms

**Outils** :

- Prisma Studio
- PostgreSQL logs
- Prisma query logging

### 2.4 Multi-tenancy

- [ ] Isolation données testée
- [ ] RLS Prisma fonctionnel
- [ ] Middleware tenant actif
- [ ] Pas de fuite données
- [ ] Queries filtrées par tenantId
- [ ] Tests cross-tenant

**Test** :

```
1. Login SDIS13
2. Créer données
3. Logout
4. Login SDIS06
5. Vérifier données SDIS13 invisibles
6. Créer données SDIS06
7. Vérifier isolation
```

### 2.5 Authentification

- [ ] Login fonctionnel
- [ ] Logout fonctionnel
- [ ] Session persistante
- [ ] Refresh tokens
- [ ] Expiration tokens
- [ ] Protection routes
- [ ] Middleware NextAuth
- [ ] CSRF protection

**Test** :

```
1. Login
2. Vérifier session
3. Attendre expiration
4. Vérifier refresh
5. Logout
6. Vérifier redirection
```

### 2.6 API

- [ ] Rate limiting actif
- [ ] Gestion erreurs 4xx/5xx
- [ ] Validation inputs
- [ ] Sanitization données
- [ ] CORS configuré
- [ ] Headers sécurité
- [ ] Logs erreurs

**Test** :

```
1. Tester rate limiting (100 req/min)
2. Envoyer données invalides
3. Vérifier erreurs 400
4. Tester CORS
5. Vérifier headers sécurité
```

---

## 🔗 PRIORITÉ 3 : Tests d'Intégration

### 3.1 Workflow FMPA Complet

```
1. Créer FMPA (admin)
2. S'inscrire (user)
3. Recevoir email confirmation
4. Recevoir notification
5. Recevoir rappel 24h avant
6. Scanner QR Code émargement
7. Statut → ATTENDED
8. Export PDF liste
9. Vérifier PDF complet
```

### 3.2 Workflow Formation Complet

```
1. Créer formation (admin)
2. S'inscrire (user)
3. Attendre validation (admin)
4. Approuver inscription
5. Recevoir email approbation
6. Suivre formation
7. Émarger présence
8. Générer attestation PDF
9. Recevoir attestation email
10. Vérifier QR Code attestation
```

### 3.3 Notifications Multi-canaux

```
1. Créer événement déclencheur
2. Vérifier notification in-app
3. Vérifier email envoyé
4. Vérifier push notification navigateur
5. Vérifier badge compteur
6. Cliquer notification
7. Vérifier redirection
8. Marquer comme lu
```

### 3.4 Queue Redis/BullMQ

```
1. Déclencher job (email, notification)
2. Vérifier queue Redis
3. Vérifier traitement job
4. Vérifier retry en cas d'échec
5. Vérifier dashboard monitoring
6. Vérifier logs jobs
```

---

## 🛡️ PRIORITÉ 4 : Audit Sécurité

### 4.1 Validation Inputs

- [ ] XSS prevention
- [ ] SQL injection prevention
- [ ] HTML sanitization
- [ ] URL validation
- [ ] Email validation
- [ ] File upload validation
- [ ] Size limits

**Test** :

```
1. Injecter <script>alert('XSS')</script>
2. Vérifier sanitization
3. Tester SQL injection
4. Upload fichier malveillant
5. Vérifier validation
```

### 4.2 Protection CSRF

- [ ] Tokens CSRF générés
- [ ] Validation tokens
- [ ] SameSite cookies
- [ ] Headers sécurité
- [ ] NextAuth protection

### 4.3 RLS Prisma

- [ ] Row Level Security actif
- [ ] Queries filtrées
- [ ] Pas de bypass possible
- [ ] Tests isolation

### 4.4 Permissions Roles

- [ ] ADMIN : accès complet
- [ ] MANAGER : gestion équipe
- [ ] USER : accès limité
- [ ] GUEST : lecture seule
- [ ] Tests chaque rôle

**Test** :

```
1. Login USER
2. Tenter accès admin
3. Vérifier refus 403
4. Login ADMIN
5. Vérifier accès complet
```

### 4.5 Variables d'Environnement

- [ ] Pas de secrets en dur
- [ ] .env.local utilisé
- [ ] .env.example à jour
- [ ] Secrets Vercel configurés
- [ ] Rotation clés API

---

## 📊 Tableau de Bord Contrôle

### Modules (Priorité 1)

| Module         | Tests | Passés | Échecs | Statut |
| -------------- | ----- | ------ | ------ | ------ |
| FMPA           | 0/50  | 0      | 0      | ⏳     |
| Chat & Mailbox | 0/60  | 0      | 0      | ⏳     |
| Formations     | 0/40  | 0      | 0      | ⏳     |
| TTA            | 0/30  | 0      | 0      | ⏳     |
| Agenda         | 0/25  | 0      | 0      | ⏳     |
| Portails       | 0/35  | 0      | 0      | ⏳     |
| Personnel      | 0/20  | 0      | 0      | ⏳     |
| Recherche      | 0/15  | 0      | 0      | ⏳     |

### Technique (Priorité 2)

| Catégorie        | Tests | Passés | Échecs | Statut |
| ---------------- | ----- | ------ | ------ | ------ |
| Performance      | 0/7   | 0      | 0      | ⏳     |
| WebSocket        | 0/8   | 0      | 0      | ⏳     |
| Base de données  | 0/6   | 0      | 0      | ⏳     |
| Multi-tenancy    | 0/6   | 0      | 0      | ⏳     |
| Authentification | 0/8   | 0      | 0      | ⏳     |
| API              | 0/7   | 0      | 0      | ⏳     |

### Intégration (Priorité 3)

| Workflow          | Tests | Passés | Échecs | Statut |
| ----------------- | ----- | ------ | ------ | ------ |
| FMPA complet      | 0/9   | 0      | 0      | ⏳     |
| Formation complet | 0/10  | 0      | 0      | ⏳     |
| Notifications     | 0/8   | 0      | 0      | ⏳     |
| Queue Redis       | 0/6   | 0      | 0      | ⏳     |

### Sécurité (Priorité 4)

| Catégorie         | Tests | Passés | Échecs | Statut |
| ----------------- | ----- | ------ | ------ | ------ |
| Validation inputs | 0/7   | 0      | 0      | ⏳     |
| CSRF              | 0/5   | 0      | 0      | ⏳     |
| RLS Prisma        | 0/4   | 0      | 0      | ⏳     |
| Permissions       | 0/5   | 0      | 0      | ⏳     |
| Variables env     | 0/5   | 0      | 0      | ⏳     |

---

## 🚀 Prochaines Étapes

### 1. Créer Checklists Détaillées

- [ ] CONTROL_FMPA.md
- [ ] CONTROL_CHAT_MAILBOX.md
- [ ] CONTROL_FORMATIONS.md
- [ ] CONTROL_TTA.md
- [ ] CONTROL_AGENDA.md
- [ ] CONTROL_PORTAILS.md
- [ ] CONTROL_PERSONNEL.md
- [ ] CONTROL_RECHERCHE.md

### 2. Exécuter Tests Priorité 1

- [ ] Tester chaque module
- [ ] Documenter résultats
- [ ] Corriger bugs trouvés
- [ ] Re-tester après corrections

### 3. Exécuter Tests Priorité 2

- [ ] Tests performance
- [ ] Tests techniques
- [ ] Optimisations

### 4. Exécuter Tests Priorité 3 & 4

- [ ] Tests intégration
- [ ] Audit sécurité
- [ ] Corrections finales

### 5. Validation Finale

- [ ] 100% tests passés
- [ ] Documentation à jour
- [ ] Prêt pour Phase 7

---

**📝 Note** : Ce plan sera mis à jour au fur et à mesure des tests.
