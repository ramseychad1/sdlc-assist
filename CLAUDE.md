# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Read Planning & Implementation Docs First

Before starting any task, always read the following files to understand the full project context, requirements, and design intent:

- **Requirements**: `1.Planning/REQUIREMENTS.md` — Product requirements, user roles, features, and phased delivery plan
- **Technical Requirements**: `1.Planning/TECHNICAL_REQUIREMENTS.md` — Tech spec with API endpoints, DB schema, component details, and implementation order
- **UX Design**: `1.Planning/ux-design.md` — Design tokens, layout specs, and styling guidance
- **UX Design (Pencil)**: `1.Planning/sdlc-assist.pen` — Visual mockups (use Pencil MCP tools to read, never use Read/Grep on .pen files)
- **Phase 1 Implementation Plan**: `Implementation/phase-1-implementation-plan.md` — Current build plan with proposed changes and verification steps

All implementation work must align with these documents. When in doubt, re-read the relevant planning doc rather than guessing.

## Project Overview

SDLC Assist is an AI-assisted SDLC web application. Users create projects and work through structured software development lifecycle phases, starting with Planning & Analysis (requirements gathering). AI features (Anthropic Claude integration) are planned for Phase 2; Phase 1 is the core foundation with auth, project CRUD, and requirements sections.

## Architecture

Monorepo with three top-level components:

- **`backend/`** — Spring Boot 3.4 (Java 21, Maven). REST API on port 8080. Uses Spring Security with session-based auth (BCrypt passwords, JSESSIONID cookies), Spring Data JPA with PostgreSQL, and Lombok for boilerplate reduction.
- **`frontend/`** — Angular 21 (standalone components, zoneless change detection, SCSS). Uses Angular Material for UI components. Dev server on port 4200 proxies `/api` to backend.
- **`supabase/`** — SQL migrations for Supabase-hosted PostgreSQL.

### Backend Structure (`com.sdlcassist`)
- `controller/` — REST endpoints: `AuthController` (`/api/auth/**`), `ProjectController` (`/api/projects`), `SectionController` (`/api/projects/{id}/sections`)
- `service/` — Business logic: `UserService` (implements `UserDetailsService`), `ProjectService`, `SectionService`
- `model/` — JPA entities: `User` (roles: ADMIN, PRODUCT_MANAGER, VIEWER), `Project` (statuses: DRAFT, ACTIVE, COMPLETED, ARCHIVED), `RequirementSection`
- `dto/` — Request/response DTOs with Lombok builders
- `config/` — `SecurityConfig` (endpoint security rules), `CorsConfig` (allows localhost:4200), `DataSeeder` (seeds initial data)

### Frontend Structure (`src/app/`)
- `core/services/` — `AuthService`, `ProjectService`, `SectionService` (HttpClient-based)
- `core/models/` — TypeScript interfaces matching backend DTOs
- `core/guards/` — `authGuard` for route protection
- `features/login/` — Login page
- `features/dashboard/` — Project list + create dialog
- `features/project/` — Project layout with SDLC phase tabs and planning/analysis child route
- Routes: `/login`, `/dashboard`, `/projects/:id/planning`

### Database
Three tables: `users`, `projects`, `requirement_sections`. UUIDs as primary keys. Sections have 5 fixed types per project (project_description, functional_requirements, non_functional_requirements, user_stories, acceptance_criteria) auto-created on first access.

## Common Commands

### Backend
```bash
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev    # Run dev server (port 8080)
cd backend && ./mvnw clean package                                      # Build JAR
cd backend && ./mvnw test                                               # Run all tests
cd backend && ./mvnw test -Dtest=ClassName                              # Run single test class
cd backend && ./mvnw test -Dtest=ClassName#methodName                   # Run single test method
```

### Frontend
```bash
cd frontend && npm start          # Dev server (port 4200)
cd frontend && npm run build      # Production build
cd frontend && npm test           # Run tests (Vitest via @angular/build:unit-test)
```

## Key Conventions

- **Angular**: Standalone components only (no NgModules). Zoneless change detection (`provideZonelessChangeDetection`). Lazy-loaded routes. Component schematics omit type suffix from class names (configured in `angular.json`).
- **Backend**: JPA `ddl-auto: validate` in prod, `ddl-auto: update` in dev. Schema changes go in `supabase/migrations/`. CSRF is disabled. Auth endpoints (`/api/auth/**`) are public; all other `/api/**` require authentication.
- **Styling**: SCSS with Angular Material custom theme. Prettier configured with 100 char width, single quotes, angular HTML parser.
- **TypeScript**: Strict mode enabled with strict templates. Target ES2022.

## Environment Variables

### Local Development
Database credentials live in `backend/src/main/resources/application-local.yml` (gitignored). This file is auto-imported by the dev profile. Create it from this template:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://aws-0-us-west-2.pooler.supabase.com:5432/postgres
    username: postgres.mtzcookrjzewywyirhja
    password: "YOUR_PASSWORD_HERE"
```

### Production (Railway)
Set these as Railway service env vars — do NOT put production credentials in code:
- `DATABASE_URL` — JDBC PostgreSQL connection string
- `DATABASE_USERNAME` / `DATABASE_PASSWORD` — DB credentials
- `SPRING_PROFILES_ACTIVE=prod`
- `ALLOWED_ORIGINS` — Frontend Railway domain (e.g. `https://frontend.railway.app`)
- Frontend build arg: `API_URL` — Backend Railway domain (e.g. `https://backend.railway.app/api`)

## Project Documentation Structure

### `1.Planning/` — All planning documents live here
| File | Purpose |
|------|---------|
| `REQUIREMENTS.md` | Product requirements, user roles, features, phased delivery |
| `TECHNICAL_REQUIREMENTS.md` | Tech spec: API endpoints, DB schema, component details |
| `ux-design.md` | Design tokens, color palette, layout specs |
| `sdlc-assist.pen` | Visual UX mockups (Pencil MCP tools only) |
| `pencil-shadcn.pen` | Additional design reference (Pencil MCP tools only) |
| `Claude-planning-chat.md` | Original planning conversation transcript |

### `Implementation/` — Implementation plans
| File | Purpose |
|------|---------|
| `phase-1-implementation-plan.md` | Phase 1 build plan with steps, proposed changes, and verification |

## Deployment

### Railway (two separate services from same repo)
- **Backend**: Root directory = `backend/`, uses `backend/Dockerfile` (multi-stage Maven → JRE Alpine)
- **Frontend**: Root directory = `frontend/`, uses `frontend/Dockerfile` (multi-stage Node → nginx Alpine)
- Frontend uses `nginx.conf` with SPA routing and Railway's `$PORT` via envsubst
- Frontend build replaces `__API_URL__` placeholder in compiled JS via `sed` at Docker build time
- Cross-origin session auth requires `SameSite=None; Secure` cookies (configured in `application.yml`, overridden to `lax/false` in dev)
- `CorsConfig` reads `ALLOWED_ORIGINS` env var (comma-separated); `SecurityConfig` injects the bean (do NOT instantiate `CorsConfig` manually)

## Current Status (as of 2026-02-15)

### Completed
- Phase 1 core: auth, project CRUD, requirement sections API + UI
- UI overhaul: shadcn/ui-inspired design with Inter font, Lucide icons, dark mode (ThemeService)
- Railway deployment prep: Dockerfiles, nginx, production config, CORS, cookie settings

### In Progress
- **Railway deployment**: Dockerfiles are pushed but Railway needs **root directories configured** per service:
  - Backend service → Settings → Root Directory = `backend`
  - Frontend service → Settings → Root Directory = `frontend`
  - Then set env vars listed above and redeploy

### Known Issues & Gotchas
- `LucideAngularModule.pick()` doesn't work in Angular 21 standalone imports — icons registered globally via `LUCIDE_ICONS` provider in `app.config.ts`
- Shell escaping with `!` in DB password breaks `source .env` and `-D` JVM args — use `application-local.yml` instead
- `SecurityConfig` must inject `CorsConfigurationSource` bean, not `new CorsConfig().corsConfigurationSource()` (causes NPE on `allowedOrigins`)
- `Project.owner` is `FetchType.LAZY` — repository uses `LEFT JOIN FETCH` to avoid `LazyInitializationException`
