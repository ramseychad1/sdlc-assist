import { Component, Input, Output, EventEmitter, HostListener, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { TemplateEntry } from '../../../../core/models/template.model';

@Component({
  selector: 'app-template-lightbox',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (isOpen && template) {
      <div class="lightbox-overlay" (click)="onBackdropClick($event)">
        <div class="lightbox-container" (click)="$event.stopPropagation()">
          <!-- Header -->
          <div class="lightbox-header">
            <div class="header-left">
              <h2>{{ template.name }}</h2>
              <span class="tag-badge">{{ template.tag }}</span>
            </div>
            <button class="btn btn-ghost btn-icon" (click)="onClose()" title="Close">
              <lucide-icon name="x" [size]="20"></lucide-icon>
            </button>
          </div>

          <!-- Image -->
          <div class="lightbox-image">
            @if (!imageLoaded) {
              <div class="image-loading">
                <lucide-icon name="loader" [size]="32" class="spin"></lucide-icon>
              </div>
            }
            <img
              [src]="template.preview"
              [alt]="template.name"
              (load)="onImageLoad()"
              (error)="onImageError($event)"
              [style.opacity]="imageLoaded ? 1 : 0" />
          </div>

          <!-- Footer -->
          <div class="lightbox-footer">
            <p class="description">{{ template.description }}</p>
            <button class="btn btn-primary" (click)="onSelectTemplate()">
              <lucide-icon name="check" [size]="16"></lucide-icon>
              <span>Select This Template</span>
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .lightbox-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 24px;
      animation: fadeIn 150ms ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .lightbox-container {
      display: flex;
      flex-direction: column;
      max-width: 90vw;
      max-height: 90vh;
      background: var(--card);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .lightbox-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      background: var(--background);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .lightbox-header h2 {
      font-size: 18px;
      font-weight: 600;
      color: var(--foreground);
      margin: 0;
    }

    .tag-badge {
      display: inline-block;
      padding: 4px 10px;
      background: color-mix(in srgb, var(--primary) 15%, transparent);
      color: var(--primary);
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 500;
    }

    .lightbox-image {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
      background: var(--muted);
      min-height: 400px;
      position: relative;
    }

    .lightbox-image img {
      max-width: 90%;
      max-height: calc(90vh - 200px);
      object-fit: contain;
      display: block;
      transition: opacity 0.2s ease;
    }

    .image-loading {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--muted-foreground);
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .lightbox-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 16px 20px;
      border-top: 1px solid var(--border);
      background: var(--background);
    }

    .description {
      font-size: 14px;
      color: var(--muted-foreground);
      margin: 0;
      flex: 1;
    }

    @media (max-width: 768px) {
      .lightbox-footer {
        flex-direction: column;
        align-items: stretch;
      }

      .description {
        text-align: center;
      }
    }
  `]
})
export class TemplateLightboxComponent implements OnChanges {
  @Input() template: TemplateEntry | null = null;
  @Input() isOpen = false;
  @Output() close = new EventEmitter<void>();
  @Output() select = new EventEmitter<string>();

  imageLoaded = false;

  ngOnChanges(changes: SimpleChanges): void {
    // Reset image loaded state when template or isOpen changes
    if (changes['template'] || changes['isOpen']) {
      this.imageLoaded = false;

      // Debug log to check image path
      if (this.template && this.isOpen) {
        console.log('Loading preview image:', this.template.preview);
      }
    }
  }

  onImageLoad(): void {
    console.log('Image loaded successfully');
    this.imageLoaded = true;
  }

  onImageError(event: any): void {
    console.error('Failed to load image:', this.template?.preview, event);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isOpen) {
      this.onClose();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    // Close if clicking directly on the overlay (not the container)
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
    this.imageLoaded = false;
    this.close.emit();
  }

  onSelectTemplate(): void {
    if (this.template) {
      this.select.emit(this.template.id);
    }
  }
}
