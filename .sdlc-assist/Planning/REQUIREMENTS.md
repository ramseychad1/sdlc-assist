# SDLC Assist - Requirements

## 1. Product Overview

**SDLC Assist** is an enterprise web application that guides teams through structured software development lifecycle phases. Users create and manage projects, each progressing through SDLC phases (Planning & Analysis, Design, Implementation, Testing & Integration, Maintenance). The application uses form-driven AI (powered by Anthropic Claude) to generate, expand, and refine structured requirements documents — not conversational AI.

### Target Audience
- Enterprise / organization-wide usage
- Flat user structure (no teams or org hierarchy)
- Three user roles: Admin, Product Manager, Viewer

---

## 2. User Roles & Permissions

| Role | Projects | Sections | Admin Panel | User Menu |
|------|----------|----------|-------------|-----------|
| **Admin** | Create, view, edit, delete all | Edit all sections | Full access (manage users, roles, settings) | Profile, Admin Settings, Logout |
| **Product Manager** | Create, view, edit own/assigned | Edit sections in their projects | No access | Profile, Logout |
| **Viewer** | View only | Read-only access | No access | Profile, Logout |

---

## 3. Authentication

- **Method**: Spring Security with form-based login and server-side sessions
- **Credentials**: Username/password stored in the application database
- **Session management**: HTTP session, cookie-based
- **Registration**: Admin creates user accounts (no self-registration for MVP)

---

## 4. User Interface Layout

### 4.1 Overall Layout
- **Side navigation** (left): collapsible sidebar
- **Header** (top): app logo, breadcrumbs, user menu
- **Footer** (bottom): copyright, version info, help links
- **Main content area** (center-right): page content

### 4.2 Side Navigation Contents
- Project list (all projects user has access to)
- SDLC phase links (within selected project)
- Collapsible toggle to maximize content area
- "New Project" quick-create button

### 4.3 Header
- Application logo and name
- Breadcrumb trail (e.g., Dashboard > Project Name > Planning & Analysis)
- User menu (top-right):
  - Profile info (name, role)
  - Admin Settings (Admin role only)
  - Logout

### 4.4 Footer
- Copyright notice
- Application version
- Help / support links

### 4.5 Progress Indicator
- Visual indicator showing which SDLC phase the current project is in
- Displayed in the project layout (above or alongside the content area)

---

## 5. Main User Flow

```
Login → Dashboard → Select/Create Project → AI Wizard → Review Generated Requirements → Edit/Refine Sections → Export
```

### 5.1 Login
- Form-based login page (username + password)
- Redirect to Dashboard on success

### 5.2 Dashboard
- Table/list view of all projects (sortable columns: name, date, status, owner)
- "New Project" button opens create dialog
- Click a project row to enter that project

### 5.3 Project View
- Side nav shows SDLC phase links for the selected project
- **Planning & Analysis** — active, functional
- **Design, Implementation, Testing & Integration, Maintenance** — "Coming Soon" with lock icon and tooltip
- Progress indicator shows current phase

### 5.4 Planning & Analysis Phase
- Contains the Requirements Gathering workflow
- Fixed 5 sections displayed as editable cards:
  1. Project Description
  2. Functional Requirements
  3. Non-Functional Requirements
  4. User Stories
  5. Acceptance Criteria
- Each section: Markdown textarea with manual save button
- AI assist button per section (Phase 2+)

---

## 6. AI Features (Phase 2+)

### 6.1 Multi-Step Wizard
A guided wizard that collects high-level project information before AI generates the full requirements document:

| Step | Fields |
|------|--------|
| **1. Project Overview** | Project name, brief summary, industry/domain |
| **2. Goals & Objectives** | Business goals, success criteria, KPIs |
| **3. Users & Personas** | Who will use the system, user personas, stakeholder roles |
| **4. Constraints & Context** | Technical limitations, budget, timeline, compliance needs |

After completing the wizard, AI generates all 5 requirement sections as a complete draft.

### 6.2 Per-Section AI Assist
- **Generate**: Create section content from scratch based on project context
- **Expand**: Add detail and depth to existing content
- **Refine**: Improve quality, clarity, and completeness of existing content
- AI is form-driven: processes structured inputs, produces structured outputs
- Streaming response populates the section textarea progressively

---

## 7. Integrations (Phase 2+)

### 7.1 Jira Export
- Export user stories and requirements as Jira issues/epics
- Map requirement sections to Jira issue types
- Configuration for Jira instance URL and authentication

---

## 8. Phased Delivery

### Phase 1: Core Foundation (Current Scope)
- Authentication & authorization (Spring Security, form login, 3 roles)
- Project CRUD (create, list, view, edit, delete)
- Dashboard with project table/list view
- Side navigation with project list and SDLC phase links
- Header with breadcrumbs, user menu; footer with version info
- Progress indicator for SDLC phases
- SDLC phase tabs (Planning & Analysis active, others "Coming Soon")
- Requirements sections: 5 fixed sections with Markdown textarea + manual save
- **No AI features in Phase 1**

### Phase 2: AI Integration
- Multi-step wizard for full document generation
- Per-section AI assist (Generate / Expand / Refine)
- Streaming AI responses
- Anthropic Claude integration via Java SDK

### Phase 3: Integrations & Expansion
- Jira export
- Additional SDLC phases (Design, Implementation, etc.)
- Enhanced reporting and analytics

---

## 9. Non-Functional Requirements

- **Deployment**: Railway (two services: backend API + frontend SPA)
- **Database**: Supabase-hosted PostgreSQL
- **Performance**: Pages load within 2 seconds; AI streaming begins within 3 seconds
- **Browser support**: Modern browsers (Chrome, Firefox, Edge, Safari — latest 2 versions)
- **Responsive**: Desktop-first, functional on tablet (mobile not required for MVP)
- **Security**: OWASP top-10 protections, session-based auth, CORS configuration, input validation
