# PHASE 2.5.2 — Complete UX Design & Technical Design Unlock

**Status:** Ready for Implementation  
**Depends On:** Phase 2.5.1 (Screen Generation) — Complete  
**Unlocks:** Phase 2.6 (Technical Design)

---

## Overview

This phase closes out the UX Design workflow. It gives the user a clear signal that they can move to Technical Design, warns them (without blocking) if screen coverage is incomplete, and unlocks the Technical Design tab as a "Coming Soon" stub ready for Phase 2.6 implementation.

---

## Core Philosophy

No modals. No blockers. The user is a professional — surface the information inline and let them decide.

---

## 1. Sub-Stepper — Step 4 Rename

Rename Step 4 in the UX Design sub-stepper:

- **Current label:** `Acceptance`
- **New label:** `Complete`

---

## 2. Step 4 — Enable/Disable Rules

| Condition | Step 4 State |
|---|---|
| 0 screens generated | Disabled — greyed out, not clickable |
| ≥ 1 screen generated & saved | Enabled — clickable, visually active |
| UX Design marked complete | Renders as ✓ checkmark — no longer a button |

The enable state should be a **computed signal/observable** from the screen store — not a one-time check — so it reacts in real time as screens are generated.

```typescript
// Reactive enable logic
step4Enabled = computed(() => this.generatedScreenCount() >= 1);
```

---

## 3. Inline Warning Banner

### When to Show

Display the warning banner when **some but not all** screens have been prototyped:

```typescript
showWarning = screenCount > 0 && generatedCount > 0 && generatedCount < screenCount;
```

### Placement

Below the UX Design sub-stepper, **above the screen cards grid** — same row as the existing "6 screens confirmed" status bar.

### Appearance

```
┌──────────────────────────────────────────────────────────────────────┐
│ ⚠️  X of Y screens have not been prototyped. Proceeding to           │
│    Technical Design without full screen coverage may reduce the      │
│    accuracy of generated architecture and data models.               │
└──────────────────────────────────────────────────────────────────────┘
```

**Design details:**
- Amber/warning color — use the existing alert/warning component style
- No dismiss/close button — it is data-driven and disappears automatically when all screens are generated
- No action buttons inside the banner — information only
- Does NOT affect the Step 4 button state in any way

---

## 4. Step 4 Click — Complete UX Design Action

No modal. Clicking Step 4 when enabled triggers a direct action:

**Sequence:**
1. Call `POST /api/projects/{projectId}/complete-phase` (see API contract below)
2. On success:
   - Step 4 node flips to ✓ checkmark
   - UX Design progress bar advances to **100%**
   - Technical Design tab transitions from locked → unlocked (lock icon removed)
   - Brief unlock visual cue on the Technical Design tab (e.g., fade-in or badge flash)
3. User navigates to Technical Design on their own — no forced redirect

---

## 5. Technical Design Tab — Coming Soon State

When the user clicks the now-unlocked Technical Design tab, they see a clean empty state. This component is a **named stub** (`TechnicalDesignComponent`) that Phase 2.6 will replace — not an inline `*ngIf`.

### Layout

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│           [🔧 Blueprint/Wrench Icon]                │
│                                                     │
│           Technical Design                         │
│           Coming Soon                               │
│                                                     │
│   This phase will generate your technical           │
│   architecture, data models, and API contracts      │
│   based on your UX prototypes.                      │
│                                                     │
│        [ ← Back to UX Design ]                     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Design details:**
- Centered card layout — consistent with other empty states in the app
- Icon in muted/secondary color — not primary, not an error state
- "Back to UX Design" is a ghost/secondary button
- No disabled form fields, no fake progress indicators — clean and honest

---

## 6. Database Changes

Add `technical_design_status` to the projects table if not already present.

```sql
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS technical_design_status VARCHAR(20) 
  NOT NULL DEFAULT 'LOCKED';

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS ux_design_completed_at TIMESTAMP;
```

**Status values (future-proofed for Phase 2.6+):**

| Value | Meaning |
|---|---|
| `LOCKED` | UX Design not yet complete |
| `UNLOCKED` | UX Design complete, Technical Design not started |
| `IN_PROGRESS` | Technical Design generation running |
| `COMPLETE` | Technical Design complete |

When UX Design is completed:

```sql
UPDATE projects 
SET ux_design_status = 'COMPLETE',
    ux_design_completed_at = NOW(),
    technical_design_status = 'UNLOCKED'
WHERE id = :projectId;
```

---

## 7. API Contract

### Complete Phase

**POST** `/api/projects/{projectId}/complete-phase`

**Request:**
```json
{
  "phase": "UX_DESIGN"
}
```

**Response 200:**
```json
{
  "projectId": "uuid",
  "phase": "UX_DESIGN",
  "status": "COMPLETE",
  "completedAt": "2026-02-20T12:00:00Z",
  "unlockedPhases": ["TECHNICAL_DESIGN"]
}
```

**Response 400** (if minimum threshold not met — belt-and-suspenders server validation):
```json
{
  "error": "INSUFFICIENT_SCREENS",
  "message": "At least one screen prototype must be generated before completing UX Design."
}
```

---

## 8. Angular Component Changes

| Component | Change |
|---|---|
| `ux-design-stepper.component` | Rename Step 4 label; add click handler; bind enabled state to `step4Enabled` signal |
| `ux-design.component` | Orchestrate `showWarning` logic; handle `complete-phase` API call; update tab lock state on success |
| `warning-banner.component` | New component (or reuse existing alert pattern) — inline amber warning, no dismiss |
| `technical-design.component` | **New stub component** — Coming Soon UI, "Back to UX Design" button |
| `project-tabs.component` | Drive Technical Design tab lock/unlock from `technical_design_status` on the project record — must survive page refresh |

---

## 9. Handoff Notes

- The `technical_design_status` field must be returned on the project DTO so the Angular app can correctly render tab lock state on initial page load and refresh
- `TechnicalDesignComponent` should be a proper named route component — Phase 2.6 replaces its content, not the routing or tab wiring
- The warning banner's screen count should query screens where `prototype_html IS NULL` for the project — same data already available from the Phase 2.5.1 screen store
- Do not use a one-time `ngOnInit` check for Step 4 enabled state — bind to a reactive signal so it updates live as the user generates screens in the same session
