# SDLC Assist — Phase 2.1: Design Template Gallery
## Claude Code CLI Implementation Prompt

---

## BEFORE YOU START

Read these project files first — they are your source of truth:
- `1.Planning/REQUIREMENTS.md` — Product requirements and phased delivery plan
- `1.Planning/TECHNICAL_REQUIREMENTS.md` — API endpoints, DB schema, component specs
- `1.Planning/ux-design.md` — Design tokens, color palette, layout specs
- `CLAUDE.md` — Architecture, conventions, known gotchas, deployment notes

Do not guess at conventions. If something is unclear, re-read the relevant planning doc.

---

## OBJECTIVE

Implement **Phase 2.1: Design Template Gallery** — the entry point to the Design phase of
the SDLC. After a user's PRD is complete (Phase 1), they can enter the Design phase and
choose a visual template. The system displays a gallery of template cards. The user can
click a card to zoom into a full preview (lightbox), then select the template to proceed
to AI-powered design system generation (Phase 2.2, not built in this task).

This task builds ONLY the template gallery and selection UX. It does NOT implement
AI design generation yet. The goal is: read templates → display gallery → lightbox →
select → save choice. That's the complete scope.

---

## TEMPLATE ASSET STRUCTURE

Template assets already exist as static files in the Angular project at:

```
frontend/src/assets/templates/
├── index.json                          ← manifest listing all available templates
└── shadcn-template/                    ← first template folder (already in place)
    ├── thumbnail.png                   ← 320×200 card image for gallery
    ├── preview.png                     ← 1440×900 full-res lightbox image
    └── metadata.json                   ← design tokens, prompt hints, component list
```

**IMPORTANT — Extensibility requirement:** The system MUST be designed so new templates
can be added by simply dropping a new folder into `assets/templates/` and adding one
entry to `index.json`. No code changes should be required to add a new template. The
Angular gallery component must be fully data-driven from `index.json`. Do not hardcode
template names, IDs, or paths anywhere in TypeScript or HTML.

### index.json structure (already exists, read it before writing code):
```json
{
  "version": "1.0",
  "templates": [
    {
      "id": "shadcn-template",
      "name": "Basic Design System",
      "tag": "Clean Enterprise",
      "description": "Neutral shadcn-inspired layout with left sidebar, data tables, and cards.",
      "thumbnail": "assets/templates/shadcn-template/thumbnail.png",
      "preview":   "assets/templates/shadcn-template/preview.png",
      "metadata":  "assets/templates/shadcn-template/metadata.json"
    }
  ]
}
```

### metadata.json structure (already exists, read it for type definition reference):
The metadata file contains: `id`, `name`, `tag`, `description`, `designTokens` (object),
`themes`, `components` (string[]), `layoutPattern`, `componentStyle`, `density`,
`colorMood`, `keyPatterns` (string[]), `avoidPatterns` (string[]), `promptHint` (string).

---

## DATABASE CHANGES

Add a `selected_template_id` column to the `projects` table to persist the user's
template choice. This is a nullable VARCHAR(100) — nullable because existing projects
and Phase 1-only projects won't have a template selected yet.

Create a new migration file:
```
supabase/migrations/004_add_selected_template_id.sql
```

```sql
-- Migration: 004_add_selected_template_id
-- Adds template selection to projects for Phase 2 Design phase

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS selected_template_id VARCHAR(100);

COMMENT ON COLUMN projects.selected_template_id IS
  'ID of the design template chosen in Phase 2.1. Matches the id field in assets/templates/index.json.';
```

Also update the `Project` JPA entity and `ProjectDto` to include `selectedTemplateId`
(snake_case in DB → camelCase in Java). Use `@Column(name = "selected_template_id")`.

---

## BACKEND CHANGES

### New endpoint: Save template selection

```
PUT /api/projects/{id}/template
Content-Type: application/json
Body: { "templateId": "shadcn-template" }
Response 200: { project object with selectedTemplateId populated }
Response 404: project not found
Response 403: caller does not own project and is not ADMIN
```

Add to `ProjectController`:
```java
@PutMapping("/{id}/template")
public ResponseEntity<ProjectDto> selectTemplate(
    @PathVariable UUID id,
    @RequestBody TemplateSelectionRequest request,
    @AuthenticationPrincipal UserDetails userDetails) { ... }
```

Create `TemplateSelectionRequest` DTO with a single field: `String templateId`.

Add `selectTemplate(UUID projectId, String templateId, String username)` to
`ProjectService`. Follow the same ownership-check pattern used by `savePrd()`.

The `selectedTemplateId` must be included in all existing `ProjectDto` responses
going forward — update the mapper so it's always serialized (null is fine for
projects that haven't reached Phase 2).

---

## FRONTEND CHANGES

### 1. New Angular service: TemplateService

Create `frontend/src/app/core/services/template.service.ts`

Responsibilities:
- Load `assets/templates/index.json` via `HttpClient` (use `http.get<TemplateIndex>()`)
- Load a specific `metadata.json` by template ID
- Cache the index in memory after first load (don't re-fetch on every route visit)
- Expose `getTemplates(): Observable<TemplateEntry[]>`
- Expose `getMetadata(id: string): Observable<TemplateMetadata>`

### 2. New TypeScript models

Create `frontend/src/app/core/models/template.model.ts`:

```typescript
export interface TemplateIndex {
  version: string;
  templates: TemplateEntry[];
}

export interface TemplateEntry {
  id: string;
  name: string;
  tag: string;
  description: string;
  thumbnail: string;
  preview: string;
  metadata: string;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  tag: string;
  description: string;
  designTokens: Record<string, string>;
  themes: {
    modes: string[];
    bases: string[];
    accents: string[];
  };
  components: string[];
  layoutPattern: string;
  componentStyle: string;
  density: string;
  colorMood: string;
  keyPatterns: string[];
  avoidPatterns: string[];
  promptHint: string;
}
```

Also update `frontend/src/app/core/models/project.model.ts` to add:
`selectedTemplateId?: string | null;`

### 3. New route: Design phase entry point

Add a new lazy-loaded route under the project layout:

```
/projects/:id/design
```

Register it in the router alongside the existing `/projects/:id/planning` route.
In the sidebar, the "Design" nav item should now route to this path instead of
showing only a "Coming Soon" tooltip — but ONLY when the project's PRD is complete
(i.e., `prdContent` is non-null and non-empty). If PRD is not complete, the Design
link stays disabled with the lock icon and "Complete Planning phase first" tooltip.

### 4. New component: DesignPhase (route component)

Create `frontend/src/app/features/project/design-phase/` as a standalone component.

This component is the container for the entire design phase. For Phase 2.1 it renders
the TemplateGallery child component. In Phase 2.2+ it will also render the AI design
generation panel. Keep it structured to accommodate future children.

### 5. New component: TemplateGallery

Create `frontend/src/app/features/project/design-phase/template-gallery/`

**Gallery view behavior:**
- On init, call `TemplateService.getTemplates()` and render one card per template
- Show a loading skeleton (3 placeholder cards) while fetching
- If the project already has a `selectedTemplateId`, show that card with a
  "Selected" checkmark badge — the user can change their selection
- Cards are arranged in a responsive CSS grid: 3 columns on desktop, 2 on tablet

**Card design (match existing app visual style — shadcn/Lucide/Inter):**
Each card contains:
- Thumbnail image (the `thumbnail.png`, 16:10 aspect ratio, object-fit: cover)
- Template name (bold, 14px)
- Tag badge (e.g., "Clean Enterprise") using the existing app badge style
- Short description (12px, muted color, 2-line clamp)
- Two action buttons: "Preview" (outline) and "Select" (default/primary)
- If this template is currently selected: replace "Select" with a filled
  "✓ Selected" badge and add a blue border ring to the card

**On "Preview" click:** open the lightbox overlay (see below)
**On "Select" click:** call `PUT /api/projects/{id}/template`, update local state,
  show a success toast ("Template selected"), and update the card state

**Empty state:** If `index.json` returns 0 templates (shouldn't happen but handle it),
show an empty state card: "No templates available yet."

### 6. New component: TemplateLightbox

Create `frontend/src/app/features/project/design-phase/template-lightbox/`

This is a full-screen overlay that shows the full-resolution `preview.png`.

**Behavior:**
- Triggered by "Preview" click on a gallery card, receives a `TemplateEntry` as input
- Full-screen dark overlay (rgba black, 0.85 opacity) with a centered container
- The `preview.png` is displayed at its natural aspect ratio, max-width 90vw,
  max-height 85vh, with object-fit: contain
- Header bar above image: template name (left) + tag badge + close button (right)
- Footer bar below image: description text (left) + "Select This Template" CTA (right)
- Close on: clicking the X button, clicking outside the image, pressing Escape
- Smooth fade-in/fade-out animation (150ms)
- "Select This Template" button in the footer calls the same select logic as the
  gallery card "Select" button, then closes the lightbox

### 7. Update ProjectService

Add `selectTemplate(projectId: string, templateId: string): Observable<Project>`
that calls `PUT /api/projects/{id}/template`. Follow the existing `savePrd()` pattern.

### 8. Sidebar update

In the project layout sidebar, update the "Design" nav item:
- If `project.prdContent` is null/empty: show lock icon, "Coming Soon" style,
  tooltip = "Complete Planning & Analysis first"
- If `project.prdContent` has content: show as a normal nav link to
  `/projects/:id/design` (no lock icon, no "Soon" badge)

---

## PHASE PROGRESS INDICATOR UPDATE

The phase progress bar currently shows 5 steps. Update step 2 ("Design") so that:
- It shows as `active` (filled dot, darker text) when the current route is under
  `/projects/:id/design`
- It shows as `done` (checkmark) when `project.selectedTemplateId` is non-null
  (template has been chosen and design phase was entered)

---

## ANGULAR CONVENTIONS TO FOLLOW

From `CLAUDE.md` — do not deviate from these:
- Standalone components only — no NgModules
- Zoneless change detection — use `ChangeDetectorRef` or signals, not `markForCheck`
- Lazy-loaded routes — the design feature module must be lazy-loaded
- Component class names omit type suffix per `angular.json` schematic config
  (e.g., class name is `TemplateGallery`, not `TemplateGalleryComponent`)
- SCSS for all styles, scoped to component
- Lucide icons registered globally via `LUCIDE_ICONS` provider — do NOT use
  `LucideAngularModule.pick()` (it doesn't work in Angular 21 standalone)
- Use `HttpClient` from `@angular/common/http` injected via `inject()`
- Follow the existing `AuthService`/`ProjectService` patterns for service structure

---

## WHAT NOT TO BUILD IN THIS TASK

Do not implement any of the following — they are Phase 2.2+:
- AI design generation (no Claude API calls from this feature)
- Rendering or displaying design tokens from metadata.json in the UI
- Applying the selected template's CSS to the app
- Exporting or downloading design artifacts
- Multiple template tabs or filter/sort controls in the gallery
  (the gallery is simple — just cards — until there are enough templates to warrant it)

---

## VERIFICATION CHECKLIST

Before considering this task complete, verify each of the following:

**Database / Backend:**
- [ ] Migration `004_add_selected_template_id.sql` exists and is valid SQL
- [ ] `Project` entity has `selectedTemplateId` field with correct `@Column` mapping
- [ ] `ProjectDto` includes `selectedTemplateId` in all responses
- [ ] `TemplateSelectionRequest` DTO exists
- [ ] `PUT /api/projects/{id}/template` endpoint exists in `ProjectController`
- [ ] `ProjectService.selectTemplate()` method exists with ownership check
- [ ] Backend compiles cleanly: `cd backend && ./mvnw clean package -DskipTests`

**Frontend — Service & Models:**
- [ ] `template.model.ts` created with all 3 interfaces
- [ ] `project.model.ts` updated with `selectedTemplateId`
- [ ] `TemplateService` created, loads `index.json`, caches result
- [ ] `ProjectService` has `selectTemplate()` method

**Frontend — Routing:**
- [ ] `/projects/:id/design` route registered and lazy-loaded
- [ ] Sidebar "Design" link: locked when no PRD, active nav link when PRD exists
- [ ] Navigating to `/projects/:id/design` renders `DesignPhase` component

**Frontend — Gallery:**
- [ ] Gallery fetches from `index.json` dynamically (not hardcoded)
- [ ] Loading skeleton shows while fetching
- [ ] Cards render with thumbnail, name, tag, description, Preview + Select buttons
- [ ] Already-selected template card shows "✓ Selected" state and ring border
- [ ] "Select" button calls `PUT /api/projects/{id}/template` and updates state
- [ ] Success toast appears after selection

**Frontend — Lightbox:**
- [ ] "Preview" button opens lightbox with full-res `preview.png`
- [ ] Lightbox shows template name, tag, description
- [ ] "Select This Template" button in lightbox footer works
- [ ] Escape key closes lightbox
- [ ] Click-outside closes lightbox

**Frontend — Phase Bar:**
- [ ] Design step shows `active` state on `/projects/:id/design` route
- [ ] Design step shows `done` state when `selectedTemplateId` is non-null

**General:**
- [ ] Frontend dev server runs without errors: `cd frontend && npm start`
- [ ] No TypeScript strict-mode errors
- [ ] New template can be added by editing only `index.json` (no TS/HTML changes needed)
- [ ] Adding a 2nd entry to `index.json` causes a second card to appear with zero
      code changes — test this manually before marking complete

---

## RUNNING THE APP LOCALLY

```bash
# Terminal 1 — Backend
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# Terminal 2 — Frontend
cd frontend
npm start
```

App is at http://localhost:4200. Log in as admin (credentials in DataSeeder).
Navigate to a project that has a completed PRD to test the Design phase entry point.

---

## FILE SUMMARY — WHAT TO CREATE / MODIFY

**New files:**
```
supabase/migrations/004_add_selected_template_id.sql
backend/.../dto/TemplateSelectionRequest.java
frontend/src/app/core/models/template.model.ts
frontend/src/app/core/services/template.service.ts
frontend/src/app/features/project/design-phase/design-phase.ts
frontend/src/app/features/project/design-phase/design-phase.html
frontend/src/app/features/project/design-phase/design-phase.scss
frontend/src/app/features/project/design-phase/template-gallery/template-gallery.ts
frontend/src/app/features/project/design-phase/template-gallery/template-gallery.html
frontend/src/app/features/project/design-phase/template-gallery/template-gallery.scss
frontend/src/app/features/project/design-phase/template-lightbox/template-lightbox.ts
frontend/src/app/features/project/design-phase/template-lightbox/template-lightbox.html
frontend/src/app/features/project/design-phase/template-lightbox/template-lightbox.scss
```

**Modified files:**
```
backend/.../model/Project.java               (add selectedTemplateId field)
backend/.../dto/ProjectDto.java              (add selectedTemplateId field)
backend/.../controller/ProjectController.java (add selectTemplate endpoint)
backend/.../service/ProjectService.java      (add selectTemplate method)
frontend/src/app/core/models/project.model.ts (add selectedTemplateId)
frontend/src/app/core/services/project.service.ts (add selectTemplate method)
frontend/src/app/features/project/project-layout.ts  (sidebar Design link logic)
frontend/src/app/features/project/project-layout.html (sidebar + phase bar updates)
frontend/src/app/app.routes.ts               (add /design lazy route)
```
