# Klypup — AI Investment Research Platform

> **Multi-tenant SaaS platform** for AI-powered equity research. Analysts can generate deep-dive reports, track watchlists with live price feeds, compare companies side-by-side, and collaborate securely within org-scoped workspaces — all backed by real-time WebSocket updates and a Gemini-powered AI research engine.

---

## Features at a Glance

| Feature | Description |
|---|---|
| **AI Research Engine** | Run deep equity research via Google Gemini AI. Generates structured financial reports with citations from SEC filings and market data. |
| **Live Watchlist** | Track companies with real-time price ticks via a direct Finnhub WebSocket connection, cached in-memory (15-min TTL), with a Finnhub REST fallback. |
| **Company Comparisons** | Side-by-side AI-generated comparisons across financial metrics for any set of companies. |
| **Real-Time Updates** | WebSocket server broadcasts `STOCK_UPDATE` events to all connected browser clients instantly. |
| **Multi-Tenancy (RBAC)** | Workspace-level data isolation via `organizationId`. Roles: `ADMIN`, `ANALYST`, `VIEWER`. |
| **Citations & Sources** | Every research report links to verifiable SEC filings, market data sources, and financial fact JSON payloads. |

---

## Tech Stack

### Backend (`apps/api`)
| Layer | Technology |
|---|---|
| Server | Node.js · Express · TypeScript |
| ORM | Prisma |
| Database | Neon Serverless PostgreSQL |
| Auth | JWT (RS256) |
| Real-time | `ws` WebSocket Server & Finnhub WS Client |
| AI | Google Gemini API |
| Financial Data | Finnhub WebSocket/REST · Yahoo Finance API · SEC EDGAR (data.sec.gov) |

### Frontend (`apps/web`)
| Layer | Technology |
|---|---|
| Framework | React 18 · TypeScript · Vite |
| Styling | Tailwind CSS |
| Data Fetching | TanStack Query (React Query) |
| HTTP Client | Axios |
| Global State | Zustand |
| Real-time | WebSocketContext (native browser WS) |

### Shared / Infrastructure
| Layer | Technology |
|---|---|
| Shared Package | `packages/shared` — Zod schemas + TS types (client & server) |
| Containers | Docker · Docker Compose |
| CI/CD | GitHub Actions |

---

## Workspace Structure

```
klypup/
├── .github/                    # CI/CD GitHub Actions workflows
├── apps/
│   ├── api/                    # Express REST API + WebSocket server
│   └── web/                    # React + Vite frontend SPA
├── packages/
│   └── shared/                 # Shared Zod schemas & TypeScript types
├── docs/                       # Architecture diagrams & specs
├── scripts/                    # DB setup & migration helpers
├── docker-compose.yml          # Local service containers
├── image.png                   # System architecture & API flow diagram
└── package.json                # Root monorepo configuration
```

→ Full directory tree with per-file descriptions: [ARCHITECTURE.md](./ARCHITECTURE.md)
→ Key technical decisions & tradeoffs: [DECISIONS.md](./DECISIONS.md)

---

## Getting Started

### Prerequisites

- **Node.js** v18+
- **Docker & Docker Compose** (for local Postgres / Redis)
- **Neon PostgreSQL** project — or a local Postgres instance

### 1. Clone

```bash
git clone https://github.com/Sourya07/klypup.git
cd klypup
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example env and fill in your credentials:

```bash
cp .env.example .env
```

Key variables to set:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon (or local) PostgreSQL connection string |
| `DIRECT_URL` | Direct connection URL (for Prisma migrations) |
| `JWT_SECRET` | Min. 32-char random secret for JWT signing |
| `GEMINI_API_KEY` | Google Gemini API key for research engine |
| `FINNHUB_API_KEY` | Finnhub key for real-time price WebSocket stream and REST fallback |
| `SEC_USER_AGENT` | Required `User-Agent` header for SEC EDGAR requests |
| `VITE_API_URL` | Frontend → Backend base URL (default: `http://localhost:8000/api/v1`) |

### 4. Database Setup

```bash
npm run db:setup      # Runs Prisma migrations
npm run db:seed       # Seeds initial data
```

### 5. Run in Development

```bash
npm run dev           # Starts both API (port 8000) and Web (port 5173) concurrently
```

| Service | URL |
|---|---|
| REST API | `http://localhost:8000/api/v1` |
| WebSocket | `ws://localhost:8000` |
| Web App | `http://localhost:5173` |

---

## API Overview

All endpoints are prefixed with `/api/v1`.

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register a new user + org |
| `POST` | `/auth/login` | Login & receive JWT |
| `GET` | `/auth/me` | Get current authenticated user |

### Research
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/research/runs` | Trigger a new AI research run (async) |
| `GET` | `/research/runs` | List research runs for the org |
| `GET` | `/research/runs/:id` | Get a specific research report |

### Watchlist
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/watchlist` | Fetch org watchlist with live price data |
| `POST` | `/watchlist` | Add a company to the watchlist |
| `DELETE` | `/watchlist/:id` | Remove a company from the watchlist |

---

## Request Lifecycle (AI Research Run)

```
Browser                   Express API                  External Services
  │                           │                               │
  │── POST /research/runs ───►│                               │
  │◄── { runId } ────────────│                               │
  │                           │── Spawn background job ──────►│
  │                           │◄─ Yahoo Finance: prices ──────│
  │                           │◄─ SEC EDGAR: filings  ────────│
  │                           │◄─ Gemini AI: report JSON ─────│
  │                           │── Save to Neon DB ────────────│
  │◄── WS: STOCK_UPDATE ─────│                               │
  │── GET /research/runs/:id ►│                               │
  │◄── Full Report JSON ─────│                               │
```

See the full architecture diagram for all data flows: [`image.png`](./image.png)

---

## Architecture

### Layered Backend (N-Tier)

Each module under `apps/api/src/modules/` follows a strict layer separation:

```
Request → Routes → Controller → Service → Repository → Prisma → Neon DB
                ↑                   ↑
             Schema (Zod)      External APIs / Jobs
```

### Modular Frontend (Feature-Based)

```
src/pages/         ← thin route wrappers only
src/features/      ← all business logic, hooks, queries per domain
src/components/    ← pure, reusable UI (Button, Card, Modal)
src/store/         ← Zustand global state slices
```

---

## CI/CD & Deployment (AWS EC2)

The repository includes a ready-to-use GitHub Actions CD pipeline ([`cd.yml`](./.github/workflows/cd.yml)) configured for deployment to an AWS EC2 instance.

**How it works:**
1. **Builds & Pushes** Docker images to GitHub Container Registry (`ghcr.io`).
2. **Copies** the `docker-compose.yml` securely to your EC2 instance via SCP.
3. **Executes** SSH commands on the EC2 instance to pull the new images and run `docker-compose up -d`.

To enable this, set the following secrets in your GitHub repository:
- `EC2_HOST` — The public IP or DNS of your AWS EC2 instance.
- `EC2_USERNAME` — Your SSH user (e.g., `ubuntu` or `ec2-user`).
- `EC2_SSH_KEY` — Your private SSH `.pem` key.

---

## Security

- **JWT Authentication** on all protected routes
- **Tenant Isolation** — every DB query scoped by `organizationId`
- **RBAC Middleware** — role checks (`ADMIN` / `ANALYST` / `VIEWER`) enforced server-side
- **Input Validation** — Zod schemas gate every incoming request at the controller boundary

---

## License

ISC — see [LICENSE](./LICENSE) for details.
