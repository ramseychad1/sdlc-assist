import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MarkdownComponent } from 'ngx-markdown';

@Component({
  selector: 'app-guidelines-drawer',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MarkdownComponent],
  template: `
    @if (visible) {
      <div class="drawer-backdrop" (click)="close()"></div>
      <div class="drawer">
        <div class="drawer-header">
          <div class="drawer-title">
            <lucide-icon name="book-open" [size]="16"></lucide-icon>
            {{ title }}
          </div>
          <button class="close-btn" (click)="close()">
            <lucide-icon name="x" [size]="16"></lucide-icon>
          </button>
        </div>
        <div class="drawer-body">
          <div class="markdown-content">
            <markdown [data]="content"></markdown>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.3);
      z-index: 999;
    }

    .drawer {
      position: fixed;
      top: 0;
      right: 0;
      width: 480px;
      height: 100vh;
      background: var(--card);
      border-left: 1px solid var(--border);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      box-shadow: -4px 0 24px rgba(0,0,0,0.12);
    }

    .drawer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }

    .drawer-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 600;
      color: var(--foreground);
    }

    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: transparent;
      color: var(--muted-foreground);
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }

    .close-btn:hover {
      background: var(--muted);
      color: var(--foreground);
    }

    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }

    .markdown-content {
      font-size: 14px;
      line-height: 1.7;
      color: var(--foreground);
    }

    .markdown-content ::ng-deep h1 { font-size: 20px; font-weight: 700; margin-bottom: 16px; }
    .markdown-content ::ng-deep h2 { font-size: 15px; font-weight: 600; margin: 20px 0 8px; color: var(--foreground); }
    .markdown-content ::ng-deep h3 { font-size: 13px; font-weight: 600; margin: 16px 0 6px; }
    .markdown-content ::ng-deep p { margin-bottom: 12px; }
    .markdown-content ::ng-deep ul, .markdown-content ::ng-deep ol { padding-left: 20px; margin-bottom: 12px; }
    .markdown-content ::ng-deep li { margin-bottom: 4px; }
    .markdown-content ::ng-deep code {
      background: var(--muted);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
    }
    .markdown-content ::ng-deep pre {
      background: var(--muted);
      padding: 16px;
      border-radius: var(--radius);
      overflow-x: auto;
      margin-bottom: 16px;
    }
    .markdown-content ::ng-deep pre code { background: none; padding: 0; }
  `]
})
export class GuidelinesDrawerComponent {
  @Input() visible = false;
  @Input() title = 'Guidelines';
  @Input() content = '';
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }
}
