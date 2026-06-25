# System Architecture & Folder Directory Layout

This document describes the design patterns, code organization, and folder structure of the **AI Investment Research Dashboard**.

---

## 1. Directory Tree

Below is the complete project directory structure detailing the placement of directories and files.

```
ai-investment-research-dashboard/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Continuous Integration workflow (lint, test, build)
│       └── cd.yml                 # Continuous Deployment workflow
├── apps/
│   ├── api/                       # Express Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Prisma database schema definition
│   │   │   └── seed.ts            # Database seed script
│   │   ├── src/
│   │   │   ├── config/            # Server configuration (environment, database, third-party APIs)
│   │   │   ├── middleware/        # Global Express middlewares (error handling, rate limits, RBAC)
│   │   │   ├── lib/               # Shared libraries/wrappers (Prisma client, OpenAI, Neon Serverless SDK)
│   │   │   ├── jobs/              # Async worker job definitions (AI research queue processors)
│   │   │   ├── tests/             # Global suite integration tests
│   │   │   └── modules/           # Feature Modules (Layered Architecture)
│   │   │       ├── auth/
│   │   │       ├── organizations/
│   │   │       ├── users/
│   │   │       ├── research/
│   │   │       ├── watchlist/
│   │   │       ├── compare/
│   │   │       ├── citations/
│   │   │       └── health/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                       # React Frontend
│       ├── src/
│       │   ├── app/               # Root routing, main application layout, provider context configuration
│       │   ├── pages/             # Route-level view components (lazy loaded)
│       │   ├── components/        # Reusable global design-system UI components (Button, Input, Card, Modal)
│       │   ├── features/          # Domain-Specific Features (Colocated modules)
│       │   │   ├── auth/
│       │   │   ├── dashboard/
│       │   │   ├── research/
│       │   │   ├── watchlist/
│       │   │   ├── compare/
│       │   │   ├── team/
│       │   │   └── settings/
│       │   ├── lib/               # Client configuration wrappers (axios, react-query clients)
│       │   ├── hooks/             # Domain-agnostic custom React hooks (useMediaQuery, useDebounce)
│       │   ├── store/             # Global state management store (Zustand)
│       │   ├── services/          # Global core service APIs (external integration APIs)
│       │   └── types/             # Global frontend-specific types
│       ├── Dockerfile
│       ├── index.html
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/                    # Shared configurations and data contracts
│       ├── src/
│       │   ├── index.ts           # Barrel file exporting all shared code
│       │   ├── schemas/           # Zod validation schemas shared between client & server
│       │   └── types/             # Shared TypeScript types & interfaces (API responses, RBAC permissions)
│       ├── package.json
│       └── tsconfig.json
├── docs/                          # Architecture diagrams, specifications, and walkthroughs
├── scripts/                       # Local environment configuration & database migration wrappers
│   └── setup-db.sh
├── .env.example                   # Shared monorepo environment template
├── .gitignore                     # Global git exclusion configurations
├── docker-compose.yml             # Local service containers (Redis, Postgres)
└── package.json                   # Root monorepo configuration
```

---

## 2. Layered Backend Design Pattern

The Express backend inside `apps/api` follows a strict **Layered Architecture (N-Tier)** organized by domains inside `src/modules/`. Each feature module (e.g., `src/modules/research/`) is partitioned into six clear responsibilities:

1. **Routes (`routes/`):** Defines REST endpoints, maps HTTP verbs to controller actions, and registers module-specific middleware (e.g., validations, RBAC checks).
2. **Controller (`controller/`):** Express-specific boundary. Parses input parameters, extract user context (e.g., tenant `organizationId`, user permissions), calls services, and formats the API JSON response. Does not touch database queries.
3. **Service (`service/`):** Contains the core business logic (e.g., running AI prompts, generating comparisons, validating quotas). Orchestrates calls to repositories, external APIs, and jobs. Framework agnostic.
4. **Repository (`repository/`):** Deals exclusively with data access (using Prisma client). Isolates SQL/database details from the business logic layer.
5. **Schema (`schema/`):** Input validation schemas (Zod). Ensures request payloads conform to rules before they enter the controller.
6. **Types (`types/`):** Module-specific TypeScript types and interfaces.

---

## 3. Modular Frontend (Feature-Based)

The React frontend inside `apps/web` utilizes a **Feature-Based Colocated Layout** to ensure the app scales easily as features are added:

- **Global vs Local:** Reusable UI elements (like global components, generic hooks, store) stay in the root folder. Feature-specific elements (components, custom hooks, network operations) live directly inside the feature's subfolder under `src/features/<feature_name>/`.
- **Page Isolation:** Views inside `src/pages/` act as thin route wrappers. They do not implement complex logic; they import and arrange components from the `features/` directory. This decouples navigation structures from business features.

---

## 4. Multi-Tenancy & Role-Based Access Control (RBAC)

- **Workspace Partitioning:** Multi-tenant separation is established at the data level via an `organizationId` foreign key on core resources (watchlists, research reports, comparisons).
- **RBAC Enforcement:** Users belong to an Organization with a specific role (`ADMIN`, `ANALYST`, `VIEWER`). Middleware intercepts incoming API calls to confirm user membership inside the requested `organizationId` and verify their permissions.
