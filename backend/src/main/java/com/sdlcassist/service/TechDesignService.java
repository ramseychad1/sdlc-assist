package com.sdlcassist.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Phase 3.1 — Mock SSE implementation for all 4 technical design artifact steps.
 * Each generate*() method fires a sequence of progress events with Thread.sleep() delays,
 * then emits COMPLETE with static placeholder content and persists to the DB.
 *
 * Phase 3.1.x will replace each method body with a real Vertex AI agent call.
 * The SseEmitter contract (event name "progress", same JSON shape) never changes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TechDesignService {

    private final ProjectService projectService;
    private final ObjectMapper objectMapper;

    // -------------------------------------------------------------------------
    // Step 2 — Architecture Overview
    // -------------------------------------------------------------------------

    public void generateArchitecture(UUID projectId, SseEmitter emitter) {
        List<ProgressEvent> events = List.of(
            new ProgressEvent("INITIALIZING",           5,  "Connecting to architecture agent..."),
            new ProgressEvent("READING_INPUTS",         15, "Reading PRD and tech preferences..."),
            new ProgressEvent("ANALYZING_DOMAIN",       30, "Analyzing domain and system boundaries..."),
            new ProgressEvent("DEFINING_LAYERS",        50, "Defining application layers and responsibilities..."),
            new ProgressEvent("IDENTIFYING_INTEGRATIONS", 65, "Identifying external integrations and dependencies..."),
            new ProgressEvent("GENERATING_OVERVIEW",    80, "Generating architecture overview document..."),
            new ProgressEvent("FINALIZING",             95, "Finalizing and validating output...")
        );
        runMockFlow(projectId, "architecture", events, ARCH_OVERVIEW_CONTENT, "Architecture overview generated.", emitter);
    }

    // -------------------------------------------------------------------------
    // Step 3 — Data Model
    // -------------------------------------------------------------------------

    public void generateDataModel(UUID projectId, SseEmitter emitter) {
        List<ProgressEvent> events = List.of(
            new ProgressEvent("INITIALIZING",        5,  "Connecting to data model agent..."),
            new ProgressEvent("READING_ARCHITECTURE",15, "Reading architecture overview..."),
            new ProgressEvent("IDENTIFYING_ENTITIES",30, "Identifying core domain entities..."),
            new ProgressEvent("MAPPING_RELATIONSHIPS",50, "Mapping entity relationships..."),
            new ProgressEvent("DEFINING_SCHEMA",     65, "Defining table schemas and constraints..."),
            new ProgressEvent("ADDING_INDEXES",      80, "Identifying indexes and performance considerations..."),
            new ProgressEvent("FINALIZING",          95, "Finalizing data model...")
        );
        runMockFlow(projectId, "data-model", events, DATA_MODEL_CONTENT, "Data model generated.", emitter);
    }

    // -------------------------------------------------------------------------
    // Step 4 — API Contract
    // -------------------------------------------------------------------------

    public void generateApiContract(UUID projectId, SseEmitter emitter) {
        List<ProgressEvent> events = List.of(
            new ProgressEvent("INITIALIZING",          5,  "Connecting to API contract agent..."),
            new ProgressEvent("READING_DATA_MODEL",    15, "Reading data model and architecture..."),
            new ProgressEvent("IDENTIFYING_ENDPOINTS", 30, "Identifying required API endpoints from screens..."),
            new ProgressEvent("DEFINING_REQUESTS",     50, "Defining request and response schemas..."),
            new ProgressEvent("APPLYING_AUTH",         65, "Applying authentication and authorization rules..."),
            new ProgressEvent("DOCUMENTING",           80, "Generating endpoint documentation..."),
            new ProgressEvent("FINALIZING",            95, "Finalizing API contract...")
        );
        runMockFlow(projectId, "api-contract", events, API_CONTRACT_CONTENT, "API contract generated.", emitter);
    }

    // -------------------------------------------------------------------------
    // Step 5 — Sequence Diagrams
    // -------------------------------------------------------------------------

    public void generateSequenceDiagrams(UUID projectId, SseEmitter emitter) {
        List<ProgressEvent> events = List.of(
            new ProgressEvent("INITIALIZING",           5,  "Connecting to sequence diagram agent..."),
            new ProgressEvent("READING_API",            15, "Reading API contract and data model..."),
            new ProgressEvent("IDENTIFYING_FLOWS",      30, "Identifying key user flows to diagram..."),
            new ProgressEvent("GENERATING_AUTH_FLOW",   50, "Generating authentication flow diagram..."),
            new ProgressEvent("GENERATING_CORE_FLOWS",  65, "Generating core feature flow diagrams..."),
            new ProgressEvent("GENERATING_ERROR_FLOWS", 80, "Generating error handling flows..."),
            new ProgressEvent("FINALIZING",             95, "Finalizing sequence diagrams...")
        );
        runMockFlow(projectId, "sequence-diagrams", events, SEQUENCE_DIAGRAMS_CONTENT, "Sequence diagrams generated.", emitter);
    }

    // -------------------------------------------------------------------------
    // Core mock flow runner — identical to real agent pattern
    // -------------------------------------------------------------------------

    private void runMockFlow(UUID projectId, String artifactType,
                             List<ProgressEvent> events, String staticContent,
                             String completeMessage, SseEmitter emitter) {
        try {
            for (ProgressEvent event : events) {
                sendProgress(emitter, event.key(), event.progress(), event.message());
                Thread.sleep(1200);
            }
            // Persist content to DB before emitting COMPLETE
            projectService.saveArtifact(projectId, artifactType, staticContent);

            String completePayload = objectMapper.writeValueAsString(Map.of(
                "event",    "COMPLETE",
                "progress", 100,
                "message",  completeMessage,
                "content",  staticContent
            ));
            emitter.send(SseEmitter.event().name("progress").data(completePayload));
            emitter.complete();

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            try { sendError(emitter, "Generation interrupted"); } catch (Exception ignored) {}
        } catch (Exception e) {
            log.error("Tech design generation failed for project {} artifact {}", projectId, artifactType, e);
            try { sendError(emitter, "Generation failed: " + e.getMessage()); } catch (Exception ignored) {}
        } finally {
            try { emitter.complete(); } catch (Exception ignored) {}
        }
    }

    // -------------------------------------------------------------------------
    // SSE helpers
    // -------------------------------------------------------------------------

    private void sendProgress(SseEmitter emitter, String event, int progress, String message) throws Exception {
        String payload = objectMapper.writeValueAsString(Map.of(
            "event",    event,
            "progress", progress,
            "message",  message
        ));
        emitter.send(SseEmitter.event().name("progress").data(payload));
    }

    private void sendError(SseEmitter emitter, String message) throws Exception {
        String payload = objectMapper.writeValueAsString(Map.of(
            "event",   "ERROR",
            "message", message
        ));
        emitter.send(SseEmitter.event().name("progress").data(payload));
        emitter.complete();
    }

    // -------------------------------------------------------------------------
    // Internal record
    // -------------------------------------------------------------------------

    private record ProgressEvent(String key, int progress, String message) {}

    // -------------------------------------------------------------------------
    // Static placeholder content
    // -------------------------------------------------------------------------

    private static final String ARCH_OVERVIEW_CONTENT = """
# Architecture Overview
**Project:** Pharmacy Benefit Verification Portal
**Stack:** Java / Spring Boot · Angular · PostgreSQL · AWS · JWT · REST

---

## System Context

The Pharmacy Benefit Verification Portal is a multi-tier web application enabling pharmacy staff to verify patient benefit eligibility against Pharmacy Benefit Manager (PBM) integrations in real time.

## Application Layers

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | Angular 21 | SPA — user interface, form handling, state management |
| API Gateway | Spring Boot 3.4 | REST API, authentication, request routing |
| Business Logic | Spring Services | Verification workflows, PBM integration orchestration |
| Data Access | Spring Data JPA | ORM, query execution, transaction management |
| Database | PostgreSQL 16 | Persistent storage — patients, verifications, audit logs |
| Cache | Redis | Session cache, PBM response cache (TTL: 15 min) |

## Key Integrations

- **PBM APIs** — External benefit verification via REST (3 providers: Caremark, Express Scripts, OptumRx)
- **AWS S3** — Document storage for uploaded benefit documents
- **SMTP / SES** — Transactional email notifications

## Security Architecture

- JWT-based stateless authentication (RS256 signed)
- Role-based access control: `STAFF`, `ADMIN`, `VIEWER`
- All PII encrypted at rest (AES-256), in transit (TLS 1.3)
- Audit logging on all verification state changes

## Deployment Architecture

```
[User Browser]
      ↓ HTTPS
[CloudFront CDN] → [S3 — Angular SPA]
      ↓ HTTPS
[ALB Load Balancer]
      ↓
[ECS Fargate — Spring Boot API] × 2 instances
      ↓                    ↓
[RDS PostgreSQL]     [ElastiCache Redis]
      ↓
[PBM APIs (external)]
```

## Architecture Decisions

- **Stateless API** — enables horizontal scaling without session affinity
- **Separate read replicas** — high-frequency verification queries routed to read replica
- **PBM response caching** — reduces external API calls and improves response time
""";

    private static final String DATA_MODEL_CONTENT = """
# Data Model
**Database:** PostgreSQL 16
**Generated from:** Architecture Overview · PRD

---

## Entities

### `users`
System users — pharmacy staff, administrators, and viewers.

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  full_name     VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL CHECK (role IN ('STAFF', 'ADMIN', 'VIEWER')),
  password_hash VARCHAR(255) NOT NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  last_login_at TIMESTAMP,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMP    -- soft delete
);

CREATE INDEX idx_users_email ON users(email);
```

---

### `patients`
⚠ **Contains PII** — email, date of birth, member ID are sensitive fields.

```sql
CREATE TABLE patients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  date_of_birth DATE         NOT NULL,       -- PII
  member_id     VARCHAR(50)  NOT NULL,       -- PII
  pbm_provider  VARCHAR(50)  NOT NULL,
  created_by    UUID         NOT NULL REFERENCES users(id),
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMP
);

CREATE INDEX idx_patients_member_id ON patients(member_id);
CREATE INDEX idx_patients_created_by ON patients(created_by);
```

---

### `verifications`
A single benefit verification request and its lifecycle.

```sql
CREATE TABLE verifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id      UUID         NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  initiated_by    UUID         NOT NULL REFERENCES users(id),
  pbm_provider    VARCHAR(50)  NOT NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING'
                    CHECK (status IN ('PENDING','IN_PROGRESS','APPROVED','DENIED','ERROR')),
  pbm_request_id  VARCHAR(100),
  pbm_response    JSONB,
  denial_reason   TEXT,
  completed_at    TIMESTAMP,
  created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verifications_patient_id ON verifications(patient_id);
CREATE INDEX idx_verifications_status     ON verifications(status);
CREATE INDEX idx_verifications_initiated  ON verifications(initiated_by);
```

---

### `audit_logs`
Immutable audit trail — no updates or deletes permitted on this table.

```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50)  NOT NULL,
  entity_id   UUID         NOT NULL,
  action      VARCHAR(50)  NOT NULL,
  changed_by  UUID         REFERENCES users(id),
  old_value   JSONB,
  new_value   JSONB,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
```

## Entity Relationship Summary

```
users ──< verifications >── patients
users ──< audit_logs
verifications ──< audit_logs
patients ──< audit_logs
```
""";

    private static final String API_CONTRACT_CONTENT = """
# API Contract
**Style:** REST · **Auth:** JWT (Bearer token) · **Base path:** `/api/v1`
**Generated from:** Architecture Overview · Data Model

---

## Authentication

### `POST /api/v1/auth/login`
Authenticate a user and return a signed JWT.

**Auth required:** No

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "token": "eyJ...",
  "expiresAt": "2026-02-22T00:00:00Z",
  "user": {
    "id": "uuid",
    "email": "string",
    "fullName": "string",
    "role": "STAFF | ADMIN | VIEWER"
  }
}
```

**Response 401:** `{ "error": "INVALID_CREDENTIALS", "message": "..." }`

---

## Patients

### `GET /api/v1/patients`
List all patients. Paginated.

**Auth required:** Yes — roles: `STAFF`, `ADMIN`

**Query params:** `page` (default 1), `pageSize` (default 25), `search` (name or member ID)

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "firstName": "string",
      "lastName": "string",
      "memberId": "string",
      "pbmProvider": "string",
      "createdAt": "ISO8601"
    }
  ],
  "total": 142,
  "page": 1,
  "pageSize": 25
}
```

---

### `POST /api/v1/patients`
Create a new patient record.

**Auth required:** Yes — roles: `STAFF`, `ADMIN`

**Request:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "memberId": "string",
  "pbmProvider": "CAREMARK | EXPRESS_SCRIPTS | OPTUMRX"
}
```

**Response 201:** Patient object
**Response 409:** `{ "error": "DUPLICATE_MEMBER_ID", "message": "..." }`

---

## Verifications

### `POST /api/v1/verifications`
Initiate a new benefit verification request.

**Auth required:** Yes — roles: `STAFF`, `ADMIN`

**Request:**
```json
{
  "patientId": "uuid"
}
```

**Response 202:**
```json
{
  "id": "uuid",
  "status": "PENDING",
  "patientId": "uuid",
  "createdAt": "ISO8601"
}
```

---

### `GET /api/v1/verifications/{id}`
Get a single verification with full PBM response detail.

**Auth required:** Yes — all roles

**Response 200:**
```json
{
  "id": "uuid",
  "status": "APPROVED | DENIED | PENDING | IN_PROGRESS | ERROR",
  "patient": { "id": "uuid", "firstName": "string", "lastName": "string" },
  "pbmProvider": "string",
  "pbmRequestId": "string",
  "denialReason": "string | null",
  "completedAt": "ISO8601 | null",
  "createdAt": "ISO8601"
}
```

---

### `GET /api/v1/verifications`
List verifications. Paginated and filterable.

**Auth required:** Yes — all roles

**Query params:** `status`, `patientId`, `fromDate`, `toDate`, `page`, `pageSize`

**Response 200:** Paginated list — same envelope as patients list.
""";

    private static final String SEQUENCE_DIAGRAMS_CONTENT = """
# Sequence Diagrams
**Generated from:** API Contract · Data Model · Architecture Overview

---

## 1. User Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant FE as Angular SPA
    participant API as Spring Boot API
    participant DB as PostgreSQL

    User->>FE: Enter email + password
    FE->>API: POST /api/v1/auth/login
    API->>DB: SELECT user WHERE email = ?
    DB-->>API: User record
    API->>API: Verify password hash (BCrypt)
    alt Valid credentials
        API->>API: Sign JWT (RS256)
        API-->>FE: 200 { token, user }
        FE->>FE: Store token in memory
        FE-->>User: Redirect to Dashboard
    else Invalid credentials
        API-->>FE: 401 INVALID_CREDENTIALS
        FE-->>User: Show error message
    end
```

---

## 2. Benefit Verification Flow

```mermaid
sequenceDiagram
    actor Staff
    participant FE as Angular SPA
    participant API as Spring Boot API
    participant DB as PostgreSQL
    participant Cache as Redis Cache
    participant PBM as PBM API (External)

    Staff->>FE: Click "Verify Benefits" for patient
    FE->>API: POST /api/v1/verifications { patientId }
    API->>DB: INSERT verification (status=PENDING)
    API-->>FE: 202 Accepted { verificationId }
    FE-->>Staff: Show "Verification in Progress"

    API->>Cache: Check cached PBM response for member
    alt Cache hit
        Cache-->>API: Cached response
    else Cache miss
        API->>PBM: POST benefit eligibility check
        PBM-->>API: Eligibility response
        API->>Cache: Store response (TTL 15 min)
    end

    API->>API: Parse PBM response
    API->>DB: UPDATE verification status = APPROVED | DENIED
    API->>DB: INSERT audit_log entry

    FE->>API: GET /api/v1/verifications/{id}
    API-->>FE: Verification with status
    FE-->>Staff: Display result with status badge
```

---

## 3. Error Handling — PBM Timeout

```mermaid
sequenceDiagram
    participant API as Spring Boot API
    participant PBM as PBM API (External)
    participant DB as PostgreSQL

    API->>PBM: POST benefit eligibility check
    Note over PBM: Timeout after 10s

    PBM--xAPI: Connection timeout
    API->>API: Retry (max 3 attempts, exponential backoff)
    PBM--xAPI: Timeout again (attempts 2, 3)

    API->>DB: UPDATE verification status = ERROR
    API->>DB: INSERT audit_log (action=PBM_TIMEOUT)
    API-->>FE: 202 with status=ERROR
    FE-->>User: Show "Verification failed — please retry"
```
""";
}
