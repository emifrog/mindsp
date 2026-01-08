# 📅 Agenda - Implémentation Étape 1

**Date** : 19 Octobre 2025 18:26  
**Statut** : ✅ Modèles DB créés  
**Prochaine étape** : Migrations + API

---

## ✅ Étape 1 Complétée : Modèles Prisma

### Modèles Créés

#### 1. AgendaEvent

**Table** : `agenda_events`

Événement du calendrier avec support de récurrence.

**Champs** :

- `id` - UUID unique
- `title` - Titre de l'événement
- `description` - Description détaillée (optionnel)
- `startDate` - Date/heure de début
- `endDate` - Date/heure de fin
- `allDay` - Événement toute la journée (boolean)
- `type` - Type d'événement (enum AgendaEventType)
- `status` - Statut (enum AgendaEventStatus)
- `location` - Lieu (optionnel)
- `color` - Couleur dans le calendrier (optionnel)
- `createdById` - ID du créateur
- `tenantId` - ID du tenant
- `isRecurring` - Événement récurrent (boolean)
- `recurrenceRule` - Règle de récurrence RRULE (optionnel)
- `parentEventId` - ID de l'événement parent si récurrent
- `createdAt` / `updatedAt` - Timestamps

**Relations** :

- `createdBy` → User
- `tenant` → Tenant
- `participants` → AgendaEventParticipant[]
- `reminders` → AgendaEventReminder[]
- `parentEvent` → AgendaEvent (auto-relation)
- `childEvents` → AgendaEvent[] (auto-relation)

**Index** :

- `[tenantId, startDate]` - Requêtes par tenant et date
- `[type]` - Filtrage par type
- `[status]` - Filtrage par statut
- `[createdById]` - Événements par créateur

#### 2. AgendaEventParticipant

**Table** : `agenda_event_participants`

Participants à un événement.

**Champs** :

- `id` - UUID unique
- `eventId` - ID de l'événement
- `userId` - ID de l'utilisateur
- `status` - Statut de participation (enum ParticipantStatus)
- `role` - Rôle dans l'événement (optionnel) - ex: "CHEF", "EQUIPIER"
- `createdAt` / `updatedAt` - Timestamps

**Relations** :

- `event` → AgendaEvent
- `user` → User

**Contraintes** :

- Unique `[eventId, userId]` - Un utilisateur ne peut être qu'une fois dans un événement

**Index** :

- `[userId]` - Événements par utilisateur

#### 3. AgendaEventReminder

**Table** : `agenda_event_reminders`

Rappels pour les événements.

**Champs** :

- `id` - UUID unique
- `eventId` - ID de l'événement
- `type` - Type de rappel (enum ReminderType)
- `timing` - Minutes avant l'événement
- `sent` - Rappel envoyé (boolean)
- `sentAt` - Date d'envoi (optionnel)
- `createdAt` - Timestamp

**Relations** :

- `event` → AgendaEvent

**Index** :

- `[eventId]` - Rappels par événement
- `[sent]` - Rappels non envoyés

### Enums Créés

#### AgendaEventType

Types d'événements disponibles :

- `GARDE` - Prise de garde (24h)
- `FMPA` - Formation de Maintien et de Perfectionnement des Acquis
- `FORMATION` - Formation / Stage
- `PROTOCOLE` - Exercice / Test de protocole
- `ENTRETIEN` - Entretien caserne / Maintenance
- `PERSONNEL` - Événement personnel (congés, RDV)
- `REUNION` - Réunion
- `AUTRE` - Autre type

#### AgendaEventStatus

Statuts d'événements :

- `SCHEDULED` - Planifié (défaut)
- `CONFIRMED` - Confirmé
- `CANCELLED` - Annulé
- `COMPLETED` - Terminé

#### ReminderType

Types de rappels :

- `EMAIL` - Email
- `NOTIFICATION` - Notification in-app
- `SMS` - SMS (si configuré)

### Relations Ajoutées

#### Dans User

```prisma
// Agenda
agendaEventsCreated AgendaEvent[] @relation("AgendaEventCreator")
agendaEventParticipations AgendaEventParticipant[] @relation("AgendaParticipant")
```

#### Dans Tenant

```prisma
agendaEvents AgendaEvent[] @relation("AgendaEvents")
```

---

## 🎯 Fonctionnalités Supportées

### ✅ Événements Simples

- Création d'événements avec date/heure
- Événements toute la journée
- Description et localisation
- Couleur personnalisée par événement

### ✅ Types d'Événements

- 8 types prédéfinis (GARDE, FMPA, FORMATION, etc.)
- Filtrage facile par type

### ✅ Gestion des Participants

- Ajout de participants à un événement
- Statut de participation (PENDING, ACCEPTED, DECLINED, TENTATIVE)
- Rôle dans l'événement (CHEF, EQUIPIER, etc.)

### ✅ Rappels Automatiques

- Rappels configurables (minutes avant)
- 3 types de rappels (EMAIL, NOTIFICATION, SMS)
- Tracking des rappels envoyés

### ✅ Événements Récurrents

- Support RRULE (RFC 5545)
- Relation parent/enfants
- Modification d'une occurrence ou de toutes

### ✅ Multi-tenant

- Isolation par tenant
- Index optimisés pour les requêtes

---

## 📊 Exemples de Données

### Événement Simple

```typescript
{
  title: "Garde Équipe A",
  description: "Garde 24h - Caserne Centrale",
  startDate: "2025-10-20T08:00:00Z",
  endDate: "2025-10-21T08:00:00Z",
  allDay: false,
  type: "GARDE",
  status: "CONFIRMED",
  location: "Caserne Centrale",
  color: "#ef4444", // Rouge
  createdById: "user-123",
  tenantId: "tenant-sdis13"
}
```

### Événement Toute la Journée

```typescript
{
  title: "FMPA Incendie",
  description: "Manœuvre incendie - Techniques d'extinction",
  startDate: "2025-10-25T00:00:00Z",
  endDate: "2025-10-25T23:59:59Z",
  allDay: true,
  type: "FMPA",
  status: "SCHEDULED",
  location: "Centre de formation",
  color: "#f59e0b", // Orange
  createdById: "user-456",
  tenantId: "tenant-sdis13"
}
```

### Événement Récurrent

```typescript
{
  title: "Réunion Hebdomadaire",
  description: "Point d'équipe",
  startDate: "2025-10-21T09:00:00Z",
  endDate: "2025-10-21T10:00:00Z",
  allDay: false,
  type: "REUNION",
  status: "SCHEDULED",
  location: "Salle de réunion",
  isRecurring: true,
  recurrenceRule: "FREQ=WEEKLY;BYDAY=MO", // Tous les lundis
  createdById: "user-789",
  tenantId: "tenant-sdis13"
}
```

### Participant

```typescript
{
  eventId: "event-123",
  userId: "user-456",
  status: "ACCEPTED",
  role: "CHEF"
}
```

### Rappel

```typescript
{
  eventId: "event-123",
  type: "NOTIFICATION",
  timing: 1440, // 24h avant (en minutes)
  sent: false
}
```

---

## 🔄 Prochaines Étapes

### Étape 2 : Migrations

```bash
# Générer la migration
npx prisma migrate dev --name add_agenda_models

# Générer le client Prisma
npx prisma generate
```

### Étape 3 : API Routes

Créer les endpoints :

- `GET /api/agenda/events` - Liste des événements
- `POST /api/agenda/events` - Créer un événement
- `GET /api/agenda/events/[id]` - Détails d'un événement
- `PATCH /api/agenda/events/[id]` - Modifier un événement
- `DELETE /api/agenda/events/[id]` - Supprimer un événement
- `POST /api/agenda/events/[id]/participants` - Ajouter un participant
- `PATCH /api/agenda/events/[id]/participants/[userId]` - Modifier statut participant

### Étape 4 : Composants Frontend

- `Calendar.tsx` - Composant calendrier principal
- `CalendarGrid.tsx` - Vue mensuelle
- `EventCard.tsx` - Carte événement
- `EventDialog.tsx` - Dialog créer/modifier
- `EventFilters.tsx` - Filtres sidebar

### Étape 5 : Utilitaires

- `calendar-utils.ts` - Fonctions calendrier
- `rrule-utils.ts` - Gestion récurrence
- `event-colors.ts` - Couleurs par type

---

## 📚 Ressources

### RRULE (Récurrence)

Format standard RFC 5545 pour les événements récurrents.

**Exemples** :

- `FREQ=DAILY` - Tous les jours
- `FREQ=WEEKLY;BYDAY=MO,WE,FR` - Lundi, Mercredi, Vendredi
- `FREQ=MONTHLY;BYMONTHDAY=1` - Le 1er de chaque mois
- `FREQ=YEARLY;BYMONTH=12;BYMONTHDAY=25` - 25 décembre chaque année

**Librairie recommandée** : `rrule` (npm)

### Couleurs par Type

```typescript
const EVENT_COLORS = {
  GARDE: "#ef4444", // Rouge
  FMPA: "#f59e0b", // Orange
  FORMATION: "#3b82f6", // Bleu
  PROTOCOLE: "#8b5cf6", // Violet
  ENTRETIEN: "#10b981", // Vert
  PERSONNEL: "#6b7280", // Gris
  REUNION: "#06b6d4", // Cyan
  AUTRE: "#64748b", // Slate
};
```

---

## ✅ Checklist Étape 1

- [x] Modèle AgendaEvent créé
- [x] Modèle AgendaEventParticipant créé
- [x] Modèle AgendaEventReminder créé
- [x] Enums créés (AgendaEventType, AgendaEventStatus, ReminderType)
- [x] Relations ajoutées dans User
- [x] Relations ajoutées dans Tenant
- [x] Index optimisés
- [x] Support récurrence (RRULE)
- [x] Documentation complète

---

**✅ Étape 1 terminée ! Prêt pour les migrations et l'API.**

**Prochaine commande** :

```bash
npx prisma migrate dev --name add_agenda_models
```
