# SOS Platform Revamp Blueprint

## Vision
Deliver a production-grade SOS platform that is reliable, secure, and delightful across web, mobile, and backend channels. The new system must support thousands of concurrent responders, handle stressful incidents gracefully, and ship updates continuously without regressions.

## Success Criteria
- **Reliability:** 99.9% uptime target, resilient to regional outages, graceful degradation when external dependencies fail.
- **Security:** OWASP-compliant APIs, encrypted secrets, secure AuthN/AuthZ, zero clear-text credentials, device hardening.
- **Performance:** P95 API latency < 250 ms under 2k RPS, mobile cold start < 2.5 s, UI interactions < 100 ms.
- **Usability:** Visual parity with main site branding, AA contrast, accessible navigation, responsive layouts.
- **Velocity:** Trunk-based development with automated CI/CD, tests covering 85% critical paths, one-click environment provisioning.

## Phased Roadmap
1. **Discovery (Week 1):** Capture user journeys, audit existing ux/ui, catalog backend integrations, document data model.
2. **Foundation (Weeks 2-3):** Establish mono-repo structure, shared tooling, design system tokens, infrastructure scaffolding.
3. **Core Implementation (Weeks 4-8):** Rebuild backend, frontend, and mobile clients with clean architecture and rigorous tests.
4. **Hardening (Weeks 9-10):** Load tests, security assessments, monitoring, feature flag rollout.
5. **Launch (Week 11):** Blue/green deployment, telemetry watch, post-launch playbook.

## Architecture Overview
- **Repo Layout:**
  - `apps/backend` (FastAPI + async SQLAlchemy + Redis + Celery)
  - `apps/frontend` (Next.js + Tailwind + React Query)
  - `apps/mobile` (Kotlin Multi-Module Compose + Ktor client)
  - `packages/design-system` (tokens + components shared web/mobile)
  - `packages/contracts` (OpenAPI/JSON schema + protobuf)
  - `infra` (Terraform + GitHub Actions + Docker)

- **Domain Model:** Alerts, Responders, Teams, Roles, Incidents, Messages.
- **Data Flow:** Event-driven via Kafka topics, transactional outbox for MySQL -> Kafka.
- **Observability:** OpenTelemetry traces, Prometheus metrics, Grafana dashboards, Sentry error monitoring.

## Backend Rebuild
- **Tech Stack:** FastAPI, SQLAlchemy 2.0 async, Alembic migrations, Redis for caching, Celery for async jobs.
- **Modules:**
  - `auth` (JWT, OAuth2, device binding, MFA)
  - `alerts` (creation, assignment, status transitions)
  - `teams` (hierarchy, permissions)
  - `notifications` (push, SMS, email via provider abstraction)
  - `analytics` (reporting endpoints, export jobs)
- **Key Improvements:**
  - Clean architecture (domain, application, infrastructure layers)
  - Pydantic v2 schemas with validation + typed errors
  - Rate limiting & audit logging middleware
  - Integration/contract tests with dockerized services.

## Frontend Rebuild
- **Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn UI, React Query, Zod, Zustand.
- **Goals:**
  - Responsive layout matching marketing site palette
  - Role-aware dashboards for Coordinator/Responder/Admin
  - Real-time updates via SSE/WebSocket hooks
  - Offline fallback with service workers
- **Quality:** ESLint, Prettier, Vitest, Playwright end-to-end flows.

## Mobile Rebuild
- **Tech Stack:** Kotlin, Jetpack Compose, Modular architecture (core, data, domain, feature modules), Hilt DI, Coroutines, Flow, Ktor client, SQLDelight offline cache.
- **Features:**
  - Authentication with biometric unlock
  - Incident map & timeline views
  - Push notifications (FCM) with deep links
  - Offline queue sync when connectivity returns
  - Theming aligned with design system tokens (dynamic color support)
- **Testing:** Unit (JUnit5), instrumentation (Compose UI tests), snapshot tests, Firebase Test Lab matrix.

## DevOps & Infrastructure
- **Environments:** `dev`, `staging`, `prod` via Terraform managed infrastructure. Automated preview environments per PR.
- **CI/CD:** GitHub Actions pipelines for lint/test/build, Docker image publishing, Canary deploy to Kubernetes cluster (AKS).
- **Secrets:** Managed via Azure Key Vault + SOPS, no secrets in repo.
- **Monitoring & Alerts:** PagerDuty integration, synthetic checks, log aggregation (Loki).

## Data & Migration Strategy
- Reverse engineer current databases, map to canonical schema.
- Build migration scripts (Alembic + data backfill jobs).
- Validate with anonymized production snapshot in staging.
- Implement read replicas and zero-downtime migration plan.

## Quality Gates
- Mandatory checks per PR: lint, unit tests, integration tests, type checks, security scans (Bandit, Trivy).
- Weekly chaos engineering exercises.
- DORA metrics tracking.

## Immediate Next Steps
1. Approve architecture blueprint and tooling stack.
2. Stand up consolidated mono-repo structure & baseline tooling (Week 1 deliverable).
3. Build design system tokens (colors, typography, spacing) to drive parity across platforms.
4. Draft detailed sprint backlog for backend, web, and mobile squads (2-week iterations).
5. Establish observability baseline (logging, tracing) in current app to monitor migration.
