# SDLC Assist

An AI-assisted Software Development Lifecycle web application. Users create projects and work through structured SDLC phases, starting with Planning & Analysis where AI generates a Product Requirements Document (PRD) from uploaded documents.

## Features

- **Project management** — Create and manage SDLC projects with status tracking
- **AI PRD generation** — Upload planning docs and generate a structured PRD via Claude (streaming) or Gemini (batch)
- **PRD editing** — Review, edit inline, save, download as Markdown, or print to PDF
- **Admin user management** — Create users, reset passwords, assign roles (ADMIN, PRODUCT_MANAGER, VIEWER)
- **Dark mode** — Full light/dark theme support

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Spring Boot 3.4, Java 21, Spring Security, Spring Data JPA |
| Frontend | Angular 21 (standalone, zoneless), Angular Material, SCSS |
| Database | PostgreSQL (Supabase-hosted) |
| AI — Claude | Anthropic API with SSE streaming |
| AI — Gemini | Google Vertex AI Agent Engine (ADK Reasoning Engine) |
| Deployment | Railway (two services), nginx reverse proxy |

## Running Locally

### Prerequisites
- Java 21+
- Node.js 20+
- Access to the Supabase database (credentials in `application-local.yml`)
- Anthropic API key
- Google Cloud service account JSON (for Gemini)

### Backend
```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
# Runs on http://localhost:8080
```

Create `backend/src/main/resources/application-local.yml` (gitignored):
```yaml
spring:
  datasource:
    url: jdbc:postgresql://aws-0-us-west-2.pooler.supabase.com:5432/postgres
    username: postgres.mtzcookrjzewywyirhja
    password: "YOUR_PASSWORD"
app:
  anthropic:
    api-key: "YOUR_ANTHROPIC_KEY"
# For Gemini (optional — use GOOGLE_APPLICATION_CREDENTIALS env var instead):
# GOOGLE_APPLICATION_CREDENTIALS: /path/to/service-account.json
```

### Frontend
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:4200, proxies /api to backend
```

## Architecture

```
frontend/          Angular 21 app (nginx in production)
  src/app/
    core/          Services, models, guards
    features/      login, dashboard, project, admin
backend/           Spring Boot REST API
  com.sdlcassist/
    controller/    AuthController, ProjectController, FileController, SectionController
    service/       AiService (Claude SSE), VertexAIService (Gemini), FileService, ProjectService
    model/         User, Project, RequirementSection, ProjectFile
supabase/          SQL migrations
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET/POST | `/api/projects` | List / create projects |
| PUT | `/api/projects/{id}/prd` | Save PRD content |
| POST | `/api/projects/{id}/files` | Upload documents |
| GET | `/api/projects/{id}/analyze/stream` | Claude SSE stream |
| POST | `/api/projects/{id}/analyze/gemini` | Gemini batch analysis |
| GET/POST/DELETE | `/api/admin/users` | User management (ADMIN only) |

## AI Integration

### Claude (Anthropic)
- Streams PRD via SSE — frontend shows tokens as they arrive
- `SseEmitter` with 5-min timeout, `onTimeout`/`onError` handlers ensure spinner always stops
- Prompt: `backend/src/main/resources/prompts/planning-analysis-v2-prod.txt`
- Env var: `ANTHROPIC_API_KEY`

### Gemini (Vertex AI Agent Engine)
- Batch response — progress bar simulates processing
- Two-step API: `POST :query` (create session) → `POST :streamQuery` (send message, collect response)
- Agent resource ID: `2165724545904803840` (GCP project: `sdlc-assist`, region: `us-central1`)
- Auth: `GOOGLE_SERVICE_ACCOUNT_JSON` env var in production; `GOOGLE_APPLICATION_CREDENTIALS` file path locally
- Env vars: `GOOGLE_SERVICE_ACCOUNT_JSON`, `VERTEXAI_PROJECT_ID`, `VERTEXAI_LOCATION`, `VERTEXAI_AGENT_RESOURCE_ID`

## Deployment (Railway)

Two Railway services deployed from the `main` branch:

- **Backend**: root dir `backend/`, private hostname `sdlc-assist.railway.internal:8080`
- **Frontend**: root dir `frontend/`, nginx proxies `/api/*` to backend

### Required Railway Environment Variables

**Backend service:**
```
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD
ALLOWED_ORIGINS          # Frontend Railway domain
ANTHROPIC_API_KEY
GOOGLE_SERVICE_ACCOUNT_JSON   # Full JSON content of service account key
VERTEXAI_PROJECT_ID      # sdlc-assist
VERTEXAI_LOCATION        # us-central1
VERTEXAI_AGENT_RESOURCE_ID    # 2165724545904803840
```

**Frontend service:**
```
API_URL=http://sdlc-assist.railway.internal:8080   # NO /api suffix
```
