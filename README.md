# AI Investment Research Dashboard

An AI-powered multi-tenant SaaS investment research platform designed for analysts to run advanced research, compare companies, track watchlists, and collaborate within workspace organizations with Role-Based Access Control (RBAC).

## Tech Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Express, Node.js, TypeScript, Prisma ORM
- **Database:** Neon Serverless PostgreSQL
- **Caching & Queue:** Redis (optional, for background jobs)
- **Deployment & Containers:** Docker, Docker Compose

---

## Workspace Structure

This project is set up as a monorepo containing the following components:

```
ai-investment-research-dashboard/
├── .github/                # CI/CD Workflows
├── apps/
│   ├── api/                # Express Backend REST API
│   └── web/                # React Frontend Application
├── packages/
│   └── shared/             # Shared Types, Schemas, and Utilities (TypeScript)
├── docs/                   # Architectural & Product Documentation
├── scripts/                # Database setup, migrations, and seed scripts
```

For a detailed view of the entire repository structure, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- A Neon PostgreSQL Database connection (or local Postgres container)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/username/ai-investment-research-dashboard.git
   cd ai-investment-research-dashboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy `.env.example` to `.env` in the root and in the respective apps:
   ```bash
   cp .env.example .env
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```

4. Database Setup & Seed:
   ```bash
   npm run db:setup
   npm run db:seed
   ```

5. Run Development Servers:
   ```bash
   npm run dev
   ```

---

## Architectural Decisions

For full details on the design choices made, refer to [DECISIONS.md](./DECISIONS.md).

- **Multi-Tenant Isolation:** Dynamic organization workspace isolation using a schema-level tenant key (`organizationId`).
- **Layered Backend architecture:** Clean isolation of Routes -> Controllers -> Services -> Repositories to facilitate mock-testing and clear separation of concerns.
- **Modular Frontend architecture:** Feature-grouped React structure to keep page-level routing independent of business feature components.
