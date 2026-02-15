import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LucideAngularModule } from 'lucide-angular';
import { SidebarComponent } from '../../shared/components/sidebar.component';
import { HeaderComponent } from '../../shared/components/header.component';
import { CreateProjectDialogComponent } from './create-project-dialog.component';
import { ProjectService } from '../../core/services/project.service';
import { AuthService } from '../../core/services/auth.service';
import { Project } from '../../core/models/project.model';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatMenuModule,
        MatDialogModule,
        MatSnackBarModule,
        LucideAngularModule,
        SidebarComponent,
        HeaderComponent,
    ],
    template: `
    <div class="layout">
      <app-sidebar
        [projects]="projects()"
        activeItem="dashboard"
        [userName]="authService.currentUser?.displayName || ''"
        (projectSelected)="onProjectSelect($event)">
      </app-sidebar>

      <div class="main">
        <app-header
          [breadcrumbs]="[{label: 'Dashboard'}]">
        </app-header>

        <div class="content">
          <div class="page-header">
            <div>
              <h1>Projects</h1>
              <p class="text-muted">Manage your SDLC projects</p>
            </div>
            <button class="btn btn-primary" (click)="openCreateDialog()">
              <lucide-icon name="plus" [size]="16"></lucide-icon>
              New Project
            </button>
          </div>

          @if (projects().length === 0) {
            <div class="empty-state">
              <lucide-icon name="folder-open" [size]="48" class="empty-icon"></lucide-icon>
              <h3>No projects yet</h3>
              <p class="text-muted">Create your first project to get started</p>
              <button class="btn btn-primary" (click)="openCreateDialog()">
                <lucide-icon name="plus" [size]="16"></lucide-icon>
                Create Project
              </button>
            </div>
          } @else {
            <div class="table-container">
              <table mat-table [dataSource]="projects()" class="project-table">
                <ng-container matColumnDef="name">
                  <th mat-header-cell *matHeaderCellDef>Project Name</th>
                  <td mat-cell *matCellDef="let project">
                    <span class="project-name" (click)="onProjectSelect(project)">
                      {{ project.name }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let project">
                    <span class="badge" [class]="'badge-' + project.status.toLowerCase()">
                      {{ project.status }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="owner">
                  <th mat-header-cell *matHeaderCellDef>Owner</th>
                  <td mat-cell *matCellDef="let project">{{ project.ownerName || '—' }}</td>
                </ng-container>

                <ng-container matColumnDef="updatedAt">
                  <th mat-header-cell *matHeaderCellDef>Last Updated</th>
                  <td mat-cell *matCellDef="let project">
                    {{ project.updatedAt | date:'mediumDate' }}
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let project">
                    <button class="btn btn-ghost btn-icon" [matMenuTriggerFor]="actionMenu"
                            (click)="$event.stopPropagation()">
                      <lucide-icon name="ellipsis" [size]="16"></lucide-icon>
                    </button>
                    <mat-menu #actionMenu="matMenu">
                      <button mat-menu-item (click)="onProjectSelect(project)">
                        <lucide-icon name="pencil" [size]="16"></lucide-icon>
                        <span>Open</span>
                      </button>
                      <button mat-menu-item (click)="deleteProject(project)">
                        <lucide-icon name="trash-2" [size]="16" class="text-destructive"></lucide-icon>
                        <span>Delete</span>
                      </button>
                    </mat-menu>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"
                    class="project-row"
                    (click)="onProjectSelect(row)"></tr>
              </table>
            </div>
          }
        </div>
      </div>
    </div>
  `,
    styles: [`
    .layout {
      display: flex;
      height: 100vh;
      background-color: var(--background);
    }

    .main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .content {
      flex: 1;
      padding: 32px;
      overflow-y: auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .page-header h1 {
      margin-bottom: 4px;
    }

    .table-container {
      background-color: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .project-table {
      width: 100%;
    }

    .project-row {
      cursor: pointer;
      transition: background-color 0.15s;
    }

    .project-name {
      font-weight: 500;
      cursor: pointer;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 32px;
      text-align: center;
    }

    .empty-icon {
      color: var(--muted-foreground);
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin-bottom: 4px;
    }

    .empty-state p {
      margin-bottom: 24px;
    }
  `],
})
export class DashboardComponent implements OnInit {
    projects = signal<Project[]>([]);
    displayedColumns = ['name', 'status', 'owner', 'updatedAt', 'actions'];

    constructor(
        private projectService: ProjectService,
        public authService: AuthService,
        private router: Router,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
    ) {}

    ngOnInit(): void {
        this.loadProjects();
    }

    loadProjects(): void {
        this.projectService.getAll().subscribe({
            next: (projects) => this.projects.set(projects),
            error: () =>
                this.snackBar.open('Failed to load projects', 'Close', { duration: 3000 }),
        });
    }

    onProjectSelect(project: Project): void {
        this.router.navigate(['/projects', project.id, 'planning']);
    }

    openCreateDialog(): void {
        const dialogRef = this.dialog.open(CreateProjectDialogComponent, {
            width: '480px',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadProjects();
            }
        });
    }

    deleteProject(project: Project): void {
        if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
            this.projectService.delete(project.id).subscribe({
                next: () => {
                    this.loadProjects();
                    this.snackBar.open('Project deleted', 'Close', { duration: 3000 });
                },
                error: () =>
                    this.snackBar.open('Failed to delete project', 'Close', { duration: 3000 }),
            });
        }
    }
}
