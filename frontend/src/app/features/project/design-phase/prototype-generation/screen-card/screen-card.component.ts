import { Component, Input, Output, EventEmitter, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ScreenDefinition, ScreenType } from '../../../../../core/models/screen-definition.model';

const SCREEN_TYPE_ICONS: Record<ScreenType, string> = {
  dashboard: 'layout-dashboard',
  list: 'list',
  detail: 'file-text',
  form: 'square-pen',
  modal: 'layers',
  settings: 'settings',
  auth: 'lock',
  report: 'chart-bar',
  wizard: 'wand',
  empty: 'inbox',
};

const COMPLEXITY_COLORS: Record<string, string> = {
  low: '#16a34a',
  medium: '#d97706',
  high: '#dc2626',
};

@Component({
  selector: 'app-screen-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="screen-card">
      @if (pageState !== 'confirmed') {
        <button class="remove-btn" (click)="remove.emit(screen.id)" title="Remove screen">
          <lucide-icon name="x" [size]="12"></lucide-icon>
        </button>
      }

      <div class="card-icon-row">
        <div class="card-icon">
          <lucide-icon [name]="getIcon(screen.screenType)" [size]="18"></lucide-icon>
        </div>
        <span class="screen-type-label">{{ screen.screenType }}</span>
      </div>

      <div class="card-name">{{ screen.name }}</div>
      <div class="card-description">{{ screen.description }}</div>

      <div class="card-meta">
        @if (screen.epicName) {
          <span class="meta-chip">{{ screen.epicName }}</span>
        }
        @if (screen.userRole) {
          <span class="meta-chip meta-role">{{ screen.userRole }}</span>
        }
      </div>

      <div class="card-footer">
        <span class="complexity-badge" [style.color]="complexityColor(screen.complexity)">
          {{ screen.complexity }} complexity
        </span>

        @if (pageState === 'confirmed') {
          @if (screen.prototypeContent) {
            <button class="btn btn-sm btn-view-proto" (click)="openPrototype.emit(screen)">
              <lucide-icon name="eye" [size]="12"></lucide-icon>
              View Prototype
            </button>
          } @else {
            <button class="btn btn-sm btn-generate-proto" (click)="openPrototype.emit(screen)">
              <lucide-icon name="sparkles" [size]="12"></lucide-icon>
              Generate
            </button>
          }
        } @else {
          <div class="prototype-btn-wrap">
            <button class="btn btn-sm btn-prototype" disabled>
              <lucide-icon name="sparkles" [size]="12"></lucide-icon>
              Generate
            </button>
            <span class="coming-soon-badge">Soon</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .screen-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      position: relative;
      transition: box-shadow 0.15s ease;
    }

    .screen-card:hover {
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .remove-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 50%;
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--muted-foreground);
      padding: 0;
      transition: background 0.15s, color 0.15s;
    }

    .remove-btn:hover {
      background: color-mix(in srgb, #dc2626 15%, transparent);
      color: #dc2626;
      border-color: color-mix(in srgb, #dc2626 30%, transparent);
    }

    .card-icon-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-icon {
      width: 32px;
      height: 32px;
      background: color-mix(in srgb, var(--primary) 12%, transparent);
      border-radius: var(--radius);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
      flex-shrink: 0;
    }

    .screen-type-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .card-name {
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
      line-height: 1.3;
      padding-right: 20px;
    }

    .card-description {
      font-size: 12px;
      color: var(--muted-foreground);
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .meta-chip {
      font-size: 11px;
      padding: 2px 8px;
      background: var(--muted);
      color: var(--muted-foreground);
      border-radius: var(--radius-full);
      font-weight: 500;
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .meta-role {
      background: color-mix(in srgb, var(--primary) 10%, transparent);
      color: var(--primary);
    }

    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-top: 4px;
      border-top: 1px solid var(--border);
      padding-top: 10px;
    }

    .complexity-badge {
      font-size: 11px;
      font-weight: 600;
      text-transform: capitalize;
    }

    .prototype-btn-wrap {
      position: relative;
      display: inline-flex;
    }

    .btn-prototype {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 28px;
      padding: 0 10px;
      font-size: 11px;
      font-weight: 500;
      background: var(--muted);
      color: var(--muted-foreground);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      cursor: not-allowed;
      opacity: 0.7;
    }

    .coming-soon-badge {
      position: absolute;
      top: -7px;
      right: -7px;
      background: var(--muted);
      color: var(--muted-foreground);
      font-size: 9px;
      font-weight: 700;
      padding: 1px 5px;
      border-radius: var(--radius-full);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid var(--border);
    }

    .btn-generate-proto {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 28px;
      padding: 0 10px;
      font-size: 11px;
      font-weight: 500;
      background: var(--primary);
      color: var(--primary-foreground);
      border: none;
      border-radius: var(--radius);
      cursor: pointer;
      transition: opacity 0.15s;
    }

    .btn-generate-proto:hover {
      opacity: 0.85;
    }

    .btn-view-proto {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 28px;
      padding: 0 10px;
      font-size: 11px;
      font-weight: 500;
      background: color-mix(in srgb, var(--primary) 12%, transparent);
      color: var(--primary);
      border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
      border-radius: var(--radius);
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-view-proto:hover {
      background: color-mix(in srgb, var(--primary) 20%, transparent);
    }
  `]
})
export class ScreenCardComponent {
  @Input() screen!: ScreenDefinition;
  @Input() pageState: string = 'review-screens';
  @Output() remove = new EventEmitter<string>();
  @Output() openPrototype = new EventEmitter<ScreenDefinition>();

  getIcon(type: ScreenType): string {
    return SCREEN_TYPE_ICONS[type] ?? 'layout';
  }

  complexityColor(complexity: string): string {
    return COMPLEXITY_COLORS[complexity] ?? COMPLEXITY_COLORS['medium'];
  }
}
