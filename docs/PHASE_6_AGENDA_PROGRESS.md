# 📅 Phase 6.1 : Module Agenda - Progression

## ✅ Étape 1 : Schéma Prisma (COMPLÉTÉ)

### Modèles Créés

#### 1. Availability

Gestion des disponibilités des utilisateurs

- Types : AVAILABLE, UNAVAILABLE, PARTIAL
- Support de récurrence
- Relations : User, Tenant

#### 2. CalendarEvent

Événements du calendrier

- Types : FMPA, FORMATION, MEETING, INTERVENTION, GARDE, ASTREINTE, OTHER
- Support participants multiples
- Intégration FMPA optionnelle
- Couleurs personnalisables

#### 3. EventParticipant

Participants aux événements

- Statuts : PENDING, ACCEPTED, DECLINED, TENTATIVE
- Message de réponse optionnel
- Tracking des réponses

### Relations Ajoutées

#### Dans User

```prisma
availabilities Availability[]
calendarEventsCreated CalendarEvent[] @relation("EventCreator")
calendarEventParticipations EventParticipant[]
```

#### Dans Tenant

```prisma
availabilities Availability[]
calendarEvents CalendarEvent[]
```

#### Dans FMPA

```prisma
calendarEvent CalendarEvent?
```

## 🔄 Prochaines Étapes

### Étape 2 : Migration Prisma

```bash
npx prisma migrate dev --name add_calendar_module
npx prisma generate
```

### Étape 3 : API Routes

- `GET/POST /api/calendar/events` - CRUD événements
- `GET/POST /api/calendar/availability` - Disponibilités
- `GET /api/calendar/planning` - Planning équipe
- `PATCH /api/calendar/events/[id]/respond` - Répondre invitation

### Étape 4 : Composants UI

- Composant Calendrier (react-big-calendar)
- Formulaire événement
- Formulaire disponibilité
- Modal détails événement

### Étape 5 : Pages

- `/agenda` - Vue calendrier
- `/agenda/disponibilites` - Gestion disponibilités
- `/agenda/planning` - Planning équipe

## 📊 Progression

- [x] Schéma Prisma
- [ ] Migration DB
- [ ] API Routes
- [ ] Composants UI
- [ ] Pages
- [ ] Tests

**Statut : 15% complété**

---

_Dernière mise à jour : 07 Octobre 2025_
