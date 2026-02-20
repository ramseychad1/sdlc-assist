# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚡ NEXT SESSION HANDOFF (2026-02-20)

### What was just completed — Phase 2.5.2: Complete UX Design & Technical Design Unlock
- **DB migration** (`006_project_ux_design_status.sql`): added `ux_design_status`, `technical_design_status`, `ux_design_completed_at` columns to `projects`
- **Backend `POST /api/projects/{id}/complete-phase`**: validates ≥1 generated prototype, sets `ux_design_status='COMPLETE'`, `technical_design_status='UNLOCKED'`
- **UX Design stepper Step 4 "Complete"**: pure visual indicator (✓ when done, greyed when not)
- **"Continue to Technical Design" button**: right-aligned in stepper action row; appears when ≥1 prototype generated; calls API on first click then navigates, just navigates on revisit
- **"Return to <previous step>" button**: left-aligned in stepper action row; step-aware labels: "Return to Planning & Analysis" (step 1), "Return to Template Selection" (step 2), "Return to Design System" (step 3)
- **Warning banner**: amber inline banner on Prototypes step when some screens are unprototyped
- **"Continue to UX Design" banner**: appears on Planning & Analysis page between AI section and PRD section when a PRD is saved
- **Technical Design tab**: Coming Soon UI with wrench icon + "Back to UX Design" ghost button; unlocks when `technicalDesignStatus !== 'LOCKED'`
- **Icons added**: `TriangleAlert`, `Wrench`, `ArrowLeft` registered in `app.config.ts`

#### Key files changed (Phase 2.5.2)
| File | Change |
|---|---|
| `supabase/migrations/006_project_ux_design_status.sql` | NEW — 3 new columns on `projects` |
| `backend/.../model/Project.java` | Added `uxDesignStatus`, `technicalDesignStatus`, `uxDesignCompletedAt` |
| `backend/.../dto/ProjectResponse.java` | Exposed new fields in `from()` |
| `backend/.../dto/CompletePhaseRequest.java` | NEW — `{ phase: String }` request DTO |
| `backend/.../repository/ProjectScreenRepository.java` | Added `countByProjectIdAndPrototypeContentIsNotNull()` |
| `backend/.../service/ProjectService.java` | Added `completePhase()` with validation |
| `backend/.../controller/ProjectController.java` | Added `POST /{id}/complete-phase` |
| `frontend/.../core/models/project.model.ts` | Added `uxDesignStatus`, `technicalDesignStatus`, `uxDesignCompletedAt` |
| `frontend/.../core/services/project.service.ts` | Added `completePhase()` |
| `frontend/.../project-layout.component.ts` | Tab unlock + progress driven from new fields; fixed `updateActivePhase()` race condition |
| `frontend/.../ux-design-stepper.component.ts` | Step 4 visual state, continue + return buttons, `returnLabel`, `onReturnClick()` |
| `frontend/.../prototype-generation.component.ts` | Computed signals, warning banner, `onCompleteUxDesign()` handler |
| `frontend/.../technical-design.component.ts` | Coming Soon UI + back-navigation |
| `frontend/.../planning-analysis.component.ts` | "Continue to UX Design" bar between AI section and PRD section |
| `frontend/src/app/app.config.ts` | Added `TriangleAlert`, `Wrench`, `ArrowLeft` icons |

### Pending: Fix Gemini (prd_generation_agent) response parsing (BLOCKER)
- `VertexAIService.streamQuery()` uses `readAllBytes()` — logs show **0 chars** despite status 200
- **Fix**: Switch to line-by-line `BufferedReader` (already done in `DesignSystemService.java` — copy that pattern)
- Test project: **"Test Project 2"** (`c8a4e709-d059-47af-ac7c-193f2200fe62`)

### Pending: Test design_system_agent end-to-end
- `DesignSystemService.java` is complete — uses v1 API, resource ID `4471708292606853120`
- Frontend: `design-system-generation.component.ts` fully replaces Coming Soon
- DB column `design_system_content` added and live
- **Test**: Navigate to a project with PRD + template selected → ux-design/design-system → click "Start Design System"

### Pending: Jira integration POC
- Goal: create Jira Epics/Stories/Tasks directly from a saved PRD
- Atlassian MCP tools are available in Claude Code (`mcp__claude_ai_Atlassian__*`)
- Test project chosen: **"Test Project 2"** (id: `c8a4e709-d059-47af-ac7c-193f2200fe62`) — has full PRD with 10 EPICs
- POC plan: user picks 1 EPIC, create it + all stories + tasks in Jira
- Start from `mcp__claude_ai_Atlassian__getAccessibleAtlassianResources`

### Vertex AI agents in GCP (as of 2026-02-20)
| Resource ID | Display Name | API Version | Notes |
|---|---|---|---|
| `2165724545904803840` | `prd_generation_agent` | v1beta1 | **Active — PRD generation** |
| `1237279335224705024` | `design_system_agent` | v1 | **Active — Design System generation** |
| `6375886510054440960` | `screen_extraction_agent` | v1 | **Active — Phase 2.4 screen list extraction** |
| `8507215033707528192` | `screen_generation_agent` | v1 | **Active — Phase 2.5 per-screen HTML generation + Phase 2.5.1 refinement** |
| `454356687504015360` | `prd_generation_agent` | v1beta1 | Older duplicate — can be deleted |

---

## IMPORTANT: Read Planning & Implementation Docs First

Before starting any task, always read the following files to understand the full project context, requirements, and design intent:

- **Requirements**: `1.Planning/REQUIREMENTS.md` — Product requirements, user roles, features, and phased delivery plan
- **Technical Requirements**: `1.Planning/TECHNICAL_REQUIREMENTS.md` — Tech spec with API endpoints, DB schema, component details, and implementation order
- **UX Design**: `1.Planning/ux-design.md` — Design tokens, layout specs, and styling guidance
- **UX Design (Pencil)**: `1.Planning/sdlc-assist.pen` — Visual mockups (use Pencil MCP tools to read, never use Read/Grep on .pen files)
- **Phase 1 Implementation Plan**: `Implementation/phase-1-implementation-plan.md` — Current build plan with proposed changes and verification steps

All implementation work must align with these documents. When in doubt, re-read the relevant planning doc rather than guessing.

## Project Overview

SDLC Assist is an AI-assisted SDLC web application. Users create projects and work through structured software development lifecycle phases. The Planning & Analysis phase uses AI (Claude streaming or Gemini batch) to generate a Product Requirements Document (PRD) from uploaded planning documents.

## Architecture

Monorepo with three top-level components:

- **`backend/`** — Spring Boot 3.4 (Java 21, Maven). REST API on port 8080. Uses Spring Security with session-based auth (BCrypt passwords, JSESSIONID cookies), Spring Data JPA with PostgreSQL, and Lombok for boilerplate reduction.
- **`frontend/`** — Angular 21 (standalone components, zoneless change detection, SCSS). Uses Angular Material for UI components. Dev server on port 4200 proxies `/api` to backend.
- **`supabase/`** — SQL migrations for Supabase-hosted PostgreSQL.

### Backend Structure (`com.sdlcassist`)
- `controller/` — REST endpoints: `AuthController` (`/api/auth/**`), `ProjectController` (`/api/projects`, `PUT /api/projects/{id}/prd`, `POST /api/projects/{id}/complete-phase`), `FileController` (`/api/projects/{id}/files`, `/analyze/stream`, `/analyze/gemini`), `SectionController`, `ScreenController` (`/api/projects/{id}/screens`, `/screens/extract` SSE, `/screens/{screenId}/prototype`, `/screens/{screenId}/refine` SSE)
- `service/` — Business logic: `UserService`, `ProjectService` (includes `savePrd()`, `completePhase()`), `SectionService`, `AiService` (Claude SSE streaming), `VertexAIService` (Gemini batch via Vertex AI Agent Engine), `DesignSystemService` (design system agent), `ScreenExtractionService` (screen list extraction), `ScreenGenerationService` (prototype generation + refinement chat), `FileService` (upload, extract text), `PromptService`
- `model/` — JPA entities: `User` (roles: ADMIN, PRODUCT_MANAGER, VIEWER), `Project` (statuses: DRAFT, ACTIVE, COMPLETED, ARCHIVED; includes `prdContent`, `designSystemContent`, `uxDesignStatus`, `technicalDesignStatus`, `uxDesignCompletedAt`), `RequirementSection`, `ProjectFile`, `ProjectScreen` (includes `prototypeContent`, `vertexSessionId`)
- `dto/` — Request/response DTOs with Lombok builders (includes `PrdRequest`, `AiAnalysisResponse`, `ScreenDefinitionDto`, `PrototypeRefineRequest`, `CompletePhaseRequest`)
- `config/` — `SecurityConfig`, `CorsConfig`, `DataSeeder`

### Frontend Structure (`src/app/`)
- `core/services/` — `AuthService`, `ProjectService` (includes `getScreens()`, `saveScreens()`, `savePrototype()`, `saveRefinedPrototype()`, `refinePrototype()` SSE, `completePhase()`), `SectionService`, `FileService` (upload, `analyzeStream()` SSE, `analyzeWithGemini()`)
- `core/models/` — TypeScript interfaces matching backend DTOs (includes `ScreenDefinition`, `ScreenType`; `Project` now has `uxDesignStatus`, `technicalDesignStatus`, `uxDesignCompletedAt`)
- `core/guards/` — `authGuard`, `unsavedChangesGuard`
- `features/login/` — Login page
- `features/dashboard/` — Project list + create dialog
- `features/project/` — Project layout with SDLC phase tabs; Planning & Analysis has "Continue to UX Design" banner; Technical Design tab unlocks from DB field
- `features/project/design-phase/prototype-generation/` — Screen extraction, review, confirm, and per-screen prototype generation with refinement chat modal; warning banner for partial coverage; `onCompleteUxDesign()` handler
- `features/project/design-phase/components/ux-design-stepper/` — Step 4 visual indicator; right "Continue to Technical Design" + left "Return to <step>" action row
- `features/project/design-phase/technical-design/` — Coming Soon UI stub (unlocked by `technicalDesignStatus`)
- `shared/pipes/` — `MarkdownPipe` (renders PRD markdown via `marked`)
- Routes: `/login`, `/dashboard`, `/projects/:id/planning`, `/projects/:id/ux-design/**`, `/projects/:id/technical-design`

### Database
Six tables: `users`, `projects`, `requirement_sections`, `project_files`, `templates`, `project_screens`. UUIDs as primary keys. The `projects` table has `prd_content` TEXT, `design_system_content` TEXT, `ux_design_status VARCHAR(20)` (default `'NOT_STARTED'`), `technical_design_status VARCHAR(20)` (default `'LOCKED'`), and `ux_design_completed_at TIMESTAMP` columns. The `project_screens` table has `prototype_content` TEXT and `vertex_session_id` VARCHAR(255) columns.

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
- `ALLOWED_ORIGINS` — Frontend Railway domain (e.g. `https://frontend.railway.app`)
- `ANTHROPIC_API_KEY` — Anthropic API key for Claude
- `GOOGLE_SERVICE_ACCOUNT_JSON` — Full JSON content of GCP service account key (for Gemini)
- `VERTEXAI_PROJECT_ID` — GCP project ID (default: `sdlc-assist`)
- `VERTEXAI_LOCATION` — GCP region (default: `us-central1`)
- `VERTEXAI_AGENT_RESOURCE_ID` — Vertex AI Reasoning Engine ID (default: `2165724545904803840`)
- Frontend env var: `API_URL` — Backend internal URL (e.g. `http://sdlc-assist.railway.internal:8080`) — this is a **runtime** env var used by nginx, NOT a build arg

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
- Frontend nginx **reverse-proxies** `/api/*` to the backend via Railway private networking (`API_URL` env var)
- nginx.conf uses `__PLACEHOLDER__` syntax (not `$VAR`) — `sed` replaces at container startup to avoid conflicting with nginx's own `$` variables
- The Dockerfile CMD reads the DNS resolver from `/etc/resolv.conf` (Railway uses IPv6 `fd12::10`, wrapped in brackets for nginx)
- Frontend JS always calls `/api` (same-origin) — the backend URL is never exposed to the browser
- Frontend build hardcodes `__API_URL__` → `/api` in compiled JS via `sed` at Docker build time
- Session cookies use `SameSite=None; Secure` (configured in `application.yml`, overridden to `lax/false` in dev)
- `CorsConfig` reads `ALLOWED_ORIGINS` env var (comma-separated); `SecurityConfig` injects the bean (do NOT instantiate `CorsConfig` manually)
- **Backend private networking hostname**: `sdlc-assist.railway.internal:8080`

## Current Status (as of 2026-02-20)

### Completed
- Phase 1 core: auth, project CRUD, requirement sections API + UI
- UI overhaul: shadcn/ui-inspired design with Inter font, Lucide icons, dark mode (ThemeService)
- Railway deployment: both services live, nginx reverse proxy, backend on Supabase DB
- Admin user management: create, delete, reset password (ADMIN role only, `/admin/users` route)
- AI streaming PRD generation via Claude (SSE) with markdown rendering, inline editing, save, download, print-to-PDF
- **PRD workflow**: AI-generated PRD is the primary artifact of Planning & Analysis. Saved on `projects.prd_content` via `PUT /api/projects/{id}/prd`
- **Gemini integration**: Vertex AI Agent Engine (ADK Reasoning Engine) as second PRD generator. Two-step session API: `create_session` → `streamQuery`. Source badge (Claude/Gemini) shown on result. Auto-enters edit mode after generation with prominent Save bar.
- **Design System generation**: `DesignSystemService.java` + `design-system-generation.component.ts`. Saves to `projects.design_system_content`.
- **Phase 2.4 — Screen Extraction**: `screen_extraction_agent` reads PRD and returns JSON list of UI screens. User reviews/removes, then confirms to persist to `project_screens` DB table.
- **Phase 2.5 — Prototype Generation**: `screen_generation_agent` generates per-screen HTML prototypes. Modal with iframe preview. Session ID persisted to `project_screens.vertex_session_id`.
- **Phase 2.5.1 — Prototype Refinement Chat**: Chat panel in prototype modal. POST SSE streaming via `fetch()`. Session replay for screens without session ID. `PATCH` endpoint to save refined HTML.
- **Phase 2.5.2 — Complete UX Design & Technical Design Unlock**: Step 4 "Complete" visual indicator in UX stepper. "Continue to Technical Design" button (right) + "Return to <prev step>" button (left) in stepper action row. Warning banner for partial prototype coverage. "Continue to UX Design" bar on Planning & Analysis page. Technical Design tab Coming Soon stub. DB-driven tab unlock via `ux_design_status` / `technical_design_status` columns.
- **Supabase PgBouncer fix**: Added `prepareThreshold: 0` to Hikari datasource properties
- **SSE stream reliability**: `SseEmitter` now has `onTimeout` + `onError` handlers

### In Progress / Known Broken
- **Gemini response parsing (prd_generation_agent)**: `VertexAIService.streamQuery()` uses `readAllBytes()` — logs show 0 chars despite status 200. Fix: switch to line-by-line `BufferedReader` (pattern in `DesignSystemService.java`).

### TODO / Deferred
- **Email invite on user creation**: Backend `EmailService` plumbing exists but **Railway blocks outbound SMTP**. Switch to HTTP-based provider (e.g. Resend) to enable in production.
- **DB object size limits**: `prd_content`, `design_system_content`, `prototype_content` are all TEXT (unbounded). Monitor if storage becomes an issue.

### Railway Env Vars (current)
- **Backend**: `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `ALLOWED_ORIGINS`, `ANTHROPIC_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `VERTEXAI_PROJECT_ID`, `VERTEXAI_LOCATION`, `VERTEXAI_AGENT_RESOURCE_ID` (no `SPRING_PROFILES_ACTIVE` — uses default profile)
- **Frontend**: `API_URL=http://sdlc-assist.railway.internal:8080` (no `/api` suffix — nginx passes full request path)

### Known Issues & Gotchas
- `LucideAngularModule.pick()` doesn't work in Angular 21 standalone imports — icons registered globally via `LUCIDE_ICONS` provider in `app.config.ts`
- Shell escaping with `!` in DB password breaks `source .env` and `-D` JVM args — use `application-local.yml` instead
- `SecurityConfig` must inject `CorsConfigurationSource` bean, not `new CorsConfig().corsConfigurationSource()` (causes NPE on `allowedOrigins`)
- `Project.owner` is `FetchType.LAZY` — repository uses `LEFT JOIN FETCH` to avoid `LazyInitializationException`
- **Supabase PgBouncer**: Transaction-mode pooling conflicts with Hibernate prepared statements. Fixed with `hikari.data-source-properties.prepareThreshold: 0` in `application.yml`. Do NOT remove this.
- **SseEmitter must have onTimeout/onError handlers**: Without them, Spring silently closes the emitter on timeout and the frontend spinner hangs forever. Always register both handlers when creating `SseEmitter`.
- **nginx + envsubst**: Do NOT use `${VAR}` syntax in nginx.conf templates — envsubst replaces nginx variables too. Use `__PLACEHOLDER__` syntax with `sed` instead.
- **nginx + Railway IPv6 DNS**: Railway's internal DNS resolver is IPv6 (`fd12::10`). Must wrap in brackets `[fd12::10]` for nginx `resolver` directive.
- **nginx variable proxy_pass**: When using a variable in `proxy_pass`, nginx passes the full original URI. Set `API_URL` to backend root (no `/api` suffix) to avoid path doubling.
- **Railway blocks outbound SMTP**: Both ports 587 and 465 are blocked. Use an HTTP-based email provider (e.g. Resend).
- **Vertex AI Agent Engine API (ADK 1.25+)**: Does NOT support a `query` class_method directly. Must use session-based flow: `POST :query` with `class_method: create_session` → `POST :streamQuery` with session_id + message.
- **Gemini auth**: Local dev uses `GOOGLE_APPLICATION_CREDENTIALS` (file path to service account JSON). Railway uses `GOOGLE_SERVICE_ACCOUNT_JSON` (full JSON content as env var). Both handled in `VertexAIService.getAccessToken()`.
- **Spring Boot SSE format**: Spring's `SseEmitter` sends `data:{...}` with NO space after the colon. Frontend SSE parsers must use `line.startsWith('data:')` — NOT `line.startsWith('data: ')` — or all events will be silently dropped.
- **POST SSE via fetch()**: Native `EventSource` only supports GET requests. For SSE over POST (e.g. refinement endpoint), use `fetch()` with `response.body.getReader()` streaming loop. The Angular dev proxy at port 4200 buffers POST responses — events arrive all at once when the connection closes, which is acceptable.
- **Angular zoneless + fetch Promise callbacks**: Signal updates inside `fetch().then()` callbacks don't trigger change detection in zoneless Angular. For DOM elements that must update immediately (e.g. `<iframe srcdoc>`), use `@ViewChild` to get the native element and set properties directly rather than relying on Angular binding.
- **TypeScript interface placement**: In Angular standalone components, interfaces declared between the `@Component({...})` decorator and `export class` cause `NG2007` / "Decorators are not valid here" build errors. Place interfaces before the `@Component` decorator.
