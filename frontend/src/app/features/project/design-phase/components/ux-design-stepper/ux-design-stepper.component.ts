import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Router, ActivatedRoute } from '@angular/router';

const STEP_ROUTES: Record<number, string> = {
  1: 'template-selection',
  2: 'design-system',
  3: 'prototypes',
};

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
        <!-- Step 1: Template Selection -->
        <div
          class="step"
          [class.completed]="currentStep >= 1"
          [class.active]="currentStep === 1"
          [class.navigable]="isNavigable(1)"
          (click)="navigateToStep(1)">
          <div class="step-dot">
            @if (currentStep > 1) {
              <lucide-icon name="check" [size]="12"></lucide-icon>
            } @else {
              <span class="step-number">1</span>
            }
          </div>
          <span class="step-label">Template Selection</span>
        </div>

        <div class="step-connector" [class.completed]="currentStep >= 2 || isDoneAhead(2)"></div>

        <!-- Step 2: Design System -->
        <div
          class="step"
          [class.completed]="currentStep >= 2 || isDoneAhead(2)"
          [class.active]="currentStep === 2"
          [class.navigable]="isNavigable(2)"
          [class.disabled]="currentStep < 2 && !isDoneAhead(2)"
          (click)="navigateToStep(2)">
          <div class="step-dot">
            @if (currentStep > 2 || isDoneAhead(2)) {
              <lucide-icon name="check" [size]="12"></lucide-icon>
            } @else {
              <span class="step-number">2</span>
            }
          </div>
          <span class="step-label">Design System</span>
        </div>

        <div class="step-connector" [class.disabled]="currentStep < 3 && !isDoneAhead(3)"></div>

        <!-- Step 3: Prototypes -->
        <div
          class="step"
          [class.completed]="currentStep >= 3 || isDoneAhead(3)"
          [class.active]="currentStep === 3"
          [class.navigable]="isNavigable(3)"
          [class.disabled]="currentStep < 3 && !isDoneAhead(3)"
          (click)="navigateToStep(3)">
          <div class="step-dot">
            @if (currentStep > 3 || isDoneAhead(3)) {
              <lucide-icon name="check" [size]="12"></lucide-icon>
            } @else {
              <span class="step-number">3</span>
            }
          </div>
          <span class="step-label">Prototypes</span>
        </div>

        <div class="step-connector" [class.completed]="uxDesignComplete" [class.disabled]="!step4Enabled && !uxDesignComplete"></div>

        <!-- Step 4: Complete (visual indicator only) -->
        <div
          class="step"
          [class.completed]="uxDesignComplete"
          [class.disabled]="!uxDesignComplete">
          <div class="step-dot">
            @if (uxDesignComplete) {
              <lucide-icon name="check" [size]="12"></lucide-icon>
            } @else {
              <span class="step-number">4</span>
            }
          </div>
          <span class="step-label">Complete</span>
        </div>
      </div>

      <div class="continue-row">
        <button class="return-btn" (click)="onReturnClick()">
          <lucide-icon name="arrow-left" [size]="12"></lucide-icon>
          {{ returnLabel }}
        </button>
        @if (step4Enabled) {
          <button class="continue-btn" (click)="onStep4Click()">
            Continue to Technical Design
            <lucide-icon name="arrow-right" [size]="12"></lucide-icon>
          </button>
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

    .step.navigable {
      cursor: pointer;
    }

    .step.navigable .step-dot {
      transition: all 0.2s ease, transform 0.15s ease;
    }

    .step.navigable:hover .step-dot {
      transform: scale(1.1);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary) 25%, transparent);
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

    .continue-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }

    .return-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 14px;
      height: 34px;
      background: none;
      color: var(--muted-foreground);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: color 0.15s, border-color 0.15s, background 0.15s;
      font-family: var(--font-family);
    }

    .return-btn:hover {
      color: var(--foreground);
      border-color: var(--foreground);
      background: var(--accent);
    }

    .continue-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 16px;
      height: 34px;
      background: var(--primary);
      color: var(--primary-foreground);
      border: none;
      border-radius: var(--radius);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: opacity 0.15s;
      font-family: var(--font-family);
    }

    .continue-btn:hover {
      opacity: 0.88;
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
  /** Highest step number that has been completed and saved (may be > currentStep). */
  @Input() maxUnlockedStep: number = 0;
  @Input() step4Enabled: boolean = false;
  @Input() uxDesignComplete: boolean = false;
  @Output() step4Click = new EventEmitter<void>();

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  get returnLabel(): string {
    switch (this.currentStep) {
      case 1: return 'Return to Planning & Analysis';
      case 2: return 'Return to Template Selection';
      case 3: return 'Return to Design System';
      default: return 'Return';
    }
  }

  onReturnClick(): void {
    if (this.currentStep === 1) {
      this.router.navigate(['../../planning'], { relativeTo: this.route });
    } else {
      this.navigateToStep(this.currentStep - 1);
    }
  }

  get progressPercentage(): number {
    if (this.uxDesignComplete) return 100;
    const effective = Math.max(this.currentStep, this.maxUnlockedStep);
    return Math.round((effective / 4) * 100);
  }

  onStep4Click(): void {
    if (this.step4Enabled) {
      this.step4Click.emit();
    }
  }

  /** A future step that is beyond currentStep but already has saved data. */
  isDoneAhead(step: number): boolean {
    return step > this.currentStep && step <= this.maxUnlockedStep;
  }

  /** Any step (back or forward-unlocked) that can be clicked — never the current step. */
  isNavigable(step: number): boolean {
    return step !== this.currentStep && (step < this.currentStep || step <= this.maxUnlockedStep);
  }

  navigateToStep(step: number): void {
    if (!this.isNavigable(step)) return;
    const routePath = STEP_ROUTES[step];
    if (!routePath) return;
    this.router.navigate(['../', routePath], { relativeTo: this.route });
  }
}
