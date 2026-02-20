# Phase 2.5.1 — Prototype Refinement Chat
## SDLC Assist — UX & Architecture Specification

**Document Type:** UX & Architecture Specification  
**Target Component:** Prototype View Modal (existing) — chat panel addition  
**Depends On:** Phase 2.4 — Design Prototype Preparation (screens confirmed + prototypes generated)  
**Date:** February 2026  
**Status:** Ready for Implementation

---

## Overview

Phase 2.5.1 adds an interactive chat refinement panel to the existing prototype view modal. After a prototype is generated, the user can open the modal, type refinement instructions in natural language, and the agent updates the prototype live in the right panel. The user can iterate through multiple refinements before clicking "Save" to persist the final version.

The key architectural enabler is Vertex AI's managed session state — the same session used to generate the prototype is kept alive and reused for all subsequent refinement turns, giving the agent full memory of what it built.

---

## What Already Exists (from Phase 2.4)

From the screenshots, the following is already implemented and must not be broken:

- Screen card grid with type icons, complexity badges, epic name, user role
- "View Prototype" button on each card opening a modal
- Modal left panel: screen metadata (Epic, Type, Complexity, User Role, description)
- Modal left panel: "Saved" status indicator and "Regenerate" button
- Modal right panel: browser chrome mockup rendering prototype HTML in an iframe
- The prototype is already generated and saved to `project_screens.prototype_content`

---

## Modal Layout — Updated for Phase 2.5.1

The existing modal gains a chat section below the metadata panel on the left side. The right panel (prototype preview) is unchanged.

```
┌─────────────────────────────────────────────────────────────────────┐
│  [DASHBOARD]  SDLC Website Homepage                    [↗] [X]     │
├──────────────────────┬──────────────────────────────────────────────┤
│  LEFT PANEL          │  RIGHT PANEL                                 │
│  (existing)          │  (existing — unchanged)                      │
│                      │                                              │
│  EPIC                │  ┌─ prototype:// ──────────────────────────┐ │
│  1. Website...       │  │                                         │ │
│                      │  │   [rendered prototype HTML]             │ │
│  TYPE                │  │                                         │ │
│  Dashboard           │  │                                         │ │
│                      │  │                                         │ │
│  COMPLEXITY          │  │                                         │ │
│  Low                 │  │                                         │ │
│                      │  │                                         │ │
│  USER ROLE           │  │                                         │ │
│  User                │  │                                         │ │
│                      │  │                                         │ │
│  [description text]  │  │                                         │ │
│                      │  │                                         │ │
│  ✓ Saved             │  │                                         │ │
│  ↺ Regenerate        │  │                                         │ │
│                      │  └─────────────────────────────────────────┘ │
│  ─────────────────   │                                              │
│                      │                                              │
│  REFINE              │                                              │
│  ┌────────────────┐  │                                              │
│  │ chat history   │  │                                              │
│  │                │  │                                              │
│  │ [user msg]     │  │                                              │
│  │ [agent msg]    │  │                                              │
│  │                │  │                                              │
│  └────────────────┘  │                                              │
│  ┌────────────────┐  │                                              │
│  │ Type a refine- │  │                                              │
│  │ ment...     [→]│  │                                              │
│  └────────────────┘  │                                              │
│                      │                                              │
│  [Save Changes]      │                                              │
│  [Discard Changes]   │                                              │
│                      │                                              │
└──────────────────────┴──────────────────────────────────────────────┘
```

---

## Chat Panel Component Details

### Section Divider

A thin horizontal rule separates the existing metadata from the new chat section. Label: "REFINE" — 11px uppercase, 600 weight, `var(--muted-foreground)`, letter-spacing 0.5px. Matches the existing "UX DESIGN PROGRESS" label style.

### Chat History Area

- Scrollable container, max-height calculated to fill remaining left panel height
- Overflow-y: auto
- Empty state: subtle centered text "Send a message to start refining this prototype." in `var(--muted-foreground)`, 12px, italic
- Each message bubble:
  - **User message** — right-aligned, `var(--primary)` background, white text, 13px, border-radius 12px 12px 2px 12px, padding 8px 12px, max-width 85%
  - **Agent message** — left-aligned, `var(--muted)` background, `var(--foreground)` text, 13px, border-radius 12px 12px 12px 2px, padding 8px 12px, max-width 85%
  - **Thinking indicator** — when agent is processing: three animated dots in a muted bubble (CSS dot animation, same visual as a typing indicator)
- Auto-scrolls to bottom on each new message

### Chat Input

- Textarea (not input) — allows multi-line refinement instructions
- Placeholder: "Describe a change to this prototype..."
- Min-height: 60px, max-height: 120px, auto-resize
- Border: `1px solid var(--border)`, radius `var(--radius)`, background `var(--background)`
- Focus: `border-color: var(--ring)`, `box-shadow: 0 0 0 2px var(--ring)`
- Send button: icon-only, `arrow-right` lucide, 16px, `var(--primary)` color, positioned inside the textarea bottom-right corner
- Keyboard shortcut: `Ctrl+Enter` or `Cmd+Enter` submits (Enter alone adds a new line)
- Disabled when agent is processing

### Save / Discard Buttons

These buttons appear **only when there are unsaved refinements** — i.e., the prototype in the preview differs from the last saved version in the database.

- **Save Changes** — `btn btn-primary btn-sm`, full width, `save` lucide icon. On click: saves current `prototype_content` to DB, clears unsaved state, updates "Saved" indicator to show new timestamp.
- **Discard Changes** — `btn btn-ghost btn-sm`, full width, `rotate-ccw` lucide icon, `var(--muted-foreground)` text. On click: reverts the iframe to the last saved prototype, clears chat history for this session, resets unsaved state.

When no unsaved changes exist (initial state or after Save), these buttons are hidden and the existing "✓ Saved" indicator is visible as before.

---

## State Management

### Unsaved Changes State

```typescript
// New signals added to the modal component
chatMessages = signal<ChatMessage[]>([]);
isRefining = signal(false);           // agent is processing
hasUnsavedChanges = signal(false);    // prototype differs from saved version
currentPrototypeHtml = signal<string>('');  // live working copy (may differ from saved)
savedPrototypeHtml = signal<string>('');    // last saved version
```

### ChatMessage Model

```typescript
interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}
```

### Unsaved Changes Logic

```typescript
// When agent returns refined prototype:
currentPrototypeHtml.set(refinedHtml);
hasUnsavedChanges.set(true);
// → iframe re-renders with new HTML
// → Save/Discard buttons appear
// → "✓ Saved" indicator hides

// When user clicks Save:
projectService.savePrototype(projectId, screenId, currentPrototypeHtml()).subscribe({
  next: () => {
    savedPrototypeHtml.set(currentPrototypeHtml());
    hasUnsavedChanges.set(false);
    // → "✓ Saved" indicator reappears with updated timestamp
    // → Save/Discard buttons hide
  }
});

// When user clicks Discard:
currentPrototypeHtml.set(savedPrototypeHtml());
hasUnsavedChanges.set(false);
chatMessages.set([]);
// → iframe reverts to saved HTML
// → chat history cleared
// → Save/Discard buttons hide
```

### Modal Close Guard

If `hasUnsavedChanges()` is true and the user clicks the X to close the modal, show a confirmation dialog:

```
"You have unsaved refinements.
 Closing will discard your changes."

[Keep Editing]  [Discard & Close]
```

Use Angular's existing unsaved changes guard pattern already in the codebase (the `HasUnsavedChanges` guard is already implemented in `planning-analysis.component.ts`).

---

## Backend Contract

### New Endpoint: Send Refinement Message

```
POST /api/projects/{projectId}/screens/{screenId}/refine
Content-Type: application/json

Request body:
{
  "message": "Move the navigation to the top and make it horizontal"
}

Response (SSE stream):
data: {"event": "THINKING", "message": "Analyzing your request..."}
data: {"event": "COMPLETE", "refinedHtml": "<!DOCTYPE html>..."}
```

Spring Boot handles all session management invisibly. The frontend sends a plain message string — it never knows about `vertex_session_id`. That's a backend concern only.

### Spring Boot Session Management Logic

```java
// On refine request:
// 1. Load screen from DB → get vertex_session_id
// 2. If vertex_session_id is null → session was never created (shouldn't happen after generation)
// 3. Try to send message to existing Vertex AI session
// 4. If session expired (Vertex AI returns 404/session-not-found):
//    → Create new session
//    → Replay context: send original generation prompt + current prototype_content
//    → Then send the user's refinement message
//    → Save new session_id to project_screens.vertex_session_id
// 5. Stream refined HTML back to frontend via SSE
// 6. Do NOT auto-save to DB — frontend holds the refined HTML until user clicks Save
```

### New Endpoint: Save Refined Prototype

```
PATCH /api/projects/{projectId}/screens/{screenId}/prototype
Content-Type: application/json

Request body:
{
  "prototypeContent": "<!DOCTYPE html>..."
}

Response:
{
  "id": "...",
  "updatedAt": "2026-02-20T14:30:00Z"
}
```

This is a dedicated save endpoint separate from the full screen update — it only touches `prototype_content` and `updated_at`.

### DB Column Already Required (confirm exists from Phase 2.4)

```sql
-- Should already exist from Phase 2.4:
project_screens.vertex_session_id VARCHAR(255)
project_screens.prototype_content TEXT
project_screens.updated_at TIMESTAMP
```

---

## What the Agent Receives Per Refinement Turn

Because Vertex AI session state maintains full conversation history, Spring Boot only needs to send the user's new message. The agent already has in its session memory:

- The original generation prompt (PRD + design system + screen definition)
- The prototype HTML it generated
- All prior refinement turns in this session

**The message sent to Vertex AI:**
```
User: Move the navigation to the top and make it horizontal.
      Return only the complete updated HTML. No explanation.
```

**Critical instruction to include in system prompt / first turn:**
The `prototype_builder_agent` system prompt must include this instruction so it applies to all refinement turns:

```
When asked to make changes to a prototype:
- Return ONLY the complete updated HTML document
- Do not explain what you changed
- Do not use markdown code fences
- Preserve all existing styles and structure unless specifically asked to change them
- Your response must start with <!DOCTYPE html> and end with </html>
```

---

## Visual Design Notes for CCC

1. **Left panel scrolling** — the left panel needs `overflow-y: auto` so it scrolls independently of the right panel. The metadata section stays at the top; the chat section fills the remaining space below it. Use `flex-direction: column` on the left panel with the chat history area having `flex: 1` and `overflow-y: auto`.

2. **Chat bubble alignment** — user messages right-aligned with `margin-left: auto`, agent messages left-aligned with `margin-right: auto`. Use a wrapping div with `display: flex; flex-direction: column; gap: 8px;` for the message list.

3. **Thinking indicator** — three dots with staggered CSS animation:
```css
.dot { width: 6px; height: 6px; border-radius: 50%; background: var(--muted-foreground); animation: bounce 1.2s ease-in-out infinite; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
```

4. **iframe re-render** — when `currentPrototypeHtml` signal updates, use Angular's `DomSanitizer.bypassSecurityTrustHtml()` pattern already in use for the prototype preview. Set the iframe `srcdoc` attribute via binding: `[attr.srcdoc]="sanitizedHtml()"`.

5. **Save/Discard button transition** — use `@if (hasUnsavedChanges())` to show/hide. Add a subtle `animation: fadeIn 0.2s ease-out` so the buttons don't flash in abruptly.

6. **Textarea auto-resize** — use a `(input)` event handler that sets `element.style.height = 'auto'` then `element.style.height = element.scrollHeight + 'px'`. Cap at `max-height: 120px` with `overflow-y: auto`.

7. **Modal width** — the existing modal may need to be slightly taller to accommodate the chat panel on the left. The right panel (prototype iframe) should maintain its current height. Left panel should scroll internally rather than expanding the modal height.

---

## Acceptance Criteria

### Chat Panel
- [ ] "REFINE" section label and divider appear below the Regenerate button
- [ ] Empty state message shows when no messages exist
- [ ] User can type a multi-line refinement instruction
- [ ] Ctrl+Enter / Cmd+Enter submits the message
- [ ] Thinking indicator appears while agent is processing
- [ ] Input is disabled while agent is processing
- [ ] User message appears right-aligned in primary color
- [ ] Agent response message appears left-aligned in muted style
- [ ] Chat history auto-scrolls to bottom on each new message

### Prototype Update
- [ ] Right panel iframe updates with refined HTML after agent responds
- [ ] Update happens without closing or reloading the modal
- [ ] Save/Discard buttons appear after first refinement
- [ ] "✓ Saved" indicator hides when unsaved changes exist
- [ ] Multiple refinement turns work correctly in sequence

### Save / Discard
- [ ] Save persists current prototype HTML to DB via PATCH endpoint
- [ ] Save updates the "✓ Saved" timestamp
- [ ] Save/Discard buttons hide after saving
- [ ] Discard reverts iframe to last saved prototype HTML
- [ ] Discard clears the chat history
- [ ] Discard hides Save/Discard buttons

### Session Management
- [ ] Refinement works immediately after generation (same session)
- [ ] Refinement works after page refresh (session resumed or replayed)
- [ ] Expired session is handled gracefully — context replayed, no error shown to user
- [ ] Frontend never exposes session_id to the user

### Modal Close Guard
- [ ] Closing modal with unsaved changes shows confirmation dialog
- [ ] "Keep Editing" dismisses dialog and keeps modal open
- [ ] "Discard & Close" discards changes and closes modal

---

## Open Questions / Deferred to Future Phase

1. **Chat history persistence** — currently chat history is in-memory only and clears when the modal closes or Discard is clicked. A future phase could persist chat turns to a `screen_chat_history` table so the user can review the refinement history later.

2. **Refinement history / versions** — currently only the latest saved prototype is stored. A future phase could implement versioning so the user can roll back to a prior saved state.

3. **Applying a refinement to multiple screens** — a power user feature where a refinement instruction ("make all headers consistent") is applied across all screens in one action. Deferred.

4. **Chat panel on mobile** — the two-panel modal layout is not designed for small screens. Deferred.
