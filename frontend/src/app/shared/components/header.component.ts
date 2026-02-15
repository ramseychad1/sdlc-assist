import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

export interface Breadcrumb {
    label: string;
    route?: string;
}

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        MatMenuModule,
        LucideAngularModule,
    ],
    template: `
    <header class="header">
      <nav class="breadcrumbs">
        @for (crumb of breadcrumbs; track crumb.label; let last = $last) {
          @if (crumb.route) {
            <a class="crumb" [routerLink]="crumb.route">{{ crumb.label }}</a>
          } @else {
            <span class="crumb current">{{ crumb.label }}</span>
          }
          @if (!last) {
            <lucide-icon name="chevron-right" [size]="16" class="separator"></lucide-icon>
          }
        }
      </nav>

      <div class="header-actions">
        <button class="btn btn-ghost btn-icon" (click)="themeService.toggle()" title="Toggle theme">
          @if (themeService.isDark()) {
            <lucide-icon name="sun" [size]="18"></lucide-icon>
          } @else {
            <lucide-icon name="moon" [size]="18"></lucide-icon>
          }
        </button>

        <button class="btn btn-ghost user-button" [matMenuTriggerFor]="userMenu">
          <div class="avatar">{{ userInitial }}</div>
          <span class="user-name">{{ authService.currentUser?.displayName || 'User' }}</span>
          <lucide-icon name="chevron-down" [size]="16"></lucide-icon>
        </button>
        <mat-menu #userMenu="matMenu">
          <div class="menu-header" mat-menu-item disabled>
            <div class="menu-user-name">{{ authService.currentUser?.displayName }}</div>
            <div class="menu-user-role">{{ authService.currentUser?.role | titlecase }}</div>
          </div>
          <hr class="menu-divider" />
          @if (authService.currentUser?.role === 'ADMIN') {
            <button mat-menu-item (click)="navigateToAdmin()">
              <lucide-icon name="users" [size]="16"></lucide-icon>
              <span>User Management</span>
            </button>
            <hr class="menu-divider" />
          }
          <button mat-menu-item (click)="onLogout()">
            <lucide-icon name="log-out" [size]="16"></lucide-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </div>
    </header>
  `,
    styles: [`
    .header {
      height: 64px;
      min-height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 32px;
      border-bottom: 1px solid var(--border);
      background-color: var(--background);
    }

    .breadcrumbs {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .crumb {
      font-size: 14px;
      color: var(--muted-foreground);
      text-decoration: none;
    }

    .crumb:hover:not(.current) {
      color: var(--foreground);
    }

    .crumb.current {
      color: var(--foreground);
      font-weight: 500;
    }

    .separator {
      color: var(--muted-foreground);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .user-button {
      gap: 8px;
    }

    .avatar {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-full);
      background-color: var(--primary);
      color: var(--primary-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
    }

    .menu-header {
      opacity: 1 !important;
      padding: 8px 16px;
    }

    .menu-user-name {
      font-weight: 500;
      font-size: 14px;
      color: var(--foreground);
    }

    .menu-user-role {
      font-size: 12px;
      color: var(--muted-foreground);
    }

    .menu-divider {
      border: none;
      border-top: 1px solid var(--border);
      margin: 4px 0;
    }
  `],
})
export class HeaderComponent {
    @Input() breadcrumbs: Breadcrumb[] = [];

    constructor(
        public authService: AuthService,
        public themeService: ThemeService,
        private router: Router,
    ) {}

    get userInitial(): string {
        const name = this.authService.currentUser?.displayName || 'U';
        return name.charAt(0).toUpperCase();
    }

    navigateToAdmin(): void {
        this.router.navigate(['/admin/users']);
    }

    onLogout(): void {
        this.authService.logout().subscribe({
            next: () => this.router.navigate(['/login']),
            error: () => this.router.navigate(['/login']),
        });
    }
}
