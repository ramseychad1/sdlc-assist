import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-design-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="design-layout">
      <div class="sub-tabs">
        <a
          routerLink="ux-design"
          routerLinkActive="active"
          class="sub-tab">
          UX Design
        </a>
        <a
          routerLink="technical-design"
          routerLinkActive="active"
          class="sub-tab">
          Technical Design
        </a>
      </div>

      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .design-layout {
      display: flex;
      flex-direction: column;
    }

    .sub-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 24px;
      border-bottom: 1px solid var(--border);
    }

    .sub-tab {
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 500;
      color: var(--muted-foreground);
      text-decoration: none;
      border-bottom: 2px solid transparent;
      transition: color 0.15s, border-color 0.15s;
      margin-bottom: -1px;
    }

    .sub-tab:hover {
      color: var(--foreground);
    }

    .sub-tab.active {
      color: var(--foreground);
      border-bottom-color: var(--primary);
    }
  `]
})
export class DesignLayoutComponent {}
