import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
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
              @for (phase of phases; track phase.label) {
                @if (phase.enabled) {
                  <button class="tab active">
                    {{ phase.label }}
                  </button>
                } @else {
                  <button class="tab disabled"
                          title="Coming Soon"
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
  `],
})
export class ProjectLayoutComponent implements OnInit {
    project = signal<Project | null>(null);
    projects = signal<Project[]>([]);
    breadcrumbs = signal<Breadcrumb[]>([]);
    progressPercent = signal(20);

    phases: SdlcPhase[] = [
        { label: 'Planning & Analysis', route: 'planning', enabled: true },
        { label: 'Design', route: 'design', enabled: false },
        { label: 'Implementation', route: 'implementation', enabled: false },
        { label: 'Testing & Integration', route: 'testing', enabled: false },
        { label: 'Maintenance', route: 'maintenance', enabled: false },
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private projectService: ProjectService,
        public authService: AuthService,
    ) {}

    ngOnInit(): void {
        const projectId = this.route.snapshot.paramMap.get('id');
        if (projectId) {
            this.projectService.getById(projectId).subscribe({
                next: (project) => {
                    this.project.set(project);
                    this.breadcrumbs.set([
                        { label: 'Projects', route: '/dashboard' },
                        { label: project.name },
                    ]);
                },
                error: () => this.router.navigate(['/dashboard']),
            });
        }

        this.projectService.getAll().subscribe({
            next: (projects) => this.projects.set(projects),
        });
    }

    onProjectSelect(project: Project): void {
        this.router.navigate(['/projects', project.id, 'planning']);
    }
}
