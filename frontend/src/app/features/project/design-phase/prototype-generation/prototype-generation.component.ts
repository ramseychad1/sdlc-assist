import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin, of, switchMap } from 'rxjs';
import { ProjectService } from '../../../../core/services/project.service';
import { TemplateService } from '../../../../core/services/template.service';
import { Project } from '../../../../core/models/project.model';
import { TemplateEntry } from '../../../../core/models/template.model';
import { ScreenDefinition } from '../../../../core/models/screen-definition.model';
import { UxDesignStepperComponent } from '../components/ux-design-stepper/ux-design-stepper.component';
import { ScreenCardComponent } from './screen-card/screen-card.component';

type PageState = 'review-inputs' | 'extracting' | 'review-screens' | 'confirmed';

@Component({
  selector: 'app-prototype-generation',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatSnackBarModule, UxDesignStepperComponent, ScreenCardComponent],
  template: `
    <div class="prototype-page">
      <app-ux-design-stepper
        [currentStep]="3"
        [maxUnlockedStep]="screens().length > 0 && pageState() === 'confirmed' ? 4 : 3">
      </app-ux-design-stepper>

      <div class="header">
        <h2>Design Prototype Preparation</h2>
        <p class="description">
          AI identifies the UI screens from your PRD that need prototypes.
        </p>
      </div>

      <!-- LOADING STATE -->
      @if (loading()) {
        <div class="card">
          <div class="skeleton-row">
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
          </div>
          <div class="skeleton skeleton-btn" style="margin-top: 20px;"></div>
        </div>
      }

      <!-- LOADED STATES -->
      @if (!loading()) {

        @switch (pageState()) {

          <!-- ─── STATE 1: REVIEW INPUTS ─── -->
          @case ('review-inputs') {
            <div class="input-grid">
              <div class="input-card">
                <div class="input-card-label">
                  <lucide-icon name="file-text" [size]="14"></lucide-icon>
                  Product Requirements Document
                </div>
                <div class="input-card-title">{{ project()?.name }}</div>
                <div class="input-card-sub">PRD ready for screen extraction</div>
              </div>
              <div class="input-card input-card-design">
                <div class="input-card-label">
                  <lucide-icon name="palette" [size]="14"></lucide-icon>
                  Design System
                </div>
                <div class="input-card-title">{{ template()?.name ?? 'Design System' }}</div>
                <div class="input-card-sub">
                  @if (template()) {
                    <span class="tag-badge">{{ template()!.tag }}</span>
                  }
                </div>
              </div>
            </div>

            <div class="card review-card">
              <div class="section-label">Ready to Identify Screens</div>
              <p class="section-subtitle">
                The AI agent will read your PRD and identify every distinct UI screen needed.
              </p>
              <button class="btn btn-primary btn-lg start-btn" (click)="startExtraction()">
                <lucide-icon name="scan-search" [size]="18"></lucide-icon>
                Identify Screens
              </button>
            </div>
          }

          <!-- ─── STATE 2: EXTRACTING ─── -->
          @case ('extracting') {
            <div class="input-grid faded">
              <div class="input-card">
                <div class="input-card-label">
                  <lucide-icon name="file-text" [size]="14"></lucide-icon>
                  Product Requirements Document
                </div>
                <div class="input-card-title">{{ project()?.name }}</div>
                <div class="input-card-sub">PRD ready for screen extraction</div>
              </div>
              <div class="input-card input-card-design">
                <div class="input-card-label">
                  <lucide-icon name="palette" [size]="14"></lucide-icon>
                  Design System
                </div>
                <div class="input-card-title">{{ template()?.name ?? 'Design System' }}</div>
                <div class="input-card-sub">
                  @if (template()) {
                    <span class="tag-badge">{{ template()!.tag }}</span>
                  }
                </div>
              </div>
            </div>

            <div class="card generating-card">
              <div class="section-label">Extracting Screens</div>
              <div class="generating-header">
                <lucide-icon name="scan-search" [size]="18" class="spin"></lucide-icon>
                <span>Identifying UI screens from PRD...</span>
              </div>
              <div class="progress-bar-track">
                <div class="progress-bar-fill" [style.width.%]="progress()"></div>
              </div>
              <div class="progress-pct">{{ progress() }}%</div>
              <p class="progress-message">{{ progressMessage() }}</p>
            </div>
          }

          <!-- ─── STATE 3: REVIEW SCREENS ─── -->
          @case ('review-screens') {
            <div class="context-bar">
              <div class="context-item">
                <lucide-icon name="file-text" [size]="13"></lucide-icon>
                <span>{{ project()?.name }}</span>
              </div>
              @if (template()) {
                <div class="context-sep"></div>
                <div class="context-item">
                  <lucide-icon name="palette" [size]="13"></lucide-icon>
                  <span>{{ template()!.name }}</span>
                  <span class="tag-badge">{{ template()!.tag }}</span>
                </div>
              }
            </div>

            <div class="confirm-banner">
              <div class="banner-left">
                <lucide-icon name="circle-check" [size]="16" class="banner-icon"></lucide-icon>
                <span class="banner-count">{{ screens().length }} screens identified</span>
                <span class="banner-sub">Review and remove any you don't need, then confirm.</span>
              </div>
              <button
                class="btn btn-primary"
                [disabled]="screens().length === 0 || saving()"
                (click)="confirmScreens()">
                @if (saving()) {
                  <lucide-icon name="loader-circle" [size]="14" class="spin"></lucide-icon>
                  Saving...
                } @else {
                  <lucide-icon name="check" [size]="14"></lucide-icon>
                  Confirm Screen List
                }
              </button>
            </div>

            @if (screens().length === 0) {
              <div class="empty-state">
                <lucide-icon name="inbox" [size]="32"></lucide-icon>
                <p>All screens removed. Please run extraction again.</p>
                <button class="btn btn-secondary" (click)="reExtract()">Run Again</button>
              </div>
            } @else {
              <div class="screen-grid">
                @for (screen of screens(); track screen.id) {
                  <app-screen-card
                    [screen]="screen"
                    [pageState]="pageState()"
                    (remove)="removeScreen($event)">
                  </app-screen-card>
                }
              </div>
            }
          }

          <!-- ─── STATE 4: CONFIRMED ─── -->
          @case ('confirmed') {
            <div class="context-bar">
              <div class="context-item">
                <lucide-icon name="file-text" [size]="13"></lucide-icon>
                <span>{{ project()?.name }}</span>
              </div>
              @if (template()) {
                <div class="context-sep"></div>
                <div class="context-item">
                  <lucide-icon name="palette" [size]="13"></lucide-icon>
                  <span>{{ template()!.name }}</span>
                  <span class="tag-badge">{{ template()!.tag }}</span>
                </div>
              }
            </div>

            <div class="success-bar">
              <div class="success-left">
                <lucide-icon name="circle-check-big" [size]="16" class="success-icon"></lucide-icon>
                <span class="success-count">{{ screens().length }} screens confirmed</span>
                <span class="success-sub">Screen list saved. Prototype generation coming soon.</span>
              </div>
              <button class="btn btn-secondary btn-sm" (click)="reExtract()">
                <lucide-icon name="refresh-cw" [size]="13"></lucide-icon>
                Re-run
              </button>
            </div>

            <div class="screen-grid">
              @for (screen of screens(); track screen.id) {
                <app-screen-card
                  [screen]="screen"
                  [pageState]="pageState()">
                </app-screen-card>
              }
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .prototype-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 60px;
    }

    .header h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--foreground);
      margin: 0 0 6px;
    }

    .description {
      font-size: 14px;
      color: var(--muted-foreground);
      margin: 0;
    }

    /* Input grid (review-inputs + extracting states) */
    .input-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      transition: opacity 0.3s ease;
    }

    .input-grid.faded {
      opacity: 0.5;
      pointer-events: none;
    }

    .input-card {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .input-card-design {
      background: var(--card);
    }

    .input-card-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .input-card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--foreground);
    }

    .input-card-sub {
      font-size: 12px;
      color: var(--muted-foreground);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Cards */
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px 24px;
    }

    .section-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .section-subtitle {
      font-size: 13px;
      color: var(--muted-foreground);
      margin: 0 0 20px;
    }

    .review-card {
      text-align: center;
    }

    .start-btn {
      max-width: 280px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 44px;
      font-size: 15px;
      font-weight: 600;
    }

    /* Generating card */
    .generating-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .generating-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 500;
      color: var(--foreground);
    }

    .progress-bar-track {
      height: 6px;
      background: var(--border);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 3px;
      transition: width 0.6s ease;
    }

    .progress-pct {
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
    }

    .progress-message {
      font-size: 13px;
      color: var(--muted-foreground);
      margin: 0;
    }

    /* Context bar */
    .context-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 10px 16px;
      font-size: 13px;
      color: var(--muted-foreground);
      flex-wrap: wrap;
    }

    .context-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--foreground);
      font-weight: 500;
    }

    .context-sep {
      width: 1px;
      height: 16px;
      background: var(--border);
    }

    /* Confirm banner */
    .confirm-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: color-mix(in srgb, var(--primary) 6%, var(--card));
      border: 1px solid color-mix(in srgb, var(--primary) 20%, var(--border));
      border-radius: var(--radius);
      padding: 14px 20px;
    }

    .banner-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .banner-icon {
      color: var(--primary);
      flex-shrink: 0;
    }

    .banner-count {
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
    }

    .banner-sub {
      font-size: 13px;
      color: var(--muted-foreground);
    }

    /* Success bar */
    .success-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: color-mix(in srgb, #16a34a 8%, var(--card));
      border: 1px solid color-mix(in srgb, #16a34a 25%, var(--border));
      border-radius: var(--radius);
      padding: 14px 20px;
    }

    .success-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .success-icon {
      color: #16a34a;
      flex-shrink: 0;
    }

    .success-count {
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
    }

    .success-sub {
      font-size: 13px;
      color: var(--muted-foreground);
    }

    /* Screen grid */
    .screen-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    /* Tag badge */
    .tag-badge {
      display: inline-block;
      padding: 2px 8px;
      background: color-mix(in srgb, var(--primary) 15%, transparent);
      color: var(--primary);
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 500;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      text-align: center;
      color: var(--muted-foreground);
      gap: 12px;
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
      border: none;
      transition: opacity 0.15s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--primary);
      color: var(--primary-foreground);
    }

    .btn-secondary {
      background: var(--muted);
      color: var(--foreground);
      border: 1px solid var(--border);
    }

    .btn-sm {
      height: 30px;
      padding: 0 12px;
      font-size: 12px;
    }

    .btn-lg {
      height: 44px;
      padding: 0 24px;
      font-size: 15px;
      font-weight: 600;
    }

    /* Skeleton */
    .skeleton {
      background: linear-gradient(
        90deg,
        var(--muted) 0%,
        color-mix(in srgb, var(--muted) 90%, var(--foreground)) 50%,
        var(--muted) 100%
      );
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s ease-in-out infinite;
      border-radius: var(--radius);
    }

    .skeleton-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .skeleton-card {
      height: 120px;
    }

    .skeleton-btn {
      height: 44px;
      max-width: 280px;
      margin: 0 auto;
    }

    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Spin */
    .spin {
      animation: spin 1.5s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class PrototypeGenerationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private templateService = inject(TemplateService);
  private snackBar = inject(MatSnackBar);

  pageState = signal<PageState>('review-inputs');
  project = signal<Project | null>(null);
  template = signal<TemplateEntry | null>(null);
  screens = signal<ScreenDefinition[]>([]);
  progress = signal(0);
  progressMessage = signal('Connecting to screen extraction agent...');
  saving = signal(false);
  loading = signal(true);

  private projectId!: string;

  ngOnInit(): void {
    this.projectId = this.route.parent?.parent?.snapshot.paramMap.get('id')!;
    setTimeout(() => this.loadData());
  }

  private loadData(): void {
    this.projectService.getById(this.projectId).pipe(
      switchMap(project => {
        this.project.set(project);

        const template$ = project.selectedTemplateId
          ? this.templateService.getTemplates()
          : of(null);

        const screens$ = this.projectService.getScreens(this.projectId);

        return forkJoin({ templates: template$, screens: screens$ });
      })
    ).subscribe({
      next: ({ templates, screens }) => {
        if (templates && this.project()?.selectedTemplateId) {
          const entry = templates.find((t: TemplateEntry) => t.id === this.project()!.selectedTemplateId) ?? null;
          this.template.set(entry);
        }

        if (screens && screens.length > 0) {
          this.screens.set(screens);
          this.pageState.set('confirmed');
        }

        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load project data', 'Dismiss', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }

  startExtraction(): void {
    this.pageState.set('extracting');
    this.progress.set(0);
    this.progressMessage.set('Connecting to screen extraction agent...');

    const url = `/api/projects/${this.projectId}/screens/extract`;
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener('progress', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        this.handleProgressEvent(data);
        if (data.event === 'COMPLETE' || data.event === 'ERROR') {
          eventSource.close();
        }
      } catch { /* skip malformed */ }
    });

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) return;
      eventSource.close();
      if (this.pageState() === 'extracting') {
        this.snackBar.open('Connection to agent lost', 'Dismiss', { duration: 5000 });
        this.pageState.set('review-inputs');
      }
    };
  }

  private handleProgressEvent(event: {
    event: string;
    progress?: number;
    message?: string;
    screens?: ScreenDefinition[];
  }): void {
    if (event.event === 'COMPLETE') {
      this.progress.set(100);
      this.progressMessage.set('Screen extraction complete.');
      if (event.screens && event.screens.length > 0) {
        this.screens.set(event.screens);
        this.pageState.set('review-screens');
      } else {
        this.snackBar.open('No screens were found. Please check your PRD and try again.', 'Dismiss', { duration: 5000 });
        this.pageState.set('review-inputs');
      }
    } else if (event.event === 'ERROR') {
      this.snackBar.open(event.message || 'Extraction failed', 'Dismiss', { duration: 5000 });
      this.pageState.set('review-inputs');
    } else {
      if (event.progress != null) this.progress.set(event.progress);
      if (event.message) this.progressMessage.set(event.message);
    }
  }

  removeScreen(id: string): void {
    this.screens.set(this.screens().filter(s => s.id !== id));
  }

  confirmScreens(): void {
    if (this.screens().length === 0) {
      this.snackBar.open('Please keep at least one screen.', 'Dismiss', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    this.projectService.saveScreens(this.projectId, this.screens()).subscribe({
      next: (saved) => {
        this.screens.set(saved);
        this.saving.set(false);
        this.pageState.set('confirmed');
      },
      error: () => {
        this.snackBar.open('Failed to save screens. Please try again.', 'Dismiss', { duration: 4000 });
        this.saving.set(false);
      }
    });
  }

  reExtract(): void {
    this.screens.set([]);
    this.pageState.set('review-inputs');
  }
}
