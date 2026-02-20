import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-technical-design',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="technical-design-page">
      <div class="coming-soon-card">
        <div class="icon-wrap">
          <lucide-icon name="wrench" [size]="40"></lucide-icon>
        </div>
        <div class="badge">Coming Soon</div>
        <h2>Technical Design</h2>
        <p class="description">
          Architecture diagrams, database schemas, API specifications, and system design
          documents will be generated here based on your PRD and UX prototypes.
        </p>
        <button class="btn btn-ghost" (click)="backToUxDesign()">
          <lucide-icon name="arrow-left" [size]="14"></lucide-icon>
          Back to UX Design
        </button>
      </div>
    </div>
  `,
  styles: [`
    .technical-design-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }

    .coming-soon-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      max-width: 440px;
      padding: 48px 40px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      gap: 16px;
    }

    .icon-wrap {
      color: var(--muted-foreground);
      opacity: 0.5;
    }

    .badge {
      display: inline-block;
      padding: 3px 10px;
      background: color-mix(in srgb, var(--primary) 10%, transparent);
      color: var(--primary);
      border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    h2 {
      font-size: 22px;
      font-weight: 700;
      color: var(--foreground);
      margin: 0;
    }

    .description {
      font-size: 14px;
      color: var(--muted-foreground);
      line-height: 1.6;
      margin: 0;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 16px;
      height: 36px;
      border-radius: var(--radius);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--border);
      background: transparent;
      color: var(--muted-foreground);
      transition: background 0.15s, color 0.15s;
      margin-top: 8px;
    }

    .btn:hover {
      background: var(--muted);
      color: var(--foreground);
    }
  `]
})
export class TechnicalDesignComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  backToUxDesign(): void {
    const projectId = this.route.parent?.snapshot.paramMap.get('id');
    if (projectId) {
      this.router.navigate(['/projects', projectId, 'ux-design', 'prototypes']);
    }
  }
}
