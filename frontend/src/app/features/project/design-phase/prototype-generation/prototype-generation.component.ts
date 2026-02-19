import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { UxDesignStepperComponent } from '../components/ux-design-stepper/ux-design-stepper.component';

@Component({
  selector: 'app-prototype-generation',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, UxDesignStepperComponent],
  template: `
    <div class="prototype-page">
      <app-ux-design-stepper [currentStep]="3"></app-ux-design-stepper>

      <div class="header">
        <h2>Prototype Generation</h2>
        <p class="description">AI-powered screen prototypes based on your design system</p>
      </div>

      <div class="coming-soon">
        <lucide-icon name="layers" [size]="64"></lucide-icon>
        <h3>Coming Soon</h3>
        <p>Prototype generation will be available in Phase 2.3</p>
      </div>
    </div>
  `,
  styles: [`
    .prototype-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
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
      opacity: 0.4;
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
export class PrototypeGenerationComponent {}
