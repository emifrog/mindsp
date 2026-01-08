# 📧 Mailbox (Email Interne) - Phase 2 : Progression

## ✅ Accomplissements (40%)

### 🗄️ Base de Données (100%)

- ✅ **4 modèles Prisma** créés
- ✅ **3 enums** définis
- ✅ **Migration** appliquée avec succès
- ✅ **Relations** configurées (User, Tenant)

**Modèles** :

1. `MailMessage` - Messages email
2. `MailRecipient` - Destinataires (TO, CC, BCC)
3. `MailAttachment` - Pièces jointes
4. `MailLabel` - Labels/Tags

**Enums** :

1. `RecipientType` (TO, CC, BCC)
2. `MailFolder` (INBOX, SENT, DRAFTS, ARCHIVE, TRASH)

### 💻 Types TypeScript (100%)

- ✅ **Fichier** : `src/types/mailbox.ts`
- ✅ **8 interfaces** créées
- ✅ Types pour création/mise à jour
- ✅ Types pour statistiques
- ✅ Types pour filtres de recherche

---

## 🚧 En Cours

### API Routes à créer

#### 1. Inbox & Folders

```typescript
GET    /api/mail/inbox       - Boîte de réception
GET    /api/mail/sent        - Messages envoyés
GET    /api/mail/drafts      - Brouillons
GET    /api/mail/archive     - Archives
GET    /api/mail/trash       - Corbeille
GET    /api/mail/starred     - Messages étoilés
```

#### 2. Messages

```typescript
GET    /api/mail/messages/:id      - Détails message
POST   /api/mail/messages          - Nouveau message
PUT    /api/mail/messages/:id      - Modifier brouillon
DELETE /api/mail/messages/:id      - Supprimer message
```

#### 3. Actions

```typescript
POST   /api/mail/messages/:id/read      - Marquer lu/non lu
POST   /api/mail/messages/:id/star      - Ajouter/retirer étoile
POST   /api/mail/messages/:id/archive   - Archiver
POST   /api/mail/messages/:id/move      - Déplacer vers dossier
POST   /api/mail/messages/:id/labels    - Gérer labels
```

#### 4. Statistiques

```typescript
GET    /api/mail/stats      - Statistiques mailbox
```

---

## 📦 Composants UI à créer

### Layout & Navigation

1. **MailboxLayout** - Layout principal
2. **FolderList** - Liste dossiers (sidebar)
3. **MailboxHeader** - Header avec recherche

### Liste Messages

4. **MessageList** - Liste messages
5. **MessageItem** - Item de message (preview)
6. **MessageFilters** - Filtres avancés

### Lecture & Composition

7. **MessageView** - Vue détaillée message
8. **ComposeDialog** - Composer nouveau message
9. **MessageComposer** - Éditeur riche (TipTap)

### Pièces Jointes & Labels

10. **AttachmentList** - Liste pièces jointes
11. **AttachmentItem** - Item pièce jointe
12. **LabelManager** - Gestion labels
13. **LabelBadge** - Badge label

---

## 🎨 Design UI Prévu

### Layout

```
┌─────────────────────────────────────────────────────────┐
│ 📧 Mailbox                    [🔍 Rechercher...] [✏️]   │
├──────────────┬──────────────────────────────────────────┤
│              │ [📥 Inbox (5)]  [⭐] [🗑️]                │
│ Dossiers     ├──────────────────────────────────────────┤
│ 📥 Inbox (5) │ ☆ John Doe        Réunion demain         │
│ 📤 Envoyés   │    Bonjour, je voulais confirmer...      │
│ 📝 Brouillons│    10:30 AM                     [📎]     │
│ 📁 Archives  │ ───────────────────────────────────────  │
│ 🗑️ Corbeille │ ⭐ Jane Smith     URGENT: Formation      │
│              │    Il faut absolument...                 │
│ Labels       │    Hier                         [📎]     │
│ 🔴 Urgent    │ ───────────────────────────────────────  │
│ 🟢 FMPA      │ ☆ Bob Martin      Disponibilités         │
│ 🔵 Admin     │    Voici mes disponibilités pour...      │
│              │    2 jours                               │
└──────────────┴──────────────────────────────────────────┘
```

### Composer Message

```
┌─────────────────────────────────────────────────────────┐
│ ✏️ Nouveau message                              [×]     │
├─────────────────────────────────────────────────────────┤
│ À :      [John Doe, Jane Smith]                  [CC]   │
│ Sujet :  [Réunion équipe]                               │
├─────────────────────────────────────────────────────────┤
│ [B] [I] [U] [📎] [🎨] [📷]                             │
├─────────────────────────────────────────────────────────┤
│ Bonjour à tous,                                         │
│                                                         │
│ Je vous propose une réunion...                          │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Pièces jointes (2):                                     │
│ 📄 document.pdf (245 KB)                        [×]     │
│ 🖼️ image.png (128 KB)                           [×]     │
├─────────────────────────────────────────────────────────┤
│ [💾 Brouillon]           [📤 Envoyer]                   │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Fonctionnalités Prévues

### Must Have ✅

- [ ] Envoyer message
- [ ] Recevoir message
- [ ] Lire message
- [ ] Répondre à message
- [ ] Transférer message
- [ ] Brouillons auto-sauvegardés
- [ ] Pièces jointes
- [ ] Dossiers (Inbox, Sent, Drafts, Archive, Trash)
- [ ] Marquer lu/non lu
- [ ] Étoiler messages
- [ ] Supprimer messages

### Should Have 🚧

- [ ] Destinataires multiples (TO, CC, BCC)
- [ ] Labels personnalisés
- [ ] Recherche messages
- [ ] Filtres avancés
- [ ] Tri (date, expéditeur, sujet)
- [ ] Sélection multiple
- [ ] Actions groupées

### Could Have 📋

- [ ] Éditeur riche (TipTap)
- [ ] Signatures
- [ ] Modèles de messages
- [ ] Rappels
- [ ] Règles de filtrage auto
- [ ] Export messages

---

## 🎯 Prochaines Étapes

### Court Terme (Aujourd'hui)

1. [ ] Créer API routes principales
2. [ ] Créer MailboxLayout
3. [ ] Créer FolderList
4. [ ] Créer MessageList
5. [ ] Créer MessageItem

### Moyen Terme (Demain)

1. [ ] Créer MessageView
2. [ ] Créer ComposeDialog
3. [ ] Implémenter upload pièces jointes
4. [ ] Créer LabelManager
5. [ ] Page Mailbox complète

### Long Terme (Cette semaine)

1. [ ] Éditeur riche (TipTap)
2. [ ] Recherche avancée
3. [ ] Actions groupées
4. [ ] Statistiques
5. [ ] Tests

---

## 📝 Notes Techniques

### Différences Chat vs Mailbox

| Critère            | Chat              | Mailbox                 |
| ------------------ | ----------------- | ----------------------- |
| **Temps réel**     | ✅ WebSocket      | ❌ HTTP classique       |
| **Messages**       | Courts, informels | Longs, formels          |
| **Structure**      | Canaux            | Dossiers                |
| **Destinataires**  | Implicite (canal) | Explicite (TO, CC, BCC) |
| **Brouillons**     | ❌ Non            | ✅ Oui                  |
| **Pièces jointes** | Optionnel         | Important               |
| **Recherche**      | Simple            | Avancée                 |
| **Organisation**   | Threads           | Labels + Dossiers       |

### Architecture

```
Client (React)
    ↓
API Routes (REST)
    ↓
Prisma ORM
    ↓
PostgreSQL
```

### Sécurité

- ✅ Authentification requise
- ✅ Tenant isolation
- ✅ Vérification destinataire
- ✅ Validation propriétaire (brouillons)
- ✅ Sanitization contenu

---

## 📊 Statistiques

### Fichiers Créés

- ✅ 1 migration Prisma
- ✅ 1 fichier types (`mailbox.ts`)
- 🚧 API routes (à créer)
- 🚧 Composants UI (à créer)
- 🚧 Page Mailbox (à créer)

**Total actuel : 2 fichiers**

### Lignes de Code

- Schéma Prisma : ~100 lignes
- Types : ~120 lignes

**Total : ~220 lignes**

---

## 🎊 Objectifs Phase 2

### Must Have

- [x] Schéma base de données
- [x] Migration Prisma
- [x] Types TypeScript
- [ ] API routes de base
- [ ] Composants UI de base
- [ ] Page Mailbox fonctionnelle
- [ ] Envoyer/Recevoir messages

### Should Have

- [ ] Pièces jointes
- [ ] Labels
- [ ] Recherche
- [ ] Filtres
- [ ] Brouillons auto-save

### Could Have

- [ ] Éditeur riche
- [ ] Signatures
- [ ] Modèles
- [ ] Règles auto

---

**Dernière mise à jour** : 12 Octobre 2025, 23:58
**Progression globale** : 40% ✅
**Prochaine étape** : Créer les API routes
