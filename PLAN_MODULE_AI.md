# Plan d'Action — Module 9 : Assistant IA Interne

**Objectif** : Permettre aux agents SDIS de poser des questions en langage naturel et obtenir des reponses contextualisees a partir des donnees de leur tenant.

**Technologie** : Claude API (Anthropic) — modele claude-sonnet-4-20250514
**Estimation** : 4 phases

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Frontend                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ AIAssistant │  │ AIChat       │  │ AISuggestion│  │
│  │ Widget      │  │ FullPage     │  │ Cards       │  │
│  └─────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│        └─────────────────┼─────────────────┘         │
│                          │                            │
│                POST /api/ai/chat                      │
└──────────────────────────┬───────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────┐
│                    Backend                            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ AI Service  │  │ Context      │  │ Conversation│  │
│  │ (Claude)    │  │ Builder      │  │ Store       │  │
│  └─────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│        │                 │                 │          │
│  ┌─────▼─────────────────▼─────────────────▼──────┐  │
│  │              Prisma (donnees tenant)            │  │
│  │  FMPA | Personnel | Formations | TTA | Agenda  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## P0 — Backend IA (fondation)

### 1. Installer le SDK Anthropic
- `npm install @anthropic-ai/sdk`
- Variable : `ANTHROPIC_API_KEY`

### 2. Creer le service IA (`src/lib/ai/ai-service.ts`)
- Classe `AIService` avec methode `chat()`
- System prompt specialise SDIS :
  - Role : assistant interne pour pompiers
  - Langue : francais
  - Ton : professionnel, concis
  - Acces aux donnees du tenant uniquement
- Streaming des reponses (SSE)
- Rate limiting (20 requetes/min par user)
- Limite de tokens (4096 max par reponse)

### 3. Creer le context builder (`src/lib/ai/context-builder.ts`)
- Recupere les donnees pertinentes du tenant selon la question
- Detecte les intentions (FMPA, personnel, formation, TTA, agenda, stats)
- Injecte les donnees dans le system prompt
- Limite le contexte a ~8000 tokens pour rester economique

### 4. Creer le modele Prisma `AIConversation`
```prisma
model AIConversation {
  id        String   @id @default(uuid())
  userId    String
  tenantId  String
  title     String?
  messages  AIMessage[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AIMessage {
  id             String   @id @default(uuid())
  conversationId String
  role           String   // "user" | "assistant"
  content        String   @db.Text
  tokensUsed     Int?
  createdAt      DateTime @default(now())
}
```

### 5. Creer la route API (`src/app/api/ai/chat/route.ts`)
- POST : envoyer un message, recevoir la reponse en streaming
- GET : historique des conversations
- Auth obligatoire + isolation tenant
- Rate limiting

---

## P1 — Frontend Chat

### 6. Creer le composant `AIAssistantWidget` (widget flottant)
- Bouton flottant en bas a droite (icone ✨)
- Ouvre un panel de chat en overlay
- Historique de la conversation courante
- Input avec envoi au Enter
- Streaming de la reponse (lettre par lettre)
- Bouton "Nouvelle conversation"

### 7. Creer la page `/assistant` (vue pleine page)
- Liste des conversations precedentes (sidebar gauche)
- Zone de chat principale
- Suggestions de questions predefinies :
  - "Quels FMPA sont prevus cette semaine ?"
  - "Qui a des qualifications qui expirent bientot ?"
  - "Resume les statistiques TTA du mois"
  - "Quelles formations sont ouvertes aux inscriptions ?"

### 8. Ajouter dans la sidebar
- Icone ✨ "Assistant IA"
- Badge "Nouveau" pendant 30 jours

---

## P2 — Contexte intelligent

### 9. Requetes contextuelles par module
L'IA peut interroger les donnees du tenant selon la question :

| Intention detectee | Donnees injectees |
|---|---|
| FMPA | FMPA a venir, taux participation, statistiques |
| Personnel | Agents, qualifications expirees, alertes medicales |
| Formations | Catalogue, inscriptions, places disponibles |
| TTA | Heures du mois, compteurs, validations en attente |
| Agenda | Evenements de la semaine, gardes, disponibilites |
| Stats generales | KPI dashboard, tendances |

### 10. Tools/Functions calling
- Permettre a l'IA d'appeler des fonctions pour recuperer des donnees specifiques
- Ex: `get_fmpa_list({ status: "PUBLISHED", period: "this_week" })`
- Ex: `get_expired_qualifications({ days_before: 30 })`
- Ex: `get_tta_summary({ month: 3, year: 2026 })`
- Ex: `search_personnel({ query: "Dupont" })`

### 11. Reponses enrichies
- L'IA peut retourner des liens cliquables vers les pages MindSP
- Ex: "Voir le detail du [FMPA Manoeuvre incendie](/fmpa/abc-123)"
- Tableaux markdown rendus en HTML
- Listes avec statuts colores

---

## P3 — Fonctionnalites avancees

### 12. Suggestions proactives (AISuggestionCards)
- Cartes sur le dashboard avec des insights generes par l'IA
- Generes en cron (1x/jour) et caches en Redis
- Exemples :
  - "⚠️ 3 agents ont des aptitudes medicales qui expirent dans 15 jours"
  - "📊 Le taux de participation FMPA a baisse de 12% ce mois"
  - "🎓 La formation PSE2 a encore 5 places disponibles"

### 13. Generation de documents
- "Redige un compte-rendu pour le FMPA du 15 mars"
- "Genere une note de service pour la FMPA incendie de demain"
- "Resume les interventions de la semaine pour le rapport mensuel"
- Export en PDF ou copie dans le presse-papier

### 14. Analyse de tendances
- "Compare les taux de participation FMPA de ce trimestre vs le precedent"
- "Quels types de formation sont les plus demandes ?"
- "Quel centre a le meilleur taux de presence ?"

### 15. Multi-modal (futur)
- Upload de documents/photos et analyse par l'IA
- Ex: photo d'un rapport papier → extraction des donnees
- Ex: scan d'une attestation → mise a jour qualifications

---

## Variables d'environnement

```env
# Anthropic Claude API
ANTHROPIC_API_KEY="sk-ant-..."

# Configuration IA
AI_MODEL="claude-sonnet-4-20250514"
AI_MAX_TOKENS=4096
AI_RATE_LIMIT_PER_MIN=20
AI_CONTEXT_MAX_TOKENS=8000
```

---

## Securite

- **Isolation tenant** : l'IA n'a acces qu'aux donnees du tenant de l'utilisateur
- **Rate limiting** : 20 requetes/min par utilisateur
- **Pas de donnees personnelles dans les logs** : seuls les token counts sont logues
- **System prompt non modifiable** par l'utilisateur
- **Audit log** : chaque conversation est tracee (userId, tenantId, timestamp)
- **Limite de cout** : max 4096 tokens par reponse, contexte limite a 8000 tokens

---

## Estimation des couts

| Usage | Tokens/requete | Cout/requete | Cout mensuel (100 users, 10 req/jour) |
|---|---|---|---|
| Question simple | ~2000 | ~$0.006 | ~$180 |
| Question avec contexte | ~6000 | ~$0.018 | ~$540 |
| Generation document | ~8000 | ~$0.024 | Occasionnel |

**Budget estime** : $200-600/mois pour 100 utilisateurs actifs (claude-sonnet-4-20250514)

Optimisations :
- Cache Redis des reponses frequentes (memes questions = meme reponse)
- Suggestions pre-generees en cron (1x/jour, pas de cout temps reel)
- Contexte minimal (uniquement les donnees pertinentes)

---

## Fichiers a creer

| Fichier | Role |
|---|---|
| `src/lib/ai/ai-service.ts` | Service principal (appel Claude, streaming) |
| `src/lib/ai/context-builder.ts` | Construction du contexte tenant |
| `src/lib/ai/tools.ts` | Definitions des tools/functions |
| `src/lib/ai/prompts.ts` | System prompts et templates |
| `src/app/api/ai/chat/route.ts` | API streaming chat |
| `src/app/api/ai/conversations/route.ts` | API historique conversations |
| `src/app/api/ai/suggestions/route.ts` | API suggestions proactives |
| `src/app/(dashboard)/assistant/page.tsx` | Page assistant pleine page |
| `src/components/ai/AIAssistantWidget.tsx` | Widget flottant |
| `src/components/ai/AIChatPanel.tsx` | Panel de conversation |
| `src/components/ai/AIMessageBubble.tsx` | Bulle de message |
| `src/components/ai/AISuggestionCards.tsx` | Cartes suggestions dashboard |
| `src/hooks/use-ai-chat.ts` | Hook React pour le chat IA |

---

## Ordre d'implementation

```
P0 (fondation)     → Service IA + Context Builder + API + Modele Prisma
P1 (frontend)      → Widget + Page assistant + Sidebar
P2 (intelligence)  → Tools calling + Contexte par module + Liens cliquables
P3 (avance)        → Suggestions proactives + Generation docs + Tendances
```

Chaque phase est independante et deployable.
