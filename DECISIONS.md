# Architectural Decision Records (ADR)

This file documents the key technical decisions, rationale, and tradeoffs for the **AI Investment Research Dashboard**.

---

## 1. Monorepo Setup (npm / pnpm Workspaces)
* **Decision:** Use a monorepo structure with standard workspaces.
* **Context:** We need a frontend (React), backend (Express API), and shared types/validation schemas.
* **Rationale:**
  - Prevents code duplication: Models defined in Prisma can map directly to TypeScript types and Zod schemas shared by both client and server.
  - Simplifies dependency management and build pipeline.
  - Allows easy local setup with a single `npm install` from the root.

---

## 2. Express Backend over Next.js API Routes
* **Decision:** Separate Express API server from the frontend.
* **Context:** Next.js is popular for full-stack, but Express provides explicit control over the API pipeline.
* **Rationale:**
  - **Job Queues & Server Limits:** AI investment research requires long-running tasks, stream generation, and queue management (via Redis). Express handles long-running connections and background jobs better than serverless Next.js functions.
  - **Layered Architecture:** Easier to implement a pure routes/controllers/services/repositories separation.
  - **Interview Readiness:** Demonstrates standard enterprise backend patterns.

---

## 3. Database Layer: Prisma ORM & Neon Serverless PostgreSQL
* **Decision:** Use Prisma ORM coupled with Neon serverless Postgres database.
* **Context:** The application needs a robust relational schema to model organizations, users, research reports, citations, watchlists, and company metadata.
* **Rationale:**
  - Prisma provides automatic type safety, easy migrations, and high developer velocity.
  - Neon's branching feature allows analysts and developers to spin up isolated databases for testing and preview branches instantly.
  - Prisma client works perfectly with Neon's serverless connection pool.

---

## 4. Multi-Tenancy Strategy (Logical Isolation)
* **Decision:** logical isolation using a tenant key (`organizationId`) on database tables, rather than separate database schemas per tenant.
* **Context:** Multi-tenancy must support shared infrastructure for fast shipping and low overhead, while ensuring clean RBAC boundary validation.
* **Rationale:**
  - Separate database instances or schema partitions would introduce heavy migration overhead for a 5-day assessment.
  - Tenant query enforcement is secured using robust Express authentication & organization validation middleware.

---

## 5. Frontend Feature-Based Directory Layout
* **Decision:** Organize React features inside self-contained modules (`src/features/*`) rather than flat global folders.
* **Context:** A dashboard can easily become bloated if folders like `/components`, `/hooks`, and `/services` contain files for every page.
* **Rationale:**
  - Co-location: Grouping React components, custom hooks, API queries, and types together by business feature makes code much easier to navigate, refactor, and delete.
  - Pages inside `src/pages` act as minimal layout assemblers.

---

## 6. Shared Package (`packages/shared`)
* **Decision:** Introduce a lightweight `packages/shared` package in the monorepo workspace.
* **Context:** Keep API payload validations (Zod schemas) and Type definitions DRY.
* **Rationale:**
  - The client can run validation before making calls, reducing API roundtrips.
  - The server uses the exact same schemas to parse incoming payloads, preventing drift between frontend and backend contracts.
