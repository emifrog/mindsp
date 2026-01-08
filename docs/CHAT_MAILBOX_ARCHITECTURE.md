# 💬 Chat Temps Réel + 📧 Mailbox - Architecture Complète

## 🎯 Vision Globale

Remplacer le système de messagerie actuel par deux modules distincts :

### 1. 💬 Chat Temps Réel (Style Slack/Discord)

- **Usage** : Communication instantanée, discussions d'équipe
- **Caractéristiques** :
  - Messages instantanés
  - Canaux/Groupes
  - Conversations privées
  - Typing indicators
  - Présence en ligne
  - Réactions emoji
  - Threads de discussion

### 2. 📧 Mailbox (Style Email Interne)

- **Usage** : Communication formelle, notifications officielles
- **Caractéristiques** :
  - Messages structurés
  - Pièces jointes
  - Brouillons
  - Dossiers (Inbox, Sent, Drafts, Archive)
  - Recherche avancée
  - Filtres et labels

---

## 📊 Schéma Base de Données

### Chat Temps Réel

```prisma
// Canaux de discussion
model ChatChannel {
  id          String   @id @default(cuid())
  name        String
  description String?
  type        ChannelType // PUBLIC, PRIVATE, DIRECT
  tenantId    String
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  createdBy   User     @relation("ChannelCreator", fields: [createdById], references: [id])

  members     ChatChannelMember[]
  messages    ChatMessage[]

  @@index([tenantId])
  @@index([type])
}

enum ChannelType {
  PUBLIC      // Visible par tous
  PRIVATE     // Sur invitation
  DIRECT      // Conversation 1-to-1
}

// Membres d'un canal
model ChatChannelMember {
  id          String   @id @default(cuid())
  channelId   String
  userId      String
  role        ChannelRole @default(MEMBER)
  joinedAt    DateTime @default(now())
  lastReadAt  DateTime?

  channel     ChatChannel @relation(fields: [channelId], references: [id], onDelete: Cascade)
  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([channelId, userId])
  @@index([userId])
}

enum ChannelRole {
  OWNER
  ADMIN
  MEMBER
}

// Messages du chat
model ChatMessage {
  id          String   @id @default(cuid())
  channelId   String
  userId      String
  content     String   @db.Text
  type        MessageType @default(TEXT)
  parentId    String?  // Pour les threads
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  channel     ChatChannel @relation(fields: [channelId], references: [id], onDelete: Cascade)
  user        User        @relation(fields: [userId], references: [id])
  parent      ChatMessage? @relation("MessageThread", fields: [parentId], references: [id])
  replies     ChatMessage[] @relation("MessageThread")

  reactions   ChatReaction[]
  attachments ChatAttachment[]
  mentions    ChatMention[]

  @@index([channelId])
  @@index([userId])
  @@index([parentId])
  @@index([createdAt])
}

enum MessageType {
  TEXT
  IMAGE
  FILE
  SYSTEM  // Messages système (X a rejoint, etc.)
}

// Réactions aux messages
model ChatReaction {
  id        String   @id @default(cuid())
  messageId String
  userId    String
  emoji     String
  createdAt DateTime @default(now())

  message   ChatMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user      User        @relation(fields: [userId], references: [id])

  @@unique([messageId, userId, emoji])
  @@index([messageId])
}

// Pièces jointes du chat
model ChatAttachment {
  id        String   @id @default(cuid())
  messageId String
  fileName  String
  fileUrl   String
  fileSize  Int
  mimeType  String
  createdAt DateTime @default(now())

  message   ChatMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@index([messageId])
}

// Mentions dans les messages
model ChatMention {
  id        String   @id @default(cuid())
  messageId String
  userId    String
  createdAt DateTime @default(now())

  message   ChatMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user      User        @relation(fields: [userId], references: [id])

  @@unique([messageId, userId])
  @@index([userId])
}

// Statut de présence
model UserPresence {
  id        String   @id @default(cuid())
  userId    String   @unique
  status    PresenceStatus @default(OFFLINE)
  lastSeen  DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum PresenceStatus {
  ONLINE
  AWAY
  BUSY
  OFFLINE
}

// Typing indicators
model TypingIndicator {
  id        String   @id @default(cuid())
  channelId String
  userId    String
  startedAt DateTime @default(now())

  @@unique([channelId, userId])
  @@index([channelId])
}
```

### Mailbox (Email Interne)

```prisma
// Messages email internes
model MailMessage {
  id          String   @id @default(cuid())
  subject     String
  body        String   @db.Text
  fromId      String
  tenantId    String
  isDraft     Boolean  @default(false)
  isImportant Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  from        User     @relation("SentMails", fields: [fromId], references: [id])

  recipients  MailRecipient[]
  attachments MailAttachment[]
  labels      MailLabel[]

  @@index([tenantId])
  @@index([fromId])
  @@index([createdAt])
}

// Destinataires des emails
model MailRecipient {
  id        String   @id @default(cuid())
  messageId String
  userId    String
  type      RecipientType
  isRead    Boolean  @default(false)
  readAt    DateTime?
  folder    MailFolder @default(INBOX)
  isArchived Boolean @default(false)
  isStarred Boolean  @default(false)
  deletedAt DateTime?

  message   MailMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user      User        @relation("ReceivedMails", fields: [userId], references: [id])

  @@unique([messageId, userId, type])
  @@index([userId])
  @@index([folder])
}

enum RecipientType {
  TO
  CC
  BCC
}

enum MailFolder {
  INBOX
  SENT
  DRAFTS
  ARCHIVE
  TRASH
}

// Pièces jointes email
model MailAttachment {
  id        String   @id @default(cuid())
  messageId String
  fileName  String
  fileUrl   String
  fileSize  Int
  mimeType  String
  createdAt DateTime @default(now())

  message   MailMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)

  @@index([messageId])
}

// Labels/Tags pour emails
model MailLabel {
  id        String   @id @default(cuid())
  messageId String
  userId    String
  name      String
  color     String

  message   MailMessage @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user      User        @relation(fields: [userId], references: [id])

  @@unique([messageId, userId, name])
  @@index([userId])
}
```

---

## 🎨 Design UI/UX

### Chat Temps Réel

```
┌─────────────────────────────────────────────────────────┐
│ 💬 Chat                                    [🔍] [@] [⚙️] │
├──────────────┬──────────────────────────────────────────┤
│              │ # général                    [📌] [👥] [⋮]│
│ Canaux       ├──────────────────────────────────────────┤
│ # général    │ John Doe          10:30 AM               │
│ # pompiers   │ Salut tout le monde! 👋                  │
│ # formations │ ───────────────────────────────────────  │
│              │ Jane Smith        10:32 AM               │
│ Messages     │ Hey! Comment ça va?                      │
│ 🟢 John Doe  │ [👍 2] [❤️ 1]                            │
│ 🟡 Jane      │ ───────────────────────────────────────  │
│ ⚫ Bob       │ Vous (en train d'écrire...)              │
│              │                                          │
│ [+ Nouveau]  │ [📎] [😊] [Envoyer un message...] [🎤]   │
└──────────────┴──────────────────────────────────────────┘
```

### Mailbox

```
┌─────────────────────────────────────────────────────────┐
│ 📧 Mailbox                            [✏️ Nouveau mail]  │
├──────────────┬──────────────────────────────────────────┤
│              │ [🔍 Rechercher...]         [⚙️] [🗑️]     │
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

---

## 🔌 Architecture Technique

### WebSocket pour Chat Temps Réel

```typescript
// src/lib/socket-chat.ts
import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

export function initChatSocket(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    path: "/api/chat/socket",
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Rejoindre un canal
    socket.on("join-channel", (channelId: string) => {
      socket.join(`channel:${channelId}`);
    });

    // Nouveau message
    socket.on("send-message", async (data) => {
      const message = await createMessage(data);
      io.to(`channel:${data.channelId}`).emit("new-message", message);
    });

    // Typing indicator
    socket.on("typing-start", (data) => {
      socket.to(`channel:${data.channelId}`).emit("user-typing", {
        userId: data.userId,
        channelId: data.channelId,
      });
    });

    socket.on("typing-stop", (data) => {
      socket.to(`channel:${data.channelId}`).emit("user-stopped-typing", {
        userId: data.userId,
        channelId: data.channelId,
      });
    });

    // Présence
    socket.on("update-presence", async (status) => {
      await updateUserPresence(socket.userId, status);
      io.emit("presence-updated", {
        userId: socket.userId,
        status,
      });
    });

    socket.on("disconnect", () => {
      updateUserPresence(socket.userId, "OFFLINE");
    });
  });

  return io;
}
```

### API Routes

```typescript
// Chat
POST   /api/chat/channels           - Créer un canal
GET    /api/chat/channels           - Liste des canaux
GET    /api/chat/channels/:id       - Détails d'un canal
PUT    /api/chat/channels/:id       - Modifier un canal
DELETE /api/chat/channels/:id       - Supprimer un canal

POST   /api/chat/channels/:id/members     - Ajouter un membre
DELETE /api/chat/channels/:id/members/:userId - Retirer un membre

GET    /api/chat/channels/:id/messages    - Messages d'un canal
POST   /api/chat/channels/:id/messages    - Envoyer un message
PUT    /api/chat/messages/:id             - Modifier un message
DELETE /api/chat/messages/:id             - Supprimer un message

POST   /api/chat/messages/:id/reactions   - Ajouter une réaction
DELETE /api/chat/messages/:id/reactions/:emoji - Retirer une réaction

GET    /api/chat/direct/:userId           - Conversation directe
POST   /api/chat/direct/:userId           - Message direct

// Mailbox
GET    /api/mail/inbox                    - Boîte de réception
GET    /api/mail/sent                     - Messages envoyés
GET    /api/mail/drafts                   - Brouillons
GET    /api/mail/archive                  - Archives
GET    /api/mail/trash                    - Corbeille

GET    /api/mail/messages/:id             - Détails d'un message
POST   /api/mail/messages                 - Nouveau message
PUT    /api/mail/messages/:id             - Modifier brouillon
DELETE /api/mail/messages/:id             - Supprimer message

POST   /api/mail/messages/:id/read        - Marquer comme lu
POST   /api/mail/messages/:id/star        - Ajouter étoile
POST   /api/mail/messages/:id/archive     - Archiver
POST   /api/mail/messages/:id/move        - Déplacer vers dossier

POST   /api/mail/labels                   - Créer un label
GET    /api/mail/labels                   - Liste des labels
POST   /api/mail/messages/:id/labels      - Ajouter label
```

---

## 📱 Composants React

### Chat Components

```
src/components/chat/
├── ChatLayout.tsx              # Layout principal
├── ChannelList.tsx             # Liste des canaux
├── ChannelItem.tsx             # Item de canal
├── MessageList.tsx             # Liste des messages
├── Message.tsx                 # Message individuel
├── MessageInput.tsx            # Input de message
├── MessageThread.tsx           # Thread de réponses
├── TypingIndicator.tsx         # Indicateur "en train d'écrire"
├── UserPresence.tsx            # Statut de présence
├── EmojiPicker.tsx             # Sélecteur d'emoji
├── FileUpload.tsx              # Upload de fichiers
├── MentionSuggestions.tsx      # Suggestions de mentions
└── CreateChannelDialog.tsx     # Dialog création canal
```

### Mailbox Components

```
src/components/mailbox/
├── MailboxLayout.tsx           # Layout principal
├── FolderList.tsx              # Liste des dossiers
├── MessageList.tsx             # Liste des messages
├── MessageItem.tsx             # Item de message
├── MessageView.tsx             # Vue détaillée
├── ComposeDialog.tsx           # Composer un message
├── MessageComposer.tsx         # Éditeur de message
├── AttachmentList.tsx          # Liste des pièces jointes
├── LabelManager.tsx            # Gestion des labels
└── SearchBar.tsx               # Barre de recherche
```

---

## 🎯 Fonctionnalités Clés

### Chat Temps Réel

#### 1. Canaux Publics

- Visibles par tous les membres du tenant
- Création par admins/managers
- Icônes colorées par type

#### 2. Canaux Privés

- Sur invitation uniquement
- Gestion des membres
- Permissions granulaires

#### 3. Messages Directs

- Conversations 1-to-1
- Historique complet
- Notifications push

#### 4. Threads

- Réponses organisées
- Compteur de réponses
- Vue dédiée

#### 5. Réactions

- Emoji sur messages
- Compteur de réactions
- Réactions rapides

#### 6. Mentions

- @utilisateur
- @channel (tous)
- Notifications

#### 7. Recherche

- Messages
- Fichiers
- Utilisateurs

### Mailbox

#### 1. Composition

- Éditeur riche (TipTap/Quill)
- Pièces jointes multiples
- Brouillons auto-sauvegardés
- Destinataires multiples (TO, CC, BCC)

#### 2. Organisation

- Dossiers (Inbox, Sent, Drafts, Archive, Trash)
- Labels personnalisés
- Étoiles/Important
- Filtres

#### 3. Recherche Avancée

- Par expéditeur
- Par sujet
- Par contenu
- Par date
- Par pièce jointe

#### 4. Actions Groupées

- Sélection multiple
- Archiver en masse
- Supprimer en masse
- Marquer comme lu/non lu

---

## 🚀 Plan d'Implémentation

### Phase 1 : Chat Temps Réel (Prioritaire)

**Durée** : 2 semaines

#### Semaine 1

- [x] Schéma Prisma
- [ ] Migration base de données
- [ ] WebSocket setup
- [ ] API routes de base
- [ ] Composants UI de base

#### Semaine 2

- [ ] Canaux publics/privés
- [ ] Messages temps réel
- [ ] Typing indicators
- [ ] Présence en ligne
- [ ] Réactions emoji

### Phase 2 : Mailbox (Secondaire)

**Durée** : 1.5 semaines

#### Semaine 3

- [ ] Schéma Prisma
- [ ] Migration base de données
- [ ] API routes
- [ ] Composants UI

#### Semaine 4 (mi-temps)

- [ ] Éditeur riche
- [ ] Pièces jointes
- [ ] Labels et dossiers
- [ ] Recherche

### Phase 3 : Améliorations

**Durée** : 1 semaine

- [ ] Notifications push
- [ ] Threads de discussion
- [ ] Mentions avancées
- [ ] Recherche globale
- [ ] Export de conversations
- [ ] Statistiques d'utilisation

---

## 📊 Comparaison Messagerie vs Chat+Mailbox

| Critère           | Messagerie Actuelle | Chat + Mailbox        |
| ----------------- | ------------------- | --------------------- |
| **Temps réel**    | ⚠️ Limité           | ✅ WebSocket natif    |
| **Organisation**  | ⚠️ Basique          | ✅ Canaux + Dossiers  |
| **Recherche**     | ⚠️ Simple           | ✅ Avancée            |
| **Collaboration** | ❌ Limitée          | ✅ Threads, réactions |
| **Notifications** | ⚠️ Basiques         | ✅ Granulaires        |
| **UX**            | ⚠️ Standard         | ✅ Moderne            |
| **Performance**   | ⚠️ Moyenne          | ✅ Optimisée          |

---

## 🎨 Stack Technique

### Frontend

- **React** : Composants
- **Socket.IO Client** : WebSocket
- **TipTap** : Éditeur riche (Mailbox)
- **React Query** : Cache et sync
- **Zustand** : State management
- **date-fns** : Dates
- **Iconify** : Icônes colorées

### Backend

- **Next.js API Routes** : REST API
- **Socket.IO** : WebSocket server
- **Prisma** : ORM
- **PostgreSQL** : Database
- **Redis** : Cache (présence, typing)

### Storage

- **Uploadthing** : Fichiers/images
- **PostgreSQL** : Messages et métadonnées

---

## ✅ Checklist de Migration

### Préparation

- [ ] Backup de la base de données
- [ ] Export des messages existants
- [ ] Communication aux utilisateurs

### Migration

- [ ] Créer nouvelles tables
- [ ] Migrer les données
- [ ] Tester la migration
- [ ] Rollback plan

### Déploiement

- [ ] Déployer le Chat
- [ ] Déployer la Mailbox
- [ ] Formation utilisateurs
- [ ] Monitoring

---

**Voulez-vous que je commence l'implémentation du Chat Temps Réel en premier ?** 💬🚀
