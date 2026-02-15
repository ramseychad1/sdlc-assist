# SDLC Assist - Technical Requirements

## Context
Build an AI-assisted SDLC web application where users manage projects through structured software development lifecycle phases. Starting with the **Planning & Analysis** phase focused on **Requirements Gathering** using form-based UI with AI assist buttons powered by Claude. The app supports multiple projects, each with their own SDLC workflow shown as horizontal tabs.

---

## Tech Stack
- **Backend**: Spring Boot 3.x (Java 21) with Maven
- **Frontend**: Angular 17+ with Angular Material
- **Database**: PostgreSQL via Supabase (connected via JDBC)
- **AI**: Anthropic Claude via official Anthropic Java SDK (`com.anthropic:anthropic-java`)
- **Deployment**: Railway (two services: backend + frontend)

---

## Monorepo Structure
```
sdlc-assist/
├── backend/                              # Spring Boot application
│   ├── pom.xml
│   ├── src/main/java/com/sdlcassist/
│   │   ├── SdlcAssistApplication.java
│   │   ├── config/
│   │   │   ├── CorsConfig.java           # CORS for Angular dev/prod
│   │   │   └── AnthropicConfig.java      # Anthropic client bean
│   │   ├── controller/
│   │   │   ├── ProjectController.java    # /api/projects CRUD
│   │   │   ├── SectionController.java    # /api/projects/{id}/sections CRUD
│   │   │   └── AiController.java         # /api/ai/generate (streaming)
│   │   ├── model/
│   │   │   ├── Project.java              # JPA entity
│   │   │   └── RequirementSection.java   # JPA entity
│   │   ├── dto/
│   │   │   ├── ProjectRequest.java
│   │   │   ├── ProjectResponse.java
│   │   │   ├── SectionRequest.java
│   │   │   ├── SectionResponse.java
│   │   │   └── AiGenerateRequest.java
│   │   ├── repository/
│   │   │   ├── ProjectRepository.java    # Spring Data JPA
│   │   │   └── SectionRepository.java    # Spring Data JPA
│   │   └── service/
│   │       ├── ProjectService.java
│   │       ├── SectionService.java
│   │       └── AiService.java            # Claude streaming integration
│   └── src/main/resources/
│       ├── application.yml               # DB, server config
│       └── application-dev.yml           # Dev profile overrides
│
├── frontend/                             # Angular application
│   ├── angular.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.ts
│   │   ├── index.html
│   │   ├── styles.scss                   # Global styles + Angular Material theme
│   │   ├── environments/
│   │   │   ├── environment.ts            # apiUrl for dev
│   │   │   └── environment.prod.ts       # apiUrl for prod
│   │   └── app/
│   │       ├── app.component.ts
│   │       ├── app.routes.ts             # Standalone routing
│   │       ├── core/
│   │       │   ├── services/
│   │       │   │   ├── project.service.ts    # HttpClient for projects API
│   │       │   │   ├── section.service.ts    # HttpClient for sections API
│   │       │   │   └── ai.service.ts         # Streaming fetch for AI endpoint
│   │       │   └── models/
│   │       │       ├── project.model.ts
│   │       │       └── section.model.ts
│   │       ├── features/
│   │       │   ├── dashboard/
│   │       │   │   ├── dashboard.component.ts      # Project list page
│   │       │   │   ├── project-card.component.ts   # Individual project card
│   │       │   │   └── create-project-dialog.component.ts
│   │       │   └── project/
│   │       │       ├── project-layout.component.ts  # Layout with SDLC tabs
│   │       │       ├── sdlc-tabs.component.ts       # Horizontal tab bar
│   │       │       ├── planning-analysis/
│   │       │       │   ├── planning-analysis.component.ts  # Requirements page
│   │       │       │   ├── section-editor.component.ts     # Section with textarea + AI button
│   │       │       │   └── ai-assist-button.component.ts   # AI dropdown button
│   │       │       ├── design/
│   │       │       │   └── coming-soon.component.ts
│   │       │       ├── implementation/
│   │       │       │   └── coming-soon.component.ts
│   │       │       ├── testing/
│   │       │       │   └── coming-soon.component.ts
│   │       │       └── maintenance/
│   │       │           └── coming-soon.component.ts
│   │       └── shared/
│   │           └── components/
│   │               └── header.component.ts
│
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
│
├── .env.example                          # SUPABASE_URL, SUPABASE_PASSWORD, ANTHROPIC_API_KEY
└── .gitignore
```

---

## Database Schema (Supabase PostgreSQL)

### `projects` table
| Column       | Type         | Notes                    |
|-------------|-------------|--------------------------|
| id          | uuid (PK)   | gen_random_uuid()        |
| name        | text         | NOT NULL                 |
| description | text         | nullable                 |
| prd_content | text         | nullable, AI-generated PRD |
| created_at  | timestamptz  | DEFAULT now()            |
| updated_at  | timestamptz  | DEFAULT now()            |

### `requirement_sections` table
| Column      | Type         | Notes                                      |
|------------|-------------|---------------------------------------------|
| id         | uuid (PK)   | gen_random_uuid()                           |
| project_id | uuid (FK)   | references projects(id) ON DELETE CASCADE   |
| section_type | text       | 'project_description', 'functional_requirements', 'non_functional_requirements', 'user_stories', 'acceptance_criteria' |
| title      | text         | Display name of section                     |
| content    | text         | The actual text content (user + AI edited)  |
| sort_order | integer      | For ordering sections                       |
| created_at | timestamptz  | DEFAULT now()                               |
| updated_at | timestamptz  | DEFAULT now()                               |

---

## API Endpoints (Spring Boot)

| Method | Route | Purpose |
|--------|-------|---------|
| GET    | `/api/projects` | List all projects |
| POST   | `/api/projects` | Create a new project |
| GET    | `/api/projects/{id}` | Get single project |
| PUT    | `/api/projects/{id}` | Update project |
| DELETE | `/api/projects/{id}` | Delete project |
| GET    | `/api/projects/{id}/sections` | Get all requirement sections for a project |
| POST   | `/api/projects/{id}/sections` | Create a requirement section |
| PUT    | `/api/projects/{id}/sections/{sectionId}` | Update a section |
| DELETE | `/api/projects/{id}/sections/{sectionId}` | Delete a section |
| PUT    | `/api/projects/{id}/prd` | Save PRD content on project |
| POST   | `/api/ai/generate` | AI assist - generate/expand/refine content (SSE streaming) |

### AI Endpoint Details (`POST /api/ai/generate`)
- **Request body**: `{ "projectContext": "...", "sectionType": "...", "currentContent": "...", "action": "generate|expand|refine" }`
- **Response**: Server-Sent Events (SSE) stream via `SseEmitter` or `Flux<String>`
- Uses Anthropic Java SDK with streaming messages API
- System prompt tailored for requirements engineering

---

## Implementation Order (8 Commits)

### Commit 1: Project scaffolding — backend
- Generate Spring Boot project (Spring Web, Spring Data JPA, PostgreSQL driver)
- `pom.xml` with dependencies: spring-boot-starter-web, spring-boot-starter-data-jpa, postgresql, anthropic-java SDK
- `application.yml` with Supabase JDBC connection string, server port 8080
- `CorsConfig.java` allowing Angular dev server (localhost:4200)
- `.env.example` with placeholder values
- `.gitignore` for Java + Node artifacts

### Commit 2: Project scaffolding — frontend
- `ng new frontend` with standalone components, SCSS, routing
- Install Angular Material (`ng add @angular/material`)
- Configure Angular Material theme in `styles.scss`
- Set up `environment.ts` with `apiUrl: 'http://localhost:8080/api'`
- `header.component.ts` — app header with title
- `app.routes.ts` — basic route structure
- Proxy config for dev (`proxy.conf.json` → backend at 8080)

### Commit 3: Database migration + JPA entities
- `supabase/migrations/001_initial_schema.sql` with both tables, indexes
- `Project.java` — JPA entity with UUID, name, description, timestamps
- `RequirementSection.java` — JPA entity with FK to project, section_type, content, sort_order
- `ProjectRepository.java` and `SectionRepository.java` — Spring Data JPA interfaces
- DTO classes for request/response

### Commit 4: Projects CRUD (backend + frontend)
- **Backend**: `ProjectController.java` + `ProjectService.java` — full REST CRUD
- **Frontend**: `project.service.ts` — HttpClient calls
- `dashboard.component.ts` — project list with Angular Material cards
- `project-card.component.ts` — individual project card
- `create-project-dialog.component.ts` — Material dialog for creating projects
- Angular Material modules: MatCard, MatButton, MatDialog, MatInput, MatIcon

### Commit 5: Project layout with SDLC tabs
- **Frontend**: `project-layout.component.ts` — layout wrapper with header + tabs
- `sdlc-tabs.component.ts` — horizontal Material tab bar
- Tab config: Planning & Analysis (active), Design, Implementation, Testing & Integration, Maintenance
- Route children under `/projects/:id/...`
- `coming-soon.component.ts` — shared placeholder for inactive tabs
- Disabled tabs show lock icon + "Coming Soon" tooltip

### Commit 6: Requirements gathering form
- **Backend**: `SectionController.java` + `SectionService.java` — CRUD for sections
- Auto-create default sections when project's sections are first requested (project_description, functional_requirements, non_functional_requirements, user_stories, acceptance_criteria)
- **Frontend**: `section.service.ts` — HttpClient calls
- `planning-analysis.component.ts` — requirements page, loads sections
- `section-editor.component.ts` — Material card with textarea, save button
- Save on button click, persist to backend/Supabase

### Commit 7: AI assist integration
- **Backend**: `AnthropicConfig.java` — Anthropic client bean setup
- `AiService.java` — builds system prompt, calls Claude streaming API
- `AiController.java` — POST endpoint returning SSE stream (`text/event-stream`)
- **Frontend**: `ai.service.ts` — uses `fetch()` with ReadableStream for SSE consumption
- `ai-assist-button.component.ts` — Material menu with Generate/Expand/Refine actions
- Wire AI button into `section-editor.component.ts`
- Loading spinner during generation, streamed text populates textarea

### Commit 8: Polish and UX refinements
- Angular Material snackbar for save/error notifications
- Empty states for no projects / no content
- Loading spinners for data fetching
- Responsive layout tweaks

---

## Key Component Details

### `sdlc-tabs.component.ts`
- Uses Angular Material `mat-tab-nav-bar` with `routerLink` per tab
- Tabs: Planning & Analysis | Design | Implementation | Testing & Integration | Maintenance
- Active tab determined by `routerLinkActive`
- Disabled tabs show a lock icon + "Coming Soon" MatTooltip
- Only Planning & Analysis routes to functional content

### `section-editor.component.ts`
- Material card with section title, `<textarea matInput>` for content, AI assist button
- Textarea is editable by user
- AI assist button triggers mat-menu: Generate / Expand / Refine
- When AI generates, content streams into the textarea progressively
- Save button persists to backend via `SectionService`

### `ai-assist-button.component.ts`
- Material icon button with `mat-menu` dropdown (3 actions)
- Sends current section content + project context to `/api/ai/generate`
- Uses `fetch()` + `ReadableStream` to consume SSE
- Shows `mat-spinner` during generation

### `AiService.java` (Backend)
- Uses Anthropic Java SDK `AnthropicClient` for streaming messages
- Builds system prompt based on section type (e.g., "You are a requirements engineering expert...")
- Action-specific user prompts: generate from scratch, expand existing, refine/improve
- Returns streamed tokens via `SseEmitter` to the controller

---

## Verification Plan
1. **Backend build**: `cd backend && ./mvnw clean package` — should compile and pass
2. **Frontend build**: `cd frontend && ng build` — should compile with no errors
3. **Dashboard**: Navigate to `http://localhost:4200` — should see project list (empty state)
4. **Create project**: Click create button, fill form, verify project appears in list
5. **Project view**: Click project, verify SDLC tabs render with Planning & Analysis active
6. **Disabled tabs**: Click other tabs, verify they show "Coming Soon"
7. **Requirements form**: Planning & Analysis page shows 5 requirement sections
8. **Manual edit**: Type in sections, save, refresh — content persists
9. **AI assist**: Click AI button on a section, verify streaming response populates textarea (requires valid `ANTHROPIC_API_KEY`)
10. **Lint**: `cd frontend && ng lint` passes clean
