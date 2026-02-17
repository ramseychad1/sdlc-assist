import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { TemplateService } from '../../../../core/services/template.service';
import { ProjectService } from '../../../../core/services/project.service';
import { TemplateEntry } from '../../../../core/models/template.model';
import { Project } from '../../../../core/models/project.model';
import { TemplateLightboxComponent } from '../template-lightbox/template-lightbox.component';

@Component({
  selector: 'app-template-gallery',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TemplateLightboxComponent],
  template: `
    <div class="gallery-container">
      @if (loading()) {
        <!-- Loading skeleton -->
        <div class="gallery-grid">
          @for (i of [1, 2, 3]; track i) {
            <div class="card skeleton">
              <div class="card-image skeleton-box"></div>
              <div class="card-content">
                <div class="skeleton-line skeleton-title"></div>
                <div class="skeleton-line skeleton-tag"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line"></div>
              </div>
            </div>
          }
        </div>
      } @else if (error()) {
        <!-- Error state -->
        <div class="empty-state">
          <lucide-icon name="alert-circle" [size]="48"></lucide-icon>
          <h3>Failed to load templates</h3>
          <p>{{ error() }}</p>
        </div>
      } @else if (templates().length === 0) {
        <!-- Empty state -->
        <div class="empty-state">
          <lucide-icon name="package-open" [size]="48"></lucide-icon>
          <h3>No templates available yet</h3>
          <p>Check back soon for design templates.</p>
        </div>
      } @else {
        <!-- Gallery grid -->
        <div class="gallery-grid">
          @for (template of templates(); track template.id) {
            <div class="card" [class.selected]="isSelected(template.id)">
              <div class="card-image">
                <img [src]="template.thumbnail" [alt]="template.name" />
                @if (isSelected(template.id)) {
                  <div class="selected-badge">
                    <lucide-icon name="check" [size]="16"></lucide-icon>
                    <span>Selected</span>
                  </div>
                }
              </div>

              <div class="card-content">
                <div class="card-header">
                  <h3 class="card-title">{{ template.name }}</h3>
                  <span class="tag-badge">{{ template.tag }}</span>
                </div>

                <p class="card-description">{{ template.description }}</p>

                <div class="card-actions">
                  <button
                    class="btn btn-ghost btn-sm"
                    (click)="onPreview(template)"
                    [disabled]="selecting()">
                    <lucide-icon name="eye" [size]="14"></lucide-icon>
                    <span>Preview</span>
                  </button>

                  @if (isSelected(template.id)) {
                    <button class="btn btn-primary btn-sm" disabled>
                      <lucide-icon name="check" [size]="14"></lucide-icon>
                      <span>Selected</span>
                    </button>
                  } @else {
                    <button
                      class="btn btn-primary btn-sm"
                      (click)="onSelect(template)"
                      [disabled]="selecting()">
                      @if (selecting()) {
                        <lucide-icon name="loader" [size]="14" class="spin"></lucide-icon>
                      }
                      <span>Select</span>
                    </button>
                  }
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Success toast -->
      @if (showSuccessToast()) {
        <div class="toast toast-success">
          <lucide-icon name="check-circle" [size]="16"></lucide-icon>
          <span>Template selected successfully</span>
        </div>
      }

      <!-- Lightbox -->
      <app-template-lightbox
        [template]="selectedForPreview()"
        [isOpen]="!!selectedForPreview()"
        (close)="onCloseLightbox()"
        (select)="onSelectFromLightbox($event)">
      </app-template-lightbox>
    </div>
  `,
  styles: [`
    .gallery-container {
      width: 100%;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
    }

    @media (max-width: 1024px) {
      .gallery-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .gallery-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Card styles */
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
      transition: border-color 0.15s, box-shadow 0.15s;
      display: flex;
      flex-direction: column;
    }

    .card:hover {
      border-color: var(--muted-foreground);
    }

    .card.selected {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 25%, transparent);
    }

    .card-image {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 10;
      overflow: hidden;
      background: var(--muted);
    }

    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .selected-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: var(--primary);
      color: white;
      border-radius: var(--radius);
      font-size: 12px;
      font-weight: 500;
    }

    .card-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      flex: 1;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
      margin: 0;
    }

    .tag-badge {
      display: inline-block;
      padding: 2px 8px;
      background: color-mix(in srgb, var(--primary) 15%, transparent);
      color: var(--primary);
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
    }

    .card-description {
      font-size: 12px;
      color: var(--muted-foreground);
      line-height: 1.5;
      margin: 0;
      flex: 1;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .card-actions {
      display: flex;
      gap: 8px;
      padding-top: 4px;
    }

    /* Loading skeleton */
    .skeleton {
      pointer-events: none;
    }

    .skeleton-box {
      background: linear-gradient(
        90deg,
        var(--muted) 0%,
        color-mix(in srgb, var(--muted) 90%, var(--foreground)) 50%,
        var(--muted) 100%
      );
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s ease-in-out infinite;
    }

    .skeleton-line {
      height: 12px;
      background: linear-gradient(
        90deg,
        var(--muted) 0%,
        color-mix(in srgb, var(--muted) 90%, var(--foreground)) 50%,
        var(--muted) 100%
      );
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s ease-in-out infinite;
      border-radius: 4px;
    }

    .skeleton-title {
      width: 60%;
    }

    .skeleton-tag {
      width: 40%;
    }

    @keyframes skeleton-loading {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
      color: var(--muted-foreground);
    }

    .empty-state lucide-icon {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground);
      margin: 0 0 8px;
    }

    .empty-state p {
      font-size: 14px;
      margin: 0;
    }

    /* Toast */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-size: 14px;
      z-index: 100;
      animation: toast-in 0.2s ease-out;
    }

    .toast-success {
      border-color: var(--primary);
      color: var(--primary);
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class TemplateGalleryComponent implements OnInit {
  private templateService = inject(TemplateService);
  private projectService = inject(ProjectService);
  private route = inject(ActivatedRoute);

  templates = signal<TemplateEntry[]>([]);
  currentProject = signal<Project | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  selecting = signal(false);
  showSuccessToast = signal(false);
  selectedForPreview = signal<TemplateEntry | null>(null);

  ngOnInit(): void {
    // Delay loading to avoid change detection issues
    setTimeout(() => {
      this.loadTemplates();
      this.loadCurrentProject();
    });
  }

  private loadTemplates(): void {
    this.loading.set(true);
    this.error.set(null);

    this.templateService.getTemplates().subscribe({
      next: (templates) => {
        this.templates.set(templates);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Unable to load templates. Please try again later.');
        this.loading.set(false);
        console.error('Failed to load templates:', err);
      }
    });
  }

  private loadCurrentProject(): void {
    const projectId = this.route.parent?.snapshot.paramMap.get('id');
    if (projectId) {
      this.projectService.getById(projectId).subscribe({
        next: (project) => {
          this.currentProject.set(project);
        },
        error: (err) => {
          console.error('Failed to load project:', err);
        }
      });
    }
  }

  isSelected(templateId: string): boolean {
    return this.currentProject()?.selectedTemplateId === templateId;
  }

  onPreview(template: TemplateEntry): void {
    this.selectedForPreview.set(template);
  }

  onCloseLightbox(): void {
    this.selectedForPreview.set(null);
  }

  onSelect(template: TemplateEntry): void {
    const projectId = this.currentProject()?.id;
    if (!projectId) return;

    this.selecting.set(true);

    this.projectService.selectTemplate(projectId, template.id).subscribe({
      next: (updatedProject) => {
        this.currentProject.set(updatedProject);
        this.selecting.set(false);
        this.showSuccessToast.set(true);

        // Hide toast after 3 seconds
        setTimeout(() => {
          this.showSuccessToast.set(false);
        }, 3000);
      },
      error: (err) => {
        this.selecting.set(false);
        this.error.set('Failed to select template. Please try again.');
        console.error('Failed to select template:', err);
      }
    });
  }

  onSelectFromLightbox(templateId: string): void {
    const template = this.templates().find(t => t.id === templateId);
    if (template) {
      this.onSelect(template);
      this.onCloseLightbox();
    }
  }
}
