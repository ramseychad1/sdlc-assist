# SDLC Assist - Product Requirements Breakdown

## Executive Summary
SDLC Assist is a web application designed to standardize and streamline requirements gathering for product managers through AI-assisted PRD generation. The MVP focuses on the Planning and Analysis phase of the software development lifecycle, utilizing Claude AI to transform raw meeting notes, transcripts, and documents into structured Product Requirements Documents following Agile methodology (Epics, Stories, Tasks).

---

## EPIC 1: User Authentication and Authorization System

**As a** system administrator  
**I want to** manage user access to SDLC Assist with role-based permissions  
**So that** only authorized personnel can create and manage projects while maintaining appropriate access controls for viewers and stakeholders

**Priority:** Critical  
**Dependencies:** None (foundational requirement)

### STORY 1.1: User Login with Session Management

**Scenario:** Authorized user logs into SDLC Assist with valid credentials

**Given:** A registered user is on the login page  
**When:** The user enters their correct username and password and submits the form  
**Then:** The user is authenticated, a secure session is created, and they are redirected to the dashboard

**Acceptance Criteria:**
- Login form accepts username and password
- Successful authentication creates a session cookie with SameSite attributes
- Failed authentication displays clear error message
- Session persists across page refreshes
- Session expires after configurable timeout period
- CSRF protection is configured appropriately for session-based auth

#### Task 1.1.1: Create Login UI Component
**Area:** Frontend  
**Description:** Build Angular component for login form with username/password fields, validation, and error messaging using Angular Material components

#### Task 1.1.2: Implement Spring Security Authentication
**Area:** Backend  
**Description:** Configure Spring Security with session-based authentication, password encoder (BCrypt), and custom authentication provider

#### Task 1.1.3: Create User Entity and Repository
**Area:** Backend/Database  
**Description:** Define User JPA entity with fields (id, username, password_hash, display_name, email, role, created_at, updated_at) and corresponding repository interface

#### Task 1.1.4: Implement Session Management Configuration
**Area:** Backend  
**Description:** Configure session timeout, cookie settings (HttpOnly, Secure, SameSite), and session fixation protection in Spring Security

#### Task 1.1.5: Create Authentication API Endpoints
**Area:** Backend  
**Description:** Implement /api/auth/login and /api/auth/logout endpoints with appropriate request/response handling

#### Task 1.1.6: Implement Authentication Service Tests
**Area:** Testing  
**Description:** Create unit and integration tests for login flow, session creation, and error handling scenarios

---

### STORY 1.2: Role-Based Access Control

**Scenario:** Users access system features according to their assigned role

**Given:** A user is authenticated with a specific role (Admin, Product Manager, or Viewer)  
**When:** The user attempts to access a feature or resource  
**Then:** The system grants or denies access based on the user's role permissions

**Acceptance Criteria:**
- Three distinct roles exist: Admin, Product Manager, Viewer
- Admin can access all system features including user management
- Product Manager can create/edit/delete own projects and generate PRDs
- Viewer has read-only access to projects they're granted access to
- Unauthorized access attempts return 403 Forbidden response
- UI elements dynamically show/hide based on user role

#### Task 1.2.1: Define Role Enumeration and Permissions Matrix
**Area:** Backend  
**Description:** Create Role enum (ADMIN, PRODUCT_MANAGER, VIEWER) and document permission mappings for each role

#### Task 1.2.2: Implement Method-Level Security Annotations
**Area:** Backend  
**Description:** Apply @PreAuthorize and @PostAuthorize annotations to controller methods based on role requirements

#### Task 1.2.3: Create Authorization Service
**Area:** Backend  
**Description:** Implement service layer logic to check user permissions for specific resources (e.g., can user edit this project?)

#### Task 1.2.4: Implement Frontend Route Guards
**Area:** Frontend  
**Description:** Create Angular route guards that check user role before allowing navigation to protected routes

#### Task 1.2.5: Create Role-Based UI Component Rendering
**Area:** Frontend  
**Description:** Implement directives or services to conditionally display UI elements based on authenticated user's role

#### Task 1.2.6: Test Authorization Rules
**Area:** Testing  
**Description:** Create comprehensive tests for each role's access patterns, including boundary cases and unauthorized access attempts

---

### STORY 1.3: User Logout Functionality

**Scenario:** Authenticated user logs out of the application

**Given:** A user is currently logged in with an active session  
**When:** The user clicks the logout button in the user menu  
**Then:** The user's session is invalidated, they are redirected to the login page, and cannot access protected resources without re-authenticating

**Acceptance Criteria:**
- Logout button is visible in the header user menu
- Clicking logout invalidates the server-side session
- User is redirected to login page after logout
- Session cookie is cleared from browser
- Attempting to access protected routes after logout redirects to login

#### Task 1.3.1: Create Logout UI Component
**Area:** Frontend  
**Description:** Add logout option to user menu dropdown in header component

#### Task 1.3.2: Implement Logout API Endpoint
**Area:** Backend  
**Description:** Create POST /api/auth/logout endpoint that invalidates session and clears security context

#### Task 1.3.3: Implement Frontend Logout Service
**Area:** Frontend  
**Description:** Create Angular service to call logout endpoint, clear local state, and navigate to login page

#### Task 1.3.4: Handle Post-Logout Redirect
**Area:** Frontend  
**Description:** Ensure authentication interceptor redirects unauthenticated API calls to login page

#### Task 1.3.5: Test Logout Flow
**Area:** Testing  
**Description:** Verify session invalidation, cookie clearing, and post-logout authorization failures

---

## EPIC 2: Administrative User Management

**As a** system administrator  
**I want to** create, manage, and remove user accounts  
**So that** I can control who has access to SDLC Assist and maintain appropriate role assignments

**Priority:** High  
**Dependencies:** Epic 1 (User Authentication)

### STORY 2.1: Admin User Creation

**Scenario:** Administrator creates a new user account

**Given:** An administrator is logged into the admin panel  
**When:** The administrator fills out the new user form with username, email, display name, and role, then submits  
**Then:** A new user account is created with a system-generated temporary password, and the administrator can provide credentials to the new user

**Acceptance Criteria:**
- Admin panel is accessible only to users with Admin role
- Form validates username uniqueness and email format
- Temporary password is generated securely
- Success message displays new user credentials (username and temporary password)
- New user appears in the user management list
- System prevents duplicate usernames

#### Task 2.1.1: Create Admin Panel UI Layout
**Area:** Frontend  
**Description:** Build Angular module for admin panel with navigation to user management section using Angular Material layout components

#### Task 2.1.2: Create User Creation Form Component
**Area:** Frontend  
**Description:** Build form with fields for username, email, display name, role selection dropdown, with client-side validation

#### Task 2.1.3: Implement User Creation API Endpoint
**Area:** Backend  
**Description:** Create POST /api/admin/users endpoint with request validation and password generation logic

#### Task 2.1.4: Implement Password Generation Service
**Area:** Backend  
**Description:** Create service to generate secure random passwords with configurable complexity requirements

#### Task 2.1.5: Add Username Uniqueness Validation
**Area:** Backend  
**Description:** Implement database constraint and application-level validation to prevent duplicate usernames

#### Task 2.1.6: Create User Creation Service Tests
**Area:** Testing  
**Description:** Test successful user creation, duplicate username handling, validation errors, and admin-only access

---

### STORY 2.2: User List and Management Dashboard

**Scenario:** Administrator views and manages all system users

**Given:** An administrator is on the user management page  
**When:** The page loads  
**Then:** A table displays all users with their username, email, display name, role, and creation date, with action buttons for each user

**Acceptance Criteria:**
- User table displays all users in the system
- Table includes columns: username, display name, email, role, created date
- Table is sortable by each column
- Search/filter capability exists for finding specific users
- Action buttons (Delete, Reset Password) are available for each user
- Admin cannot delete their own account

#### Task 2.2.1: Create User List Component
**Area:** Frontend  
**Description:** Build Angular component with Material table to display user list with sorting and filtering

#### Task 2.2.2: Implement Get All Users API Endpoint
**Area:** Backend  
**Description:** Create GET /api/admin/users endpoint that returns paginated user list

#### Task 2.2.3: Create User List Service
**Area:** Frontend  
**Description:** Implement Angular service to fetch user data and manage table state (sorting, filtering)

#### Task 2.2.4: Implement Self-Deletion Prevention Logic
**Area:** Backend/Frontend  
**Description:** Add business logic to prevent admin from deleting their own account, disable delete button in UI

#### Task 2.2.5: Add Search and Filter Functionality
**Area:** Frontend  
**Description:** Implement client-side or server-side search/filter for username, email, and role

#### Task 2.2.6: Test User List Features
**Area:** Testing  
**Description:** Verify data display, sorting, filtering, and admin-only access

---

### STORY 2.3: User Account Deletion

**Scenario:** Administrator deletes a user account

**Given:** An administrator is viewing the user management list  
**When:** The administrator clicks the delete button for a user and confirms the action  
**Then:** The user account is permanently deleted and the user can no longer log in

**Acceptance Criteria:**
- Delete button triggers confirmation dialog
- Confirmation dialog warns about permanent deletion
- Successful deletion removes user from the list
- Deleted user's sessions are invalidated immediately
- {confirm with Product Manager} - What happens to projects owned by deleted user? Are they reassigned, deleted, or orphaned?

#### Task 2.3.1: Create Delete Confirmation Dialog Component
**Area:** Frontend  
**Description:** Build Material dialog component with warning message and confirm/cancel buttons

#### Task 2.3.2: Implement User Deletion API Endpoint
**Area:** Backend  
**Description:** Create DELETE /api/admin/users/{userId} endpoint with soft or hard delete logic

#### Task 2.3.3: Implement Session Invalidation on Deletion
**Area:** Backend  
**Description:** Add logic to invalidate all active sessions for deleted user

#### Task 2.3.4: Handle Project Ownership on User Deletion
**Area:** Backend  
**Description:** {confirm with Product Manager} Implement chosen strategy for handling projects owned by deleted user

#### Task 2.3.5: Update User List After Deletion
**Area:** Frontend  
**Description:** Refresh user list or remove deleted user from table without full page reload

#### Task 2.3.6: Test User Deletion Flow
**Area:** Testing  
**Description:** Verify deletion, session invalidation, project handling, and prevention of self-deletion

---

### STORY 2.4: Password Reset by Administrator

**Scenario:** Administrator resets a user's password

**Given:** An administrator is viewing the user management list  
**When:** The administrator clicks the reset password button for a user  
**Then:** A new temporary password is generated and displayed to the administrator to provide to the user

**Acceptance Criteria:**
- Reset password button is available for each user
- New temporary password is generated securely
- Dialog displays the new temporary password to the administrator
- User's existing sessions remain active until they log out or timeout
- Administrator can copy the password to clipboard

#### Task 2.4.1: Create Password Reset Dialog Component
**Area:** Frontend  
**Description:** Build Material dialog that displays generated password with copy-to-clipboard functionality

#### Task 2.4.2: Implement Password Reset API Endpoint
**Area:** Backend  
**Description:** Create POST /api/admin/users/{userId}/reset-password endpoint that generates new password

#### Task 2.4.3: Add Copy to Clipboard Functionality
**Area:** Frontend  
**Description:** Implement clipboard API integration with visual feedback on successful copy

#### Task 2.4.4: Update User Password in Database
**Area:** Backend  
**Description:** Implement password hash update logic with appropriate security (BCrypt)

#### Task 2.4.5: Test Password Reset Flow
**Area:** Testing  
**Description:** Verify new password works for login, old password no longer works, admin-only access

---

## EPIC 3: Project Management and Dashboard

**As a** product manager  
**I want to** create, organize, and track software projects through their lifecycle  
**So that** I can maintain a centralized repository of all project requirements and their current status

**Priority:** Critical  
**Dependencies:** Epic 1 (User Authentication)

### STORY 3.1: Dashboard with Project List

**Scenario:** User views their accessible projects on the dashboard

**Given:** A user is logged into SDLC Assist  
**When:** The user lands on the dashboard or clicks the home navigation link  
**Then:** A list of projects is displayed showing project name, owner, status, and creation date with the ability to create new projects or navigate into existing ones

**Acceptance Criteria:**
- Dashboard displays projects the user has access to (own projects for PMs, all projects for Admins, granted projects for Viewers)
- Each project card/row shows: name, description (truncated), owner name, status badge, creation date
- "Create New Project" button is visible to Admins and Product Managers
- Clicking a project navigates to the project detail view
- Projects are sorted by most recently updated by default
- Empty state message displays when user has no projects

#### Task 3.1.1: Create Dashboard Component
**Area:** Frontend  
**Description:** Build main dashboard Angular component with project list layout using Material cards or table

#### Task 3.1.2: Implement Get Projects API Endpoint
**Area:** Backend  
**Description:** Create GET /api/projects endpoint with role-based filtering (PM sees own, Admin sees all)

#### Task 3.1.3: Create Project Entity and Repository
**Area:** Backend/Database  
**Description:** Define Project JPA entity (id, name, description, status, owner_id, prd_content, created_at, updated_at) and repository

#### Task 3.1.4: Implement Project Service Layer
**Area:** Backend  
**Description:** Create service layer for project business logic including access control checks

#### Task 3.1.5: Create Project List Display Component
**Area:** Frontend  
**Description:** Build reusable component to display project information with status badges and navigation

#### Task 3.1.6: Add Empty State UI
**Area:** Frontend  
**Description:** Create empty state component with message and call-to-action when no projects exist

#### Task 3.1.7: Implement Role-Based Project Visibility
**Area:** Backend  
**Description:** Add query filtering logic based on user role and project ownership

#### Task 3.1.8: Test Dashboard Display and Access Control
**Area:** Testing  
**Description:** Verify correct projects display for each role, sorting, and navigation

---

### STORY 3.2: Project Creation

**Scenario:** Product Manager creates a new project

**Given:** A Product Manager or Admin is on the dashboard  
**When:** The user clicks "Create New Project", fills in the project name and description, and submits  
**Then:** A new project is created in Draft status with the current user as owner, and the user is navigated to the project view

**Acceptance Criteria:**
- Create project button opens modal or form with name and description fields
- Project name is required and must be unique per user
- Description is optional but recommended
- Newly created project has status "Draft"
- Creator is set as project owner
- User is redirected to the new project's detail page after creation
- Cancel button closes dialog without creating project

#### Task 3.2.1: Create Project Creation Dialog Component
**Area:** Frontend  
**Description:** Build Material dialog with form fields for name (required) and description (optional)

#### Task 3.2.2: Implement Create Project API Endpoint
**Area:** Backend  
**Description:** Create POST /api/projects endpoint with request validation and owner assignment

#### Task 3.2.3: Add Project Name Uniqueness Validation
**Area:** Backend  
**Description:** Implement validation to ensure project names are unique per owner {confirm with Product Manager: unique per owner or globally unique?}

#### Task 3.2.4: Create Project Status Enumeration
**Area:** Backend  
**Description:** Define ProjectStatus enum with values: DRAFT, ACTIVE, COMPLETED, ARCHIVED

#### Task 3.2.5: Implement Post-Creation Navigation
**Area:** Frontend  
**Description:** After successful creation, navigate to project detail view with new project ID

#### Task 3.2.6: Test Project Creation Flow
**Area:** Testing  
**Description:** Verify project creation, validation, ownership assignment, and navigation

---

### STORY 3.3: Project Status Management

**Scenario:** Product Manager updates project status

**Given:** A Product Manager is viewing a project they own  
**When:** The user changes the project status dropdown and confirms  
**Then:** The project status is updated and reflected throughout the system

**Acceptance Criteria:**
- Status dropdown available in project header with four options: Draft, Active, Completed, Archived
- Status change is persisted immediately
- Status badge updates throughout UI without page refresh
- Only project owner or Admin can change status
- Status change history is captured in updated_at timestamp

#### Task 3.3.1: Create Status Dropdown Component
**Area:** Frontend  
**Description:** Build status selector component in project header with Material select component

#### Task 3.3.2: Implement Update Project Status API Endpoint
**Area:** Backend  
**Description:** Create PATCH /api/projects/{projectId}/status endpoint with authorization checks

#### Task 3.3.3: Add Status Update Authorization Logic
**Area:** Backend  
**Description:** Verify requesting user is owner or admin before allowing status change

#### Task 3.3.4: Update Project Status Badge Component
**Area:** Frontend  
**Description:** Create reusable status badge component with color coding (Draft=grey, Active=blue, Completed=green, Archived=amber)

#### Task 3.3.5: Test Status Update Flow
**Area:** Testing  
**Description:** Verify status changes persist, authorization works, and UI updates correctly

---

### STORY 3.4: Project Detail View with SDLC Phase Navigation

**Scenario:** User navigates to a project and sees all SDLC phases

**Given:** A user has clicked on a project from the dashboard  
**When:** The project detail page loads  
**Then:** The user sees a sidebar with all five SDLC phases, with Planning and Analysis accessible and other phases marked as "Coming Soon"

**Acceptance Criteria:**
- Left sidebar displays five SDLC phases: Planning and Analysis, Design, Implementation, Testing and Integration, Maintenance
- Planning and Analysis phase is clickable and functional
- Other four phases show "Coming Soon" badge and are not clickable
- Active phase is highlighted in sidebar
- Project header shows project name, status, and owner information
- Breadcrumb navigation shows path (Dashboard > Project Name > Phase Name)
- Visual progress indicator shows current phase in overall lifecycle

#### Task 3.4.1: Create Project Layout Component
**Area:** Frontend  
**Description:** Build project container component with collapsible sidebar, header, and main content area

#### Task 3.4.2: Create SDLC Phase Navigation Component
**Area:** Frontend  
**Description:** Build sidebar navigation with phase list, active state highlighting, and "Coming Soon" badges

#### Task 3.4.3: Create Project Header Component
**Area:** Frontend  
**Description:** Build header showing project name, status badge, owner name, and breadcrumb navigation

#### Task 3.4.4: Implement Phase Progress Indicator
**Area:** Frontend  
**Description:** Create visual progress component showing five phases with current phase highlighted

#### Task 3.4.5: Create Sidebar Collapse Functionality
**Area:** Frontend  
**Description:** Add toggle button to collapse/expand sidebar and persist preference in local storage

#### Task 3.4.6: Implement Phase Routing
**Area:** Frontend  
**Description:** Configure Angular routes for /projects/{id}/phase/{phaseName} with guards for inactive phases

#### Task 3.4.7: Test Project Navigation
**Area:** Testing  
**Description:** Verify navigation works, inactive phases are disabled, and layout is responsive

---

## EPIC 4: AI-Powered PRD Generation in Planning and Analysis Phase

**As a** product manager  
**I want to** upload raw project documentation and have AI generate a structured PRD  
**So that** I can quickly transform meeting notes and unstructured requirements into actionable Epics, Stories, and Tasks

**Priority:** Critical  
**Dependencies:** Epic 1, Epic 3

### STORY 4.1: Document Upload Interface

**Scenario:** Product Manager uploads source documents for PRD generation

**Given:** A Product Manager is in the Planning and Analysis phase of their project  
**When:** The user selects and uploads up to three files (PDF, Word, text, or markdown) with a maximum size of 10MB each  
**Then:** The files are uploaded, validated, stored in the database, and made available for AI analysis

**Acceptance Criteria:**
- Upload area supports drag-and-drop and click-to-browse
- Accepted file types: .pdf, .docx, .doc, .txt, .md
- Maximum 3 files per project
- Maximum 10MB per file
- File validation provides clear error messages for invalid formats or sizes
- Uploaded files display with filename, size, and remove button
- Text is extracted from documents and stored for AI processing
- Files can be downloaded again later

#### Task 4.1.1: Create File Upload Component
**Area:** Frontend  
**Description:** Build Angular component with drag-and-drop zone and file browser using Material or ng2-file-upload library

#### Task 4.1.2: Implement Client-Side File Validation
**Area:** Frontend  
**Description:** Add file type, size, and count validation before upload with user-friendly error messages

#### Task 4.1.3: Create Project Files Entity and Repository
**Area:** Backend/Database  
**Description:** Define ProjectFile entity (id, project_id, filename, file_type, file_size, file_data, extracted_text, uploaded_at) and repository

#### Task 4.1.4: Implement File Upload API Endpoint
**Area:** Backend  
**Description:** Create POST /api/projects/{projectId}/files endpoint accepting multipart form data

#### Task 4.1.5: Implement Text Extraction Service
**Area:** Backend  
**Description:** Create service to extract text from PDFs (using Apache PDFBox), Word docs (using Apache POI), and text files

##### Sub-Task 4.1.5.1: Add Apache PDFBox Dependency
**Area:** Backend  
**Description:** Add Apache PDFBox library to pom.xml for PDF text extraction

##### Sub-Task 4.1.5.2: Add Apache POI Dependency
**Area:** Backend  
**Description:** Add Apache POI library to pom.xml for Word document processing

##### Sub-Task 4.1.5.3: Implement PDF Text Extraction
**Area:** Backend  
**Description:** Create method to extract text from PDF using PDFBox with error handling

##### Sub-Task 4.1.5.4: Implement Word Document Text Extraction
**Area:** Backend  
**Description:** Create method to extract text from .doc and .docx files using POI

#### Task 4.1.6: Create Uploaded Files List Component
**Area:** Frontend  
**Description:** Display uploaded files with name, size, type icon, and remove button

#### Task 4.1.7: Implement File Download Endpoint
**Area:** Backend  
**Description:** Create GET /api/projects/{projectId}/files/{fileId}/download endpoint to retrieve original file

#### Task 4.1.8: Implement File Removal
**Area:** Backend/Frontend  
**Description:** Create DELETE endpoint and UI functionality to remove uploaded files before analysis

#### Task 4.1.9: Test File Upload Flow
**Area:** Testing  
**Description:** Test various file types, size limits, validation, text extraction accuracy, and error handling

---

### STORY 4.2: AI PRD Generation with Streaming Output

**Scenario:** Product Manager generates a structured PRD from uploaded documents

**Given:** A Product Manager has uploaded source documents in the Planning and Analysis phase  
**When:** The user clicks the "Analyze" button  
**Then:** Claude AI processes the documents and streams the generated PRD in real-time, displaying Epics, Stories, and Tasks in Agile format

**Acceptance Criteria:**
- "Analyze" button is enabled when at least one file is uploaded
- Clicking Analyze initiates AI processing within 3 seconds
- PRD streams in real-time showing progressive output (user sees text appearing)
- Generated PRD follows structure: Epics with user stories (As a/I want/So that), Stories with Given/When/Then, Tasks with area designation (Frontend/Backend/Database/Testing)
- Each Epic includes title, description, priority
- Each Story includes scenario title, Given/When/Then, acceptance criteria
- Each Task includes area, description
- Loading indicator shows during streaming
- Error handling displays meaningful message if AI generation fails
- Generated content is rendered as formatted markdown
- {confirm with Product Manager} - Should there be a character or token limit on the combined uploaded document text?

#### Task 4.2.1: Create Claude AI Integration Service
**Area:** Backend  
**Description:** Implement service to interact with Anthropic Claude API with streaming enabled

##### Sub-Task 4.2.1.1: Add Anthropic SDK Dependency
**Area:** Backend  
**Description:** Add Anthropic Java SDK or HTTP client library to pom.xml

##### Sub-Task 4.2.1.2: Configure API Key Management
**Area:** Backend  
**Description:** Set up secure configuration for Anthropic API key in application properties with environment variable override

##### Sub-Task 4.2.1.3: Implement Streaming Response Handler
**Area:** Backend  
**Description:** Create handler to process Server-Sent Events (SSE) from Claude API

#### Task 4.2.2: Design and Implement System Prompt
**Area:** Backend  
**Description:** Create detailed system prompt that instructs Claude to generate PRDs in specified format (Epics > Stories > Tasks) with Agile methodology

##### Sub-Task 4.2.2.1: Define PRD Output Format Specification
**Area:** Backend  
**Description:** Document exact markdown structure and hierarchy for AI output including required sections and formatting

##### Sub-Task 4.2.2.2: Create Prompt Template with Examples
**Area:** Backend  
**Description:** Build system prompt with few-shot examples showing desired Epic/Story/Task structure

#### Task 4.2.3: Implement PRD Generation API Endpoint
**Area:** Backend  
**Description:** Create POST /api/projects/{projectId}/prd/generate endpoint that streams SSE responses

#### Task 4.2.4: Create Document Context Preparation Service
**Area:** Backend  
**Description:** Implement logic to concatenate extracted text from all uploaded files and format for Claude context

#### Task 4.2.5: Implement Server-Sent Events Stream
**Area:** Backend  
**Description:** Configure Spring Boot to support SSE streaming for real-time PRD generation output

#### Task 4.2.6: Create PRD Display Component
**Area:** Frontend  
**Description:** Build component to display streaming PRD content with markdown rendering using library like ngx-markdown

#### Task 4.2.7: Implement Streaming Client Logic
**Area:** Frontend  
**Description:** Create service using EventSource API to connect to SSE endpoint and progressively update PRD display

#### Task 4.2.8: Add Loading and Error States
**Area:** Frontend  
**Description:** Implement loading spinner during generation and error message display with retry option

#### Task 4.2.9: Implement PRD Storage
**Area:** Backend  
**Description:** Save completed PRD markdown to project.prd_content field in database

#### Task 4.2.10: Test PRD Generation Flow
**Area:** Testing  
**Description:** Test with various document inputs, verify output structure, test streaming functionality, error handling, and performance (3-second start requirement)

---

### STORY 4.3: PRD Review, Edit, and Regenerate

**Scenario:** Product Manager reviews and edits generated PRD

**Given:** A PRD has been generated and is displayed in the Planning and Analysis phase  
**When:** The user reviews the content and decides to edit or regenerate  
**Then:** The user can edit the PRD markdown directly, save changes, or regenerate a new PRD from the source documents

**Acceptance Criteria:**
- Generated PRD displays in rendered markdown format by default
- "Edit" button switches to edit mode showing raw markdown in textarea
- "Save" button persists changes and returns to rendered view
- "Cancel" button discards changes and returns to rendered view
- "Regenerate" button prompts confirmation and triggers new AI generation
- Regeneration replaces existing PRD content {confirm with Product Manager: should we keep version history?}
- Edited content is validated as proper markdown before saving
- Auto-save or draft saving is NOT included in MVP

#### Task 4.3.1: Create PRD Edit Mode Component
**Area:** Frontend  
**Description:** Build textarea component for markdown editing with monospace font and adequate sizing

#### Task 4.3.2: Implement Edit/Save Toggle Logic
**Area:** Frontend  
**Description:** Create state management to switch between rendered and edit views

#### Task 4.3.3: Create PRD Update API Endpoint
**Area:** Backend  
**Description:** Create PUT /api/projects/{projectId}/prd endpoint to save edited PRD content

#### Task 4.3.4: Implement Markdown Validation
**Area:** Backend  
**Description:** Add basic validation to ensure saved content is valid markdown (check for proper formatting)

#### Task 4.3.5: Create Regenerate Confirmation Dialog
**Area:** Frontend  
**Description:** Build confirmation dialog warning that regeneration will replace existing content

#### Task 4.3.6: Implement Regenerate Logic
**Area:** Backend/Frontend  
**Description:** Reuse PRD generation endpoint but add flag to overwrite existing content

#### Task 4.3.7: Add Unsaved Changes Warning
**Area:** Frontend  
**Description:** Implement navigation guard to warn user if they try to leave edit mode with unsaved changes

#### Task 4.3.8: Test Edit and Regenerate Flows
**Area:** Testing  
**Description:** Verify editing saves correctly, regeneration works, confirmations display, unsaved changes are handled

---

### STORY 4.4: PRD Download and Export

**Scenario:** Product Manager exports the PRD for external use

**Given:** A PRD has been generated and saved  
**When:** The user clicks the download button and selects a format  
**Then:** The PRD is downloaded as a markdown file or can be printed to PDF from the browser

**Acceptance Criteria:**
- Download button is visible when PRD exists
- "Download as Markdown" option downloads .md file with project name
- "Print to PDF" option opens browser print dialog with print-optimized styling
- Downloaded markdown file contains the complete PRD content
- Printed PDF maintains formatting and hierarchy
- File naming convention: {project-name}-prd-{date}.md

#### Task 4.4.1: Create Download Button Component
**Area:** Frontend  
**Description:** Add download dropdown button in PRD header with markdown and print options

#### Task 4.4.2: Implement Markdown Download
**Area:** Frontend  
**Description:** Create service to generate blob from markdown content and trigger browser download

#### Task 4.4.3: Create Print Stylesheet
**Area:** Frontend  
**Description:** Add CSS media query for @media print to optimize PRD rendering for PDF export

#### Task 4.4.4: Implement Print Function
**Area:** Frontend  
**Description:** Create method to trigger browser print dialog with PRD content

#### Task 4.4.5: Add File Naming Logic
**Area:** Frontend  
**Description:** Generate filename using project name and current date in consistent format

#### Task 4.4.6: Test Download and Print Functionality
**Area:** Testing  
**Description:** Verify markdown download content accuracy, PDF print quality, and file naming

---

## EPIC 5: Application UI/UX Foundation

**As a** user of SDLC Assist  
**I want to** navigate intuitively through a well-designed interface  
**So that** I can efficiently complete my tasks without confusion or unnecessary friction

**Priority:** High  
**Dependencies:** Epic 1

### STORY 5.1: Main Application Layout and Navigation

**Scenario:** User navigates through the application using primary navigation elements

**Given:** A user is logged into SDLC Assist  
**When:** The user interacts with the application  
**Then:** A consistent layout with header, collapsible sidebar, and main content area provides intuitive navigation

**Acceptance Criteria:**
- Top header displays app logo/name on left, breadcrumb navigation in center, user menu on right
- Left sidebar shows project list (when on dashboard) or SDLC phases (when in project view)
- Sidebar is collapsible with toggle button, state persists in local storage
- Main content area occupies remaining space and is scrollable
- Active navigation item is highlighted
- Responsive layout works on desktop (1920x1080), laptop (1366x768), and tablet (768x1024)
- Mobile layout is not required for MVP but should degrade gracefully

#### Task 5.1.1: Create Main Layout Component Structure
**Area:** Frontend  
**Description:** Build root application component with header, sidebar, and content router outlet using Angular Material layout directives

#### Task 5.1.2: Create Header Component
**Area:** Frontend  
**Description:** Build header with app branding, breadcrumb navigation component, and user menu dropdown

#### Task 5.1.3: Create Breadcrumb Service and Component
**Area:** Frontend  
**Description:** Implement service to track navigation path and component to display clickable breadcrumbs

#### Task 5.1.4: Create Collapsible Sidebar Component
**Area:** Frontend  
**Description:** Build sidebar with toggle functionality and local storage persistence of collapsed state

#### Task 5.1.5: Create User Menu Dropdown
**Area:** Frontend  
**Description:** Build dropdown menu with user's display name, role badge, and logout option

#### Task 5.1.6: Implement Responsive Layout
**Area:** Frontend  
**Description:** Add CSS media queries and flexbox/grid layout to support different screen sizes

#### Task 5.1.7: Create Navigation State Management
**Area:** Frontend  
**Description:** Implement service or state management for active navigation item highlighting

#### Task 5.1.8: Test Layout and Navigation
**Area:** Testing  
**Description:** Verify layout renders correctly at different resolutions, sidebar toggles work, navigation highlights correctly

---

### STORY 5.2: Consistent UI Component Library

**Scenario:** Application uses consistent Material Design components throughout

**Given:** Any page or feature in the application  
**When:** A user interacts with UI elements  
**Then:** All components follow consistent Material Design patterns with the application's color scheme and typography

**Acceptance Criteria:**
- Angular Material components are used for all standard UI elements (buttons, forms, dialogs, tables, cards)
- Consistent color palette is defined and applied: primary, accent, warn colors
- Typography scale is consistent across all text elements
- Button styles are consistent: primary, secondary, text, icon buttons
- Form fields have consistent styling, validation states, and error messages
- Loading states use consistent spinner/progress indicators
- Success/error messages use Material snackbar component
- {confirm with Product Manager} - Is there a specific brand color palette to use?

#### Task 5.2.1: Configure Angular Material Theme
**Area:** Frontend  
**Description:** Create custom Material theme with defined color palette, typography, and spacing configuration

#### Task 5.2.2: Create Shared UI Module
**Area:** Frontend  
**Description:** Build Angular module that imports and exports all commonly used Material modules for reuse

#### Task 5.2.3: Define Typography Styles
**Area:** Frontend  
**Description:** Configure Material typography with consistent font families, sizes, and weights across heading and body text

#### Task 5.2.4: Create Button Style Standards
**Area:** Frontend  
**Description:** Document and implement standard button types with consistent usage patterns

#### Task 5.2.5: Create Form Field Standards
**Area:** Frontend  
**Description:** Establish consistent form field appearance, validation display, and error messaging patterns

#### Task 5.2.6: Implement Global Loading Indicator Service
**Area:** Frontend  
**Description:** Create service and component for displaying loading states consistently throughout the app

#### Task 5.2.7: Implement Notification Service
**Area:** Frontend  
**Description:** Create service using Material snackbar for success, error, and info messages with consistent timing

#### Task 5.2.8: Create UI Style Guide Documentation
**Area:** Documentation  
**Description:** Document component usage patterns, color codes, and spacing standards for development team reference

---

### STORY 5.3: Error Handling and User Feedback

**Scenario:** User receives clear feedback for successful actions and errors

**Given:** A user performs any action in the application  
**When:** The action succeeds or fails  
**Then:** The user receives immediate, clear feedback through appropriate UI mechanisms

**Acceptance Criteria:**
- Successful actions display success message (snackbar) for 3 seconds
- Form validation errors display inline below field and on form submit
- API errors display error message with specific issue when available
- Network errors display generic "Connection failed" message with retry option
- 401 Unauthorized responses redirect to login page
- 403 Forbidden responses display "Access Denied" message
- 404 Not Found displays appropriate "Resource not found" page
- 500 Internal Server Error displays generic error with support contact option
- Loading states prevent duplicate submissions

#### Task 5.3.1: Create Error Interceptor
**Area:** Frontend  
**Description:** Implement Angular HTTP interceptor to catch and handle API errors globally

#### Task 5.3.2: Implement Form Validation Error Display
**Area:** Frontend  
**Description:** Create reusable form error display component that shows validation messages below fields

#### Task 5.3.3: Create Error Page Components
**Area:** Frontend  
**Description:** Build 404, 403, and 500 error page components with appropriate messaging and navigation options

#### Task 5.3.4: Implement Backend Exception Handling
**Area:** Backend  
**Description:** Create global exception handler using @ControllerAdvice to return consistent error response format

#### Task 5.3.5: Define Standard Error Response Format
**Area:** Backend  
**Description:** Establish JSON structure for error responses including error code, message, and timestamp

#### Task 5.3.6: Add Request Validation
**Area:** Backend  
**Description:** Implement validation annotations on DTOs and return clear validation error messages

#### Task 5.3.7: Implement Loading State Management
**Area:** Frontend  
**Description:** Create mechanism to disable action buttons during API calls to prevent duplicate submissions

#### Task 5.3.8: Test Error Handling Scenarios
**Area:** Testing  
**Description:** Verify all error types display correctly, retry mechanisms work, and users can recover from errors

---

## EPIC 6: Database Design and Backend Infrastructure

**As a** development team  
**I want to** have a well-structured database schema and backend architecture  
**So that** data integrity is maintained and the system performs efficiently

**Priority:** Critical  
**Dependencies:** None (foundational requirement)

### STORY 6.1: Database Schema Implementation

**Scenario:** Database tables are created to support all application entities

**Given:** A PostgreSQL database is provisioned on Supabase  
**When:** Database migrations are executed  
**Then:** All required tables, indexes, and constraints are created with proper relationships

**Acceptance Criteria:**
- Users table exists with all required fields and password security
- Projects table exists with foreign key to Users (owner)
- Project_files table exists with foreign key to Projects
- Appropriate indexes exist on frequently queried fields (username, project owner_id, etc.)
- Timestamps (created_at, updated_at) exist on all tables with appropriate defaults
- Cascading delete rules are defined appropriately {confirm with Product Manager: should deleting project delete files?}
- Database constraints enforce data integrity (NOT NULL, unique constraints)

#### Task 6.1.1: Set Up Database Migration Tool
**Area:** Backend/Database  
**Description:** Configure Flyway or Liquibase for database version control and migration management

#### Task 6.1.2: Create Users Table Migration
**Area:** Database  
**Description:** Write migration script to create users table with columns: id (UUID/BIGSERIAL), username (VARCHAR UNIQUE), password_hash (VARCHAR), display_name (VARCHAR), email (VARCHAR), role (VARCHAR/ENUM), created_at (TIMESTAMP), updated_at (TIMESTAMP)

##### Sub-Task 6.1.2.1: Add Users Table Indexes
**Area:** Database  
**Description:** Create index on username for login query performance

#### Task 6.1.3: Create Projects Table Migration
**Area:** Database  
**Description:** Write migration script for projects table with columns: id, name (VARCHAR), description (TEXT), status (VARCHAR/ENUM), owner_id (FK to users), prd_content (TEXT), created_at, updated_at

##### Sub-Task 6.1.3.1: Add Projects Table Indexes
**Area:** Database  
**Description:** Create indexes on owner_id and status for efficient filtering

##### Sub-Task 6.1.3.2: Add Foreign Key Constraint
**Area:** Database  
**Description:** Create FK constraint from projects.owner_id to users.id with appropriate cascade/restrict rules

#### Task 6.1.4: Create Project_Files Table Migration
**Area:** Database  
**Description:** Write migration script for project_files table with columns: id, project_id (FK), filename (VARCHAR), file_type (VARCHAR), file_size (BIGINT), file_data (BYTEA), extracted_text (TEXT), uploaded_at (TIMESTAMP)

##### Sub-Task 6.1.4.1: Add Project_Files Table Indexes
**Area:** Database  
**Description:** Create index on project_id for efficient file retrieval by project

##### Sub-Task 6.1.4.2: Add Foreign Key Constraint
**Area:** Database  
**Description:** Create FK constraint from project_files.project_id to projects.id with cascade delete {confirm with Product Manager}

#### Task 6.1.5: Create Database Initialization Script
**Area:** Database  
**Description:** Create script to set up initial admin user for first-time system setup

#### Task 6.1.6: Test Database Migrations
**Area:** Testing  
**Description:** Verify migrations run successfully, can be rolled back, and enforce constraints properly

---

### STORY 6.2: Backend API Architecture Setup

**Scenario:** Backend services are structured following best practices

**Given:** Spring Boot application is initialized  
**When:** Backend code is organized  
**Then:** Clear separation exists between controllers, services, repositories, and entities with appropriate configuration

**Acceptance Criteria:**
- Project structure follows standard Spring Boot conventions (controller, service, repository, entity, dto, config packages)
- DTOs are used for API requests/responses, separate from JPA entities
- Service layer contains business logic, repositories only handle data access
- Configuration classes handle Spring Security, CORS, API client setup
- Application properties externalize configuration (database URL, API keys, etc.)
- Health check endpoint exists at /api/health
- API versioning strategy is established (e.g., /api/v1/)
- OpenAPI/Swagger documentation is auto-generated {confirm with Product Manager: required for MVP?}

#### Task 6.2.1: Create Project Structure and Packages
**Area:** Backend  
**Description:** Set up Maven/Gradle project with standard package structure (controller, service, repository, entity, dto, config, exception)

#### Task 6.2.2: Configure Application Properties
**Area:** Backend  
**Description:** Set up application.yml with profiles (dev, prod) for database, server, and external API configuration

#### Task 6.2.3: Create Base Entity Class
**Area:** Backend  
**Description:** Create abstract BaseEntity with common fields (id, created_at, updated_at) and JPA annotations

#### Task 6.2.4: Implement DTO Mapping Strategy
**Area:** Backend  
**Description:** Set up MapStruct or ModelMapper for entity-to-DTO conversions

#### Task 6.2.5: Create Global Exception Handler
**Area:** Backend  
**Description:** Implement @ControllerAdvice class for consistent exception handling and error responses

#### Task 6.2.6: Configure CORS Settings
**Area:** Backend  
**Description:** Create CORS configuration allowing requests from frontend domain with appropriate allowed methods and headers

#### Task 6.2.7: Implement Health Check Endpoint
**Area:** Backend  
**Description:** Create /api/health endpoint returning system status and version information

#### Task 6.2.8: Set Up Logging Configuration
**Area:** Backend  
**Description:** Configure Logback/SLF4J with appropriate log levels and patterns for different environments

#### Task 6.2.9: Document API Standards
**Area:** Documentation  
**Description:** Create developer documentation outlining API conventions, naming standards, and response formats

---

### STORY 6.3: Security Configuration

**Scenario:** Application implements security best practices

**Given:** The application is deployed  
**When:** Users and systems interact with the application  
**Then:** Security measures protect against common vulnerabilities

**Acceptance Criteria:**
- OWASP Top 10 protections are implemented where applicable
- HTTPS is enforced in production (handled by Railway/Supabase)
- SQL injection prevention through parameterized queries (JPA default)
- XSS prevention through output encoding (Angular default)
- CSRF protection configured appropriately for session-based auth
- Security headers set (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- Sensitive data (passwords, API keys) never logged or exposed in responses
- API rate limiting implemented to prevent abuse {confirm with Product Manager: required for MVP?}
- Session timeout configured (30 minutes idle, 8 hours absolute)

#### Task 6.3.1: Configure Spring Security Headers
**Area:** Backend  
**Description:** Set up security headers filter to add X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security

#### Task 6.3.2: Configure Session Security
**Area:** Backend  
**Description:** Set session timeout, fixation protection, and cookie security attributes (HttpOnly, Secure, SameSite)

#### Task 6.3.3: Implement Input Validation
**Area:** Backend  
**Description:** Add validation annotations to all DTOs and ensure validation errors return proper responses

#### Task 6.3.4: Configure Password Security
**Area:** Backend  
**Description:** Implement BCryptPasswordEncoder with appropriate strength and ensure passwords never logged

#### Task 6.3.5: Add Security Logging
**Area:** Backend  
**Description:** Log authentication attempts, authorization failures, and security-relevant events without exposing sensitive data

#### Task 6.3.6: Implement Rate Limiting
**Area:** Backend  
**Description:** {confirm with Product Manager: MVP requirement?} Add rate limiting to authentication and API endpoints using bucket4j or similar

#### Task 6.3.7: Configure CORS Securely
**Area:** Backend  
**Description:** Restrict CORS to specific frontend domain, not wildcard, with appropriate allowed methods

#### Task 6.3.8: Perform Security Audit
**Area:** Testing  
**Description:** Run security scanning tools (OWASP ZAP, dependency check) and address findings

---

## EPIC 7: Deployment and DevOps Setup

**As a** development team  
**I want to** deploy the application to production infrastructure  
**So that** users can access SDLC Assist reliably with proper monitoring

**Priority:** High  
**Dependencies:** All development epics

### STORY 7.1: Railway Deployment Configuration

**Scenario:** Application is deployed to Railway with proper service configuration

**Given:** Code is committed to the repository  
**When:** Deployment is triggered  
**Then:** Both backend and frontend services are deployed, configured, and accessible

**Acceptance Criteria:**
- Monorepo is connected to Railway project
- Backend service deploys from /backend directory using Maven build
- Frontend service deploys from /frontend directory with nginx serving static files
- Environment variables are configured (database URL, API keys, frontend URL)
- Backend service exposes port 8080
- Frontend nginx proxies /api/* requests to backend service internal URL
- Services can communicate via Railway's internal networking
- HTTPS is automatically provided by Railway
- Custom domain can be configured {confirm with Product Manager: required for MVP?}
- Health checks are configured to monitor service status

#### Task 7.1.1: Create Railway Project
**Area:** DevOps  
**Description:** Set up Railway project and connect GitHub repository

#### Task 7.1.2: Configure Backend Service
**Area:** DevOps  
**Description:** Create railway.json or use Railway UI to configure backend service build and start commands

##### Sub-Task 7.1.2.1: Set Backend Build Command
**Area:** DevOps  
**Description:** Configure Maven build: `mvn clean package -DskipTests`

##### Sub-Task 7.1.2.2: Set Backend Start Command
**Area:** DevOps  
**Description:** Configure Java execution: `java -jar target/sdlc-assist.jar`

##### Sub-Task 7.1.2.3: Configure Backend Environment Variables
**Area:** DevOps  
**Description:** Set DATABASE_URL, ANTHROPIC_API_KEY, CORS_ALLOWED_ORIGIN

#### Task 7.1.3: Configure Frontend Service
**Area:** DevOps  
**Description:** Set up frontend build and nginx configuration

##### Sub-Task 7.1.3.1: Create Frontend Dockerfile
**Area:** DevOps  
**Description:** Write multi-stage Dockerfile: build with Node, serve with nginx

##### Sub-Task 7.1.3.2: Create Nginx Configuration
**Area:** DevOps  
**Description:** Configure nginx.conf to serve Angular app and proxy /api/* to backend

##### Sub-Task 7.1.3.3: Set Frontend Build Command
**Area:** DevOps  
**Description:** Configure Docker build in Railway

#### Task 7.1.4: Configure Service Networking
**Area:** DevOps  
**Description:** Set up Railway's internal networking for backend-frontend communication

#### Task 7.1.5: Configure Environment-Specific Settings
**Area:** Backend/Frontend  
**Description:** Ensure application reads configuration from environment variables, not hardcoded values

#### Task 7.1.6: Set Up Health Check Endpoints
**Area:** DevOps  
**Description:** Configure Railway health checks pointing to /api/health endpoint

#### Task 7.1.7: Test Deployment Process
**Area:** Testing  
**Description:** Verify both services deploy successfully, can communicate, and application functions end-to-end

---

### STORY 7.2: Supabase PostgreSQL Configuration

**Scenario:** Database is provisioned and configured on Supabase

**Given:** A Supabase account is created  
**When:** The database is set up  
**Then:** PostgreSQL instance is available, migrations are run, and backend can connect securely

**Acceptance Criteria:**
- Supabase project is created with PostgreSQL 15+
- Connection string is secured in Railway environment variables
- Database migrations run successfully on first deployment
- SSL connection is enforced between backend and database
- Database backup policy is configured (automatic daily backups)
- Connection pooling is configured appropriately for expected load
- Database logs are accessible for troubleshooting

#### Task 7.2.1: Create Supabase Project
**Area:** DevOps  
**Description:** Sign up for Supabase and create new project with strong database password

#### Task 7.2.2: Configure Database Settings
**Area:** DevOps  
**Description:** Adjust database settings for connection limits, timeouts, and SSL requirements

#### Task 7.2.3: Generate Connection String
**Area:** DevOps  
**Description:** Create connection string with pooler enabled and add to Railway environment variables

#### Task 7.2.4: Configure Database SSL
**Area:** Backend  
**Description:** Ensure JDBC connection string includes SSL parameters (sslmode=require)

#### Task 7.2.5: Run Initial Migrations
**Area:** DevOps  
**Description:** Execute Flyway/Liquibase migrations on Supabase database to create schema

#### Task 7.2.6: Create Database Admin User
**Area:** Database  
**Description:** Insert initial admin user record for system access

#### Task 7.2.7: Configure Backup Schedule
**Area:** DevOps  
**Description:** Verify Supabase automatic backup schedule and retention policy

#### Task 7.2.8: Test Database Connectivity
**Area:** Testing  
**Description:** Verify backend can connect, execute queries, and handle connection failures gracefully

---

### STORY 7.3: Monitoring and Logging Setup

**Scenario:** Application health and errors are monitored for operational awareness

**Given:** Application is deployed to production  
**When:** Users interact with the system  
**Then:** Logs are collected, errors are tracked, and system health is visible

**Acceptance Criteria:**
- Application logs are accessible via Railway dashboard
- Error logs include stack traces and context for debugging
- Log levels are appropriate (INFO for normal operations, ERROR for exceptions)
- {confirm with Product Manager} - External monitoring service integration (e.g., Sentry, LogRocket) required for MVP?
- Database query performance can be monitored via Supabase dashboard
- Uptime monitoring alerts when services are down
- Resource usage (CPU, memory) is visible in Railway metrics

#### Task 7.3.1: Configure Application Logging
**Area:** Backend  
**Description:** Set up Logback configuration with appropriate appenders and log levels for production

#### Task 7.3.2: Implement Structured Logging
**Area:** Backend  
**Description:** Use structured log format (JSON) to facilitate log parsing and analysis

#### Task 7.3.3: Configure Railway Log Retention
**Area:** DevOps  
**Description:** Set log retention policy in Railway to balance visibility and cost

#### Task 7.3.4: Set Up Error Tracking
**Area:** Backend/Frontend  
**Description:** {confirm with Product Manager: MVP requirement?} Integrate Sentry or similar error tracking service

#### Task 7.3.5: Configure Uptime Monitoring
**Area:** DevOps  
**Description:** Set up uptime monitoring (UptimeRobot or Railway's built-in)