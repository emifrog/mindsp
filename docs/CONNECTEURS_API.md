# Connecteurs API Externes — MindSP

## Architecture

MindSP dispose de connecteurs prêts pour s'intégrer avec les logiciels métier des SDIS.
Les connecteurs sont dans `src/lib/integrations/`.

```
src/lib/integrations/
├── index.ts              # Point d'entrée, factories
├── types.ts              # Interfaces et types communs
├── base-connector.ts     # Classe abstraite (auth, retry, logs)
├── antibia-connector.ts  # Connecteur Antibia
└── lgtp-connector.ts     # Connecteur LGTP
```

---

## Connecteurs disponibles

### 1. Antibia — Gestion opérationnelle

**Éditeur** : Antibia/Masternaut
**Usage** : Gestion des interventions, gardes, disponibilités
**Utilisé par** : Nombreux SDIS en France

#### Données synchronisées

| Données Antibia | → MindSP | Méthode |
|---|---|---|
| Interventions | CalendarEvent (INTERVENTION) + TTAEntry | `syncInterventions()` |
| Gardes | TTAEntry (GARDE) | `syncGardes()` |
| Disponibilités | UserPresence (ONLINE/OFFLINE) | `syncDisponibilites()` |

#### Types de données

```typescript
interface AntibiaIntervention {
  id: string;
  numero: string;          // "2026-INT-001234"
  type: string;            // SAP, INC, DIV
  motif: string;
  adresse: string;
  commune: string;
  dateDepart: Date;
  dateRetour?: Date;
  duree?: number;          // minutes
  statut: "EN_COURS" | "TERMINEE" | "ANNULEE";
  engins: AntibiaEngin[];
  personnel: AntibiaPersonnel[];
}

interface AntibiaGarde {
  id: string;
  matricule: string;
  centreSecours: string;
  dateDebut: Date;
  dateFin: Date;
  type: "GARDE_24H" | "GARDE_12H" | "ASTREINTE" | "PIQUET";
}

interface AntibiaDisponibilite {
  id: string;
  matricule: string;
  statut: "DISPONIBLE" | "INDISPONIBLE" | "EN_INTERVENTION";
  dateDebut: Date;
  dateFin?: Date;
}
```

#### Usage

```typescript
import { createAntibiaConnector } from "@/lib/integrations";

const antibia = createAntibiaConnector();

// Tester la connexion
const ok = await antibia.testConnection();

// Synchroniser les interventions du dernier mois
const result = await antibia.syncInterventions(tenantId, {
  from: new Date("2026-03-01"),
  to: new Date("2026-03-31"),
});

console.log(`${result.created} créés, ${result.updated} mis à jour, ${result.errors.length} erreurs`);

// Synchroniser les gardes
await antibia.syncGardes(tenantId);

// Synchroniser les disponibilités en temps réel
await antibia.syncDisponibilites(tenantId);
```

#### Variables d'environnement

```env
ANTIBIA_API_URL=https://api.antibia.fr/v1/sdis06
ANTIBIA_API_KEY=votre-cle-api
ANTIBIA_SDIS_ID=06
```

---

### 2. LGTP — Gestion des Temps et Plannings

**Éditeur** : LGTP
**Usage** : Plannings de garde, heures de travail, compteurs
**Utilisé par** : SDIS pour la gestion administrative du temps

#### Données synchronisées

| Données LGTP | → MindSP | Méthode |
|---|---|---|
| Entrées de temps | TTAEntry | `syncTemps()` |
| Plannings mensuels | TTAEntry (par jour) | `syncPlanning()` |
| Compteurs d'heures | PersonnelFile.metadata | `syncCompteurs()` |

#### Types de données

```typescript
interface LGTPTemps {
  id: string;
  matricule: string;
  date: Date;
  type: "GARDE" | "ASTREINTE" | "FORMATION" | "FMPA" | "REPOS" | "CONGE" | "MALADIE" | "INTERVENTION";
  heureDebut: string;
  heureFin: string;
  duree: number;           // heures
  commentaire?: string;
  valide: boolean;
}

interface LGTPPlanning {
  id: string;
  mois: number;
  annee: number;
  centreSecours: string;
  lignes: LGTPPlanningLigne[];
}

interface LGTPCompteur {
  matricule: string;
  annee: number;
  heuresGarde: number;
  heuresAstreinte: number;
  heuresFormation: number;
  heuresFMPA: number;
  congesRestants: number;
  reposCompensatoire: number;
}
```

#### Usage

```typescript
import { createLGTPConnector } from "@/lib/integrations";

const lgtp = createLGTPConnector();

// Synchroniser les entrées de temps
const result = await lgtp.syncTemps(tenantId, {
  from: new Date("2026-03-01"),
  to: new Date("2026-03-31"),
});

// Importer un planning mensuel
await lgtp.syncPlanning(tenantId, 3, 2026); // Mars 2026

// Mettre à jour les compteurs d'heures
await lgtp.syncCompteurs(tenantId, 2026);
```

#### Variables d'environnement

```env
LGTP_API_URL=https://api.lgtp.fr/v1
LGTP_API_KEY=votre-cle-api
LGTP_SDIS_ID=06
```

---

## Fonctionnement commun

### Mapping agents

Le lien entre le système externe et MindSP se fait via le **matricule** (champ `badge` sur le modèle User).

```
Antibia matricule "SPV-06-1234" → User.badge "SPV-06-1234" → userId
```

**Important** : Chaque agent doit avoir son matricule renseigné dans MindSP pour que la synchronisation fonctionne.

### Classe de base (BaseConnector)

Tous les connecteurs héritent de `BaseConnector` qui fournit :

| Feature | Description |
|---|---|
| **Authentification** | Header `Authorization: Bearer <apiKey>` + `X-SDIS-ID` |
| **Retry automatique** | 3 tentatives avec backoff exponentiel (1s, 2s, 3s) |
| **Timeout** | 30 secondes par défaut, configurable |
| **Error tracking** | Collecte des erreurs par élément synchronisé |
| **Mode debug** | Logs détaillés des requêtes HTTP |
| **Résultat standard** | `SyncResult { created, updated, skipped, errors, duration }` |

### Options de synchronisation

```typescript
interface SyncOptions {
  from?: Date;        // Début de période (défaut: J-30)
  to?: Date;          // Fin de période (défaut: aujourd'hui)
  fullSync?: boolean; // Re-synchroniser même les éléments existants
  limit?: number;     // Nombre max d'éléments
}
```

### Résultat de synchronisation

```typescript
interface SyncResult {
  created: number;     // Nouveaux éléments créés dans MindSP
  updated: number;     // Éléments mis à jour
  skipped: number;     // Éléments ignorés (déjà à jour)
  errors: SyncError[]; // Erreurs rencontrées
  duration: number;    // Durée en ms
  syncedAt: Date;      // Timestamp
}
```

---

## Mise en place

### Prérequis

1. **Convention partenariale** signée avec l'éditeur (Antibia ou LGTP)
2. **Clé API** fournie par l'éditeur
3. **Matricules** des agents renseignés dans MindSP (champ `badge`)

### Étapes

1. Obtenir les accès API (URL + clé)
2. Ajouter les variables d'environnement (`.env` + Vercel)
3. Tester la connexion :
   ```typescript
   const connector = createAntibiaConnector();
   const ok = await connector.testConnection();
   ```
4. Lancer une première synchronisation (fullSync: true)
5. Configurer un cron job pour synchronisation régulière

### Synchronisation automatique (recommandé)

Ajouter un cron job (Vercel Cron ou externe) :

```
# Toutes les 15 minutes : disponibilités
*/15 * * * * curl https://mindsp.vercel.app/api/integrations/sync?type=disponibilites

# Toutes les heures : interventions et gardes
0 * * * * curl https://mindsp.vercel.app/api/integrations/sync?type=interventions,gardes

# Tous les jours à 6h : plannings et compteurs
0 6 * * * curl https://mindsp.vercel.app/api/integrations/sync?type=plannings,compteurs
```

---

---

### 3. Microsoft 365 — Outlook, Teams, OneDrive, Azure AD

**API** : Microsoft Graph API v1.0
**Usage** : Synchronisation avec l'écosystème Microsoft du SDIS
**Package** : `@microsoft/microsoft-graph-client`, `@azure/identity`

#### Données synchronisées

| Microsoft 365 | → MindSP | Méthode |
|---|---|---|
| Outlook Mail | MailMessage | `syncMails()` |
| Outlook Calendar | CalendarEvent | `syncCalendar()` |
| Teams Messages | → Canal Teams | `sendTeamsMessage()`, `sendTeamsAlert()` |
| OneDrive Files | PortalDocument | `syncDocuments()` |
| Azure AD Users | User | `syncUsers()` |

#### Fonctionnalités

| Méthode | Direction | Permission Graph API |
|---|---|---|
| `syncMails()` | Outlook → MindSP | `Mail.Read` |
| `sendMail()` | MindSP → Outlook | `Mail.Send` |
| `syncCalendar()` | Outlook → MindSP | `Calendars.Read` |
| `createCalendarEvent()` | MindSP → Outlook | `Calendars.ReadWrite` |
| `pushEventToOutlook()` | FMPA/Formation → Outlook participants | `Calendars.ReadWrite` |
| `sendTeamsMessage()` | MindSP → Teams | `ChannelMessage.Send` |
| `sendTeamsAlert()` | Alerte MindSP → Teams | `ChannelMessage.Send` |
| `listFiles()` | Lister OneDrive | `Files.Read.All` |
| `syncDocuments()` | OneDrive → MindSP | `Files.Read.All` |
| `syncUsers()` | Azure AD → MindSP | `User.Read.All` |

#### Usage

```typescript
import { createMicrosoft365Connector } from "@/lib/integrations";

const ms365 = createMicrosoft365Connector();

// Tester la connexion
const ok = await ms365.testConnection();

// Synchroniser les mails d'un agent
await ms365.syncMails(tenantId, "jean.dupont@sdis06.fr", {
  since: new Date("2026-03-01"),
});

// Synchroniser le calendrier Outlook
await ms365.syncCalendar(tenantId, "jean.dupont@sdis06.fr", {
  from: new Date(),
  to: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
});

// Pousser un FMPA vers Outlook Calendar des participants
await ms365.pushEventToOutlook(
  tenantId,
  "Manœuvre incendie",
  "Exercice extinction feux de forêts",
  "Plateau technique SDIS06",
  new Date("2026-04-01T09:00:00"),
  new Date("2026-04-01T17:00:00"),
  ["agent1@sdis06.fr", "agent2@sdis06.fr"]
);

// Envoyer une alerte dans Teams
await ms365.sendTeamsAlert(teamId, channelId, {
  type: "FMPA",
  title: "Manœuvre incendie - Demain 9h00",
  message: "12 inscrits - Plateau technique SDIS06",
  linkUrl: "/fmpa/abc-123",
});

// Synchroniser les utilisateurs Azure AD
await ms365.syncUsers(tenantId, { department: "SPV" });

// Importer les documents OneDrive
await ms365.syncDocuments(tenantId, "admin@sdis06.fr", "/root:/SDIS:/children");
```

#### Variables d'environnement

```env
MS365_TENANT_ID=votre-azure-tenant-id
MS365_CLIENT_ID=votre-app-client-id
MS365_CLIENT_SECRET=votre-app-client-secret
```

#### Mise en place Azure

1. Aller sur [portal.azure.com](https://portal.azure.com) → Azure Active Directory
2. **App registrations** → New registration
   - Nom : "MindSP SDIS"
   - Type : "Accounts in this organizational directory only"
3. **Certificates & secrets** → New client secret → copier la valeur
4. **API permissions** → Add permission → Microsoft Graph :
   - `Mail.Read`, `Mail.Send`
   - `Calendars.Read`, `Calendars.ReadWrite`
   - `ChannelMessage.Send`
   - `Files.Read.All`
   - `User.Read.All`
5. **Grant admin consent** (un admin Azure AD doit approuver)
6. Copier le **Tenant ID**, **Client ID**, **Client Secret** dans les variables d'environnement

---

## Créer un nouveau connecteur

Pour intégrer un autre logiciel SDIS :

```typescript
import { BaseConnector } from "./base-connector";
import type { ConnectorConfig, SyncResult } from "./types";

export class MonConnector extends BaseConnector {
  get name() { return "MonLogiciel"; }

  async testConnection(): Promise<boolean> {
    try {
      await this.request("/api/ping");
      return true;
    } catch {
      return false;
    }
  }

  async syncDonnees(tenantId: string): Promise<SyncResult> {
    this.resetErrors();
    const startTime = Date.now();
    let created = 0, updated = 0, skipped = 0;

    const data = await this.requestWithRetry("/api/donnees");

    // ... logique de synchronisation ...

    return this.createSyncResult(created, updated, skipped, startTime);
  }
}
```

---

## Sécurité

- Les clés API ne sont **jamais** stockées en base — uniquement dans les variables d'environnement
- Les requêtes utilisent **HTTPS** obligatoirement
- Le mapping matricule empêche l'accès aux données d'autres tenants
- Les erreurs sont loguées dans Sentry (pas les données sensibles)
- Timeout de 30s pour éviter les blocages
