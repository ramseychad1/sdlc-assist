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
        <div class="gallery-grid" [class.has-action-bar]="currentProject()?.selectedTemplateId">
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

      <!-- Next Step Action Bar -->
      @if (pendingTemplateId(); as selectedId) {
        @for (template of templates(); track template.id) {
          @if (template.id === selectedId) {
            <div class="action-bar">
              <div class="action-bar-content">
                <div class="selected-info">
                  <img [src]="template.thumbnail" [alt]="template.name" class="selected-thumbnail" />
                  <div class="selected-details">
                    <span class="selected-label">Selected Template</span>
                    <span class="selected-name">{{ template.name }}</span>
                  </div>
                </div>
                <button
                  class="btn btn-primary btn-lg"
                  (click)="onGenerate()"
                  [disabled]="selecting()">
                  @if (selecting()) {
                    <lucide-icon name="loader" [size]="18" class="spin"></lucide-icon>
                  } @else {
                    <lucide-icon name="sparkles" [size]="18"></lucide-icon>
                  }
                  <span>Generate Design System</span>
                  <span class="coming-soon-badge">Coming Soon</span>
                </button>
              </div>
            </div>
          }
        }
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

    .gallery-grid.has-action-bar {
      padding-bottom: 120px; /* Space for action bar */
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

    /* Action Bar */
    .action-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--card);
      border-top: 1px solid var(--border);
      padding: 16px 24px;
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
      z-index: 50;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .action-bar-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }

    .selected-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .selected-thumbnail {
      width: 64px;
      height: 40px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      object-fit: cover;
    }

    .selected-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .selected-label {
      font-size: 11px;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 500;
    }

    .selected-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
    }

    .btn-lg {
      height: 44px;
      padding: 0 24px;
      font-size: 15px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
    }

    .coming-soon-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: var(--muted);
      color: var(--muted-foreground);
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: var(--radius-full);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    @media (max-width: 768px) {
      .action-bar-content {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
      }

      .selected-info {
        justify-content: center;
      }

      .btn-lg {
        width: 100%;
        justify-content: center;
      }
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
  pendingTemplateId = signal<string | null>(null); // Local state before saving

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
    // Need to go up two levels: ux-design -> design -> projects/:id
    const projectId = this.route.parent?.parent?.snapshot.paramMap.get('id');
    console.log('Loading project with ID:', projectId);
    if (projectId) {
      this.projectService.getById(projectId).subscribe({
        next: (project) => {
          console.log('Project loaded:', project);
          console.log('Selected template ID:', project.selectedTemplateId);
          this.currentProject.set(project);
        },
        error: (err) => {
          console.error('Failed to load project:', err);
        }
      });
    }
  }

  isSelected(templateId: string): boolean {
    // Check pending selection first, then fall back to saved selection
    const pending = this.pendingTemplateId();
    if (pending !== null) {
      return pending === templateId;
    }
    return this.currentProject()?.selectedTemplateId === templateId;
  }

  onPreview(template: TemplateEntry): void {
    console.log('onPreview called for template:', template.id);
    this.selectedForPreview.set(template);
  }

  onCloseLightbox(): void {
    this.selectedForPreview.set(null);
  }

  onSelect(template: TemplateEntry): void {
    console.log('onSelect called for template:', template.id);
    // Just set local state, don't save to DB yet
    this.pendingTemplateId.set(template.id);
  }

  onGenerate(): void {
    const projectId = this.currentProject()?.id;
    const templateId = this.pendingTemplateId();

    if (!projectId || !templateId) {
      console.log('Missing project ID or template ID');
      return;
    }

    console.log('Generating design system with template:', templateId);
    this.selecting.set(true);

    // Save the selection to database
    this.projectService.selectTemplate(projectId, templateId).subscribe({
      next: (updatedProject) => {
        this.currentProject.set(updatedProject);
        this.selecting.set(false);
        this.showSuccessToast.set(true);

        // TODO: Phase 2.2 - Trigger actual design system generation here

        // Hide toast after 3 seconds
        setTimeout(() => {
          this.showSuccessToast.set(false);
        }, 3000);
      },
      error: (err) => {
        this.selecting.set(false);
        this.error.set('Failed to save template selection. Please try again.');
        console.error('Failed to save template selection:', err);
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
