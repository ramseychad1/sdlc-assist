import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-ux-design-stepper',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="stepper-container">
      <div class="stepper-header">
        <span class="stepper-label">UX Design Progress</span>
        <span class="stepper-percentage">{{ progressPercentage }}%</span>
      </div>
      <div class="stepper">
        <div class="step" [class.completed]="currentStep >= 1" [class.active]="currentStep === 1">
          <div class="step-dot">
            @if (currentStep > 1) {
              <lucide-icon name="check" [size]="12"></lucide-icon>
            } @else {
              <span class="step-number">1</span>
            }
          </div>
          <span class="step-label">Template Selection</span>
        </div>
        <div class="step-connector" [class.completed]="currentStep >= 2"></div>
        <div class="step" [class.completed]="currentStep >= 2" [class.active]="currentStep === 2">
          <div class="step-dot">
            @if (currentStep > 2) {
              <lucide-icon name="check" [size]="12"></lucide-icon>
            } @else {
              <span class="step-number">2</span>
            }
          </div>
          <span class="step-label">Design System</span>
        </div>
        <div class="step-connector" [class.disabled]="currentStep < 3"></div>
        <div class="step" [class.disabled]="currentStep < 3" [class.active]="currentStep === 3">
          <div class="step-dot">
            <span class="step-number">3</span>
          </div>
          <span class="step-label">Prototypes</span>
        </div>
        <div class="step-connector" [class.disabled]="currentStep < 4"></div>
        <div class="step" [class.disabled]="currentStep < 4" [class.active]="currentStep === 4">
          <div class="step-dot">
            <span class="step-number">4</span>
          </div>
          <span class="step-label">Acceptance</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stepper-container {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px 24px;
      margin-bottom: 24px;
    }

    .stepper-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .stepper-label {
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .stepper-percentage {
      font-size: 16px;
      font-weight: 600;
      color: var(--primary);
    }

    .stepper {
      display: flex;
      align-items: center;
      gap: 0;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      flex: 0 0 auto;
    }

    .step-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--muted);
      border: 2px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
      color: var(--muted-foreground);
      transition: all 0.2s ease;
    }

    .step.active .step-dot {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
      box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent);
    }

    .step.completed .step-dot {
      background: var(--primary);
      border-color: var(--primary);
      color: white;
    }

    .step.disabled .step-dot {
      opacity: 0.4;
    }

    .step-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--muted-foreground);
      text-align: center;
      white-space: nowrap;
    }

    .step.active .step-label {
      color: var(--foreground);
      font-weight: 600;
    }

    .step.completed .step-label {
      color: var(--foreground);
    }

    .step-connector {
      flex: 1;
      height: 2px;
      background: var(--border);
      margin: 0 8px;
      position: relative;
      top: -16px;
    }

    .step-connector.completed {
      background: var(--primary);
    }

    .step-connector.disabled {
      opacity: 0.4;
    }

    .step-number {
      line-height: 1;
    }

    @media (max-width: 768px) {
      .step-label {
        font-size: 10px;
      }

      .step-dot {
        width: 28px;
        height: 28px;
        font-size: 11px;
      }

      .step-connector {
        margin: 0 4px;
      }
    }
  `]
})
export class UxDesignStepperComponent {
  @Input() currentStep: number = 1;

  get progressPercentage(): number {
    return Math.round((this.currentStep / 4) * 100);
  }
}
