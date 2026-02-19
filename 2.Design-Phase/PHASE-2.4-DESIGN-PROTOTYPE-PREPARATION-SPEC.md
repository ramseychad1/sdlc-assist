# Phase 2.3 — Design Prototype Preparation
## SDLC Assist — UX & Architecture Specification

**Document Type:** UX & Architecture Specification  
**Target Component:** `prototype-generation.component.ts` (replaces Coming Soon placeholder)  
**Depends On:** Phase 2.2 — Design System Generation (design_system_content stored in DB)  
**Date:** February 2026  
**Status:** Ready for Implementation

---

## Overview

Phase 2.3 introduces a dedicated **screen extraction agent** whose sole job is to read the project PRD and return a structured list of UI screens that need prototypes. The user reviews this list as a card grid, then confirms it to persist the screens to the database. Each screen card will eventually have a "Generate Prototype" button — in this phase that button is disabled with a Coming Soon badge.

This phase does NOT build prototypes. It prepares the inventory of screens that Phase 2.4 will build one at a time.

---

## Two-Agent Architecture (Full Picture)

```
Phase 2.3 — This spec
  └─ screen_extraction_agent
       Input:  PRD content
       Output: JSON array of screen objects
       Job:    Identify every distinct UI screen implied by the PRD

Phase 2.4 — Future spec
  └─ prototype_builder_agent
       Input:  Single screen object + design system content + PRD content
       Output: HTML/CSS prototype for that specific screen
       Job:    Build one screen at a time, on demand
```

Keeping these as two separate agents is intentional. The extraction agent is fast and analytical — it reads and identifies. The builder agent is slow and creative — it designs and generates. Mixing them would make both worse.

---

## User Flow

```
Design System Generation (Step 2 — complete)
  └─ Action bar: "Generate Prototypes →" clicked
       │
       ▼
Prototype Preparation Page [STATE 1: Ready to Extract]
  └─ User sees: context cards (PRD + Design System)
  └─ User clicks "Identify Screens"
       │
       ▼
Prototype Preparation Page [STATE 2: Extracting]
  └─ SSE progress events while agent runs
       │
       ▼
Prototype Preparation Page [STATE 3: Review Screens]
  └─ Card grid of extracted screens (unsaved)
  └─ User can remove individual screens
  └─ User clicks "Confirm Screen List"
       │
       ▼
Prototype Preparation Page [STATE 4: Confirmed]
  └─ Screens saved to DB
  └─ Card grid re-renders in confirmed state
  └─ Each card shows "Generate Prototype" button (disabled, Coming Soon badge)
  └─ UX stepper Step 3 shows as complete
```

---

## State 1: Ready to Extract

Renders immediately when the user lands on the page. No agent call fires yet.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  [UX Design Stepper — Step 3 active]                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Prototype Preparation                                  │
│  AI will analyze your PRD to identify all UI screens    │
│  that need prototypes.                                  │
│                                                         │
│  ┌─── READY TO ANALYZE ───────────────────────────────┐ │
│  │                                                     │ │
│  │  The following inputs will be analyzed              │ │
│  │                                                     │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  │ │
│  │  │  📄 PRD              │  │  🎨 Design System    │  │ │
│  │  │                     │  │                     │  │ │
│  │  │  Pharmacy Benefit   │  │  Cardinal Brand     │  │ │
│  │  │  Verification       │  │  Healthcare         │  │ │
│  │  │  Portal             │  │  Enterprise         │  │ │
│  │  │                     │  │                     │  │ │
│  │  │  PRD generated      │  │  Design system      │  │ │
│  │  │  Feb 17, 2026       │  │  generated          │  │ │
│  │  │                     │  │  Feb 19, 2026       │  │ │
│  │  └─────────────────────┘  └─────────────────────┘  │ │
│  │                                                     │ │
│  │              [✦ Identify Screens]                   │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Component Details

Mirrors the Review & Confirm state from Phase 2.2 exactly — same two-column input card pattern, same card styling, same button style. This is intentional visual consistency across the UX Design phase.

**PRD Card (left)** — same as Phase 2.2: project name, "PRD generated" + date.

**Design System Card (right)** — replaces the template thumbnail card:
- Icon: `palette` lucide icon, 16px, `var(--primary)`
- Label: "Design System" — 11px uppercase muted
- Template name (e.g., "Cardinal Brand") — 15px, 600 weight
- Tag badge — "Healthcare Enterprise" — same `.tag-badge` style
- Sub-label: "Design system generated" + formatted date from `project.designSystemUpdatedAt` — 12px muted
- Background: `var(--muted)`, border `var(--border)`, radius `var(--radius)`, padding 16px

**"Identify Screens" button**
- Full width, centered, max-width 320px
- Style: `btn btn-primary btn-lg`
- Icon: `scan-search` lucide, 18px
- Label: "Identify Screens"

### Data Requirements on Init

```typescript
// Load on component init
project          // ProjectService.getById(projectId)
                 //   → gives PRD name, PRD date, design system date, selectedTemplateId
template         // TemplateService.getById(project.selectedTemplateId)
                 //   → gives template name and tag for Design System card
screens          // ProjectService.getScreens(projectId)
                 //   → if screens already exist in DB, skip straight to STATE 4
```

**Important:** If screens are already saved in the DB for this project, the component skips States 1–3 entirely and renders directly in State 4 (confirmed). This prevents re-running the agent on every page visit.

---

## State 2: Extracting

Triggered when user clicks "Identify Screens." Context cards remain visible at reduced opacity (0.5). Progress card replaces the button area.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Context cards — PRD + Design System — opacity 0.5]    │
│                                                         │
│  ┌─── ANALYZING PRD ───────────────────────────────────┐ │
│  │                                                     │ │
│  │   🔍 (scanning animation)  Identifying screens...   │ │
│  │                                                     │ │
│  │   ████████████░░░░░░░░░░░░░░  40%                  │ │
│  │                                                     │ │
│  │   Extracting user flows from Epic 2...              │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### SSE Progress Events

| Event Key | Display Message | Progress % |
|---|---|---|
| `INITIALIZING` | Connecting to screen extraction agent... | 5% |
| `READING_PRD` | Reading PRD structure and epics... | 15% |
| `ANALYZING_EPICS` | Analyzing epics and user stories... | 30% |
| `EXTRACTING_FLOWS` | Extracting user flows and navigation paths... | 50% |
| `IDENTIFYING_SCREENS` | Identifying distinct UI screens... | 65% |
| `CLASSIFYING_SCREENS` | Classifying screen types and complexity... | 80% |
| `FINALIZING` | Finalizing screen inventory... | 92% |
| `COMPLETE` | Screen identification complete. | 100% |

---

## State 3: Review Screens (Unsaved)

When the agent returns the screen list, the progress card fades out and the card grid renders. The context cards (PRD + Design System) collapse into a compact summary bar above the grid to free up vertical space.

The screens are **not yet saved to the database** in this state. A prominent confirmation bar is shown.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  [UX Design Stepper — Step 3 active]                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─── COMPACT CONTEXT BAR ────────────────────────────┐ │
│  │  📄 Pharmacy Benefit Verification Portal            │ │
│  │  🎨 Cardinal Brand  •  Design system generated      │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─── CONFIRMATION BANNER ────────────────────────────┐ │
│  │  ✦ Claude identified 12 screens from your PRD.     │ │
│  │  Review the list below and remove any screens you  │ │
│  │  don't need. Click Confirm to save.                │ │
│  │                              [Confirm Screen List] │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │ │
│  │  Screen  │  │  Screen  │  │  Screen  │             │ │
│  │  Card    │  │  Card    │  │  Card    │             │ │
│  └──────────┘  └──────────┘  └──────────┘             │ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │ │
│  │  Screen  │  │  Screen  │  │  Screen  │             │ │
│  │  Card    │  │  Card    │  │  Card    │             │ │
│  └──────────┘  └──────────┘  └──────────┘             │ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Compact Context Bar

A single horizontal row replacing the two large input cards. Thin, low-visual-weight — just enough to remind the user what was analyzed.

- Background: `var(--muted)`, border `var(--border)`, radius `var(--radius)`, padding 12px 16px
- Single line: PRD icon + project name + separator `•` + palette icon + template name + separator `•` + "Design system generated [date]"
- Font: 13px, `var(--muted-foreground)`

### Confirmation Banner

- Background: `color-mix(in srgb, var(--primary) 6%, var(--background))` — same as `.ai-save-bar` in planning-analysis
- Border: 1px solid `color-mix(in srgb, var(--primary) 20%, transparent)`
- Left: `sparkles` icon + count message + instruction text
- Right: "Confirm Screen List" primary button
- Padding: 16px 20px

### Screen Card — Review State

Grid: 3 columns, gap 20px. Responsive: 2 columns below 1024px, 1 column below 640px.

```
┌─────────────────────────────────────────┐
│  [X remove button — top right corner]   │
│                                         │
│  🖥  Dashboard                           │  ← screen type icon + screen name
│                                         │
│  SCREEN TYPE                            │  ← 11px uppercase label
│  Main Dashboard                         │  ← type value
│                                         │
│  Central hub showing patient benefit    │  ← description, 2-line clamp
│  verification status, recent activity,  │
│  and quick actions for staff users.     │
│                                         │
│  EPIC                                   │  ← 11px uppercase label
│  Epic 1: Staff Interface                │  ← which epic it belongs to
│                                         │
│  [Generate Prototype]  ← disabled, Coming Soon badge
└─────────────────────────────────────────┘
```

**Card anatomy:**

- Background: `var(--card)`, border `1px solid var(--border)`, radius `var(--radius)`, padding 16px
- Hover: border-color `var(--muted-foreground)` — same as template gallery cards

**Remove button (X) — review state only, hidden in confirmed state:**
- Position: absolute, top 10px, right 10px
- Style: `btn-icon` ghost — matches existing file delete button style
- Icon: `x` lucide, 14px
- On click: remove screen from local signal array (does not persist yet)
- Show a brief strikethrough animation before removing from DOM

**Screen type icon** — lucide icon chosen based on `screenType` value:

| screenType | Icon |
|---|---|
| `dashboard` | `layout-dashboard` |
| `list` | `list` |
| `detail` | `file-text` |
| `form` | `square-pen` |
| `modal` | `panels-top-left` |
| `settings` | `settings` |
| `auth` | `lock` |
| `report` | `bar-chart-2` |
| `wizard` | `git-branch` |
| `empty` | `inbox` |
| default | `monitor` |

**"Generate Prototype" button — disabled state:**
- Style: `btn btn-primary btn-sm`, `disabled` attribute set
- Opacity: 0.5, cursor: not-allowed
- Position: relative, so the Coming Soon badge can be absolutely positioned on top
- Coming Soon badge: `position: absolute; top: -8px; right: -8px;` — same style as existing `.coming-soon-badge` in template-gallery.component.ts (`var(--muted)` background, `var(--muted-foreground)` text, 10px font, uppercase)

---

## State 4: Confirmed

Triggered when user clicks "Confirm Screen List." Screens are saved to the database. The confirmation banner is replaced by a success bar. The remove (X) buttons disappear from cards. The UX stepper Step 3 dot gets a checkmark.

### Confirmation Flow

```typescript
onConfirm(): void {
  this.saving.set(true);
  const screens = this.screens();  // current local signal array

  this.projectService.saveScreens(this.projectId, screens).subscribe({
    next: (savedScreens) => {
      this.screens.set(savedScreens);
      this.pageState.set('confirmed');
      this.saving.set(false);
    },
    error: () => {
      this.saving.set(false);
      this.snackBar.open('Failed to save screens. Please try again.', 'Close', { duration: 3000 });
    }
  });
}
```

### Layout Changes in Confirmed State

**Success bar** (replaces confirmation banner):
- Background: `color-mix(in srgb, var(--primary) 6%, var(--background))`
- Icon: `check-circle` lucide, `var(--primary)` color
- Text: "12 screens confirmed. Click Generate Prototype on any screen to begin designing."
- No button — this is informational only

**Card changes in confirmed state:**
- Remove (X) button hidden
- Card border remains normal (no selected/highlighted state)
- "Generate Prototype" button remains disabled with Coming Soon badge
- Cards are otherwise identical to review state

---

## Agent: `screen_extraction_agent`

### Agent Input (sent by Spring Boot)

```
PRD Content: [full text of project.prdContent]

Instructions:
Analyze the PRD above and identify every distinct UI screen that needs to be designed.
For each screen, return a JSON array with this exact structure.
```

### Expected Agent Output (JSON)

The agent must return a valid JSON array. Spring Boot parses this before sending to the frontend.

```json
[
  {
    "id": "screen-001",
    "name": "Patient Benefit Dashboard",
    "description": "Central hub for staff to view patient benefit verification status, recent PBM transactions, and pending verifications requiring action.",
    "screenType": "dashboard",
    "epicName": "Epic 1: Staff Verification Interface",
    "complexity": "high",
    "userRole": "Staff Pharmacist",
    "notes": "Primary landing screen after login. Must surface critical alerts prominently."
  },
  {
    "id": "screen-002",
    "name": "Benefit Verification Form",
    "description": "Multi-step form for initiating a new benefit verification request against PBM integrations.",
    "screenType": "form",
    "epicName": "Epic 1: Staff Verification Interface",
    "complexity": "high",
    "userRole": "Staff Pharmacist",
    "notes": "Requires real-time PBM validation feedback during input."
  }
]
```

### Field Definitions

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | Yes | Agent-generated, e.g., "screen-001". Used as temp key before DB save assigns real ID. |
| `name` | string | Yes | Short display name shown in card header |
| `description` | string | Yes | 1-3 sentence description shown in card body, 2-line clamp |
| `screenType` | string | Yes | One of: dashboard, list, detail, form, modal, settings, auth, report, wizard, empty |
| `epicName` | string | Yes | Which Epic from the PRD this screen belongs to |
| `complexity` | string | Yes | low / medium / high — not displayed in Phase 2.3 but stored for Phase 2.4 |
| `userRole` | string | No | Primary user role for this screen |
| `notes` | string | No | Agent notes for Phase 2.4 prototype builder — not displayed to user |

### Agent System Prompt (in `screen_extraction_agent/agent.py`)

```python
instruction="""
You are a UX analyst specializing in extracting UI screen inventories from Product Requirements Documents.

When given a PRD, your job is to identify every distinct UI screen that needs to be designed and built.

Rules:
- Return ONLY a valid JSON array. No preamble, no markdown, no explanation.
- Each screen must be a genuinely distinct UI view — not a minor variation of another screen.
- Group screens by Epic when the PRD has epics defined.
- Assign screenType from this list only: dashboard, list, detail, form, modal, settings, auth, report, wizard, empty
- Complexity: high = 5+ distinct data elements or interactions; medium = 2-4; low = 1 simple purpose
- Include admin/settings screens if implied by the PRD even if not explicitly named
- Include auth screens (login, forgot password) if the PRD implies authentication
- Do not invent screens not implied by the PRD
- Description must be 1-3 sentences, specific to this project's domain
- Aim for completeness: a missing screen now means a gap in Phase 2.4

Return only the JSON array with no other text.
"""
```

---

## Angular Component Architecture

### Files to Create / Modify

| File | Action | Notes |
|---|---|---|
| `prototype-generation.component.ts` | **Replace** | Full implementation replacing Coming Soon |
| `screen-card/screen-card.component.ts` | **Create** | Extracted screen card sub-component |
| `ux-design.routes.ts` | **Verify** | Prototype route already exists, no change needed |

### Signals (State Machine)

```typescript
// Page state
pageState = signal<'review-inputs' | 'extracting' | 'review-screens' | 'confirmed'>('review-inputs');

// Data
project = signal<Project | null>(null);
template = signal<TemplateEntry | null>(null);
screens = signal<ScreenDefinition[]>([]);
saving = signal(false);

// Extraction progress
progress = signal(0);
progressMessage = signal('');
```

### `ScreenDefinition` Model

Create `src/app/core/models/screen-definition.model.ts`:

```typescript
export interface ScreenDefinition {
  id: string;               // DB-assigned after save, agent-temp-id before
  projectId: string;
  name: string;
  description: string;
  screenType: ScreenType;
  epicName: string;
  complexity: 'low' | 'medium' | 'high';
  userRole?: string;
  notes?: string;
  prototypeContent?: string;  // null in Phase 2.3, populated in Phase 2.4
  createdAt?: string;
}

export type ScreenType =
  'dashboard' | 'list' | 'detail' | 'form' | 'modal' |
  'settings' | 'auth' | 'report' | 'wizard' | 'empty';
```

### Init Logic

```typescript
ngOnInit(): void {
  this.loadProjectAndTemplate();
}

private loadProjectAndTemplate(): void {
  const projectId = this.route.parent?.parent?.snapshot.paramMap.get('id');

  this.projectService.getById(projectId).subscribe(project => {
    this.project.set(project);

    this.templateService.getById(project.selectedTemplateId).subscribe(template => {
      this.template.set(template);
    });

    // Check if screens already confirmed — skip to confirmed state
    this.projectService.getScreens(projectId).subscribe(screens => {
      if (screens.length > 0) {
        this.screens.set(screens);
        this.pageState.set('confirmed');
      }
      this.loading.set(false);
    });
  });
}
```

### Screen Removal (Review State)

```typescript
removeScreen(screenId: string): void {
  this.screens.set(this.screens().filter(s => s.id !== screenId));
}
```

No API call — purely local signal mutation. Only persisted on Confirm.

---

## Backend Contract (Spring Boot)

### New Endpoint: Extract Screens

```
POST /api/projects/{projectId}/screens/extract
Content-Type: text/event-stream (SSE)
```

**SSE event format** — same pattern as design system generation:
```
data: {"event": "READING_PRD", "progress": 15, "message": "Reading PRD structure and epics..."}
data: {"event": "COMPLETE", "progress": 100, "screens": [...JSON array from agent...]}
```

Spring Boot parses the agent's raw JSON string into a `List<ScreenDefinition>` before emitting the `COMPLETE` event. The frontend receives a clean typed array, not raw agent text.

### New Endpoint: Save Screens

```
POST /api/projects/{projectId}/screens
Content-Type: application/json
Body: ScreenDefinition[]  (the user-confirmed list)

Response: ScreenDefinition[]  (with DB-assigned IDs and timestamps)
```

### New Endpoint: Get Screens

```
GET /api/projects/{projectId}/screens

Response: ScreenDefinition[]
```

Returns empty array `[]` if no screens have been confirmed yet.

### New DB Table

```sql
CREATE TABLE project_screens (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name              VARCHAR(255) NOT NULL,
  description       TEXT,
  screen_type       VARCHAR(50),
  epic_name         VARCHAR(255),
  complexity        VARCHAR(20),
  user_role         VARCHAR(255),
  notes             TEXT,
  prototype_content TEXT,         -- populated in Phase 2.4
  display_order     INTEGER,      -- preserves agent-returned order
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_project_screens_project_id ON project_screens(project_id);
```

---

## Visual Design Notes for CCC

1. **Reuse Phase 2.2 patterns exactly** — the State 1 "Ready to Analyze" layout is intentionally identical to Phase 2.2's "Ready to Generate" state. Same card structure, same button style, same two-column input grid. The only visual differences are the right card (Design System instead of Template thumbnail) and the button label/icon.

2. **Confirmation banner** — use the exact `.ai-save-bar` CSS class pattern from `planning-analysis.component.ts`. Same background, same border, same padding. Only difference is the content inside.

3. **Screen card grid** — follow the template gallery card grid pattern: `display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;` with the same responsive breakpoints.

4. **Remove button** — use the exact `.btn-icon` pattern from the file list in `planning-analysis.component.ts`. Position it absolute top-right of the card. Hide it entirely (not just disable) in confirmed state using `@if (pageState() !== 'confirmed')`.

5. **Coming Soon badge on Generate Prototype button** — copy the `.coming-soon-badge` CSS class verbatim from `template-gallery.component.ts`. It already exists.

6. **Compact context bar** — this is new but simple. Single row, `var(--muted)` background, 13px text, flex layout with gaps and a subtle separator character `•` between items.

7. **Success bar in confirmed state** — matches the success toast style: `border-color: var(--primary)`, primary-tinted background, `check-circle` icon in primary color.

8. **Stepper** — pass `[currentStep]="3"` to `app-ux-design-stepper`. In confirmed state, the stepper should show Step 3 as completed (checkmark). This requires the stepper to accept an optional `completedStep` input or check against the saved state. Check how the existing stepper handles the Step 1 checkmark — use the same mechanism.

---

## Acceptance Criteria

### State 1 — Ready to Extract
- [ ] Page loads with two context cards (PRD + Design System)
- [ ] PRD card shows project name and PRD generation date
- [ ] Design System card shows template name, tag, and design system generation date
- [ ] "Identify Screens" button is enabled only when both project and template are loaded
- [ ] If screens already exist in DB, skip directly to State 4 (no flicker through earlier states)

### State 2 — Extracting
- [ ] Context cards reduce to 0.5 opacity
- [ ] Progress bar increments through SSE events
- [ ] Progress messages update with each event
- [ ] No timeout — waits for COMPLETE event regardless of duration

### State 3 — Review Screens
- [ ] Card grid renders with correct screen count
- [ ] Each card shows: icon (by screenType), name, type label, description (2-line clamp), epic name
- [ ] Remove (X) button removes card from grid without page reload
- [ ] Screen count in confirmation banner updates when screens are removed
- [ ] "Confirm Screen List" button is disabled if all screens have been removed
- [ ] Confirming with 0 screens shows a validation snackbar ("Please keep at least one screen")

### State 4 — Confirmed
- [ ] Screens are saved to `project_screens` table with correct `display_order`
- [ ] Remove (X) buttons are hidden
- [ ] Success bar shows correct count
- [ ] "Generate Prototype" button is disabled on every card
- [ ] Coming Soon badge is visible on every Generate Prototype button
- [ ] UX stepper shows Step 3 as active (Step 1 and 2 checked)
- [ ] Refreshing the page returns to State 4 (screens loaded from DB)

### Agent
- [ ] `screen_extraction_agent` is deployed to Vertex AI Agent Engine
- [ ] Agent returns valid JSON array (no markdown wrapping)
- [ ] Spring Boot parses agent response and maps to `ScreenDefinition[]` before SSE COMPLETE event
- [ ] If agent returns malformed JSON, Spring Boot emits an ERROR event and frontend shows snackbar

---

## Open Questions / Decisions Deferred to Phase 2.4

1. **Screen ordering** — the agent returns screens in PRD order. `display_order` preserves this. Phase 2.4 may want to let users reorder cards (drag-and-drop) before generating prototypes. Not in scope here.

2. **Editing screen names/descriptions** — currently read-only once confirmed. Phase 2.4 may want inline editing before triggering the prototype builder. Not in scope here.

3. **Re-extraction** — if the user wants to re-run the extraction agent (e.g., after updating the PRD), there is no "Re-identify Screens" button in this phase. Deferred.

4. **Screen count limits** — no limit enforced in this phase. If a PRD is large, the agent may return 20+ screens. Phase 2.4 should consider pagination or lazy rendering for large screen inventories.
