# SDLC Assist — Phase 2.2: Design System Generation
## Claude Code CLI Implementation Prompt

---

## BEFORE YOU START

Read these project files first — they are your source of truth:
- `1.Planning/REQUIREMENTS.md` — Product requirements and phased delivery plan
- `1.Planning/TECHNICAL_REQUIREMENTS.md` — API endpoints, DB schema, component specs
- `1.Planning/ux-design.md` — Design tokens, color palette, layout specs
- `CLAUDE.md` — Architecture, conventions, known gotchas, deployment notes
- `2.Design-Phase/PHASE-2.1-DESIGN-TEMPLATE-GALLERY.md` — Phase 2.1 implementation (template selection)

Do not guess at conventions. If something is unclear, re-read the relevant planning doc.

---

## OBJECTIVE

Implement **Phase 2.2: Design System Generation** — the second sub-step within the UX Design phase. After the user selects a template in Phase 2.1, they click "Generate Design System" which triggers AI-powered customization of the template's design tokens based on their PRD. The system generates a customized design system and shows the user a live component preview so they can see how buttons, alerts, badges, and other UI elements will look in their specific project.

This task builds the AI generation logic, the component preview UI, and the navigation between UX Design sub-steps.

---

## CONTEXT: UPDATED NAVIGATION STRUCTURE

The main SDLC phase tabs have been updated. The old structure was:

```
Planning & Analysis → Design → Implementation → Testing → Maintenance
```

The new structure is:

```
Planning & Analysis → UX Design → Technical Design → Implementation Plan → Artifacts & Export
```

**"Design" has been renamed to "UX Design"** and now contains sub-steps (a pizza tracker progression):

```
U X Design Phase Sub-Steps:
1. Template Selection    ✓ (Phase 2.1, already built)
2. Design System         ← (Phase 2.2, what we're building now)
3. Prototypes            (Phase 2.3, future)
4. UX Acceptance         (Phase 2.4, future)
``` 

The user progresses linearly through these sub-steps. Each sub-step is a child route under `/projects/:id/ux-design/`.

---

## ROUTE STRUCTURE

**Current routes (Phase 2.1):**
- `/projects/:id/ux-design` → defaults to template-selection child route
- `/projects/:id/ux-design/template-selection` → Template gallery (already built)

**New routes (Phase 2.2):**
- `/projects/:id/ux-design/design-system` → Design system generation + component preview (what we're building)

**Future routes (not in this task):**
- `/projects/:id/ux-design/prototypes` → Screen mockups (Phase 2.3)
- `/projects/:id/ux-design/acceptance` → Final UX review gate (Phase 2.4)

---

## DATABASE CHANGES

Add columns to track UX Design sub-phase progress and store the generated design system.

Create a new migration file:
```
supabase/migrations/005_add_ux_design_progress.sql
```

```sql
-- Migration: 005_add_ux_design_progress
-- Adds UX Design sub-phase tracking and design system storage

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS ux_design_step INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS design_system_tokens JSONB,
  ADD COLUMN IF NOT EXISTS design_system_explanation TEXT;

COMMENT ON COLUMN projects.ux_design_step IS
  'Current sub-step within UX Design phase: 1=Template Selection, 2=Design System, 3=Prototypes, 4=Acceptance';

COMMENT ON COLUMN projects.design_system_tokens IS
  'AI-generated design tokens (colors, typography, spacing) customized from the selected template based on the PRD';

COMMENT ON COLUMN projects.design_system_explanation IS
  'AI-generated plain-English explanation of what was changed from the template and why';
```

Update the `Project` JPA entity to include:
```java
@Column(name = "ux_design_step")
private Integer uxDesignStep = 1;

@Column(name = "design_system_tokens", columnDefinition = "jsonb")
private String designSystemTokens;  // stored as JSON string

@Column(name = "design_system_explanation", columnDefinition = "text")
private String designSystemExplanation;
```

Update `ProjectDto` to include these fields as well.

---

## BACKEND CHANGES

### New endpoint: Generate Design System

```
POST /api/projects/{id}/design-system/generate
Authorization: required (user must own project or be ADMIN)
Response 200: { tokens: {...}, explanation: "..." }
Response 404: project not found
Response 403: caller does not own project
Response 400: PRD not complete or template not selected
```

**Request body:** None (reads from existing project state)

**Process:**
1. Load project from DB, verify ownership
2. Verify `prdContent` is non-null (if null → 400 error: "PRD must be completed first")
3. Verify `selectedTemplateId` is non-null (if null → 400 error: "Template must be selected first")
4. Load the template metadata from `assets/templates/{selectedTemplateId}/metadata.json`
5. Call Claude API with the generation prompt (see below)
6. Parse the response JSON
7. Save to `designSystemTokens` and `designSystemExplanation` columns
8. Update `uxDesignStep = 2`
9. Return the tokens + explanation

Add to `ProjectController`:
```java
@PostMapping("/{id}/design-system/generate")
public ResponseEntity<DesignSystemResponse> generateDesignSystem(
    @PathVariable UUID id,
    @AuthenticationPrincipal UserDetails userDetails) { ... }
```

Create `DesignSystemResponse` DTO:
```java
@Data
@Builder
public class DesignSystemResponse {
    private Map<String, Object> tokens;        // the design token JSON
    private String explanation;                // AI's plain-English explanation
}
```

### Claude API Integration

Create a new service: `DesignSystemService` in `backend/src/main/java/com/sdlcassist/service/`

**Dependencies:**
- Inject `AnthropicClient` (same client used for PRD generation in Phase 1)
- Inject `ObjectMapper` for JSON parsing
- Read template metadata from classpath resource at runtime

**Method:**
```java
public DesignSystemResponse generateDesignSystem(String prdContent, String templateId, TemplateMetadata templateMetadata) {
    // Build the Claude prompt
    String prompt = buildPrompt(prdContent, templateId, templateMetadata);
    
    // Call Claude API (use claude-sonnet-4-5-20250929 model)
    // Request JSON-only output (no markdown, no preamble)
    
    // Parse response
    // Return DesignSystemResponse
}
```

### Claude Prompt Structure

```
You are generating a customized design system for a software project.

The user has selected a design template and you must adapt it to their specific project requirements.

## SELECTED TEMPLATE
Name: {template.name}
Style: {template.componentStyle}
Color Mood: {template.colorMood}

## BASE DESIGN TOKENS (from template)
{JSON.stringify(template.designTokens, null, 2)}

## TEMPLATE GUIDANCE
{template.promptHint}

## PROJECT PRD
{prdContent}

## YOUR TASK

Based on the PRD's feature requirements, user workflows, and domain context, generate a customized design token set that:

1. **Preserves the template's core aesthetic** (layout pattern, typography scale, component style, border radius)
2. **Adapts semantic colors** for the project domain (e.g., if the PRD mentions patient enrollment, use green for "approved", amber for "pending", red for "denied")
3. **Adds new tokens** if the project needs domain-specific states or variants not in the base template
4. **Adjusts existing tokens** if the base template's choices don't fit the domain (e.g., change success color from yellow to green for healthcare clarity)

## OUTPUT FORMAT

Respond with ONLY a JSON object (no markdown, no preamble, no ```json fences) in this exact schema:

{
  "tokens": {
    "colors": {
      "primary": "#hexcode",
      "secondary": "#hexcode",
      "success": "#hexcode",
      "warning": "#hexcode",
      "info": "#hexcode",
      "error": "#hexcode",
      // ... include all color tokens from the base template
      // ... add new ones if needed (e.g., "pending": "#hexcode")
    },
    "typography": {
      "fontFamily": "string",
      "fontScale": "string",
      "headingSize": "string",
      "bodySize": "string"
      // ... include all typography tokens from base template
    },
    "spacing": {
      "unit": "string (e.g., '8px')",
      "scale": "string (e.g., 'comfortable')"
      // ... include spacing tokens from base template
    },
    "layout": {
      "borderRadius": "string",
      "sidebarWidth": "string"
      // ... include layout tokens from base template
    }
  },
  "explanation": "Plain-English explanation (2-3 sentences) of what you changed from the base template and why, based on the PRD's domain and workflows. Example: 'I changed the success color from light yellow to green because the PRD describes a healthcare enrollment workflow where green clearly indicates approval. I added a new "pending" state in soft purple for applications awaiting review.'"
}

CRITICAL: The "tokens" object must be a valid, complete design token set. Do NOT reference the base template in the output — generate the full token values.
```

### Template Metadata Loading

The backend needs to read the template's `metadata.json` at runtime. Create a utility method in `DesignSystemService`:

```java
private TemplateMetadata loadTemplateMetadata(String templateId) throws IOException {
    String path = "/static/templates/" + templateId + "/metadata.json";
    InputStream is = getClass().getResourceAsStream(path);
    if (is == null) {
        throw new FileNotFoundException("Template metadata not found: " + templateId);
    }
    return objectMapper.readValue(is, TemplateMetadata.class);
}
```

Create a `TemplateMetadata` Java class matching the metadata.json structure (or use a generic `Map<String, Object>` if you prefer).

**IMPORTANT:** The frontend's `assets/templates/` folder is part of the Angular build. To make it accessible from the backend at runtime, you need to either:
- (Option A) Copy the templates to `backend/src/main/resources/static/templates/` during build
- (Option B) Make the backend read from a shared location (e.g., environment variable pointing to templates directory)
- (Option C) Have the frontend serve the metadata.json via an endpoint and the backend fetches it via HTTP

**Recommended: Option A.** Add a build step to copy templates from `frontend/src/assets/templates/` to `backend/src/main/resources/static/templates/` so both frontend and backend can access them.

---

## FRONTEND CHANGES

### 1. Update Project Model

Update `frontend/src/app/core/models/project.model.ts`:

```typescript
export interface Project {
  id: string;
  name: string;
  status: string;
  prdContent?: string;
  selectedTemplateId?: string;
  uxDesignStep?: number;              // NEW
  designSystemTokens?: DesignTokens;  // NEW
  designSystemExplanation?: string;   // NEW
  // ... existing fields
}

export interface DesignTokens {
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string>;
  layout: Record<string, string>;
}
```

### 2. Update ProjectService

Add method to `frontend/src/app/core/services/project.service.ts`:

```typescript
generateDesignSystem(projectId: string): Observable<DesignSystemResponse> {
  return this.http.post<DesignSystemResponse>(
    `${this.apiUrl}/projects/${projectId}/design-system/generate`,
    {}
  );
}
```

Create the response interface:
```typescript
export interface DesignSystemResponse {
  tokens: DesignTokens;
  explanation: string;
}
```

### 3. New Route Component: DesignSystemGeneration

Create `frontend/src/app/features/ux-design/design-system-generation/`

This component is rendered at `/projects/:id/ux-design/design-system`.

**State:**
- `project: Project` (loaded from route resolver or parent)
- `tokens: DesignTokens | null` (loaded from project or freshly generated)
- `explanation: string | null`
- `isGenerating: boolean` (loading state)

**On Init:**
- Check `project.designSystemTokens`
- If null: show "Generating..." and immediately call `generateDesignSystem()`
- If present: show the component preview with existing tokens

**UI Layout:**

```
┌────────────────────────────────────────────────────────────┐
│  UX Design Progress                                   50%  │
│  ●────────●────────○────────○                              │
│  Template  Design   Prototype Accept                       │
│            System                                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Design System Preview                                     │
│                                                            │
│  [AI Explanation Card]                                     │
│  "I changed the success color from light yellow to green  │
│   because the PRD describes a healthcare enrollment        │
│   workflow where green clearly indicates approval."        │
│                                                            │
│  [Component Preview Section]                               │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Buttons                                             │ │
│  │  [Primary Button] [Secondary] [Outline] [Ghost]      │ │
│  │                                                       │ │
│  │  Alerts                                               │ │
│  │  ┌─────────────────────────────────────────────┐    │ │
│  │  │ ✓ Enrollment Approved                        │    │ │
│  │  │   Patient has been successfully enrolled.    │    │ │
│  │  └─────────────────────────────────────────────┘    │ │
│  │                                                       │ │
│  │  ┌─────────────────────────────────────────────┐    │ │
│  │  │ ⚠ Missing Information                        │    │ │
│  │  │   Please provide insurance details.          │    │ │
│  │  └─────────────────────────────────────────────┘    │ │
│  │                                                       │ │
│  │  Status Badges                                        │ │
│  │  [Pending] [Approved] [Denied] [In Review]          │ │
│  │                                                       │ │
│  │  Typography                                           │ │
│  │  Page Title (28px Bold)                              │ │
│  │  Section Header (18px Semibold)                      │ │
│  │  Body text looks like this (14px Regular)           │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [Expandable: View Raw Design Tokens ▸]                   │
│  (Accordion showing JSON with color swatches)             │
│                                                            │
│  [← Back to Templates] [Regenerate] [Continue →]          │
└────────────────────────────────────────────────────────────┘
```

### 4. Component Preview Renderer

The component preview section dynamically renders UI elements styled with the generated tokens.

**Implementation approach:**
Create a `ComponentPreview` child component that accepts `tokens: DesignTokens` as input and renders sample components.

The component injects CSS custom properties at runtime:

```typescript
@Component({
  selector: 'app-component-preview',
  template: `
    <div class="preview-container" [style]="cssVars">
      <section class="preview-section">
        <h3>Buttons</h3>
        <button class="btn btn-primary">Primary Button</button>
        <button class="btn btn-secondary">Secondary</button>
        <button class="btn btn-outline">Outline</button>
        <button class="btn btn-ghost">Ghost</button>
      </section>

      <section class="preview-section">
        <h3>Alerts</h3>
        <div class="alert alert-success">
          <span class="alert-icon">✓</span>
          <div>
            <strong>Enrollment Approved</strong>
            <p>Patient has been successfully enrolled.</p>
          </div>
        </div>
        <div class="alert alert-warning">
          <span class="alert-icon">⚠</span>
          <div>
            <strong>Missing Information</strong>
            <p>Please provide insurance details.</p>
          </div>
        </div>
        <!-- ... more alerts -->
      </section>

      <section class="preview-section">
        <h3>Status Badges</h3>
        <span class="badge badge-pending">Pending</span>
        <span class="badge badge-success">Approved</span>
        <span class="badge badge-error">Denied</span>
        <span class="badge badge-info">In Review</span>
      </section>

      <section class="preview-section">
        <h3>Typography</h3>
        <h1 class="preview-heading">Page Title (28px Bold)</h1>
        <h2 class="preview-subheading">Section Header (18px Semibold)</h2>
        <p class="preview-body">Body text looks like this (14px Regular)</p>
      </section>
    </div>
  `,
  styles: [/* Component styles using var(--primary), var(--success), etc. */]
})
export class ComponentPreview {
  @Input() tokens!: DesignTokens;

  get cssVars(): { [key: string]: string } {
    return {
      '--primary': this.tokens.colors.primary,
      '--secondary': this.tokens.colors.secondary,
      '--success': this.tokens.colors.success,
      '--warning': this.tokens.colors.warning,
      '--info': this.tokens.colors.info,
      '--error': this.tokens.colors.error,
      '--border-radius': this.tokens.layout.borderRadius,
      '--font-family': this.tokens.typography.fontFamily,
      // ... map all tokens to CSS variables
    };
  }
}
```

The SCSS for this component uses `var(--primary)`, `var(--success)`, etc., which get populated at runtime from the generated tokens.

### 5. UX Design Sub-Phase Stepper

Create a reusable `UxDesignStepper` component that shows the pizza tracker progress.

```typescript
@Component({
  selector: 'app-ux-design-stepper',
  template: `
    <div class="stepper-container">
      <div class="stepper-header">
        <span class="stepper-label">UX Design Progress</span>
        <span class="stepper-percentage">{{ progressPercentage }}%</span>
      </div>
      <div class="stepper">
        <div class="step" [class.completed]="currentStep >= 1" [class.active]="currentStep === 1">
          <div class="step-dot">{{ currentStep > 1 ? '✓' : '1' }}</div>
          <span class="step-label">Template Selection</span>
        </div>
        <div class="step-connector"></div>
        <div class="step" [class.completed]="currentStep >= 2" [class.active]="currentStep === 2">
          <div class="step-dot">{{ currentStep > 2 ? '✓' : '2' }}</div>
          <span class="step-label">Design System</span>
        </div>
        <div class="step-connector"></div>
        <div class="step" [class.disabled]="currentStep < 3">
          <div class="step-dot">3</div>
          <span class="step-label">Prototypes</span>
        </div>
        <div class="step-connector"></div>
        <div class="step" [class.disabled]="currentStep < 4">
          <div class="step-dot">4</div>
          <span class="step-label">Accept</span>
        </div>
      </div>
    </div>
  `,
  styles: [/* Stepper styling */]
})
export class UxDesignStepper {
  @Input() currentStep!: number;

  get progressPercentage(): number {
    return (this.currentStep / 4) * 100;
  }
}
```

This component is shown at the top of both the template-selection page and the design-system page (and future sub-steps).

### 6. Navigation Flow

**From Template Selection (Phase 2.1) to Design System (Phase 2.2):**

When the user clicks "Generate Design System" on the template-selection page:
```typescript
onGenerateDesignSystem(): void {
  // Navigate to design-system route
  this.router.navigate(['/projects', this.projectId, 'ux-design', 'design-system']);
}
```

The `DesignSystemGeneration` component loads and immediately calls `generateDesignSystem()` if tokens don't exist yet.

**From Design System (Phase 2.2) back to Template Selection:**

"Back to Templates" button:
```typescript
onBackToTemplates(): void {
  this.router.navigate(['/projects', this.projectId, 'ux-design', 'template-selection']);
}
```

**From Design System (Phase 2.2) forward to Prototypes (Phase 2.3):**

"Continue →" button:
```typescript
onContinue(): void {
  // For now, show a "Coming Soon" message or navigate to a placeholder
  this.router.navigate(['/projects', this.projectId, 'ux-design', 'prototypes']);
}
```

### 7. Regenerate Function

The "Regenerate" button allows the user to re-run the AI generation (e.g., if they don't like the initial result).

```typescript
onRegenerate(): void {
  this.isGenerating = true;
  this.projectService.generateDesignSystem(this.projectId).subscribe({
    next: (response) => {
      this.tokens = response.tokens;
      this.explanation = response.explanation;
      this.isGenerating = false;
      // Show success toast
    },
    error: (err) => {
      console.error('Design system generation failed:', err);
      this.isGenerating = false;
      // Show error toast
    }
  });
}
```

---

## ROUTING UPDATES

Update `frontend/src/app/app.routes.ts`:

The existing route structure likely has:
```typescript
{
  path: 'projects/:id',
  component: ProjectLayout,
  children: [
    { path: 'ux-design/template-selection', component: TemplateGallery },
    // ... other routes
  ]
}
```

Add the new design-system route:
```typescript
{
  path: 'projects/:id',
  component: ProjectLayout,
  children: [
    {
      path: 'ux-design',
      children: [
        { path: '', redirectTo: 'template-selection', pathMatch: 'full' },
        { path: 'template-selection', component: TemplateGallery },
        { path: 'design-system', component: DesignSystemGeneration },  // NEW
        // Phase 2.3 future:
        // { path: 'prototypes', component: PrototypeGeneration },
      ]
    },
    // ... other phase routes
  ]
}
```

---

## MAIN PHASE TAB UPDATE

In the project layout, the main phase tabs need to be updated:

**Old tabs:**
Planning & Analysis | Design | Implementation | Testing & Integration | Maintenance

**New tabs:**
Planning & Analysis | UX Design | Technical Design | Implementation Plan | Artifacts & Export

Update `ProjectLayout` component:
- Rename the "Design" tab to "UX Design"
- Update the route: `/projects/:id/design` → `/projects/:id/ux-design`
- Add new tabs for Technical Design, Implementation Plan, Artifacts & Export (show as locked/coming soon for now)

The "UX Design" tab should be enabled when `project.prdContent` is non-null.

---

## VERIFICATION CHECKLIST

Before considering this task complete, verify each of the following:

**Database / Backend:**
- [ ] Migration `005_add_ux_design_progress.sql` exists and is valid SQL
- [ ] `Project` entity has `uxDesignStep`, `designSystemTokens`, `designSystemExplanation` fields
- [ ] `ProjectDto` includes these new fields
- [ ] `DesignSystemResponse` DTO exists
- [ ] `DesignSystemService` exists with `generateDesignSystem()` method
- [ ] Template metadata can be loaded from classpath resources
- [ ] `POST /api/projects/{id}/design-system/generate` endpoint exists and works
- [ ] Claude API call generates valid JSON output
- [ ] Generated tokens are saved to database correctly
- [ ] Backend compiles cleanly: `cd backend && ./mvnw clean package -DskipTests`

**Frontend — Models & Services:**
- [ ] `project.model.ts` updated with new fields
- [ ] `ProjectService.generateDesignSystem()` method exists
- [ ] `DesignSystemResponse` interface exists

**Frontend — Components:**
- [ ] `DesignSystemGeneration` component created
- [ ] `ComponentPreview` component created and renders buttons, alerts, badges, typography
- [ ] `UxDesignStepper` component created and shows pizza tracker
- [ ] Stepper shows correct step highlighting based on `project.uxDesignStep`

**Frontend — Routing:**
- [ ] `/projects/:id/ux-design/design-system` route registered
- [ ] Navigation from template-selection to design-system works
- [ ] "Back to Templates" button navigates back
- [ ] "Continue" button navigates forward (or shows coming soon)

**Frontend — UI/UX:**
- [ ] AI explanation is displayed prominently
- [ ] Component preview renders with generated tokens applied via CSS variables
- [ ] Expandable "View Raw Design Tokens" accordion works
- [ ] "Regenerate" button triggers new generation
- [ ] Loading state shows during generation
- [ ] Success toast appears after generation completes
- [ ] Error toast appears if generation fails

**Integration:**
- [ ] Clicking "Generate Design System" on template-selection page navigates to design-system page and triggers generation
- [ ] If user refreshes the page, existing tokens load from database (no re-generation unless they click "Regenerate")
- [ ] Main phase tabs show "UX Design" instead of "Design"
- [ ] Frontend dev server runs without errors: `cd frontend && npm start`
- [ ] No TypeScript strict-mode errors

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

App is at http://localhost:4200. Log in as admin, navigate to a project with a completed PRD and selected template, then test the design system generation flow.

---

## FILE SUMMARY — WHAT TO CREATE / MODIFY

**New files:**
```
supabase/migrations/005_add_ux_design_progress.sql
backend/.../service/DesignSystemService.java
backend/.../dto/DesignSystemResponse.java
backend/.../model/TemplateMetadata.java (optional, or use Map)
frontend/src/app/features/ux-design/design-system-generation/design-system-generation.ts
frontend/src/app/features/ux-design/design-system-generation/design-system-generation.html
frontend/src/app/features/ux-design/design-system-generation/design-system-generation.scss
frontend/src/app/features/ux-design/components/component-preview/component-preview.ts
frontend/src/app/features/ux-design/components/component-preview/component-preview.html
frontend/src/app/features/ux-design/components/component-preview/component-preview.scss
frontend/src/app/features/ux-design/components/ux-design-stepper/ux-design-stepper.ts
frontend/src/app/features/ux-design/components/ux-design-stepper/ux-design-stepper.html
frontend/src/app/features/ux-design/components/ux-design-stepper/ux-design-stepper.scss
```

**Modified files:**
```
backend/.../model/Project.java (add uxDesignStep, designSystemTokens, designSystemExplanation)
backend/.../dto/ProjectDto.java (add same fields)
backend/.../controller/ProjectController.java (add generateDesignSystem endpoint)
frontend/src/app/core/models/project.model.ts (add uxDesignStep, designSystemTokens, etc.)
frontend/src/app/core/services/project.service.ts (add generateDesignSystem method)
frontend/src/app/features/ux-design/template-gallery/template-gallery.ts (update navigation on "Generate")
frontend/src/app/features/project/project-layout.ts (rename Design tab to UX Design)
frontend/src/app/features/project/project-layout.html (update tab labels)
frontend/src/app/app.routes.ts (add design-system child route)
```

---

## CRITICAL REMINDERS

**Template Metadata Access:**
The backend needs access to the template metadata files. Make sure templates are copied from `frontend/src/assets/templates/` to `backend/src/main/resources/static/templates/` during the build, OR configure the backend to read from a shared location.

**Claude API Response Parsing:**
The Claude prompt asks for JSON-only output with no markdown fences. However, Claude sometimes still wraps responses in ```json blocks. The backend should strip these fences before parsing:

```java
String responseText = claudeResponse.getContent().get(0).getText();
// Remove markdown fences if present
responseText = responseText.replaceAll("^```json\\s*", "").replaceAll("\\s*```$", "");
DesignSystemResponse parsed = objectMapper.readValue(responseText, DesignSystemResponse.class);
```

**Component Preview Styling:**
The component preview should use the same styling structure as the template previews from Phase 2.1 for visual consistency. Reuse button classes, alert classes, badge classes from the existing app stylesheet or create a shared `_component-library.scss` partial.

**Error Handling:**
If Claude API call fails, template metadata is missing, or JSON parsing fails, show a user-friendly error message with a "Retry" button rather than crashing the page.

**Progressive Enhancement:**
The component preview can start simple (buttons + 2 alerts) and be expanded later. Don't block on rendering every possible component variant — focus on the most visually impactful ones first.

---

## PHASE 2.2 SUCCESS CRITERIA

This task is complete when:
1. User can click "Generate Design System" and see the loading state
2. Backend calls Claude API and receives customized design tokens
3. User sees a component preview styled with the generated tokens
4. User sees the AI's explanation of what was changed
5. User can click "Regenerate" to try again
6. User can click "Continue" to proceed (even if it's a placeholder for now)
7. The stepper at the top correctly shows step 2 as active
8. All TypeScript and Java code compiles without errors
9. The flow feels smooth and intentional — no jarring transitions

TW=DW! 🚀
