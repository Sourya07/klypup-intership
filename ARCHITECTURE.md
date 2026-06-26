# System Architecture & Directory Layout

This document describes the design patterns, code organization, data flows, and complete folder structure of the **Klypup AI Investment Research Platform**.

---

## 1. High-Level System Diagram

The following diagram (see [`image.png`](./image.png)) shows the full data flow across all system layers:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    Client: Browser  (React / Vite)                              │
│                                                                                 │
│   ┌─────────────────────────┐      ┌─────────────────────────────────────┐     │
│   │  Dashboard / Watchlist  │      │   API Services Layer (Axios)        │     │
│   │  / Reports UI           │◄────►│   TanStack Query + Zustand Store    │     │
│   └─────────────────────────┘      └──────────────┬──────────────────────┘     │
│                                                    │                            │
│   ┌─────────────────────────┐                      │ HTTP (REST)                │
│   │   WebSocketContext      │◄── WS events ────────┤                            │
│   │  (STOCK_UPDATE events)  │                      │                            │
│   └─────────────────────────┘                      │                            │
└───────────────────────────────────────────────────┼────────────────────────────┘
                                                     │
                            ┌────────────────────────▼──────────────────────────┐
                            │         Backend: Express.js Server                │
                            │                                                   │
                            │  ┌──────────────┐    ┌──────────────────────────┐ │
                            │  │ Express      │    │   WebSocket Server (ws)  │ │
                            │  │ Router       │    │   broadcast() → clients  │ │
                            │  └──────┬───────┘    └──────────────────────────┘ │
                            │         │                                          │
                            │  ┌──────▼──────────────────────────────────────┐  │
                            │  │              Feature Modules                 │  │
                            │  │  Auth │ Research │ Watchlist │ Webhooks │... │  │
                            │  └──────┬──────────────────────────────────────┘  │
                            │         │                                          │
                            │  ┌──────▼──────────┐   ┌─────────────────────┐   │
                            │  │ Research        │   │   Memory Cache      │   │
                            │  │ Background Job  │   │   (RAM, 15-min TTL) │   │
                            │  └──────┬──────────┘   └─────────────────────┘   │
                            │         │                                          │
                            │  ┌──────▼──────────┐                              │
                            │  │  Prisma Client  │                              │
                            │  └──────┬──────────┘                              │
                            └─────────┼──────────────────────────────────────── ┘
                                      │
          ┌───────────────────────────▼────────────────────────────────┐
          │                    Storage Layer                           │
          │              Neon Serverless PostgreSQL                    │
          └────────────────────────────────────────────────────────────┘

          ┌──────────────────────────────────────────────────────────────────┐
          │               External APIs & Data Feeds                        │
          │   Finnhub Webhook Stream │ Yahoo Finance API │ SEC EDGAR │ Grok  │
          └──────────────────────────────────────────────────────────────────┘
```

---

## 2. Key Data Flows

### 2.1 AI Research Run Flow

```
1.  Browser → POST /api/v1/research/runs
2.  Express Router → Research Controller → Research Service
3.  Service validates quota, creates a DB record (status: PENDING), returns { runId }
4.  Service spawns a Research Background Job (in-process async worker)
5.  Background Job:
      a. Fetches historical prices           ← Yahoo Finance API
      b. Fetches SEC filings                 ← SEC EDGAR (data.sec.gov)
      c. Builds structured AI payload        ← Grok AI API (xAI)
      d. Receives Financial Facts Report JSON from Grok
      e. Saves completed report + citations  → Prisma → Neon PostgreSQL
      f. Broadcasts STOCK_UPDATE event       → WebSocket Server → all clients
6.  Browser WebSocketContext receives STOCK_UPDATE, triggers UI refresh
7.  Browser → GET /api/v1/research/runs/:id  → receives full report JSON
```

### 2.2 Live Watchlist & Finnhub Webhook Flow

```
1.  Finnhub Cloud → POST /api/v1/webhooks/finnhub  (HMAC-SHA256 signature verified)
2.  Webhook Module merges the incoming price tick into the in-memory cache
3.  Watchlist Module reads the cache (15-min TTL) before falling back to a DB query
4.  On a cache miss → Prisma fetch → response + cache repopulation
5.  WebSocket Server broadcasts STOCK_UPDATE to all connected browser clients
6.  Browser → GET /api/v1/watchlist returns merged watchlist + live price data
```

### 2.3 Authentication Flow

```
1.  Browser → POST /api/v1/auth/login  { email, password }
2.  Auth Service validates credentials → issues a signed JWT
3.  Subsequent requests include  Authorization: Bearer <token>
4.  Auth Middleware decodes token → attaches { userId, organizationId, role } to req
5.  RBAC Middleware enforces role gates per route
```

---

## 3. Directory Tree

Complete project directory structure with per-file descriptions.

```
klypup/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint → Test → Build pipeline
│       └── cd.yml                  # Deployment pipeline
│
├── apps/
│   ├── api/                        # Express.js REST API + WebSocket Server
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Prisma ORM schema (all models & relations)
│   │   │   └── seed.ts             # Seed script: orgs, users, sample data
│   │   ├── src/
│   │   │   ├── index.ts            # App entry point: server bootstrap, middleware chain
│   │   │   ├── config/             # Environment config loaders & validation
│   │   │   ├── middleware/         # Global Express middleware:
│   │   │   │                       #   auth (JWT), RBAC, error handler, rate-limit
│   │   │   ├── lib/                # Shared wrappers & singletons:
│   │   │   │   ├── prisma.ts       #   Prisma Client singleton
│   │   │   │   ├── websocket.ts    #   ws WebSocket server (initWebSocketServer, broadcast)
│   │   │   │   └── ai.ts           #   Grok AI SDK wrapper
│   │   │   ├── jobs/               # In-process async background workers
│   │   │   │                       #   (research-job.ts: AI research pipeline)
│   │   │   ├── utils/              # Pure utility helpers (formatters, error classes)
│   │   │   ├── tests/              # Integration test suites
│   │   │   └── modules/            # Domain feature modules (Layered Architecture)
│   │   │       ├── auth/           #   Register, login, JWT issuance
│   │   │       ├── organizations/  #   Org management, member invitations
│   │   │       ├── users/          #   User profile, preferences
│   │   │       ├── research/       #   AI research run lifecycle (PENDING→DONE)
│   │   │       ├── watchlist/      #   Company watchlist + live price merge
│   │   │       ├── compare/        #   Side-by-side AI company comparison
│   │   │       ├── citations/      #   Research report citation management
│   │   │       ├── webhooks/       #   Finnhub webhook ingestion & verification
│   │   │       └── health/         #   /health liveness probe
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                        # React 18 + Vite frontend SPA
│       ├── src/
│       │   ├── app/                # Root providers: Router, QueryClient, Zustand, WS
│       │   ├── pages/              # Route-level view shells (thin, lazy-loaded)
│       │   ├── components/         # Design-system UI components (Button, Card, Modal…)
│       │   ├── features/           # Domain-colocated feature modules
│       │   │   ├── auth/           #   Login, register, token management
│       │   │   ├── dashboard/      #   Home analytics overview
│       │   │   ├── research/       #   Research run form + report viewer
│       │   │   ├── watchlist/      #   Watchlist table + live price cells
│       │   │   ├── compare/        #   Company comparison UI
│       │   │   ├── team/           #   Org member management
│       │   │   └── settings/       #   User & org settings
│       │   ├── lib/                # Configured Axios instance, QueryClient setup
│       │   ├── hooks/              # Domain-agnostic hooks (useDebounce, useMediaQuery)
│       │   ├── store/              # Zustand global state slices
│       │   ├── services/           # Core service API call definitions
│       │   └── types/              # Frontend-specific global TypeScript types
│       ├── Dockerfile
│       ├── index.html
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                     # Shared data contracts (imported by both apps)
│       ├── src/
│       │   ├── index.ts            # Barrel export
│       │   ├── schemas/            # Zod validation schemas (API payloads)
│       │   └── types/              # Shared TypeScript interfaces (API responses, RBAC)
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                           # Architecture diagrams & product specs
├── scripts/
│   └── setup-db.sh                 # Runs Prisma migrate + seed in one step
├── image.png                       # System architecture & API flow diagram
├── .env.example                    # Annotated monorepo environment template
├── .gitignore
├── .dockerignore
├── docker-compose.yml              # Local dev containers (Postgres, Redis)
└── package.json                    # Root monorepo scripts & workspace config
```

---

## 4. Layered Backend Design Pattern (N-Tier)

Every module under `apps/api/src/modules/<feature>/` enforces the same six-layer structure. No layer may skip levels — a controller must never touch Prisma directly, a repository must never hold business logic.

```
HTTP Request
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│  Routes (routes/)                                           │
│  Maps HTTP verbs → controller actions.                      │
│  Registers per-route middleware (auth, RBAC, Zod validate). │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Controller (controller/)                                   │
│  Express boundary layer. Parses req params/body/query.      │
│  Extracts { userId, organizationId, role } from req.user.   │
│  Calls service, formats JSON response. No DB access.        │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Service (service/)                                         │
│  Core business logic. Framework-agnostic.                   │
│  Orchestrates: repositories, external API calls, jobs,      │
│  quota checks, cache reads/writes, WebSocket broadcasts.    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Repository (repository/)                                   │
│  Data-access only. All Prisma queries live here.            │
│  Always scoped by organizationId for tenant isolation.      │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Schema (schema/)                                           │
│  Zod schemas for request body / query / param validation.   │
│  Shared schemas imported from packages/shared.              │
└─────────────────────────────────────────────────────────────┘

  Supporting layer (types/) — TypeScript types & interfaces
  scoped to this module only.
```

---

## 5. Modular Frontend Architecture (Feature-Based)

The React SPA in `apps/web/src` follows a **feature-colocated layout** ensuring the codebase scales linearly with new features.

### Guiding Principles

| Principle | Detail |
|---|---|
| **Global vs. Local** | Reusable, domain-agnostic code (components, hooks, store) lives at `src/`. Feature-specific code (queries, local hooks, local types) lives inside `src/features/<name>/`. |
| **Page Isolation** | `src/pages/` files are thin route wrappers. They import and arrange feature components — zero business logic. |
| **Query Colocation** | React Query hooks (data fetching, mutations) live inside the feature they serve (`src/features/<name>/hooks/`). |
| **Shared Contracts** | All API types are imported from `packages/shared`, never re-declared on the frontend. |

### Frontend Call Chain

```
Page (route)
  └── Feature Component
        ├── useQuery / useMutation  (TanStack Query)
        │     └── Axios instance  (lib/axios.ts → VITE_API_URL)
        ├── Zustand store slice    (src/store/)
        └── WebSocketContext       (broadcasts → UI state update)
```

---

## 6. Multi-Tenancy & Role-Based Access Control (RBAC)

### Tenant Isolation (Logical)

All core database tables (`Research`, `Watchlist`, `Comparison`, `Citation`) carry an `organizationId` foreign key. Every repository query includes a `WHERE organizationId = ?` clause derived from the authenticated user's token — data from one tenant is never visible to another.

### RBAC Enforcement

```
Route registration
  → authMiddleware     (verifies JWT, attaches req.user)
  → rbacMiddleware     (checks req.user.role against required permission)
  → Controller

Role hierarchy:
  ADMIN    — full CRUD on all org resources + member management
  ANALYST  — create & read research runs, watchlist, comparisons
  VIEWER   — read-only access to reports and watchlist
```

---

## 7. Real-Time WebSocket Architecture

The `ws` WebSocket server is co-hosted on the same HTTP server as Express (no separate port).

```typescript
// lib/websocket.ts
initWebSocketServer(httpServer);   // binds ws:// to the same port as REST API

// From any service/job:
broadcast('STOCK_UPDATE', { ticker: 'AAPL', price: 192.5 });
```

On the frontend, `WebSocketContext` wraps the native browser `WebSocket` API and exposes a subscription interface to feature components. When a `STOCK_UPDATE` event arrives, the relevant React Query cache is invalidated and the UI re-renders automatically.

---

## 8. Shared Package (`packages/shared`)

Prevents contract drift between the API and the frontend:

```
packages/shared/src/
├── schemas/            ← Zod schemas (used on both client & server for validation)
└── types/              ← TypeScript interfaces (ApiResponse<T>, ResearchReport, WatchlistItem…)
```

- **Server** uses schemas to parse & validate incoming request payloads.
- **Client** uses schemas for pre-flight form validation, reducing unnecessary round-trips.
- **Both** share the same type definitions — a single source of truth for API contracts.
