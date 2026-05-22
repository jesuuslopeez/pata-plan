# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2026-05-22

First public release of PataPlan, delivered as the final project for 2º DAW.

### Added

#### Domain model and backend

- Prisma schema covering the full domain: users, groups, animals, weights, health events, event types, protocols, protocol steps, assignments, visits, documents and expenses.
- Authentication module: registration, login, JWT middleware and role-based access control (`ADMIN` / `COLLABORATOR` globally, `VIEWER` / `EDITOR` per group).
- Email verification on registration with a one-time link (1 h expiry).
- Password recovery flow via email with a temporary token (1 h expiry).
- "Remember me" persistence option on the login form (`sessionStorage` vs `localStorage` 30 days).
- Group CRUD with collaborator management and per-group invitation codes.
- Animal CRUD with photo upload via `multer`.
- Weight history endpoints with anomaly detection and automatic creation of a checkup event on outliers.
- Health event CRUD with automatic next-dose scheduling based on a configurable frequency.
- Health protocol engine: CRUD, individual step management, assignment to animals and cascade date recalculation when a protocol event is completed late.
- Visits, documents and expenses CRUD per animal, with categorised expense statistics.
- Per-animal PDF health report generation (`pdfkit`) bundling fiche, vaccines, deworming, visits, weight evolution and expense summary.
- Priority-scored alert system on the dashboard (delay × event severity × animal state).
- Dashboard summary and upcoming events endpoints.
- Daily scheduled email notifications for upcoming, due and overdue events (`node-cron` + SMTP).
- Swagger UI mounted at `/api/docs` covering every endpoint of the API.

#### Frontend

- Editorial landing page as the public root, with `/login` as the entry point.
- 404 page with paw-print illustration for unknown routes.
- Authentication context, login and registration pages with inline validation.
- Main layout with sidebar navigation, header and route guard.
- Dashboard page with priority alerts and upcoming events sections.
- Animals listing page with filters (group, species, search) and animal cards.
- Animal profile page with tabs (health, visits, documents, weight) and weight evolution chart.
- Health calendar view with filtering by animal, group and event type.
- Protocol management page with drag-to-reorder steps and a per-animal assignment modal.
- Expenses page with add-expense modal and categorised statistics.
- Settings page with editorial redesign, full responsive layout and per-group collaborator management.
- User avatar dropdown in the header with quick access to account settings and logout.
- Logout redirects to the public landing page.
- Inline group creation from the animal form.
- Ability to delete individual health events from the animal profile.
- Date validation in the animal form rejects future dates of birth.
- Open Graph and Twitter Card meta tags.
- Conversion of all pixel units to `rem` for accessibility.

#### Testing

- Backend test suite with Jest + Supertest (56 tests across `auth`, `animal` and integration suites) covering the critical flows: register → login → group → animal → event → dashboard, protocol cascade recalculation and RBAC.
- Frontend test suite with Vitest + React Testing Library (27 tests across `Badge`, `SearchInput`, `ConfirmDialog`, `AnimalCard` and the `Login` page).

#### Deployment, CI/CD and operations

- VPS deployment via GitHub Actions with SSH and `docker compose` orchestration.
- Post-deploy healthcheck against host port `8085`.
- Backend and frontend test workflow running on every push and pull request.
- Production `docker-compose` with notification env vars wired in, migrations on container start and a persistent `uploads/` volume.
- Nginx caching headers and JS bundle splitting to reach PageSpeed > 80.
- Dev CORS accepts any `localhost` origin to ease local testing.

#### Accessibility

- Accessibility audit and WCAG AA compliance fixes: visible focus styles, skip link, modal Escape handling, missing `aria-label`s.

#### Documentation

- Complete `/docs` folder with chapters 01–10: introduction, description, installation, style guide, design, development, testing, deployment, user manual and conclusions.
- Architecture diagrams in `docs/08-despliegue.md`.
- README rewrite with badges, feature overview and API summary.
- REST API endpoint reference in `docs/api-endpoints.md`.

### Changed

- Weight anomaly detection now uses the last 2 records as a baseline instead of a longer historical window, which behaves better with young animals that are still growing.
- Event recurrence uses `max(today, scheduledDate)` as the base for the next event, so completing a future event in advance no longer collides with the next occurrence.
- Settings eyebrow no longer shows the year; only the section label remains.
- Conventional Commits adopted as commit convention; single-line subjects without body enforced.

### Fixed

- Mobile responsiveness across header, sidebar, expenses, protocols and animal profile.
- Scroll position is reset to top on route change.
- Recharts `ResponsiveContainer` warning resolved by setting an explicit height on chart containers.
- Protocol edit modal preserves step data when reopened.
- Weight anomaly markers render correctly on the chart.
- Document remove flow uses `verifyDocumentEditAccess` (correct authorisation helper).
- Nginx proxies `/uploads` to the backend so animal photos load in production.
- Production client container binds to host port `8085` to avoid collision with another service on the VPS.
- CI lint errors blocking the pipeline.

## Development history

The 1.0.0 release was the outcome of one preparation sprint plus four implementation sprints of two weeks each. The list below summarises what landed in each block; commit-level detail is preserved in the Git history and in `docs/06-desarrollo.md`.

### Sprint 0 — Project bootstrap (March 2026)

Initial repository skeleton (`LICENSE`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CITATION.cff`, `.gitignore`), GitHub issue and pull request templates, Dependabot configuration, `.env.example`, project banner and Docker Compose setup for development and production.

### Sprint 1 — Backend core and authentication (late March – early April 2026)

Express server scaffolding, full Prisma schema with seed, JWT-based authentication and RBAC middleware, group and animal CRUD with photo upload, weight history with anomaly detection, health event CRUD with auto-scheduling, REST API endpoint reference, shared ESLint and Prettier configuration.

### Sprint 2 — Protocols, scoring and frontend pages (April 2026)

Health protocol CRUD with chained steps, protocol assignment with auto-generated calendar events, cascade date recalculation, priority-scored alert system, dashboard summary and upcoming events endpoints, Swagger UI, frontend authentication context, login and registration pages, main layout, dashboard, animals listing, animal profile and health calendar pages, first batch of backend unit tests.

### Sprint 3 — Visits, documents, expenses and reports (late April – mid May 2026)

Vet visit CRUD, document upload and management, expense CRUD with categorised statistics, per-animal PDF health report, per-group collaborator roles, add-expense modal, protocol management page with drag-to-reorder, email verification on registration, password recovery flow, "Remember me" option on login.

### Sprint 4 — Pre-release polish, deployment and documentation (mid May 2026)

Daily scheduled email notifications, accessibility audit and WCAG AA fixes, integration tests for critical flows, expanded Swagger covering every endpoint, performance optimisations (code splitting, lazy loading, nginx caching), editorial landing page, 404 page, mobile responsiveness pass, editorial redesign of the Settings page, GitHub Actions CI/CD with VPS SSH deploy, professional README, architecture diagrams, complete documentation chapters and the final 1.0.0 release on 2026-05-22.

[1.0.0]: https://github.com/jesuuslopeez/pata-plan/releases/tag/v1.0.0
