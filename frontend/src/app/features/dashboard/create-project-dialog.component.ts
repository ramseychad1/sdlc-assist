import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { ProjectService } from '../../core/services/project.service';

@Component({
    selector: 'app-create-project-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, MatDialogModule],
    template: `
    <h2 mat-dialog-title>Create New Project</h2>
    <mat-dialog-content>
      <div class="form-group">
        <label class="form-label" for="project-name">Project Name</label>
        <input id="project-name"
               class="input"
               [(ngModel)]="name"
               placeholder="Enter project name"
               required />
      </div>

      <div class="form-group">
        <label class="form-label" for="project-desc">Description</label>
        <textarea id="project-desc"
                  class="textarea"
                  [(ngModel)]="description"
                  placeholder="Brief project description"
                  rows="3"></textarea>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button class="btn btn-ghost" mat-dialog-close>Cancel</button>
      <button class="btn btn-primary"
              [disabled]="!name.trim()"
              (click)="create()">
        Create
      </button>
    </mat-dialog-actions>
  `,
    styles: [`
    .form-group {
      margin-bottom: 16px;
    }

    .textarea {
      min-height: 80px;
    }
  `],
})
export class CreateProjectDialogComponent {
    name = '';
    description = '';

    constructor(
        private dialogRef: MatDialogRef<CreateProjectDialogComponent>,
        private projectService: ProjectService,
    ) {}

    create(): void {
        this.projectService
            .create({
                name: this.name.trim(),
                description: this.description.trim() || undefined,
            })
            .subscribe({
                next: () => this.dialogRef.close(true),
                error: () => this.dialogRef.close(false),
            });
    }
}
