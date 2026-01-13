# 🏗️ Architecture sur Render

Diagramme et explications de l'architecture de déploiement MindSP sur Render.

## 📐 Architecture Globale

```
┌────────────────────────────────────────────────────────────────────┐
│                         UTILISATEURS                               │
│                    🌍 Internet / Navigateurs                       │
└────────────────────────────────────────────────────────────────────┘
                                 │
                                 │ HTTPS/WSS
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                      RENDER.COM CDN GLOBAL                         │
│                   🌐 Edge Network Worldwide                        │
│                                                                    │
│  ├─ Static Assets (/public, /_next/static)                       │
│  ├─ Automatic HTTPS                                               │
│  └─ DDoS Protection                                               │
└────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────────────────────────────────────────┐
│                     RENDER WEB SERVICE                             │
│                  mindsp-web (Frankfurt, EU)                        │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   Next.js Application                     │   │
│  │                                                           │   │
│  │  ┌─────────────────┐      ┌─────────────────┐          │   │
│  │  │   App Router    │      │   API Routes    │          │   │
│  │  │   (Pages)       │      │   (/api/*)      │          │   │
│  │  │                 │      │                 │          │   │
│  │  │ • Dashboard     │      │ • Auth          │          │   │
│  │  │ • FMPA          │      │ • FMPA          │          │   │
│  │  │ • Messaging     │      │ • Formations    │          │   │
│  │  │ • Agenda        │      │ • Notifications │          │   │
│  │  └─────────────────┘      └─────────────────┘          │   │
│  │                                                           │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │          Custom Node.js Server                    │  │   │
│  │  │              (server.js)                          │  │   │
│  │  │                                                    │  │   │
│  │  │  ┌──────────────────────────────────────┐        │  │   │
│  │  │  │       Socket.IO Server               │        │  │   │
│  │  │  │         (Path: /api/socket)          │        │  │   │
│  │  │  │                                       │        │  │   │
│  │  │  │  • Chat temps réel                   │        │  │   │
│  │  │  │  • Notifications push                │        │  │   │
│  │  │  │  • Présence en ligne                 │        │  │   │
│  │  │  │  • Typing indicators                 │        │  │   │
│  │  │  └──────────────────────────────────────┘        │  │   │
│  │  │                                                    │  │   │
│  │  │  ┌──────────────────────────────────────┐        │  │   │
│  │  │  │         BullMQ Workers               │        │  │   │
│  │  │  │                                       │        │  │   │
│  │  │  │  • Email notifications               │        │  │   │
│  │  │  │  • FMPA reminders                    │        │  │   │
│  │  │  │  • Report generation                 │        │  │   │
│  │  │  └──────────────────────────────────────┘        │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │                                                           │   │
│  │  Resources: 512MB RAM, 0.5 CPU (Starter)                │   │
│  │            2GB RAM, 1.0 CPU (Standard)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
                  │                            │
                  │                            │
        ┌─────────┴──────────┐    ┌───────────┴──────────┐
        ▼                    ▼    ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  PostgreSQL 16   │  │  Redis (Upstash) │  │   UploadThing    │
│   mindsp-db      │  │   Cache & Queue  │  │  File Storage    │
│  (Frankfurt)     │  │   (EU-West)      │  │   (Global CDN)   │
│                  │  │                  │  │                  │
│ • User data      │  │ • Sessions       │  │ • Avatars        │
│ • Conversations  │  │ • Rate limiting  │  │ • Documents      │
│ • Messages       │  │ • Cache queries  │  │ • Attachments    │
│ • FMPA data      │  │ • BullMQ jobs    │  │                  │
│                  │  │                  │  │                  │
│ 1GB Storage      │  │ 10K req/day      │  │ 2GB Free         │
│ 97 Connections   │  │ FREE ✅          │  │                  │
│ FREE ✅          │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## 🔄 Flux de Données

### 1. Requête HTTP Standard

```
Utilisateur
    │
    │ 1. GET /dashboard
    ▼
Render CDN
    │
    │ 2. Forward to Web Service
    ▼
Next.js App Router
    │
    │ 3. Fetch data via Prisma
    ▼
PostgreSQL
    │
    │ 4. Return data
    ▼
Next.js SSR
    │
    │ 5. HTML Response
    ▼
Utilisateur (Page rendered)
```

### 2. API Call avec Cache

```
Client
    │
    │ 1. POST /api/fmpa
    ▼
Next.js API Route
    │
    │ 2. Check Redis cache
    ▼
Redis (Upstash)
    │
    ├─── Cache HIT ──────────────┐
    │                             │
    │                             ▼
    │                        Return cached
    │                             │
    └─── Cache MISS              │
         │                        │
         │ 3. Query PostgreSQL    │
         ▼                        │
    PostgreSQL                    │
         │                        │
         │ 4. Cache result        │
         ▼                        │
    Redis (Upstash)               │
         │                        │
         └────────────────────────┘
                  │
                  │ 5. JSON Response
                  ▼
              Client
```

### 3. WebSocket (Socket.IO)

```
Client A                         Client B
    │                                │
    │ 1. Connect WebSocket           │
    ├────────────────────────────────┤
    │         Socket.IO Server       │
    │                                │
    │ 2. Authenticate                │
    ├──────────► Verify DB ◄─────────┤
    │            PostgreSQL           │
    │                                │
    │ 3. Join room "conversation:123"│
    │                                │
    │ 4. Send message ───────────────►
    │            │                   │
    │            │ 5. Save to DB     │
    │            ▼                   │
    │       PostgreSQL               │
    │            │                   │
    │            │ 6. Broadcast      │
    │ ◄──────────┴────────────────────
    │                                │
    │ 7. Receive message             │ 7. Receive message
    ▼                                ▼
```

### 4. Background Job (BullMQ)

```
Event Trigger
    │
    │ 1. User registers to FMPA
    ▼
API Route
    │
    │ 2. Create job in queue
    ▼
Redis (BullMQ Queue)
    │
    │ 3. Worker picks job
    ▼
BullMQ Worker
    │
    ├─── 4a. Send email notification
    │
    ├─── 4b. Create reminder job (J-7)
    │
    └─── 4c. Update statistics cache
         │
         ▼
    Job completed
```

---

## 🔐 Sécurité et Isolation

### Isolation Multi-Tenant

```
┌─────────────────────────────────────────────────────────────┐
│                     Web Service                             │
│                                                             │
│  Request → Middleware → Extract tenantId → Filter queries  │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │              Prisma Queries                       │    │
│  │                                                    │    │
│  │  WHERE tenantId = req.user.tenantId               │    │
│  │                                                    │    │
│  │  Toutes les requêtes filtrent automatiquement    │    │
│  │  par tenant pour isolation complète               │    │
│  └───────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      PostgreSQL                             │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Tenant A     │  │ Tenant B     │  │ Tenant C     │    │
│  │ Data         │  │ Data         │  │ Data         │    │
│  │ (Isolated)   │  │ (Isolated)   │  │ (Isolated)   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Sécurité Réseau

```
Internet
    │
    │ HTTPS Only (443)
    ▼
Render CDN (Edge)
    │
    │ • DDoS Protection
    │ • SSL/TLS Termination
    │ • Rate Limiting (Edge)
    ▼
Render Load Balancer
    │
    │ • Health Checks
    │ • Auto-scaling
    ▼
Web Service (Private Network)
    │
    │ Internal IPs only
    │
    ├───► PostgreSQL (Private)
    │      └─ No public access
    │
    └───► Redis (External, secured)
           └─ TLS + Authentication
```

---

## 📊 Scaling et Performance

### Scaling Vertical (Upgrading Plan)

```
Starter                Standard              Pro
┌─────────┐           ┌─────────┐          ┌─────────┐
│ 512 MB  │ ────────► │  2 GB   │ ───────► │  4 GB   │
│ 0.5 CPU │           │  1 CPU  │          │  2 CPU  │
│         │           │         │          │         │
│ $7/mo   │           │ $25/mo  │          │ $85/mo  │
└─────────┘           └─────────┘          └─────────┘
   │                      │                     │
   │                      │                     │
   ▼                      ▼                     ▼
~50 users            ~200 users            ~500 users
concurrent           concurrent            concurrent
```

### Scaling Horizontal (Multiple Instances) - Pro Plan+

```
                    Load Balancer
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
    Instance 1       Instance 2       Instance 3
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ 2GB RAM │     │ 2GB RAM │     │ 2GB RAM │
    │ Node.js │     │ Node.js │     │ Node.js │
    │ Socket  │     │ Socket  │     │ Socket  │
    └─────────┘     └─────────┘     └─────────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Redis Adapter       │
              │   (Socket.IO sync)    │
              └───────────────────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
         PostgreSQL              Redis (Upstash)
```

### Cache Strategy

```
┌─────────────────────────────────────────────────────────┐
│                    Cache Layers                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  L1: Browser Cache (Static Assets)                     │
│      └─ Render CDN (Global Edge)                       │
│                                                         │
│  L2: Redis Cache (API Responses)                       │
│      └─ Upstash Redis (10K req/day free)              │
│         ├─ User sessions                               │
│         ├─ Query results                               │
│         └─ Rate limiting                               │
│                                                         │
│  L3: Next.js ISR (Static pages)                        │
│      └─ Incremental Static Regeneration               │
│         ├─ Public pages                                │
│         └─ Revalidate: 3600s                           │
│                                                         │
│  L4: PostgreSQL (Source of truth)                      │
│      └─ Full dataset                                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Déploiement et CI/CD

### Workflow de Déploiement

```
Developer Machine              GitHub                Render
       │                         │                     │
       │ 1. git push            │                     │
       ├────────────────────────►                     │
       │                         │                     │
       │                         │ 2. Webhook trigger │
       │                         ├─────────────────────►
       │                         │                     │
       │                         │    3. Build Start   │
       │                         │    ├─ Clone repo    │
       │                         │    ├─ npm ci        │
       │                         │    ├─ prisma gen   │
       │                         │    ├─ migrations   │
       │                         │    └─ next build   │
       │                         │                     │
       │                         │    4. Deploy        │
       │                         │    ├─ Health check │
       │                         │    ├─ Rolling      │
       │                         │    └─ Switch       │
       │                         │                     │
       │                         │    5. Live ✅       │
       │                         │                     │
       │ 6. Notification         │                     │
       ◄─────────────────────────┴─────────────────────┤
       │                         │                     │
       │ ✅ Deploy success       │                     │
```

### Zero-Downtime Deployment

```
┌─────────────────────────────────────────────────────┐
│              Rolling Deployment                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Old Version (v1.0)            New Version (v1.1)  │
│                                                     │
│  ┌──────────┐                  ┌──────────┐       │
│  │ Instance │                  │ Instance │       │
│  │   v1.0   │                  │   v1.1   │       │
│  │  ████████│                  │          │       │
│  └──────────┘                  └──────────┘       │
│      100%          ──►             0%              │
│                                                     │
│      75%           ──►            25%              │
│                                                     │
│      50%           ──►            50%              │
│                                                     │
│      25%           ──►            75%              │
│                                                     │
│       0%           ──►           100%              │
│                                                     │
│  ┌──────────┐                  ┌──────────┐       │
│  │ Instance │                  │ Instance │       │
│  │   v1.0   │                  │   v1.1   │       │
│  │          │                  │  ████████│       │
│  └──────────┘                  └──────────┘       │
│                                                     │
│  Old instance terminated       New instance live  │
└─────────────────────────────────────────────────────┘
```

---

## 📈 Monitoring et Observabilité

### Metrics Collection

```
┌────────────────────────────────────────────────────────┐
│                  Web Service                           │
│                                                        │
│  ┌──────────────────────────────────────────┐        │
│  │  Application Metrics                     │        │
│  │  ├─ HTTP Requests/sec                    │        │
│  │  ├─ Response Time (p50, p95, p99)        │        │
│  │  ├─ Error Rate                            │        │
│  │  ├─ WebSocket Connections                 │        │
│  │  └─ Active Users                          │        │
│  └──────────────────────────────────────────┘        │
│                    │                                   │
│                    ▼                                   │
│  ┌──────────────────────────────────────────┐        │
│  │  System Metrics                          │        │
│  │  ├─ CPU Usage (%)                        │        │
│  │  ├─ Memory Usage (MB)                    │        │
│  │  ├─ Disk I/O                             │        │
│  │  └─ Network I/O                          │        │
│  └──────────────────────────────────────────┘        │
└────────────────────────────────────────────────────────┘
                    │
                    ▼
┌────────────────────────────────────────────────────────┐
│              Render Dashboard                          │
│                                                        │
│  • Real-time metrics                                  │
│  • Historical graphs                                  │
│  • Alerts configuration                               │
│  • Log aggregation                                    │
└────────────────────────────────────────────────────────┘
```

---

## 🌍 Géographie et Latence

### Render Regions

```
┌─────────────────────────────────────────────────────────┐
│                    Render Global Network                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Deployment Region: Frankfurt (EU)                     │
│  ├─ Web Service                                        │
│  ├─ PostgreSQL Database                                │
│  └─ Redis (via Upstash EU-West)                       │
│                                                         │
│  CDN Edge Locations: Global                            │
│  ├─ Europe (Amsterdam, London, Paris, Frankfurt)      │
│  ├─ North America (US-East, US-West, Canada)          │
│  └─ Asia (Singapore, Tokyo, Sydney)                   │
│                                                         │
│  Latency (from France):                                │
│  ├─ Static Assets: ~20ms (CDN Edge)                   │
│  ├─ API Calls: ~50ms (Frankfurt)                      │
│  └─ WebSocket: ~50ms (Direct connection)              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Technologies et Versions

```
┌────────────────────────────────────────────────────────┐
│                   Tech Stack                           │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Runtime                                               │
│  ├─ Node.js 20.x LTS                                  │
│  └─ npm 10.x                                           │
│                                                        │
│  Framework                                             │
│  ├─ Next.js 14.2.15 (App Router)                     │
│  └─ React 18.3                                         │
│                                                        │
│  Database                                              │
│  ├─ PostgreSQL 16                                      │
│  ├─ Prisma ORM 5.20                                   │
│  └─ Connection Pooling (97 max)                       │
│                                                        │
│  Cache & Queue                                         │
│  ├─ Redis 7.x (Upstash)                               │
│  ├─ BullMQ 5.13                                       │
│  └─ Upstash Redis REST API                            │
│                                                        │
│  Real-time                                             │
│  ├─ Socket.IO 4.8                                     │
│  ├─ WebSocket Protocol                                 │
│  └─ Polling Fallback                                  │
│                                                        │
│  Storage                                               │
│  ├─ UploadThing (S3-backed)                           │
│  └─ 2GB Free                                           │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 📚 Documentation

Pour plus de détails sur chaque composant :

- [Guide Complet](DEPLOYMENT_RENDER.md) - Documentation complète
- [Configuration](../render.yaml) - Fichier Blueprint
- [Performance](RENDER_PRODUCTION.md#performance) - Optimisations
- [Sécurité](RENDER_PRODUCTION.md#sécurité) - Best practices

---

🏗️ **Architecture prête pour la production et le scaling !**
