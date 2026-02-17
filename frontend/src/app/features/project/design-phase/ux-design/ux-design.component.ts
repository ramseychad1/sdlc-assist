import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TemplateGalleryComponent } from '../template-gallery/template-gallery.component';

@Component({
  selector: 'app-ux-design',
  standalone: true,
  imports: [CommonModule, TemplateGalleryComponent],
  template: `
    <div class="ux-design">
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
export class UxDesignComponent {}
