import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { UxDesignStepperComponent } from '../components/ux-design-stepper/ux-design-stepper.component';

@Component({
  selector: 'app-design-system-generation',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UxDesignStepperComponent],
  template: `
    <div class="design-system-generation">
      <app-ux-design-stepper [currentStep]="2"></app-ux-design-stepper>

      <div class="header">
        <h2>Design System Generation</h2>
        <p class="description">
          AI-powered design system customization based on your PRD
        </p>
      </div>

      <div class="coming-soon">
        <lucide-icon name="sparkles" [size]="64"></lucide-icon>
        <h3>Coming Soon</h3>
        <p>Design system generation will be implemented in Phase 2.2</p>
      </div>
    </div>
  `,
  styles: [`
    .design-system-generation {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .header {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .header h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--foreground);
      margin: 0;
    }

    .description {
      font-size: 14px;
      color: var(--muted-foreground);
      margin: 0;
    }

    .coming-soon {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 24px;
      text-align: center;
      color: var(--muted-foreground);
    }

    .coming-soon lucide-icon {
      margin-bottom: 24px;
      opacity: 0.5;
    }

    .coming-soon h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--foreground);
      margin: 0 0 8px;
    }

    .coming-soon p {
      font-size: 14px;
      margin: 0;
    }
  `]
})
export class DesignSystemGenerationComponent {}
