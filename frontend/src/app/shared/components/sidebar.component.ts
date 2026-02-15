import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Project } from '../../core/models/project.model';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        RouterLinkActive,
        LucideAngularModule,
    ],
    template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="brand" routerLink="/dashboard">
          <lucide-icon name="layers" [size]="24"></lucide-icon>
          <span class="brand-text">SDLC Assist</span>
        </div>
      </div>

      <nav class="sidebar-content">
        <div class="nav-section">
          <a class="nav-item"
             routerLink="/dashboard"
             routerLinkActive="active"
             [routerLinkActiveOptions]="{ exact: true }">
            <lucide-icon name="layout-dashboard" [size]="18"></lucide-icon>
            <span>Dashboard</span>
          </a>
        </div>

        <div class="nav-section">
          <div class="section-title">Projects</div>
          @for (project of projects; track project.id) {
            <a class="nav-item"
               [routerLink]="['/projects', project.id, 'planning']"
               routerLinkActive="active"
               (click)="projectSelected.emit(project)">
              <lucide-icon name="folder" [size]="18"></lucide-icon>
              <span class="project-label">{{ project.name }}</span>
            </a>
          }
          @if (projects.length === 0) {
            <div class="nav-item empty">
              <lucide-icon name="folder-open" [size]="18"></lucide-icon>
              <span>No projects</span>
            </div>
          }
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="user-info" *ngIf="userName">
          <div class="avatar">{{ userName.charAt(0).toUpperCase() }}</div>
          <span class="user-name">{{ userName }}</span>
        </div>
      </div>
    </aside>
  `,
    styles: [`
    .sidebar {
      width: 256px;
      min-width: 256px;
      height: 100vh;
      background-color: var(--sidebar);
      border-right: 1px solid var(--sidebar-border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-header {
      padding: 16px;
      border-bottom: 1px solid var(--sidebar-border);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      text-decoration: none;
      color: var(--sidebar-foreground);
    }

    .brand-text {
      font-size: 16px;
      font-weight: 600;
      color: var(--sidebar-foreground);
    }

    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .nav-section {
      margin-bottom: 8px;
    }

    .section-title {
      font-size: 12px;
      font-weight: 500;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 12px 12px 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      color: var(--sidebar-foreground);
      cursor: pointer;
      text-decoration: none;
      font-size: 14px;
      transition: background-color 0.15s;
    }

    .nav-item:hover {
      background-color: var(--sidebar-accent);
    }

    .nav-item.active {
      background-color: var(--sidebar-accent);
      font-weight: 500;
    }

    .nav-item.empty {
      color: var(--muted-foreground);
      cursor: default;
    }

    .nav-item.empty:hover {
      background-color: transparent;
    }

    .nav-item lucide-icon {
      color: var(--muted-foreground);
    }

    .nav-item.active lucide-icon {
      color: var(--sidebar-foreground);
    }

    .project-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sidebar-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--sidebar-border);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .avatar {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-full);
      background-color: var(--sidebar-primary);
      color: var(--sidebar-primary-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 600;
    }

    .user-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--sidebar-foreground);
    }
  `],
})
export class SidebarComponent {
    @Input() projects: Project[] = [];
    @Input() activeItem = '';
    @Input() userName = '';
    @Output() projectSelected = new EventEmitter<Project>();
}
