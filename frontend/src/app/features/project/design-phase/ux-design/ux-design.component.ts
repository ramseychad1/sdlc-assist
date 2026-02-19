import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TemplateGalleryComponent } from '../template-gallery/template-gallery.component';
import { UxDesignStepperComponent } from '../components/ux-design-stepper/ux-design-stepper.component';
import { ProjectService } from '../../../../core/services/project.service';

@Component({
  selector: 'app-ux-design',
  standalone: true,
  imports: [CommonModule, TemplateGalleryComponent, UxDesignStepperComponent],
  template: `
    <div class="ux-design">
      <app-ux-design-stepper [currentStep]="1" [maxUnlockedStep]="maxUnlockedStep()"></app-ux-design-stepper>

      <div class="phase-header">
        <h2>Design Template Selection</h2>
        <p class="phase-description">
          Choose a design template to establish the visual direction for your project.
          You can preview each template before making your selection.
        </p>
      </div>

      <app-template-gallery></app-template-gallery>
    </div>
  `,
  styles: [`
    .ux-design {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .phase-header {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .phase-header h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--foreground);
      margin: 0;
    }

    .phase-description {
      font-size: 14px;
      color: var(--muted-foreground);
      margin: 0;
    }
  `]
})
export class UxDesignComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private projectService = inject(ProjectService);

  maxUnlockedStep = signal(0);

  ngOnInit(): void {
    // route depth: template-selection -> ux-design -> projects/:id
    const projectId = this.route.parent?.parent?.snapshot.paramMap.get('id');
    if (!projectId) return;
    this.projectService.getById(projectId).subscribe({
      next: (project) => {
        if (project.designSystemContent) {
          this.maxUnlockedStep.set(2);
        }
      }
    });
  }
}
