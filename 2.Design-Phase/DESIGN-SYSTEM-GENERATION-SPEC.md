# UX Spec: Design System Generation
## SDLC Assist — Phase 2.2

**Document Type:** UX & Architecture Specification  
**Target Component:** `design-system-generation.component.ts`  
**Date:** February 2026  
**Status:** Ready for Implementation

---

## Overview

This spec defines the full UX and component behavior for the Design System Generation page — replacing the current "Coming Soon" placeholder. The page has two distinct states that render in sequence: a **Review & Confirm** state followed by a **Result** state. There is no back-end call until the user explicitly clicks "Start Design System."

---

## User Flow (End to End)

```
Template Gallery
  └─ User selects Cardinal Brand
  └─ Clicks "Generate Design System" in action bar
       │
       ▼
Design System Generation Page [STATE 1: Review & Confirm]
  └─ User sees: PRD summary card + Template preview card
  └─ User clicks "Start Design System"
       │
       ▼
Design System Generation Page [STATE 2: Generating]
  └─ SSE progress events from Spring Boot
  └─ Structured progress messages (not token streaming)
       │
       ▼
Design System Generation Page [STATE 3: Result]
  └─ Visual design system display (read-only)
  └─ Save to project
  └─ Action bar: "Generate Prototypes →"
       │
       ▼
Prototype Page [Coming Soon placeholder]
  └─ UX stepper advances to Step 3
```

---

## State 1: Review & Confirm

This state renders immediately when the user lands on the page after clicking "Generate Design System" from the template gallery. **No API call is made yet.**

### Purpose
Give the user a clear "review your inputs before submitting" moment. They see exactly what will be sent to the AI agent — the PRD and the selected template — before burning an agent call.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  [UX Design Stepper — Step 2 active]                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Design System Generation                               │
│  AI-powered design system customization based on        │
│  your PRD and selected template.                        │
│                                                         │
│  ┌─── READY TO GENERATE ──────────────────────────────┐ │
│  │                                                     │ │
│  │  The following inputs will be sent to the AI agent  │ │
│  │                                                     │ │
│  │  ┌─────────────────────┐  ┌─────────────────────┐  │ │
│  │  │  📄 PRD              │  │  🎨 Template         │  │ │
│  │  │                     │  │                     │  │ │
│  │  │  Pharmacy Benefit   │  │  [thumbnail image]  │  │ │
│  │  │  Verification       │  │                     │  │ │
│  │  │  Portal             │  │  Cardinal Brand     │  │ │
│  │  │                     │  │  Healthcare         │  │ │
│  │  │  PRD generated      │  │  Enterprise         │  │ │
│  │  │  Feb 17, 2026       │  │                     │  │ │
│  │  └─────────────────────┘  └─────────────────────┘  │ │
│  │                                                     │ │
│  │              [✦ Start Design System]                │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Component Details

**Outer card** — matches the `.card` style used in Planning & Analysis. Border `var(--border)`, radius `var(--radius)`, padding 24px.

**Section label** — small uppercase label at top of card: "READY TO GENERATE" in `var(--muted-foreground)`, 11px, 600 weight, letter-spacing 0.5px. Matches the "UX DESIGN PROGRESS" label style from the stepper.

**Subtitle** — "The following inputs will be sent to the AI agent" in `var(--muted-foreground)`, 13px.

**Two-column input grid** — side by side cards, equal width, gap 16px.

**PRD Card (left)**
- Icon: `file-text` lucide icon, 16px, `var(--primary)`
- Label: "Product Requirements Document" — 11px uppercase muted label
- Title: Project name pulled from `project.name` — 15px, 600 weight, foreground
- Sub-label: "PRD generated" + formatted date from `project.updatedAt` — 12px muted
- Background: `var(--muted)`, border `var(--border)`, radius `var(--radius)`, padding 16px

**Template Card (right)**
- Thumbnail image from `template.thumbnail` — full width, aspect ratio 16/10, object-fit cover, border-radius top corners
- Template name — 14px, 600 weight, foreground
- Tag badge — matches existing `.tag-badge` style from template gallery (primary color tint)
- Background: `var(--card)`, border `var(--border)`, radius `var(--radius)`, overflow hidden

**"Start Design System" button**
- Full width, centered below the two cards
- Style: `btn btn-primary btn-lg` — matches the "Generate Design System" button from the template gallery action bar
- Icon: `sparkles` lucide, 18px
- Label: "Start Design System"
- Max-width 320px, centered with `margin: 0 auto`

### Data Requirements (Angular)
The component needs to load on init:
- `project` — from `ProjectService.getById(projectId)` — to get name, PRD date
- `template` — from `TemplateService.getById(project.selectedTemplateId)` — to get thumbnail, name, tag

Both must be loaded before rendering (show skeleton state while loading).

---

## State 2: Generating

Triggered when user clicks "Start Design System." The Review & Confirm card is replaced by a progress card. The two-column input cards remain visible above it as context (greyed out / reduced opacity 0.5) so the user remembers what's running.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Context: PRD card + Template card, opacity 0.5]       │
│                                                         │
│  ┌─── GENERATING ──────────────────────────────────────┐ │
│  │                                                     │ │
│  │   ✦ (spinning)  Generating Design System...         │ │
│  │                                                     │ │
│  │   ████████████░░░░░░░░░░░░░░░░░░  45%              │ │
│  │                                                     │ │
│  │   Analyzing PRD requirements...                     │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Progress Messages (SSE Events from Spring Boot)

Spring Boot emits structured SSE progress events (not token streaming). The frontend listens and maps each event to a user-friendly message. Define these as an ordered sequence:

| Event Key | Display Message | Progress % |
|---|---|---|
| `INITIALIZING` | Connecting to design system agent... | 5% |
| `ANALYZING_PRD` | Analyzing PRD requirements... | 20% |
| `EXTRACTING_DOMAIN` | Identifying domain patterns and use cases... | 35% |
| `APPLYING_TEMPLATE` | Applying Cardinal Brand design tokens... | 50% |
| `GENERATING_COLORS` | Generating color system and semantic tokens... | 65% |
| `GENERATING_TYPOGRAPHY` | Defining typography scale and hierarchy... | 75% |
| `GENERATING_COMPONENTS` | Specifying component library... | 85% |
| `FINALIZING` | Finalizing design system document... | 95% |
| `COMPLETE` | Design system generated successfully. | 100% |

Note: "Cardinal Brand" in the message above should be dynamic — use the actual selected template name.

### Progress Bar
Matches the Gemini progress bar style already in the codebase:
- Full width, height 6px, background `var(--border)`, border-radius 3px
- Fill: `var(--primary)`, transition `width 0.6s ease`

---

## State 3: Result

When the SSE stream completes and the agent response is received, the progress card fades out and the result renders. The input context cards (PRD + Template) remain at the top, full opacity restored.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Context: PRD card + Template card — full opacity]     │
│                                                         │
│  ┌─── GENERATED DESIGN SYSTEM ────────────── [actions] ┐ │
│  │   ✦ Claude  •  Healthcare Enterprise                │ │
│  │                                                     │ │
│  │  ┌── COLOR SYSTEM ──────────────────────────────┐  │ │
│  │  │  ● #e41f35  Primary    ● #f3f3f3  Background │  │ │
│  │  │  ● #ffffff  Card       ● #333333  Foreground │  │ │
│  │  │  ● #bbdde6  Accent     ● #efefef  Border     │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │                                                     │ │
│  │  ┌── TYPOGRAPHY ────────────────────────────────┐  │ │
│  │  │  Font: Geist / Inter                        │  │ │
│  │  │  Scale: Compact  Body: 13px  H1: 24px       │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │                                                     │ │
│  │  ┌── COMPONENTS ────────────────────────────────┐  │ │
│  │  │  Sidebar  Button  Badge  Card  Table  Input  │  │ │
│  │  │  Dialog  Tabs  Alert  Progress  Dropdown...  │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │                                                     │ │
│  │  ┌── LAYOUT ────────────────────────────────────┐  │ │
│  │  │  Pattern: Sidebar Left Fixed (256px)         │  │ │
│  │  │  Density: Comfortable  Radius: 6px           │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

[ACTION BAR — fixed bottom]
  [thumbnail]  Generated Design System  •  Cardinal Brand
                                     [✦ Generate Prototypes →]
```

### Result Card Sections

The agent will return a structured response. The frontend parses it and renders four visual sections. These are **display only — no editing** in this phase.

**Header row (inside result card)**
- Left: `sparkles` icon + "Generated Design System" label + Claude source badge (matches existing `.source-claude` badge style)
- Right: action buttons — `download` icon button (download as .md), `refresh-cw` icon button (Regenerate)

**COLOR SYSTEM section**
- Section label: "COLOR SYSTEM" — uppercase, 11px, muted, 600 weight
- Color swatches grid — each swatch is a filled circle (24px diameter) + hex value + semantic name
- Two-column layout: Primary colors left, neutrals right
- The actual hex values come from the template's `designTokens` object (already in `metadata.json`)
- Swatch circle uses `background-color: [hex value]`, bordered with 1px `var(--border)`

**TYPOGRAPHY section**
- Font family name — pulled from `designTokens.fontFamily`
- Scale label — pulled from `designTokens.fontScale`
- Small specimen row showing: Body size, H1 size, H2 size in the actual font

**COMPONENTS section**
- Component name pills — each component from `template.components` array rendered as a small badge
- Style: same as existing `.tag-badge` but neutral color (`var(--muted)` background, `var(--foreground)` text)
- Wrapping flex row

**LAYOUT section**
- Layout pattern label — from `designTokens.layoutPattern` (humanized: "sidebar-left-fixed" → "Sidebar Left Fixed")
- Density and border radius — from `designTokens.density` and `designTokens.borderRadius`
- Small visual diagram of the layout pattern (simple CSS box diagram — sidebar on left, content on right)

### Action Bar (Fixed Bottom — matches Template Gallery pattern)

Slides up from the bottom after result is saved, using the same `slideUp` animation and styling already in the codebase.

**Left side:**
- Small template thumbnail (64x40, same as template gallery action bar)
- Label: "Generated Design System" (11px uppercase muted)
- Sub-label: Template name (14px, 600 weight, foreground)

**Right side:**
- Primary button: "Generate Prototypes" with `arrow-right` lucide icon
- On click: navigate to `/projects/:id/ux-design/prototypes`

---

## Prototype Page (Step 3 — Coming Soon)

When the user clicks "Generate Prototypes," they are navigated to the prototype route. The UX stepper advances to Step 3. The page renders a Coming Soon state — identical in structure to the current design system placeholder, but with updated copy.

### Component: `prototype-generation.component.ts`

```
[UX Design Stepper — Step 3 active]

Prototype Generation
AI-powered screen prototypes based on your design system

[layers icon — large, muted]
Coming Soon
Prototype generation will be available in Phase 2.3
```

This is a simple placeholder — same structure as the existing `design-system-generation.component.ts` "Coming Soon" state but with the stepper showing Step 3.

---

## Angular Component Architecture

### Files to Create / Modify

| File | Action | Notes |
|---|---|---|
| `design-system-generation.component.ts` | **Replace** | Full implementation replacing Coming Soon |
| `design-system-result/design-system-result.component.ts` | **Create** | Extracted result display sub-component |
| `design-system-result/color-swatch.component.ts` | **Create** | Individual color swatch (circle + label) |
| `prototype-generation.component.ts` | **Create** | Coming Soon placeholder, stepper at Step 3 |
| `ux-design.routes.ts` | **Update** | Add prototype route |

### State Machine (Signals)

```typescript
// In design-system-generation.component.ts

pageState = signal<'review' | 'generating' | 'result'>('review');
project = signal<Project | null>(null);
template = signal<TemplateEntry | null>(null);
loading = signal(true);

// Generating state
progress = signal(0);
progressMessage = signal('');

// Result state
designSystemContent = signal<string | null>(null);  // Raw agent response
saved = signal(false);
```

### Key Behaviors

**On init:**
1. Load `project` via `ProjectService.getById(projectId)`
2. Load `template` via `TemplateService.getById(project.selectedTemplateId)`
3. If `project.designSystemContent` already exists → skip to `result` state immediately (don't re-run the agent)
4. Otherwise → render `review` state

**On "Start Design System" click:**
1. Set `pageState` to `'generating'`
2. Call Spring Boot SSE endpoint: `POST /api/projects/:id/design-system/generate`
3. Subscribe to SSE events, map event keys to progress % and messages
4. On `COMPLETE` event: set `designSystemContent`, set `pageState` to `'result'`
5. Auto-save to project via `ProjectService.saveDesignSystem(projectId, content)`

**On "Generate Prototypes" click:**
1. Navigate to `/projects/:id/ux-design/prototypes`

**On "Regenerate" click:**
1. Reset `designSystemContent` to null
2. Set `pageState` back to `'review'`
3. Clear saved state

---

## Backend Contract (Spring Boot)

### New Endpoint Required

```
POST /api/projects/{projectId}/design-system/generate
Content-Type: text/event-stream (SSE)
```

**SSE Event Format:**
```
data: {"event": "ANALYZING_PRD", "progress": 20, "message": "Analyzing PRD requirements..."}
data: {"event": "COMPLETE", "progress": 100, "content": "[full design system response]"}
```

**What Spring Boot sends to the Vertex AI Agent:**
- The full PRD content from `project.prdContent`
- The template metadata JSON from `project.selectedTemplateId` (load from DB or file)
- The template `promptHint` field from `metadata.json` — this is the key prompt context

**New DB Column Required:**
```sql
ALTER TABLE projects ADD COLUMN design_system_content TEXT;
```

---

## Visual Design Notes for CCC

These notes ensure the implementation stays consistent with the existing design language:

1. **Card style** — all panels use `background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px 24px;` — same as `.ai-section` in planning-analysis

2. **Section labels** — uppercase labels like "COLOR SYSTEM", "TYPOGRAPHY" match the "UX DESIGN PROGRESS" label style: `font-size: 11px; font-weight: 600; color: var(--muted-foreground); text-transform: uppercase; letter-spacing: 0.5px;`

3. **Source badge** — the Claude badge on the result header uses the existing `.source-claude` class already defined in planning-analysis.component.ts

4. **Action bar** — copy the exact `action-bar`, `action-bar-content`, `selected-info`, `selected-thumbnail`, `selected-details` CSS classes from template-gallery.component.ts — do not reinvent

5. **Progress bar** — copy the `.gemini-progress-bar` / `.gemini-progress-fill` pattern from planning-analysis.component.ts

6. **Skeleton loading** — use the existing skeleton animation pattern from template-gallery.component.ts while project and template data loads

7. **Color swatches** — 24px circles using `border-radius: 50%`, `width: 24px`, `height: 24px`, `background-color: [hex]`, `border: 1px solid var(--border)`. Add a subtle `box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1)` so very light colors are visible against white backgrounds.

8. **Component pills** — the component name badges use `var(--muted)` background, `var(--foreground)` text, same padding and border-radius as `.tag-badge` but without the primary color tint.

---

## Acceptance Criteria

- [ ] Page lands in Review state after clicking "Generate Design System" — no agent call fires
- [ ] PRD card shows project name and PRD date
- [ ] Template card shows thumbnail, name, and tag badge
- [ ] "Start Design System" button fires the SSE endpoint
- [ ] Progress bar increments smoothly through the event sequence
- [ ] Progress messages update with each SSE event
- [ ] Result renders with all four sections: Color System, Typography, Components, Layout
- [ ] Color swatches display correctly for both light and dark hex values
- [ ] Result is auto-saved to `projects.design_system_content` on completion
- [ ] "Regenerate" button returns to Review state
- [ ] Action bar slides up after save with "Generate Prototypes" button
- [ ] Clicking "Generate Prototypes" navigates to prototype route
- [ ] Prototype page shows Coming Soon with stepper at Step 3
- [ ] Returning to the page when result already exists skips straight to Result state
- [ ] UX stepper shows Step 1 completed (checkmark), Step 2 active on this page

---

## Open Questions / Decisions Deferred

1. **Agent response format** — the spec assumes the agent returns structured Markdown or JSON that maps to the four sections. The actual prompt and response shape needs to be validated against the deployed `design_system_agent` before frontend implementation begins. The color/typography/component data can largely be sourced directly from the template `metadata.json` rather than the agent — consider having the agent supplement/override rather than generate from scratch.

2. **Download format** — the download button is included in the spec but the format (Markdown vs JSON vs PDF) is TBD.

3. **Error handling** — if the SSE stream fails mid-generation, the spec follows the same pattern as Planning & Analysis: show partial result if any content received, snackbar with "Generation interrupted" message, offer Regenerate.
