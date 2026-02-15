# SDLC Assist — Phase 1 Implementation Plan

Build the core application: Spring Boot backend + Angular frontend with authentication, project CRUD, SDLC phase tabs, and requirements sections. **No AI integration** — that's Phase 2.

## User Review Required

> [!IMPORTANT]
> **Database**: The tech spec calls for Supabase PostgreSQL via JDBC. Do you have a Supabase instance set up, or should I configure for a local PostgreSQL for now?

> [!IMPORTANT]
> **Auth approach**: Requirements specify Spring Security with server-side sessions (username/password). For Phase 1, I'll implement a basic form login with hardcoded admin credentials and session management. We can add proper user management later.

> [!IMPORTANT]  
> **Angular Material vs Custom styling**: The tech spec says Angular Material, but the UX design uses shadcn-style tokens. I'll use Angular Material components styled with the `ux-design.md` color tokens to match the Pencil designs closely.

---

## Proposed Changes

### 1. Backend Scaffolding

#### [NEW] [pom.xml](file:///Users/chadramsey/projects/sdlc-assist/backend/pom.xml)
- Spring Boot 3.x (Java 21), Maven
- Dependencies: `spring-boot-starter-web`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`, `postgresql`, `lombok`
- No Anthropic SDK yet (Phase 2)

#### [NEW] [SdlcAssistApplication.java](file:///Users/chadramsey/projects/sdlc-assist/backend/src/main/java/com/sdlcassist/SdlcAssistApplication.java)
- Main Spring Boot application class

#### [NEW] [application.yml](file:///Users/chadramsey/projects/sdlc-assist/backend/src/main/resources/application.yml)
- PostgreSQL JDBC config (Supabase or local), port 8080
- Spring Security session config

#### [NEW] [application-dev.yml](file:///Users/chadramsey/projects/sdlc-assist/backend/src/main/resources/application-dev.yml)
- Dev profile: local DB, debug logging

#### [NEW] [CorsConfig.java](file:///Users/chadramsey/projects/sdlc-assist/backend/src/main/java/com/sdlcassist/config/CorsConfig.java)
- Allow `localhost:4200` for Angular dev server

#### [NEW] [SecurityConfig.java](file:///Users/chadramsey/projects/sdlc-assist/backend/src/main/java/com/sdlcassist/config/SecurityConfig.java)
- Form-based login, session management, CSRF config, endpoint security rules

---

### 2. Database & JPA Entities

#### [NEW] [001_initial_schema.sql](file:///Users/chadramsey/projects/sdlc-assist/supabase/migrations/001_initial_schema.sql)
- `projects` table (uuid PK, name, description, timestamps)
- `requirement_sections` table (uuid PK, project_id FK, section_type, title, content, sort_order, timestamps)
- `users` table (uuid PK, username, password_hash, role, timestamps)

#### [NEW] [Project.java](file:///Users/chadramsey/projects/sdlc-assist/backend/src/main/java/com/sdlcassist/model/Project.java)
#### [NEW] [RequirementSection.java](file:///Users/chadramsey/projects/sdlc-assist/backend/src/main/java/com/sdlcassist/model/RequirementSection.java)
#### [NEW] [User.java](file:///Users/chadramsey/projects/sdlc-assist/backend/src/main/java/com/sdlcassist/model/User.java)
- JPA entities matching DB schema

#### [NEW] DTOs: `ProjectRequest`, `ProjectResponse`, `SectionRequest`, `SectionResponse`
#### [NEW] Repositories: `ProjectRepository`, `SectionRepository`, `UserRepository`

---

### 3. Backend API (REST Controllers + Services)

#### [NEW] [ProjectController.java](file:///Users/chadramsey/projects/sdlc-assist/backend/src/main/java/com/sdlcassist/controller/ProjectController.java)
- `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/{id}`

#### [NEW] [SectionController.java](file:///Users/chadramsey/projects/sdlc-assist/backend/src/main/java/com/sdlcassist/controller/SectionController.java)
- `GET/POST /api/projects/{id}/sections`, `PUT/DELETE /api/projects/{id}/sections/{sectionId}`
- Auto-create 5 default sections on first GET

#### [NEW] [AuthController.java](file:///Users/chadramsey/projects/sdlc-assist/backend/src/main/java/com/sdlcassist/controller/AuthController.java)
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`

#### [NEW] Services: `ProjectService`, `SectionService`, `UserService`

---

### 4. Frontend Scaffolding

#### [NEW] Angular 17+ project via `ng new frontend`
- Standalone components, SCSS, routing
- Angular Material with custom theme matching `ux-design.md` tokens
- Environment files with `apiUrl`
- Proxy config for dev → backend at 8080

---

### 5. Frontend Features

#### [NEW] Login page (`/login`)
- Centered card, username/password inputs, sign-in button with eye toggle
- Matches Pencil design `9ww35`

#### [NEW] Dashboard (`/dashboard`)
- Sidebar with nav items + project list
- Header bar with breadcrumbs + user menu
- Project data table (name, status, owner, last updated, actions)
- "New Project" button → create dialog
- Matches Pencil design `7zXbN`

#### [NEW] Project View (`/projects/:id`)
- Layout with sidebar + header + SDLC tabs
- Planning & Analysis active, others show "Coming Soon" with lock icon
- Progress indicator
- 5 requirement section cards with textareas + Save buttons
- Matches Pencil design `urMst`

#### [NEW] Shared components
- `sidebar.component.ts` — collapsible sidebar with nav
- `header.component.ts` — breadcrumbs + user menu
- `create-project-dialog.component.ts`

---

### 6. Project Configuration

#### [MODIFY] [.gitignore](file:///Users/chadramsey/projects/sdlc-assist/.gitignore)
- Add Java build artifacts, Node modules, IDE files, env files

#### [NEW] [.env.example](file:///Users/chadramsey/projects/sdlc-assist/.env.example)
- `SUPABASE_URL`, `SUPABASE_PASSWORD`, `SPRING_PROFILES_ACTIVE`

---

## Implementation Order

| Step | Scope | Description |
|------|-------|-------------|
| 1 | Backend | Spring Boot scaffolding (pom.xml, config, security) |
| 2 | Backend | DB schema, JPA entities, repositories, DTOs |
| 3 | Backend | Projects REST API (controller + service) |
| 4 | Backend | Sections REST API + Auth controller |
| 5 | Frontend | Angular scaffolding (ng new, Material, theme, proxy) |
| 6 | Frontend | Login page + auth service |
| 7 | Frontend | Dashboard + sidebar + header + project table |
| 8 | Frontend | Project view + SDLC tabs + requirement sections |

## Verification Plan

### Automated
- `cd backend && ./mvnw clean package` — compiles without errors
- `cd frontend && ng build` — compiles without errors

### Manual
- Backend starts on port 8080
- Frontend starts on port 4200
- Login → Dashboard → Create Project → Project View flow works end-to-end
- Requirement sections save and persist across page refreshes
