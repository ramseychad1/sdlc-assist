import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { HeaderComponent, Breadcrumb } from '../../shared/components/header.component';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { Project } from '../../core/models/project.model';

interface SdlcPhase {
    label: string;
    route: string;
    enabled: boolean;
    tooltip?: string;
}

@Component({
    selector: 'app-project-layout',
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,
        LucideAngularModule,
        SidebarComponent,
        HeaderComponent,
    ],
    template: `
    <div class="layout">
      <app-sidebar
        [projects]="projects()"
        [userName]="authService.currentUser?.displayName || ''"
        (projectSelected)="onProjectSelect($event)">
      </app-sidebar>

      <div class="main">
        <app-header [breadcrumbs]="breadcrumbs()"></app-header>

        <div class="content">
          @if (project(); as proj) {
            <div class="page-header">
              <h1>{{ proj.name }}</h1>
            </div>

            <div class="tabs">
              @for (phase of phases(); track phase.label) {
                @if (phase.enabled) {
                  <button
                    class="tab"
                    [class.active]="isActivePhase(phase.route)"
                    (click)="navigateToPhase(phase.route)">
                    {{ phase.label }}
                  </button>
                } @else {
                  <button class="tab disabled"
                          [title]="phase.tooltip || 'Coming Soon'"
                          disabled>
                    <lucide-icon name="lock" [size]="14"></lucide-icon>
                    {{ phase.label }}
                  </button>
                }
              }
            </div>

            <div class="progress-section">
              <div class="progress-label">
                <span>Progress</span>
                <span class="progress-value">{{ progressPercent() }}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="progressPercent()"></div>
              </div>
              <div class="progress-steps">
                @for (phase of phases(); track phase.route; let i = $index) {
                  <div class="progress-step"
                       [class.active]="isPhaseActive(phase)"
                       [class.done]="isPhaseDone(phase)"
                       [title]="phase.label">
                    @if (isPhaseDone(phase)) {
                      <lucide-icon name="check" [size]="12"></lucide-icon>
                    } @else {
                      <span class="step-number">{{ i + 1 }}</span>
                    }
                  </div>
                }
              </div>
            </div>

            <router-outlet></router-outlet>
          }
        </div>
      </div>
    </div>
  `,
    styles: [`
    .layout {
      display: flex;
      height: 100vh;
      background-color: var(--background);
    }

    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .content {
      flex: 1;
      padding: 32px;
      overflow-y: auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin-bottom: 4px;
    }

    .tabs {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--border);
      margin-bottom: 24px;
    }

    .tab {
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      font-family: var(--font-family);
      border: none;
      background: none;
      cursor: pointer;
      color: var(--muted-foreground);
      border-bottom: 2px solid transparent;
      transition: color 0.15s, border-color 0.15s;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .tab.active {
      color: var(--foreground);
      border-bottom-color: var(--foreground);
    }

    .tab.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .progress-section {
      margin-bottom: 24px;
    }

    .progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: var(--muted-foreground);
      margin-bottom: 6px;
    }

    .progress-value {
      font-weight: 500;
      color: var(--foreground);
    }

    .progress-bar {
      height: 8px;
      background-color: var(--muted);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background-color: var(--primary);
      border-radius: var(--radius-full);
      transition: width 0.3s ease;
    }

    .progress-steps {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      padding: 0 2px;
    }

    .progress-step {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--muted);
      border: 2px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      color: var(--muted-foreground);
      transition: all 0.2s ease;
    }

    .progress-step .step-number {
      line-height: 1;
    }

    .progress-step.active {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);
    }

    .progress-step.done {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }
  `],
})
export class ProjectLayoutComponent implements OnInit {
    project = signal<Project | null>(null);
    projects = signal<Project[]>([]);
    breadcrumbs = signal<Breadcrumb[]>([]);
    progressPercent = signal(20);
    activePhase = signal<string>('planning');
    phases = signal<SdlcPhase[]>([]);

    private destroyRef = inject(DestroyRef);

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private projectService: ProjectService,
        public authService: AuthService,
    ) {}

    ngOnInit(): void {
        this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            const projectId = params.get('id');
            if (projectId) {
                this.loadProject(projectId);
            }
        });

        this.projectService.getAll().subscribe({
            next: (projects) => this.projects.set(projects),
        });

        // Track active phase based on route
        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(() => {
            this.updateActivePhase();
        });

        // Set initial active phase
        this.updateActivePhase();
    }

    private loadProject(projectId: string): void {
        this.projectService.getById(projectId).subscribe({
            next: (project) => {
                this.project.set(project);
                this.updatePhases(project);
                this.updateProgress(project);
                this.breadcrumbs.set([
                    { label: 'Projects', route: '/dashboard' },
                    { label: project.name },
                ]);
            },
            error: () => this.router.navigate(['/dashboard']),
        });
    }

    private updatePhases(project: Project): void {
        const hasPrd = !!project.prdContent && project.prdContent.trim().length > 0;

        this.phases.set([
            { label: 'Planning & Analysis', route: 'planning', enabled: true },
            {
                label: 'UX Design',
                route: 'ux-design',
                enabled: hasPrd,
                tooltip: hasPrd ? undefined : 'Complete Planning & Analysis first'
            },
            { label: 'Technical Design', route: 'technical-design', enabled: false },
            { label: 'Implementation Plan', route: 'implementation', enabled: false },
            { label: 'Artifacts & Export', route: 'artifacts', enabled: false },
        ]);
    }

    private updateProgress(project: Project): void {
        let completedPhases = 0;
        const totalPhases = 5;

        // Phase 1: Planning & Analysis - complete when PRD exists
        if (project.prdContent && project.prdContent.trim().length > 0) {
            completedPhases++;
        }

        // Phase 2: Design - complete when template is selected
        if (project.selectedTemplateId) {
            completedPhases++;
        }

        // Calculate percentage (each phase is 20%)
        const percent = (completedPhases / totalPhases) * 100;
        this.progressPercent.set(Math.round(percent));
    }

    onProjectSelect(project: Project): void {
        this.router.navigate(['/projects', project.id, 'planning']);
    }

    navigateToPhase(route: string): void {
        const projectId = this.project()?.id;
        if (projectId) {
            this.router.navigate(['/projects', projectId, route]);
        }
    }

    isActivePhase(route: string): boolean {
        return this.activePhase() === route;
    }

    private updateActivePhase(): void {
        const url = this.router.url;
        const phase = this.phases().find(p => url.includes(`/${p.route}`));
        if (phase) {
            this.activePhase.set(phase.route);
        }
    }

    isPhaseActive(phase: SdlcPhase): boolean {
        return this.activePhase() === phase.route;
    }

    isPhaseDone(phase: SdlcPhase): boolean {
        const project = this.project();
        if (!project) return false;

        // Planning & Analysis is done when PRD is complete
        if (phase.route === 'planning') {
            return !!project.prdContent && project.prdContent.trim().length > 0;
        }

        // UX Design is done when template is selected
        if (phase.route === 'ux-design') {
            return !!project.selectedTemplateId;
        }

        // Other phases not yet implemented
        return false;
    }
}
