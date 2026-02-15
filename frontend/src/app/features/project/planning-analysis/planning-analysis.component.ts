import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LucideAngularModule } from 'lucide-angular';
import { SectionService } from '../../../core/services/section.service';
import { RequirementSection } from '../../../core/models/section.model';

@Component({
    selector: 'app-planning-analysis',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatSnackBarModule,
        LucideAngularModule,
    ],
    template: `
    <div class="sections">
      @for (section of sections(); track section.id) {
        <div class="section-card card">
          <div class="section-header">
            <h3>{{ section.title }}</h3>
          </div>
          <div class="section-body">
            <textarea
              class="textarea"
              [(ngModel)]="section.content"
              placeholder="Enter {{ section.title | lowercase }} here..."
              rows="6">
            </textarea>
          </div>
          <div class="section-footer">
            <button class="btn btn-primary"
                    (click)="saveSection(section)"
                    [disabled]="savingId() === section.id">
              <lucide-icon name="save" [size]="16"></lucide-icon>
              @if (savingId() === section.id) {
                Saving...
              } @else {
                Save
              }
            </button>
          </div>
        </div>
      }

      @if (loading()) {
        <div class="loading">Loading sections...</div>
      }
    </div>
  `,
    styles: [`
    .sections {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .section-card {
      overflow: hidden;
    }

    .section-header {
      padding: 16px 24px 0;
    }

    .section-header h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground);
    }

    .section-body {
      padding: 12px 24px;
    }

    .section-footer {
      padding: 0 24px 16px;
      display: flex;
      justify-content: flex-end;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--muted-foreground);
    }
  `],
})
export class PlanningAnalysisComponent implements OnInit {
    sections = signal<RequirementSection[]>([]);
    loading = signal(true);
    savingId = signal<string | null>(null);

    private projectId = '';

    constructor(
        private route: ActivatedRoute,
        private sectionService: SectionService,
        private snackBar: MatSnackBar,
    ) {}

    ngOnInit(): void {
        this.projectId = this.route.parent?.snapshot.paramMap.get('id') || '';
        if (this.projectId) {
            this.loadSections();
        }
    }

    private loadSections(): void {
        this.sectionService.getByProject(this.projectId).subscribe({
            next: (sections) => {
                this.sections.set(sections);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.snackBar.open('Failed to load sections', 'Close', { duration: 3000 });
            },
        });
    }

    saveSection(section: RequirementSection): void {
        this.savingId.set(section.id);
        this.sectionService.update(this.projectId, section.id, { content: section.content }).subscribe({
            next: (updated) => {
                const current = this.sections();
                this.sections.set(current.map((s) => (s.id === updated.id ? updated : s)));
                this.savingId.set(null);
                this.snackBar.open('Section saved', 'Close', { duration: 2000 });
            },
            error: () => {
                this.savingId.set(null);
                this.snackBar.open('Failed to save section', 'Close', { duration: 3000 });
            },
        });
    }
}
