import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { Project } from '../../core/models/project.model';

const STORAGE_KEY = 'sidebar-collapsed';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, LucideAngularModule],
    template: `
    <aside class="sidebar" [class.collapsed]="collapsed()">

      <!-- Header: brand + toggle -->
      <div class="sidebar-header">
        <div class="brand" routerLink="/dashboard" [title]="collapsed() ? 'SDLC Assist' : ''">
          <lucide-icon name="layers" [size]="22"></lucide-icon>
          @if (!collapsed()) {
            <span class="brand-text">SDLC Assist</span>
          }
        </div>
        <button class="collapse-btn" (click)="toggle()" [title]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
          <lucide-icon [name]="collapsed() ? 'panel-left-open' : 'panel-left-close'" [size]="16"></lucide-icon>
        </button>
      </div>

      <!-- Nav -->
      <nav class="sidebar-content">
        <div class="nav-section">
          <a class="nav-item"
             routerLink="/dashboard"
             routerLinkActive="active"
             [routerLinkActiveOptions]="{ exact: true }"
             [title]="collapsed() ? 'Dashboard' : ''">
            <lucide-icon name="layout-dashboard" [size]="18"></lucide-icon>
            @if (!collapsed()) { <span>Dashboard</span> }
          </a>
        </div>

        <div class="nav-section">
          @if (!collapsed()) {
            <div class="section-title">Projects</div>
          } @else {
            <div class="section-divider"></div>
          }
          @for (project of projects; track project.id) {
            <a class="nav-item"
               [routerLink]="['/projects', project.id, 'planning']"
               routerLinkActive="active"
               [title]="collapsed() ? project.name : ''"
               (click)="projectSelected.emit(project)">
              <lucide-icon name="folder" [size]="18"></lucide-icon>
              @if (!collapsed()) {
                <span class="project-label">{{ project.name }}</span>
              }
            </a>
          }
          @if (projects.length === 0 && !collapsed()) {
            <div class="nav-item empty">
              <lucide-icon name="folder-open" [size]="18"></lucide-icon>
              <span>No projects</span>
            </div>
          }
        </div>
      </nav>

      <!-- Footer -->
      <div class="sidebar-footer">
        <div class="user-info" *ngIf="userName" [title]="collapsed() ? userName : ''">
          <div class="avatar">{{ userName.charAt(0).toUpperCase() }}</div>
          @if (!collapsed()) {
            <span class="user-name">{{ userName }}</span>
          }
        </div>
      </div>

    </aside>
  `,
    styles: [`
    .sidebar {
      width: 224px;
      min-width: 224px;
      height: 100vh;
      background-color: var(--sidebar);
      border-right: 1px solid var(--sidebar-border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: width 0.2s ease, min-width 0.2s ease;
    }

    .sidebar.collapsed {
      width: 52px;
      min-width: 52px;
    }

    /* Header */
    .sidebar-header {
      padding: 12px 10px;
      border-bottom: 1px solid var(--sidebar-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 6px;
      min-height: 52px;
    }

    .sidebar.collapsed .sidebar-header {
      justify-content: center;
      flex-direction: column;
      gap: 8px;
      padding: 10px 6px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      text-decoration: none;
      color: var(--sidebar-foreground);
      flex-shrink: 0;
      min-width: 0;
    }

    .brand-text {
      font-size: 15px;
      font-weight: 600;
      color: var(--sidebar-foreground);
      white-space: nowrap;
      overflow: hidden;
    }

    .collapse-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: var(--radius);
      color: var(--muted-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 0.15s, color 0.15s;
    }

    .collapse-btn:hover {
      background: var(--sidebar-accent);
      color: var(--sidebar-foreground);
    }

    /* Content */
    .sidebar-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 6px;
    }

    .nav-section {
      margin-bottom: 4px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 10px 8px 4px;
      white-space: nowrap;
    }

    .section-divider {
      height: 1px;
      background: var(--sidebar-border);
      margin: 8px 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 7px 8px;
      border-radius: var(--radius-sm);
      color: var(--sidebar-foreground);
      cursor: pointer;
      text-decoration: none;
      font-size: 13.5px;
      transition: background-color 0.15s;
      white-space: nowrap;
      overflow: hidden;
    }

    .sidebar.collapsed .nav-item {
      justify-content: center;
      padding: 8px 6px;
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
      flex-shrink: 0;
    }

    .nav-item.active lucide-icon {
      color: var(--sidebar-foreground);
    }

    .project-label {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Footer */
    .sidebar-footer {
      padding: 10px 10px;
      border-top: 1px solid var(--sidebar-border);
    }

    .sidebar.collapsed .sidebar-footer {
      padding: 10px 6px;
      display: flex;
      justify-content: center;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      overflow: hidden;
    }

    .avatar {
      width: 30px;
      height: 30px;
      min-width: 30px;
      border-radius: var(--radius-full);
      background-color: var(--sidebar-primary);
      color: var(--sidebar-primary-foreground);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }

    .user-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--sidebar-foreground);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `],
})
export class SidebarComponent implements OnInit {
    @Input() projects: Project[] = [];
    @Input() activeItem = '';
    @Input() userName = '';
    @Output() projectSelected = new EventEmitter<Project>();

    collapsed = signal(false);

    ngOnInit(): void {
        this.collapsed.set(localStorage.getItem(STORAGE_KEY) === 'true');
    }

    toggle(): void {
        const next = !this.collapsed();
        this.collapsed.set(next);
        localStorage.setItem(STORAGE_KEY, String(next));
    }
}
