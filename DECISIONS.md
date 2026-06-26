# Architectural Decision Records (ADR)

This document captures the key technical decisions, their context, rationale, and tradeoffs made during the design and build of the **Klypup AI Investment Research Platform**.

Each ADR follows the format: **Decision → Context → Rationale → Tradeoffs**.

---

## ADR-01 · Monorepo with npm Workspaces

**Decision:** Structure the project as a single npm workspace monorepo containing `apps/api`, `apps/web`, and `packages/shared`.

**Context:** The platform has three distinct runtimes — an Express API server, a React SPA, and a shared library of TypeScript types and Zod validation schemas. Without a shared package, type definitions and validation logic must be duplicated and kept in sync manually.

**Rationale:**
- **Single source of truth** — Prisma models, Zod schemas, and API response types are defined once in `packages/shared` and imported by both the server and the client.
- **Simplified DX** — One `npm install` from the root installs all dependencies across all workspaces.
- **Atomic changesets** — A single pull request can update a shared type, the API that produces it, and the UI that consumes it simultaneously.
- **Straightforward CI** — A single `npm run build --workspaces` command validates every package.

**Tradeoffs:**
- All developers must be aware of workspace boundaries to avoid inadvertently importing server-only code into the frontend bundle.
- A misconfigured `tsconfig.json` path alias can cause hard-to-debug import resolution issues across packages.

---

## ADR-02 · Standalone Express API over Next.js API Routes

**Decision:** Run a dedicated Express.js server in `apps/api` rather than using Next.js API Routes or a serverless function platform.

**Context:** The research engine requires long-running AI calls (multi-second Grok AI completions), background job processing, and a persistent WebSocket server — all patterns that conflict with the stateless, short-lived execution model of serverless functions.

**Rationale:**
- **Long-running connections** — Grok AI research jobs can take 10–30 seconds. Serverless functions impose strict execution time limits; Express handles these gracefully.
- **WebSocket support** — A persistent `ws` WebSocket server must share the same process and port as the REST API to broadcast `STOCK_UPDATE` events. This is not possible in a serverless model.
- **Background jobs** — In-process async workers can be spawned and managed within Express's lifecycle without external queue infrastructure.
- **Architectural clarity** — A dedicated API layer makes the Routes → Controller → Service → Repository pattern explicit and easy to reason about during code review.

**Tradeoffs:**
- Requires managing a separate deployment artifact and process compared to a unified Next.js full-stack deployment.
- Long-running jobs would ideally move to a proper queue (e.g., BullMQ + Redis) as traffic scales; the current in-process worker is a pragmatic starting point.

---

## ADR-03 · Prisma ORM + Neon Serverless PostgreSQL

**Decision:** Use Prisma as the ORM layer on top of a Neon serverless PostgreSQL database.

**Context:** The application needs a strongly relational schema to model organizations, users, research reports, citations, watchlists, and company metadata — with robust migration tooling and type safety.

**Rationale:**
- **End-to-end type safety** — Prisma generates a fully-typed client from `schema.prisma`, eliminating an entire class of runtime DB errors.
- **Migration confidence** — `prisma migrate dev` produces version-controlled, reviewable SQL migrations. No raw SQL drift.
- **Neon branching** — Neon's database branching allows instant creation of isolated preview environments for feature branches — useful for testing schema changes without affecting the main database.
- **Connection pooling** — Neon's serverless connection pool pairs perfectly with Node.js's async concurrency model.

**Tradeoffs:**
- Prisma's query engine is an additional binary dependency. Cold start performance is irrelevant for a long-running Express server but would matter in serverless.
- Complex analytical queries (e.g., reporting aggregations) may require dropping down to `$queryRaw` to avoid Prisma's ORM overhead.

---

## ADR-04 · In-Memory Price Cache (RAM, 15-min TTL)

**Decision:** Cache incoming Finnhub webhook price ticks in a Node.js in-memory `Map` with a 15-minute TTL, instead of writing every tick to the database or setting up Redis.

**Context:** Finnhub delivers frequent real-time price updates for every tracked ticker. Writing each tick to PostgreSQL would create excessive write pressure. The frontend watchlist only needs prices that are "fresh enough" (within 15 minutes) — stale-while-revalidate semantics are acceptable.

**Rationale:**
- **Zero infrastructure cost** — No Redis instance is required for the cache layer at this scale.
- **Sub-millisecond reads** — In-process Map lookups are faster than any network round-trip to an external cache.
- **Simple invalidation** — A TTL-based eviction policy covers the use case without needing cache invalidation logic.

**Tradeoffs:**
- **No persistence** — Cache is lost on server restart. The Watchlist Service falls back to the last-known DB price on a cache miss, which may be older than 15 minutes after a cold start.
- **Not horizontally scalable** — In a multi-instance deployment, each server instance maintains its own cache. A Redis-based shared cache would be required to maintain consistency across instances.

---

## ADR-05 · Multi-Tenancy via Logical Isolation (`organizationId`)

**Decision:** Implement multi-tenancy using a logical isolation pattern: a shared database schema with an `organizationId` foreign key on every tenant-scoped resource, rather than separate schemas or databases per tenant.

**Context:** The platform serves multiple organizations (tenants) from a single deployment. Tenant data must be strictly isolated, but the overhead of per-tenant database provisioning is prohibitive at this stage.

**Rationale:**
- **Operational simplicity** — A single schema, a single migration path, a single connection pool.
- **Fast shipping** — Adding a new tenant is a database row insert, not a schema provisioning workflow.
- **Enforced at the application layer** — Every repository query includes `WHERE organizationId = ?`, and the Auth + RBAC middleware guarantees the `organizationId` in every request comes from a verified JWT claim — not from user-supplied input.

**Tradeoffs:**
- **Noisy neighbor risk** — A high-volume tenant's query load affects all tenants. Mitigation: query-level rate limiting and connection pool sizing.
- **Accidental data leak risk** — A missing `organizationId` clause in a query could expose cross-tenant data. Mitigation: a repository base class or helper that automatically injects the tenant filter; integration tests covering tenant boundary conditions.

---

## ADR-06 · WebSocket Server Co-hosted with Express (`ws`)

**Decision:** Use the `ws` library to run a WebSocket server co-hosted on the same HTTP server instance as the Express REST API, rather than a separate WebSocket service.

**Context:** Real-time `STOCK_UPDATE` events need to be pushed to all connected browser clients whenever a Finnhub webhook tick is received or a research job completes.

**Rationale:**
- **Zero additional port or service** — `initWebSocketServer(httpServer)` binds the WS server to the same port as Express. One process, one port.
- **Direct in-process broadcast** — Any module (Webhook handler, Research job) can call `broadcast(event, payload)` without any inter-process message passing.
- **Minimal client-side complexity** — The browser's native `WebSocket` API is sufficient; no socket.io client library needed.

**Tradeoffs:**
- **No rooms or namespaces** — The current `broadcast()` sends to all connected clients. A future iteration should filter by `organizationId` so tenants only receive their own updates.
- **No reconnection logic** — The frontend `WebSocketContext` must implement its own reconnection strategy (e.g., exponential backoff) for resilience.

---

## ADR-07 · Feature-Based Frontend Directory Layout

**Decision:** Organize the React application as feature-colocated modules under `src/features/<name>/` rather than grouping by technical type (all hooks together, all components together, etc.).

**Context:** An investment research dashboard has many distinct domains: auth, research runs, watchlist, company comparison, team management, settings. A flat technical grouping causes files from unrelated features to intermingle, making refactoring and deletion of a single feature difficult.

**Rationale:**
- **High cohesion, low coupling** — All code serving a single business feature (components, hooks, API queries, local types) lives in one directory. Moving or deleting a feature is a directory operation.
- **Clear ownership** — Feature folder boundaries map directly to team ownership or PR scope.
- **Thin page layer** — `src/pages/` contains only route shells that import and arrange feature components. Routing changes never require touching business logic.

**Tradeoffs:**
- Truly shared UI primitives (Button, Input, Card) must resist the temptation to live inside a feature. A clear rule is needed: if a component is used by more than one feature, it belongs in `src/components/`.

---

## ADR-08 · Shared Package (`packages/shared`) for API Contracts

**Decision:** Introduce `packages/shared` as a first-class monorepo package exporting Zod schemas and TypeScript types consumed by both `apps/api` and `apps/web`.

**Context:** Without a shared contract layer, API response shapes and validation schemas are defined in the backend and either duplicated or assumed in the frontend — leading to silent mismatches that only surface at runtime.

**Rationale:**
- **Single source of truth** — One Zod schema defines the API payload shape. The server parses incoming requests against it; the client validates form submissions against it before even making a network call.
- **Compile-time contract enforcement** — If the server changes a field name, the TypeScript compiler immediately flags all frontend usages of the old field name.
- **Reduced round-trips** — Frontend pre-validation with shared schemas catches invalid inputs before they hit the network.

**Tradeoffs:**
- Developers must remember to publish / rebuild `packages/shared` when schemas change, or configure TypeScript project references for automatic incremental compilation.
- Circular dependency risk if `packages/shared` ever tries to import from `apps/api` or `apps/web`.
