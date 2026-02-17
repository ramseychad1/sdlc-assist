import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-technical-design',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="placeholder">
      <div class="placeholder-content">
        <lucide-icon name="blocks" [size]="48"></lucide-icon>
        <h2>Technical Design</h2>
        <p>Coming Soon</p>
        <p class="hint">Architecture diagrams, database schemas, and API specifications will be available here.</p>
      </div>
    </div>
  `,
  styles: [`
    .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }

    .placeholder-content {
      text-align: center;
      color: var(--muted-foreground);
      max-width: 400px;
    }

    .placeholder-content lucide-icon {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .placeholder-content h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--foreground);
      margin: 0 0 8px;
    }

    .placeholder-content p {
      font-size: 14px;
      margin: 0;
    }

    .placeholder-content .hint {
      margin-top: 12px;
      font-size: 13px;
      opacity: 0.7;
    }
  `]
})
export class TechnicalDesignComponent {}
