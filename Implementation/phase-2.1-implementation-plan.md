# Phase 2.1 Implementation Plan: Design Template Gallery

## Overview
Implement a data-driven template gallery that allows users to browse, preview, and select design templates for their projects. The gallery must be fully extensible — new templates can be added by updating only `index.json`, with zero code changes required.

---

## Implementation Order

### STEP 1: Database & Backend Foundation (30 min)

**1.1 Database Migration**
- Create `supabase/migrations/004_add_selected_template_id.sql`
- Add `selected_template_id VARCHAR(100)` nullable column to `projects` table
- Run migration locally against Supabase
- Verify column exists with `\d projects` in psql or via Supabase dashboard

**1.2 Backend Model Updates**
- Update `backend/src/main/java/com/sdlcassist/model/Project.java`
  - Add `@Column(name = "selected_template_id") private String selectedTemplateId;`
- Update `backend/src/main/java/com/sdlcassist/dto/ProjectDto.java`
  - Add `private String selectedTemplateId;` field
  - Update `from(Project project)` mapper to include it

**1.3 Create Template Selection DTO**
- Create `backend/src/main/java/com/sdlcassist/dto/TemplateSelectionRequest.java`
  - Single field: `@NotBlank String templateId`
  - Lombok annotations: `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`

**1.4 Backend Service Method**
- Add to `backend/src/main/java/com/sdlcassist/service/ProjectService.java`:
  ```java
  public Project selectTemplate(UUID projectId, String templateId, String username) {
      // Load project with ownership check (same pattern as savePrd)
      // Set project.setSelectedTemplateId(templateId)
      // Save and return
  }
  ```

**1.5 Backend Controller Endpoint**
- Add to `backend/src/main/java/com/sdlcassist/controller/ProjectController.java`:
  ```java
  @PutMapping("/{id}/template")
  public ResponseEntity<ProjectDto> selectTemplate(
      @PathVariable UUID id,
      @RequestBody @Valid TemplateSelectionRequest request,
      @AuthenticationPrincipal UserDetails userDetails) {
      Project project = projectService.selectTemplate(id, request.getTemplateId(), userDetails.getUsername());
      return ResponseEntity.ok(ProjectDto.from(project));
  }
  ```

**Verification:**
- `./mvnw clean compile` passes
- Backend starts without errors
- Can hit `PUT /api/projects/{id}/template` via Postman/curl and see `selectedTemplateId` in response

---

### STEP 2: Frontend Models & Service (20 min)

**2.1 TypeScript Models**
- Create `frontend/src/app/core/models/template.model.ts`
  - Define `TemplateIndex`, `TemplateEntry`, `TemplateMetadata` interfaces per spec
- Update `frontend/src/app/core/models/project.model.ts`
  - Add `selectedTemplateId?: string | null;`

**2.2 Template Service**
- Create `frontend/src/app/core/services/template.service.ts`
  - Injectable with `providedIn: 'root'`
  - Use `inject(HttpClient)`
  - Cache `index.json` in memory after first load (use a `ReplaySubject(1)` or `shareReplay(1)`)
  - Methods:
    - `getTemplates(): Observable<TemplateEntry[]>` — loads and returns templates array
    - `getMetadata(id: string): Observable<TemplateMetadata>` — loads specific metadata.json

**2.3 Update ProjectService**
- Add to `frontend/src/app/core/services/project.service.ts`:
  ```typescript
  selectTemplate(projectId: string, templateId: string): Observable<Project> {
    return this.http.put<Project>(
      `${environment.apiUrl}/projects/${projectId}/template`,
      { templateId },
      { withCredentials: true }
    );
  }
  ```

**Verification:**
- TypeScript compiles without errors
- Can inject `TemplateService` and call `getTemplates()` in a test component
- `assets/templates/index.json` is fetched successfully

---

### STEP 3: Gallery UI Components (45 min)

**3.1 Create DesignPhase Container**
- Create `frontend/src/app/features/project/design-phase/design-phase.component.ts`
  - Standalone component
  - Inline template that renders `<app-template-gallery>` child
  - Keep structure simple for now — will add AI generation panel in Phase 2.2

**3.2 Create TemplateGallery Component**
- Create `frontend/src/app/features/project/design-phase/template-gallery/template-gallery.component.ts`
  - Inject `TemplateService`, `ProjectService`, `ActivatedRoute`
  - On init: load templates and current project
  - Render cards in CSS grid (3 columns desktop, 2 tablet, 1 mobile)
  - Show loading skeleton (3 placeholder cards)
  - Card design:
    - Thumbnail image (16:10 aspect ratio, object-fit: cover)
    - Template name (bold, 14px)
    - Tag badge (use existing app badge style)
    - Description (12px, muted, 2-line clamp with `text-overflow: ellipsis`)
    - Two buttons: "Preview" (outline) and "Select" (primary)
    - If selected: show "✓ Selected" badge + blue ring border
  - Button handlers:
    - `onPreview(template)` — emit event to show lightbox
    - `onSelect(template)` — call `projectService.selectTemplate()`, show toast, update state

**3.3 Empty State**
- If `templates.length === 0`, show centered empty state:
  - Icon: `package-open` (Lucide)
  - Text: "No templates available yet."

**Verification:**
- Gallery loads and displays template cards from `index.json`
- Clicking "Select" updates the project and shows success toast
- Card shows "✓ Selected" state after selection

---

### STEP 4: Lightbox Component (30 min)

**4.1 Create TemplateLightbox Component**
- Create `frontend/src/app/features/project/design-phase/template-lightbox/template-lightbox.component.ts`
  - `@Input() template: TemplateEntry | null`
  - `@Input() isOpen: boolean`
  - `@Output() close = new EventEmitter<void>()`
  - `@Output() select = new EventEmitter<string>()` (emits template ID)
  - Full-screen overlay (fixed positioning, z-index 50)
  - Dark backdrop (rgba(0,0,0,0.85))
  - Centered container with:
    - Header: template name + tag badge + close button (X icon)
    - Image: `preview.png` at natural aspect ratio (max-width 90vw, max-height 85vh)
    - Footer: description (left) + "Select This Template" CTA (right)
  - Close handlers:
    - X button click → `close.emit()`
    - Escape key (`@HostListener('document:keydown.escape')`) → `close.emit()`
    - Click on backdrop (outside image) → `close.emit()`
  - Smooth fade-in/fade-out animation (150ms)

**4.2 Integrate with Gallery**
- Add lightbox to `template-gallery.component.html`
- State: `selectedForPreview: TemplateEntry | null = null`
- Show lightbox when `selectedForPreview` is non-null
- Handle `(select)` event from lightbox → call `onSelect()`, close lightbox

**Verification:**
- Clicking "Preview" opens lightbox with full-res image
- Escape key closes lightbox
- Clicking backdrop closes lightbox
- "Select This Template" button works and closes lightbox

---

### STEP 5: Routing & Navigation (20 min)

**5.1 Update Routes**
- Modify `frontend/src/app/app.routes.ts`
  - Replace the placeholder `/projects/:id/design` route (or update it)
  - Lazy-load `DesignPhase` component
  - Set default child route to redirect to `design` (or make it the route component)

**5.2 Update Project Layout Sidebar**
- Modify `frontend/src/app/features/project/project-layout.component.ts`
  - Update "Design" phase button logic:
    - If `project.prdContent` is null/empty: disabled, show lock icon, tooltip "Complete Planning & Analysis first"
    - If `project.prdContent` exists: enabled, clickable, routes to `/projects/:id/design`

**5.3 Remove Old Placeholder Design Routes**
- Delete or update the existing `design-layout.component.ts`, `ux-design.component.ts`, `technical-design.component.ts` that were placeholders
- These were temporary "Coming Soon" stubs — replace with the real Phase 2.1 implementation

**Verification:**
- Design tab appears unlocked when PRD is complete
- Clicking Design tab navigates to `/projects/:id/design` and shows gallery
- Design tab shows lock icon when PRD is empty

---

### STEP 6: Phase Progress Indicator (15 min)

**6.1 Update Phase Bar Logic**
- In `project-layout.component.ts`, update the phase progress calculation:
  - Step 2 (Design) shows `active` state when route includes `/design`
  - Step 2 shows `done` state (checkmark) when `project.selectedTemplateId` is non-null

**Verification:**
- Progress bar highlights "Design" when on `/projects/:id/design`
- After selecting a template, "Design" step shows checkmark
- Progress percentage updates accordingly

---

### STEP 7: Testing & Polish (20 min)

**7.1 Extensibility Test**
- Manually add a second entry to `assets/templates/index.json` (duplicate `shadcn-template` with a different ID)
- Refresh app — verify second card appears with zero code changes
- Remove the test entry

**7.2 Responsive Design Check**
- Test gallery on mobile (1 column), tablet (2 columns), desktop (3 columns)
- Verify lightbox works on all screen sizes
- Check touch interactions (tap outside to close)

**7.3 Error Handling**
- Test what happens if `index.json` fails to load (show error message)
- Test what happens if template selection API call fails (show error toast)

**7.4 Loading States**
- Verify skeleton loaders show while fetching templates
- Verify button loading spinners during API calls

**Verification:**
- All items in spec's verification checklist pass
- No TypeScript errors
- No console errors in browser
- Smooth UX with proper loading/error states

---

## File Structure Summary

### New Files (14 total)
```
supabase/migrations/004_add_selected_template_id.sql

backend/src/main/java/com/sdlcassist/dto/TemplateSelectionRequest.java

frontend/src/app/core/models/template.model.ts
frontend/src/app/core/services/template.service.ts

frontend/src/app/features/project/design-phase/design-phase.component.ts
frontend/src/app/features/project/design-phase/template-gallery/template-gallery.component.ts
frontend/src/app/features/project/design-phase/template-lightbox/template-lightbox.component.ts
```

### Modified Files (8 total)
```
backend/src/main/java/com/sdlcassist/model/Project.java
backend/src/main/java/com/sdlcassist/dto/ProjectDto.java
backend/src/main/java/com/sdlcassist/controller/ProjectController.java
backend/src/main/java/com/sdlcassist/service/ProjectService.java

frontend/src/app/core/models/project.model.ts
frontend/src/app/core/services/project.service.ts
frontend/src/app/features/project/project-layout.component.ts
frontend/src/app/app.routes.ts
```

### Deleted Files (3 total — old placeholders)
```
frontend/src/app/features/project/design/design-layout.component.ts
frontend/src/app/features/project/design/ux-design.component.ts
frontend/src/app/features/project/design/technical-design.component.ts
```

---

## Estimated Time: 3-4 hours

### Breakdown:
- Step 1 (Backend): 30 min
- Step 2 (Models & Service): 20 min
- Step 3 (Gallery): 45 min
- Step 4 (Lightbox): 30 min
- Step 5 (Routing): 20 min
- Step 6 (Progress): 15 min
- Step 7 (Testing): 20 min

**Total: ~3 hours active development**

---

## Critical Success Factors

1. **Data-Driven Architecture**: Gallery must read from `index.json` — no hardcoded template IDs in TS/HTML
2. **Extensibility**: Adding a new template = edit only `index.json` (test this!)
3. **Ownership Checks**: Backend must verify user owns the project before allowing template selection
4. **PRD Gate**: Design phase only accessible when `prdContent` is non-null
5. **Visual Consistency**: Match existing shadcn/Lucide/Inter design language
6. **Responsive**: Gallery must work on mobile, tablet, desktop
7. **Error Handling**: Graceful failures for missing assets, API errors, network issues

---

## Next Steps After Approval

Once you approve this plan, I'll proceed with implementation in the order outlined above. Each step will be verified before moving to the next. I'll commit changes in logical chunks (e.g., "Add backend template selection", "Add template gallery UI") rather than one massive commit at the end.

Should I proceed with Step 1 (Database & Backend)?
