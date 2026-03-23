# Plan d'Action — Module 9 : Assistant IA Interne

**Objectif** : Permettre aux agents SDIS de poser des questions en langage naturel et obtenir des reponses contextualisees a partir des donnees de leur tenant.

**Technologie** : OpenRouter (multi-modeles) — modele par defaut : google/gemini-2.5-flash-preview (gratuit)
**Estimation** : 4 phases

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Frontend                           │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ AIAssistant │  │ AIChat       │  │ AISuggestion│  │
│  │ Widget  ✅  │  │ FullPage ✅  │  │ Cards       │  │
│  └─────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│        └─────────────────┼─────────────────┘         │
│                          │                            │
│                POST /api/ai/chat  ✅                  │
└──────────────────────────┬───────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────┐
│                    Backend                            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │ AI Service  │  │ Context      │  │ Conversation│  │
│  │ (OpenRouter)│  │ Builder  ✅  │  │ Store   ✅  │  │
│  │     ✅      │  │              │  │             │  │
│  └─────┬───────┘  └──────┬───────┘  └─────┬──────┘  │
│        │                 │                 │          │
│  ┌─────▼─────────────────▼─────────────────▼──────┐  │
│  │              Prisma (donnees tenant)            │  │
│  │  FMPA | Personnel | Formations | TTA | Agenda  │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

---

## P0 — Backend IA (fondation) ✅ FAIT

### 1. ~~Installer le SDK~~ ✅
- SDK `openai` installe (compatible OpenRouter)
- Variable : `OPENROUTER_API_KEY` configuree sur Vercel
- Variable : `AI_MODEL` configurable (defaut: `google/gemini-2.5-flash-preview`)

### 2. ~~Service IA~~ ✅ (`src/lib/ai/ai-service.ts`)
- Classe `AIService` avec methodes `chat()` et `chatStream()`
- Connexion via OpenRouter (baseURL: openrouter.ai/api/v1)
- Streaming SSE des reponses
- Historique conversations (20 derniers messages)
- CRUD conversations (create, list, get, delete)
- Modele configurable via `AI_MODEL` env var

### 3. ~~Context builder~~ ✅ (`src/lib/ai/context-builder.ts`)
- Detection d'intention par mots-cles (6 modules)
- Construction contexte : FMPA, Personnel, Formation, TTA, Agenda, Stats
- Donnees injectees dans le system prompt
- Requetes Prisma paralleles (Promise.all)

### 4. ~~Prompts~~ ✅ (`src/lib/ai/prompts.ts`)
- System prompt specialise SDIS (francais, concis, professionnel)
- Regles de formatage (Markdown, tableaux, liens MindSP)
- 6 suggestions de questions par defaut

### 5. ~~Modeles Prisma~~ ✅
- `AIConversation` (userId, tenantId, title, messages)
- `AIMessage` (conversationId, role, content, tokensUsed)
- Index sur [userId, updatedAt] et [conversationId, createdAt]
- Tables creees en prod via `prisma db push`

### 6. ~~Route API~~ ✅ (`src/app/api/ai/chat/route.ts`)
- POST : envoyer message, reponse streaming SSE ou JSON
- GET : lister conversations ou charger une conversation
- DELETE : supprimer une conversation
- Auth obligatoire + isolation tenant
- Limite 5000 caracteres par message
- maxDuration: 60s pour le streaming

---

## P1 — Frontend Chat ✅ FAIT

### 7. ~~Hook use-ai-chat~~ ✅ (`src/hooks/use-ai-chat.ts`)
- Gestion messages avec streaming
- Parse SSE (data: {text}, data: {done, conversationId})
- CRUD conversations (new, load, delete)
- AbortController pour annulation

### 8. ~~Composant AIChatPanel~~ ✅ (`src/components/ai/AIChatPanel.tsx`)
- Zone de chat avec messages user/assistant
- Streaming lettre par lettre
- Rendu Markdown (tableaux, gras, liens, listes)
- Suggestions predefinies quand conversation vide
- Sidebar conversations (mode page complete)
- Auto-scroll vers le bas

### 9. ~~Widget flottant~~ ✅ (`src/components/ai/AIAssistantWidget.tsx`)
- Bouton ✨ flottant en bas a droite (toutes les pages)
- Ouvre un panel overlay 420x560px
- Animation slide-in

### 10. ~~Page /assistant~~ ✅ (`src/app/(dashboard)/assistant/page.tsx`)
- Vue pleine page avec sidebar conversations
- Liste conversations precedentes
- Suppression conversations

### 11. ~~Sidebar + Layout~~ ✅
- "✨ Assistant IA" ajoute dans la navigation
- Widget AIAssistantWidget ajoute dans le layout dashboard
- Version mise a jour (v2.2.0)

---

## P2 — Contexte intelligent (A FAIRE)

### 12. Tools/Functions calling
- Permettre a l'IA d'appeler des fonctions pour recuperer des donnees specifiques
- Ex: `get_fmpa_list({ status: "PUBLISHED", period: "this_week" })`
- Ex: `get_expired_qualifications({ days_before: 30 })`
- Ex: `get_tta_summary({ month: 3, year: 2026 })`
- Ex: `search_personnel({ query: "Dupont" })`

### 13. Reponses enrichies
- L'IA peut retourner des liens cliquables vers les pages MindSP
- Ex: "Voir le detail du [FMPA Manoeuvre incendie](/fmpa/abc-123)"
- Tableaux markdown rendus en HTML
- Listes avec statuts colores

---

## P3 — Fonctionnalites avancees (A FAIRE)

### 14. Suggestions proactives (AISuggestionCards)
- Cartes sur le dashboard avec des insights generes par l'IA
- Generes en cron (1x/jour) et caches en Redis
- Exemples :
  - "⚠️ 3 agents ont des aptitudes medicales qui expirent dans 15 jours"
  - "📊 Le taux de participation FMPA a baisse de 12% ce mois"
  - "🎓 La formation PSE2 a encore 5 places disponibles"

### 15. Generation de documents
- "Redige un compte-rendu pour le FMPA du 15 mars"
- "Genere une note de service pour la FMPA incendie de demain"
- Export en PDF ou copie dans le presse-papier

### 16. Analyse de tendances
- "Compare les taux de participation FMPA de ce trimestre vs le precedent"
- "Quels types de formation sont les plus demandes ?"

---

## Variables d'environnement

```env
# OpenRouter
OPENROUTER_API_KEY="sk-or-v1-..."

# Configuration IA (optionnel — valeurs par defaut)
AI_MODEL="google/gemini-2.5-flash-preview"   # Gratuit, 1M contexte
AI_MAX_TOKENS=4096
```

### Modeles gratuits alternatifs (OpenRouter)

| Modele | Taille | Contexte | Francais |
|---|---|---|---|
| `google/gemini-2.5-flash-preview` | - | 1M | Excellent |
| `deepseek/deepseek-chat-v3-0324:free` | - | 64K | Tres bon |
| `qwen/qwen3-235b-a22b:free` | 235B | 40K | Bon |
| `google/gemma-3-27b-it:free` | 27B | 96K | Bon |

Pour changer de modele : modifier `AI_MODEL` sur Vercel, pas besoin de redéployer.

---

## Fichiers crees

| Fichier | Role | Status |
|---|---|---|
| `src/lib/ai/ai-service.ts` | Service OpenRouter (streaming, historique) | ✅ |
| `src/lib/ai/context-builder.ts` | Construction contexte tenant (6 modules) | ✅ |
| `src/lib/ai/prompts.ts` | System prompts et suggestions | ✅ |
| `src/app/api/ai/chat/route.ts` | API streaming SSE + CRUD conversations | ✅ |
| `src/hooks/use-ai-chat.ts` | Hook React chat IA | ✅ |
| `src/components/ai/AIChatPanel.tsx` | Panel de conversation complet | ✅ |
| `src/components/ai/AIAssistantWidget.tsx` | Bouton flottant ✨ | ✅ |
| `src/app/(dashboard)/assistant/page.tsx` | Page assistant pleine page | ✅ |
| `src/components/ai/AISuggestionCards.tsx` | Cartes suggestions dashboard | A faire |

---

## Securite

- **Isolation tenant** : l'IA n'a acces qu'aux donnees du tenant de l'utilisateur
- **Auth obligatoire** : session NextAuth requise
- **Limite message** : 5000 caracteres max
- **System prompt non modifiable** par l'utilisateur
- **Historique sauvegarde** : chaque conversation tracee (userId, tenantId)
- **Pas de donnees sensibles dans les logs** : seuls les token counts

---

## Ordre d'implementation

```
P0 (fondation)     ✅ Service IA + Context Builder + API + Modele Prisma
P1 (frontend)      ✅ Widget + Page assistant + Sidebar + Hook
P2 (intelligence)  ⏳ Tools calling + Contexte par module + Liens cliquables
P3 (avance)        ⏳ Suggestions proactives + Generation docs + Tendances
```
