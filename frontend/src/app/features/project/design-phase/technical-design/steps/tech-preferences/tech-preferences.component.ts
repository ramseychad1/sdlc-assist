import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClient } from '@angular/common/http';
import { MarkdownComponent } from 'ngx-markdown';
import { ProjectService } from '../../../../../../core/services/project.service';
import { Project, TechPreferences } from '../../../../../../core/models/project.model';
import { GuidelinesDrawerComponent } from '../../components/guidelines-drawer/guidelines-drawer.component';

interface DropdownOption { label: string; value: string; }

const FRONTEND_OPTIONS: DropdownOption[] = [
  { label: 'Angular', value: 'Angular' },
  { label: 'React', value: 'React' },
  { label: 'Next.js', value: 'Next.js' },
  { label: 'Vue.js', value: 'Vue.js' },
  { label: 'Plain HTML / CSS / JavaScript', value: 'Plain HTML / CSS / JavaScript' },
  { label: 'Other', value: 'Other' },
];

const BACKEND_OPTIONS: DropdownOption[] = [
  { label: 'Java / Spring Boot', value: 'Java / Spring Boot' },
  { label: 'C# / .NET', value: 'C# / .NET' },
  { label: 'Node.js / Express', value: 'Node.js / Express' },
  { label: 'Node.js / NestJS', value: 'Node.js / NestJS' },
  { label: 'Python / FastAPI', value: 'Python / FastAPI' },
  { label: 'Python / Django', value: 'Python / Django' },
  { label: 'Ruby on Rails', value: 'Ruby on Rails' },
  { label: 'Other', value: 'Other' },
];

const DATABASE_OPTIONS: DropdownOption[] = [
  { label: 'PostgreSQL', value: 'PostgreSQL' },
  { label: 'MySQL', value: 'MySQL' },
  { label: 'Microsoft SQL Server', value: 'Microsoft SQL Server' },
  { label: 'MongoDB', value: 'MongoDB' },
  { label: 'DynamoDB', value: 'DynamoDB' },
  { label: 'SQLite', value: 'SQLite' },
  { label: 'Other', value: 'Other' },
];

const DEPLOYMENT_OPTIONS: DropdownOption[] = [
  { label: 'Cloud — AWS', value: 'Cloud — AWS' },
  { label: 'Cloud — Azure', value: 'Cloud — Azure' },
  { label: 'Cloud — Google Cloud (GCP)', value: 'Cloud — Google Cloud (GCP)' },
  { label: 'Containerized — Docker / Kubernetes', value: 'Containerized — Docker / Kubernetes' },
  { label: 'PaaS — Railway / Render / Heroku', value: 'PaaS — Railway / Render / Heroku' },
  { label: 'On-Premises / Self-hosted', value: 'On-Premises / Self-hosted' },
  { label: 'Other', value: 'Other' },
];

const AUTH_OPTIONS: DropdownOption[] = [
  { label: 'JWT (stateless)', value: 'JWT (stateless)' },
  { label: 'Session-based (server-side)', value: 'Session-based (server-side)' },
  { label: 'OAuth 2.0 / SSO', value: 'OAuth 2.0 / SSO' },
  { label: 'Auth0 / Okta (third-party)', value: 'Auth0 / Okta (third-party)' },
  { label: 'API Key', value: 'API Key' },
  { label: 'Other', value: 'Other' },
];

const API_STYLE_OPTIONS: DropdownOption[] = [
  { label: 'REST', value: 'REST' },
  { label: 'GraphQL', value: 'GraphQL' },
  { label: 'REST + GraphQL', value: 'REST + GraphQL' },
  { label: 'gRPC', value: 'gRPC' },
  { label: 'Other', value: 'Other' },
];

@Component({
  selector: 'app-tech-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, MarkdownComponent, GuidelinesDrawerComponent],
  template: `
    <div class="step-page">
      <!-- Stack Configuration -->
      <div class="section-card">
        <div class="section-header">
          <h2 class="section-title">Technical Preferences</h2>
          <p class="section-desc">Define your technology stack. These choices guide all generated technical artifacts.</p>
        </div>

        <div class="sub-card">
          <div class="sub-card-label">STACK CONFIGURATION</div>

          <div class="field-grid">
            <!-- Frontend Framework -->
            <div class="field">
              <label class="field-label">FRONTEND FRAMEWORK</label>
              <select class="select" [(ngModel)]="prefs.frontend" (ngModelChange)="onPrefChange()">
                <option value="">Select framework...</option>
                @for (opt of frontendOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
              @if (prefs.frontend === 'Other') {
                <input class="other-input" type="text" [(ngModel)]="otherValues.frontend"
                       placeholder="Specify framework..." (ngModelChange)="onPrefChange()"/>
              }
            </div>

            <!-- Backend Framework -->
            <div class="field">
              <label class="field-label">BACKEND FRAMEWORK</label>
              <select class="select" [(ngModel)]="prefs.backend" (ngModelChange)="onPrefChange()">
                <option value="">Select framework...</option>
                @for (opt of backendOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
              @if (prefs.backend === 'Other') {
                <input class="other-input" type="text" [(ngModel)]="otherValues.backend"
                       placeholder="Specify framework..." (ngModelChange)="onPrefChange()"/>
              }
            </div>

            <!-- Database -->
            <div class="field">
              <label class="field-label">DATABASE</label>
              <select class="select" [(ngModel)]="prefs.database" (ngModelChange)="onPrefChange()">
                <option value="">Select database...</option>
                @for (opt of databaseOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
              @if (prefs.database === 'Other') {
                <input class="other-input" type="text" [(ngModel)]="otherValues.database"
                       placeholder="Specify database..." (ngModelChange)="onPrefChange()"/>
              }
            </div>

            <!-- Deployment -->
            <div class="field">
              <label class="field-label">DEPLOYMENT / INFRASTRUCTURE</label>
              <select class="select" [(ngModel)]="prefs.deployment" (ngModelChange)="onPrefChange()">
                <option value="">Select deployment...</option>
                @for (opt of deploymentOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
              @if (prefs.deployment === 'Other') {
                <input class="other-input" type="text" [(ngModel)]="otherValues.deployment"
                       placeholder="Specify deployment..." (ngModelChange)="onPrefChange()"/>
              }
            </div>

            <!-- Authentication -->
            <div class="field">
              <label class="field-label">AUTHENTICATION</label>
              <select class="select" [(ngModel)]="prefs.auth" (ngModelChange)="onPrefChange()">
                <option value="">Select auth method...</option>
                @for (opt of authOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
              @if (prefs.auth === 'Other') {
                <input class="other-input" type="text" [(ngModel)]="otherValues.auth"
                       placeholder="Specify auth method..." (ngModelChange)="onPrefChange()"/>
              }
            </div>

            <!-- API Style -->
            <div class="field">
              <label class="field-label">API STYLE</label>
              <select class="select" [(ngModel)]="prefs.apiStyle" (ngModelChange)="onPrefChange()">
                <option value="">Select API style...</option>
                @for (opt of apiStyleOptions; track opt.value) {
                  <option [value]="opt.value">{{ opt.label }}</option>
                }
              </select>
              @if (prefs.apiStyle === 'Other') {
                <input class="other-input" type="text" [(ngModel)]="otherValues.apiStyle"
                       placeholder="Specify API style..." (ngModelChange)="onPrefChange()"/>
              }
            </div>
          </div>

          <div class="save-row">
            @if (saveSuccess()) {
              <span class="save-success">
                <lucide-icon name="check" [size]="14"></lucide-icon>
                Preferences saved
              </span>
            }
            <button class="btn btn-primary"
                    [disabled]="!canSave() || saving()"
                    (click)="savePreferences()">
              @if (saving()) {
                <lucide-icon name="loader" [size]="14"></lucide-icon>
                Saving...
              } @else {
                <lucide-icon name="save" [size]="14"></lucide-icon>
                Save Preferences
              }
            </button>
          </div>
        </div>
      </div>

      <!-- Corporate Guidelines Upload -->
      <div class="section-card">
        <div class="sub-card-label">CORPORATE TECHNICAL GUIDELINES</div>
        <p class="section-desc">Upload your organization's technical standards. Markdown (.md) format. Optional.</p>

        @if (!project()?.corporateGuidelinesFilename) {
          <!-- Empty state -->
          <div class="upload-zone"
               [class.drag-over]="dragOver()"
               (click)="fileInput.click()"
               (dragover)="$event.preventDefault(); dragOver.set(true)"
               (dragleave)="dragOver.set(false)"
               (drop)="onFileDrop($event)">
            <lucide-icon name="file-up" [size]="24"></lucide-icon>
            <span>Drop .md file here or click to browse</span>
            <span class="upload-hint">Markdown only · max 500KB</span>
          </div>
          <input #fileInput type="file" accept=".md" style="display:none"
                 (change)="onFileSelect($event)"/>
        } @else {
          <!-- File uploaded state -->
          <div class="file-card">
            <div class="file-info">
              <lucide-icon name="file-text" [size]="20"></lucide-icon>
              <div>
                <div class="file-name">{{ project()!.corporateGuidelinesFilename }}</div>
                <div class="file-meta">Uploaded {{ project()!.corporateGuidelinesUploadedAt | date:'MMM d, yyyy' }}</div>
              </div>
            </div>
            <div class="file-actions">
              <button class="btn btn-ghost btn-sm" (click)="viewCorporateGuidelines()">
                <lucide-icon name="book-open" [size]="13"></lucide-icon>
                View
              </button>
              <button class="btn btn-ghost btn-sm" (click)="replaceInput.click()">
                <lucide-icon name="refresh-ccw" [size]="13"></lucide-icon>
                Replace
              </button>
              <button class="btn btn-ghost btn-sm btn-danger" (click)="removeGuidelines()">
                <lucide-icon name="trash-2" [size]="13"></lucide-icon>
                Remove
              </button>
              <input #replaceInput type="file" accept=".md" style="display:none"
                     (change)="onFileSelect($event)"/>
            </div>
          </div>
        }

        @if (uploadError()) {
          <div class="field-error">{{ uploadError() }}</div>
        }
      </div>

      <!-- Global Generic Guidelines -->
      <div class="section-card">
        <div class="guidelines-header">
          <div class="guidelines-title">
            <lucide-icon name="info" [size]="16"></lucide-icon>
            <div>
              <div class="sub-card-label" style="margin-bottom: 2px;">GLOBAL GENERIC GUIDELINES</div>
              <p class="section-desc" style="margin:0">These baseline standards are always applied to all generated artifacts.</p>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" (click)="globalGuidelinesOpen.set(!globalGuidelinesOpen())">
            {{ globalGuidelinesOpen() ? 'Hide' : 'View' }}
            <lucide-icon [name]="globalGuidelinesOpen() ? 'chevron-down' : 'chevron-right'" [size]="13"></lucide-icon>
          </button>
        </div>

        @if (globalGuidelinesOpen()) {
          <div class="global-guidelines-content">
            <div class="markdown-content">
              <markdown [data]="globalGuidelinesContent()"></markdown>
            </div>
          </div>
        }
      </div>

      <!-- Action Bar: Continue to Step 2 -->
      @if (project()?.techPreferencesSavedAt) {
        <div class="action-bar">
          <div class="action-bar-left">
            <lucide-icon name="check-circle" [size]="16"></lucide-icon>
            <span>Tech Preferences saved</span>
          </div>
          <button class="btn btn-primary" (click)="continueToArchitecture()">
            Generate Architecture Overview
            <lucide-icon name="arrow-right" [size]="14"></lucide-icon>
          </button>
        </div>
      }
    </div>

    <!-- Guidelines Drawer -->
    <app-guidelines-drawer
      [visible]="drawerVisible()"
      [title]="drawerTitle()"
      [content]="drawerContent()"
      (closed)="drawerVisible.set(false)">
    </app-guidelines-drawer>
  `,
  styles: [`
    .step-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .section-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
    }

    .section-header {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--foreground);
      margin: 0 0 6px;
    }

    .section-desc {
      font-size: 13px;
      color: var(--muted-foreground);
      margin: 0 0 16px;
      line-height: 1.5;
    }

    .sub-card {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
    }

    .sub-card-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--muted-foreground);
      margin-bottom: 16px;
    }

    .field-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .field-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--muted-foreground);
    }

    .select {
      width: 100%;
      height: 38px;
      padding: 0 10px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--card);
      color: var(--foreground);
      font-size: 14px;
      font-family: var(--font-family);
      cursor: pointer;
      outline: none;
      appearance: auto;
      transition: border-color 0.15s;
    }

    .select:focus {
      border-color: var(--primary);
    }

    .other-input {
      height: 38px;
      padding: 0 10px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: var(--card);
      color: var(--foreground);
      font-size: 14px;
      font-family: var(--font-family);
      outline: none;
      transition: border-color 0.15s;
    }

    .other-input:focus {
      border-color: var(--primary);
    }

    .save-row {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 12px;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    .save-success {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #16a34a;
    }

    /* Upload zone */
    .upload-zone {
      border: 2px dashed var(--border);
      border-radius: var(--radius);
      background: var(--muted);
      padding: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      color: var(--muted-foreground);
      font-size: 14px;
      margin-bottom: 4px;
    }

    .upload-zone:hover, .upload-zone.drag-over {
      border-color: var(--primary);
      background: color-mix(in srgb, var(--primary) 5%, var(--background));
    }

    .upload-hint {
      font-size: 12px;
      color: var(--muted-foreground);
      opacity: 0.7;
    }

    /* File uploaded card */
    .file-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      gap: 12px;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--muted-foreground);
    }

    .file-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--foreground);
    }

    .file-meta {
      font-size: 12px;
      color: var(--muted-foreground);
    }

    .file-actions {
      display: flex;
      gap: 8px;
    }

    .field-error {
      font-size: 12px;
      color: #dc2626;
      margin-top: 6px;
    }

    /* Global guidelines */
    .guidelines-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .guidelines-title {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      color: var(--muted-foreground);
    }

    .global-guidelines-content {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    .markdown-content {
      font-size: 14px;
      line-height: 1.7;
      color: var(--foreground);
      max-height: 400px;
      overflow-y: auto;
    }

    .markdown-content ::ng-deep h1 { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
    .markdown-content ::ng-deep h2 { font-size: 14px; font-weight: 600; margin: 16px 0 6px; }
    .markdown-content ::ng-deep ul { padding-left: 20px; margin-bottom: 12px; }
    .markdown-content ::ng-deep li { margin-bottom: 3px; font-size: 13px; }
    .markdown-content ::ng-deep code {
      background: var(--muted);
      padding: 2px 5px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 12px;
    }

    /* Action bar */
    .action-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }

    .action-bar-left {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--muted-foreground);
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 16px;
      height: 36px;
      border-radius: var(--radius);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--muted-foreground);
      transition: background 0.15s, color 0.15s;
      font-family: var(--font-family);
      white-space: nowrap;
    }

    .btn:hover {
      background: var(--muted);
      color: var(--foreground);
    }

    .btn.btn-sm {
      height: 30px;
      padding: 0 10px;
      font-size: 12px;
    }

    .btn.btn-primary {
      background: var(--primary);
      color: var(--primary-foreground);
      border-color: var(--primary);
    }

    .btn.btn-primary:hover:not(:disabled) {
      opacity: 0.88;
    }

    .btn.btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn.btn-ghost {
      border-color: transparent;
    }

    .btn.btn-danger:hover {
      color: #dc2626;
      border-color: #dc2626;
      background: color-mix(in srgb, #dc2626 8%, transparent);
    }
  `]
})
export class TechPreferencesComponent implements OnInit {
  project = signal<Project | null>(null);
  saving = signal(false);
  saveSuccess = signal(false);
  dragOver = signal(false);
  uploadError = signal('');
  globalGuidelinesOpen = signal(false);
  globalGuidelinesContent = signal('');
  drawerVisible = signal(false);
  drawerTitle = signal('');
  drawerContent = signal('');
  private prefsTick = signal(0);

  prefs = {
    frontend: '',
    backend: '',
    database: '',
    deployment: '',
    auth: '',
    apiStyle: '',
  };

  otherValues = {
    frontend: '',
    backend: '',
    database: '',
    deployment: '',
    auth: '',
    apiStyle: '',
  };

  readonly frontendOptions = FRONTEND_OPTIONS;
  readonly backendOptions = BACKEND_OPTIONS;
  readonly databaseOptions = DATABASE_OPTIONS;
  readonly deploymentOptions = DEPLOYMENT_OPTIONS;
  readonly authOptions = AUTH_OPTIONS;
  readonly apiStyleOptions = API_STYLE_OPTIONS;

  canSave = computed(() => {
    this.prefsTick(); // signal dependency so computed re-runs on every pref change
    const p = this.prefs;
    const o = this.otherValues;
    const effectiveFrontend = p.frontend === 'Other' ? o.frontend : p.frontend;
    const effectiveBackend = p.backend === 'Other' ? o.backend : p.backend;
    const effectiveDatabase = p.database === 'Other' ? o.database : p.database;
    const effectiveDeployment = p.deployment === 'Other' ? o.deployment : p.deployment;
    const effectiveAuth = p.auth === 'Other' ? o.auth : p.auth;
    const effectiveApiStyle = p.apiStyle === 'Other' ? o.apiStyle : p.apiStyle;
    return [effectiveFrontend, effectiveBackend, effectiveDatabase, effectiveDeployment, effectiveAuth, effectiveApiStyle]
      .every(v => v.trim().length > 0);
  });

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private http = inject(HttpClient);

  private get projectId(): string | null {
    return this.route.parent?.parent?.snapshot.paramMap.get('id') ?? null;
  }

  ngOnInit(): void {
    const id = this.projectId;
    if (id) {
      this.projectService.getById(id).subscribe(proj => {
        this.project.set(proj);
        this.loadPrefsFromProject(proj);
      });
    }
    this.loadGlobalGuidelines();
  }

  private loadPrefsFromProject(proj: Project): void {
    if (proj.techPreferences) {
      try {
        const saved = JSON.parse(proj.techPreferences) as TechPreferences;
        this.prefs.frontend = saved.frontend;
        this.prefs.backend = saved.backend;
        this.prefs.database = saved.database;
        this.prefs.deployment = saved.deployment;
        this.prefs.auth = saved.auth;
        this.prefs.apiStyle = saved.apiStyle;
      } catch { /* ignore parse error */ }
    }
  }

  private loadGlobalGuidelines(): void {
    this.http.get('/guidelines/global-generic-guidelines.md', { responseType: 'text' }).subscribe({
      next: content => this.globalGuidelinesContent.set(content),
      error: () => this.globalGuidelinesContent.set('*Could not load global guidelines.*'),
    });
  }

  onPrefChange(): void {
    this.prefsTick.update(n => n + 1);
    if (this.saveSuccess()) this.saveSuccess.set(false);
  }

  savePreferences(): void {
    if (!this.canSave() || this.saving()) return;
    const id = this.projectId;
    if (!id) return;

    const effectivePrefs: TechPreferences = {
      frontend: this.prefs.frontend === 'Other' ? this.otherValues.frontend : this.prefs.frontend,
      backend: this.prefs.backend === 'Other' ? this.otherValues.backend : this.prefs.backend,
      database: this.prefs.database === 'Other' ? this.otherValues.database : this.prefs.database,
      deployment: this.prefs.deployment === 'Other' ? this.otherValues.deployment : this.prefs.deployment,
      auth: this.prefs.auth === 'Other' ? this.otherValues.auth : this.prefs.auth,
      apiStyle: this.prefs.apiStyle === 'Other' ? this.otherValues.apiStyle : this.prefs.apiStyle,
    };

    this.saving.set(true);
    this.projectService.saveTechPreferences(id, effectivePrefs).subscribe({
      next: proj => {
        this.project.set(proj);
        this.saving.set(false);
        this.saveSuccess.set(true);
        this.projectService.notifyProjectChanged(id);
        setTimeout(() => this.saveSuccess.set(false), 3000);
      },
      error: () => this.saving.set(false),
    });
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0]);
      input.value = '';
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFile(file);
  }

  private handleFile(file: File): void {
    this.uploadError.set('');
    if (!file.name.toLowerCase().endsWith('.md')) {
      this.uploadError.set('Only .md files are accepted.');
      return;
    }
    if (file.size > 512_000) {
      this.uploadError.set('Maximum file size is 500KB.');
      return;
    }
    const id = this.projectId;
    if (!id) return;
    this.projectService.uploadCorporateGuidelines(id, file).subscribe({
      next: proj => {
        this.project.set(proj);
        this.projectService.notifyProjectChanged(id);
      },
      error: () => this.uploadError.set('Upload failed. Please try again.'),
    });
  }

  removeGuidelines(): void {
    const id = this.projectId;
    if (!id) return;
    this.projectService.deleteCorporateGuidelines(id).subscribe({
      next: proj => {
        this.project.set(proj);
        this.projectService.notifyProjectChanged(id);
      },
    });
  }

  viewCorporateGuidelines(): void {
    // We need to fetch the content from backend — use a project reload
    // For now, show a drawer note that we need to re-fetch the full content
    // (corporateGuidelinesContent is not in the DTO to avoid bloating responses)
    this.drawerTitle.set('Corporate Technical Guidelines');
    this.drawerContent.set('*Loading corporate guidelines...*');
    this.drawerVisible.set(true);
    // Fetch content via a dedicated endpoint or just show file info
    this.http.get<{content: string}>(`/api/projects/${this.projectId}/corporate-guidelines`).subscribe({
      next: res => this.drawerContent.set(res.content),
      error: () => this.drawerContent.set('*Could not load corporate guidelines.*'),
    });
  }

  continueToArchitecture(): void {
    const id = this.projectId;
    if (id) {
      this.router.navigate(['/projects', id, 'technical-design', 'architecture']);
    }
  }
}
