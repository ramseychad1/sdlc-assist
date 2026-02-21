import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterOutlet, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { Project } from '../../../../core/models/project.model';
import { ProjectService } from '../../../../core/services/project.service';
import { TechDesignStepperComponent } from './components/tech-design-stepper/tech-design-stepper.component';

@Component({
  selector: 'app-technical-design',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LucideAngularModule, TechDesignStepperComponent],
  template: `
    <div class="tech-design-page">
      @if (project(); as proj) {
        <app-tech-design-stepper
          [currentStep]="currentStep()"
          [completedSteps]="completedSteps()"
          [staleSteps]="staleSteps()"
          (stepClicked)="navigateToStep($event)">
        </app-tech-design-stepper>

        @if (staleSteps().length > 0) {
          <div class="stale-banner">
            <lucide-icon name="triangle-alert" [size]="16"></lucide-icon>
            <span>
              Tech preferences have changed. The following artifacts may no longer reflect your current stack and should be regenerated:
              <strong>{{ staleArtifactNames() }}</strong>
            </span>
          </div>
        }

        <router-outlet></router-outlet>
      }
    </div>
  `,
  styles: [`
    .tech-design-page {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .stale-banner {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 16px;
      background: color-mix(in srgb, #f59e0b 10%, transparent);
      border: 1px solid color-mix(in srgb, #f59e0b 30%, transparent);
      border-radius: var(--radius);
      margin-bottom: 20px;
      font-size: 13px;
      color: #92400e;
      line-height: 1.5;
    }

    .stale-banner lucide-icon {
      color: #f59e0b;
      flex-shrink: 0;
      margin-top: 1px;
    }
  `]
})
export class TechnicalDesignComponent implements OnInit {
  project = signal<Project | null>(null);
  currentStep = signal<number>(1);

  completedSteps = computed(() => {
    const proj = this.project();
    if (!proj) return [];
    const steps: number[] = [];
    if (proj.techPreferencesSavedAt) steps.push(1);
    if (proj.archOverviewGeneratedAt) steps.push(2);
    if (proj.dataModelGeneratedAt) steps.push(3);
    if (proj.apiContractGeneratedAt) steps.push(4);
    if (proj.sequenceDiagramsGeneratedAt) steps.push(5);
    return steps;
  });

  staleSteps = computed(() => {
    const proj = this.project();
    if (!proj || !proj.techPreferencesSavedAt) return [];
    const savedAt = new Date(proj.techPreferencesSavedAt).getTime();
    const guidelinesAt = proj.corporateGuidelinesUploadedAt
      ? new Date(proj.corporateGuidelinesUploadedAt).getTime() : 0;
    const changeAt = Math.max(savedAt, guidelinesAt);
    const stale: number[] = [];
    if (proj.archOverviewGeneratedAt && new Date(proj.archOverviewGeneratedAt).getTime() < changeAt) stale.push(2);
    if (proj.dataModelGeneratedAt && new Date(proj.dataModelGeneratedAt).getTime() < changeAt) stale.push(3);
    if (proj.apiContractGeneratedAt && new Date(proj.apiContractGeneratedAt).getTime() < changeAt) stale.push(4);
    if (proj.sequenceDiagramsGeneratedAt && new Date(proj.sequenceDiagramsGeneratedAt).getTime() < changeAt) stale.push(5);
    return stale;
  });

  staleArtifactNames = computed(() => {
    return this.staleSteps().map(s => {
      switch (s) {
        case 2: return 'Architecture Overview';
        case 3: return 'Data Model';
        case 4: return 'API Contract';
        case 5: return 'Sequence Diagrams';
        default: return '';
      }
    }).join(' · ');
  });

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);

  private readonly STEP_ROUTES: Record<number, string> = {
    1: 'tech-preferences',
    2: 'architecture',
    3: 'data-model',
    4: 'api-contract',
    5: 'sequence-diagrams',
  };

  private readonly ROUTE_STEPS: Record<string, number> = {
    'tech-preferences': 1,
    'architecture': 2,
    'data-model': 3,
    'api-contract': 4,
    'sequence-diagrams': 5,
  };

  ngOnInit(): void {
    const projectId = this.route.parent?.snapshot.paramMap.get('id');
    if (projectId) {
      this.loadProject(projectId);
    }

    this.projectService.projectChanged$.pipe(
      filter(id => id === this.project()?.id),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(id => this.loadProject(id));

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.syncStepFromUrl());

    this.syncStepFromUrl();
  }

  private loadProject(projectId: string): void {
    this.projectService.getById(projectId).subscribe({
      next: proj => {
        this.project.set(proj);
        this.enforceStepAccess();
      },
    });
  }

  private enforceStepAccess(): void {
    const url = this.router.url;
    for (const [route, step] of Object.entries(this.ROUTE_STEPS)) {
      if (url.includes(`/technical-design/${route}`)) {
        if (step > 1 && !this.completedSteps().includes(step - 1)) {
          this.redirectToLastAccessible();
        }
        return;
      }
    }
  }

  private redirectToLastAccessible(): void {
    const projectId = this.project()?.id;
    if (!projectId) return;
    const completed = this.completedSteps();
    let targetStep = 1;
    for (let s = 1; s <= 4; s++) {
      if (completed.includes(s)) targetStep = s + 1;
      else break;
    }
    const route = this.STEP_ROUTES[Math.min(targetStep, 5)];
    this.router.navigate(['/projects', projectId, 'technical-design', route], { replaceUrl: true });
  }

  private syncStepFromUrl(): void {
    const url = this.router.url;
    for (const [route, step] of Object.entries(this.ROUTE_STEPS)) {
      if (url.includes(`/technical-design/${route}`)) {
        this.currentStep.set(step);
        return;
      }
    }
  }

  navigateToStep(step: number): void {
    const projectId = this.project()?.id;
    const routePath = this.STEP_ROUTES[step];
    if (!projectId || !routePath) return;
    if (step > 1 && !this.completedSteps().includes(step - 1)) return;
    this.router.navigate(['/projects', projectId, 'technical-design', routePath]);
  }
}
