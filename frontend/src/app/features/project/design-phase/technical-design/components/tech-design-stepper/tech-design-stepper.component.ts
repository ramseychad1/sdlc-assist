import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

interface StepDef {
  number: number;
  label: string;
}

@Component({
  selector: 'app-tech-design-stepper',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="stepper-container">
      <div class="stepper-header">
        <span class="stepper-label">Technical Design Progress</span>
        <span class="stepper-percentage">{{ progressPercentage }}%</span>
      </div>

      <div class="stepper">
        @for (step of steps; track step.number; let last = $last) {
          <div
            class="step"
            [class.completed]="isCompleted(step.number)"
            [class.active]="currentStep === step.number"
            [class.stale]="isStale(step.number)"
            [class.locked]="isLocked(step.number)"
            [class.navigable]="isNavigable(step.number)"
            (click)="onStepClick(step.number)">
            <div class="step-dot">
              @if (isStale(step.number)) {
                <lucide-icon name="triangle-alert" [size]="12"></lucide-icon>
              } @else if (isCompleted(step.number)) {
                <lucide-icon name="check" [size]="12"></lucide-icon>
              } @else {
                <span class="step-number">{{ step.number }}</span>
              }
            </div>
            <span class="step-label">{{ step.label }}</span>
          </div>

          @if (!last) {
            <div class="step-connector"
                 [class.completed]="isCompleted(step.number)"
                 [class.locked]="isLocked(step.number + 1)">
            </div>
          }
        }
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

    .step.stale .step-dot {
      background: color-mix(in srgb, #f59e0b 15%, var(--card));
      border-color: #f59e0b;
      color: #92400e;
    }

    .step.locked .step-dot {
      opacity: 0.4;
    }

    .step.navigable {
      cursor: pointer;
    }

    .step.navigable:hover .step-dot {
      transform: scale(1.1);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 20%, transparent);
    }

    .step.navigable:hover .step-label {
      color: var(--primary);
    }

    .step-label {
      font-size: 12px;
      font-weight: 500;
      color: var(--muted-foreground);
      text-align: center;
      white-space: nowrap;
      transition: color 0.15s ease;
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
      transition: background 0.2s;
    }

    .step-connector.completed {
      background: var(--primary);
    }

    .step-connector.locked {
      opacity: 0.4;
    }

    .step-number {
      line-height: 1;
    }

    @media (max-width: 768px) {
      .step-label { font-size: 10px; }
      .step-dot { width: 28px; height: 28px; font-size: 11px; }
      .step-connector { margin: 0 4px; }
    }
  `]
})
export class TechDesignStepperComponent {
  @Input() currentStep: number = 1;
  @Input() completedSteps: number[] = [];
  @Input() staleSteps: number[] = [];
  @Output() stepClicked = new EventEmitter<number>();

  readonly steps: StepDef[] = [
    { number: 1, label: 'Tech Preferences' },
    { number: 2, label: 'Architecture' },
    { number: 3, label: 'Data Model' },
    { number: 4, label: 'API Contract' },
    { number: 5, label: 'Sequence Diagrams' },
  ];

  get progressPercentage(): number {
    return Math.round((this.completedSteps.length / this.steps.length) * 100);
  }

  isCompleted(step: number): boolean {
    return this.completedSteps.includes(step) && !this.isStale(step);
  }

  isStale(step: number): boolean {
    return this.staleSteps.includes(step);
  }

  isLocked(step: number): boolean {
    if (step === 1) return false;
    return !this.completedSteps.includes(step - 1) && step !== this.currentStep;
  }

  isNavigable(step: number): boolean {
    if (step === this.currentStep) return false;
    if (step < this.currentStep) return true;
    // Can navigate forward only if previous step is completed
    return this.completedSteps.includes(step - 1);
  }

  onStepClick(step: number): void {
    if (this.isNavigable(step)) {
      this.stepClicked.emit(step);
    }
  }
}
