import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { switchMap } from 'rxjs';
import { ProjectService } from '../../../../core/services/project.service';
import { TemplateService } from '../../../../core/services/template.service';
import { Project } from '../../../../core/models/project.model';
import { TemplateEntry, TemplateMetadata } from '../../../../core/models/template.model';
import { UxDesignStepperComponent } from '../components/ux-design-stepper/ux-design-stepper.component';

interface ColorSwatch {
  key: string;
  label: string;
  hex: string;
}

const COLOR_DISPLAY_KEYS: { key: string; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'background', label: 'Background' },
  { key: 'card', label: 'Card' },
  { key: 'foreground', label: 'Foreground' },
  { key: 'accent', label: 'Accent' },
  { key: 'border', label: 'Border' },
  { key: 'muted', label: 'Muted' },
  { key: 'secondary', label: 'Secondary' },
];

type ResultTab = 'overview' | 'preview';

@Component({
  selector: 'app-design-system-generation',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatSnackBarModule, UxDesignStepperComponent],
  template: `
    <div class="design-system-page">
      <app-ux-design-stepper [currentStep]="2"></app-ux-design-stepper>

      <div class="header">
        <h2>Design System Generation</h2>
        <p class="description">
          AI-powered design system customization based on your PRD and selected template.
        </p>
      </div>

      <!-- LOADING STATE -->
      @if (loading()) {
        <div class="card">
          <div class="skeleton-row">
            <div class="skeleton skeleton-card"></div>
            <div class="skeleton skeleton-card"></div>
          </div>
          <div class="skeleton skeleton-btn" style="margin-top: 20px;"></div>
        </div>
      }

      <!-- LOADED STATES -->
      @if (!loading()) {

        <!-- Input context cards — shown in all non-loading states, opacity fades during generating -->
        <div class="input-grid" [class.faded]="pageState() === 'generating'">
          <!-- PRD Card -->
          <div class="input-card">
            <div class="input-card-label">
              <lucide-icon name="file-text" [size]="14"></lucide-icon>
              Product Requirements Document
            </div>
            <div class="input-card-title">{{ project()?.name }}</div>
            <div class="input-card-sub">
              PRD generated {{ formatDate(project()?.updatedAt) }}
            </div>
          </div>

          <!-- Template Card -->
          <div class="input-card template-card">
            @if (template()) {
              <img [src]="template()!.thumbnail" [alt]="template()!.name" class="template-thumbnail" />
              <div class="input-card-body">
                <div class="input-card-title">{{ template()!.name }}</div>
                <span class="tag-badge">{{ template()!.tag }}</span>
              </div>
            }
          </div>
        </div>

        <!-- STATE 1: REVIEW & CONFIRM -->
        @if (pageState() === 'review') {
          <div class="card review-card">
            <div class="section-label">Ready to Generate</div>
            <p class="section-subtitle">The following inputs will be sent to the AI agent</p>
            <button class="btn btn-primary btn-lg start-btn" (click)="startGeneration()">
              <lucide-icon name="sparkles" [size]="18"></lucide-icon>
              Start Design System
            </button>
          </div>
        }

        <!-- STATE 2: GENERATING -->
        @if (pageState() === 'generating') {
          <div class="card generating-card">
            <div class="section-label">Generating</div>
            <div class="generating-header">
              <lucide-icon name="sparkles" [size]="18" class="spin"></lucide-icon>
              <span>Generating Design System...</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" [style.width.%]="progress()"></div>
            </div>
            <div class="progress-pct">{{ progress() }}%</div>
            <p class="progress-message">{{ progressMessage() }}</p>
          </div>
        }

        <!-- STATE 3: RESULT -->
        @if (pageState() === 'result' && templateMetadata()) {
          <div class="card result-card">
            <div class="result-header">
              <div class="result-header-left">
                <lucide-icon name="sparkles" [size]="16"></lucide-icon>
                <span class="result-title">Generated Design System</span>
                <span class="source-badge source-claude">Claude</span>
                <span class="result-template-name">{{ template()?.tag }}</span>
              </div>
              <div class="result-header-actions">
                <button class="btn-icon" title="Download" (click)="downloadContent()">
                  <lucide-icon name="download" [size]="16"></lucide-icon>
                </button>
                <button class="btn-icon" title="Regenerate" (click)="regenerate()">
                  <lucide-icon name="refresh-cw" [size]="16"></lucide-icon>
                </button>
              </div>
            </div>

            <!-- TAB STRIP -->
            <div class="result-tabs">
              <button class="result-tab" [class.active]="resultTab() === 'overview'" (click)="resultTab.set('overview')">Overview</button>
              <button class="result-tab" [class.active]="resultTab() === 'preview'" (click)="resultTab.set('preview')">
                <lucide-icon name="eye" [size]="13"></lucide-icon>
                Live Preview
              </button>
            </div>

            <!-- OVERVIEW TAB -->
            @if (resultTab() === 'overview') {
              <!-- COLOR SYSTEM -->
              <div class="result-section">
                <div class="section-label">Color System</div>
                <div class="color-swatches">
                  @for (swatch of colorSwatches(); track swatch.key) {
                    <div class="swatch-item">
                      <div class="swatch-circle"
                           [style.background-color]="swatch.hex"
                           [title]="swatch.hex"></div>
                      <div class="swatch-info">
                        <span class="swatch-hex">{{ swatch.hex }}</span>
                        <span class="swatch-label">{{ swatch.label }}</span>
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- TYPOGRAPHY -->
              <div class="result-section">
                <div class="section-label">Typography</div>
                <div class="typography-row">
                  <span class="typo-font">{{ fontFamily() }}</span>
                  <span class="typo-sep">·</span>
                  <span class="typo-scale">{{ humanize(fontScale()) }} scale</span>
                  <span class="typo-sep">·</span>
                  <span class="typo-sample typo-body">Body 13px</span>
                  <span class="typo-sample typo-h2">H2 18px</span>
                  <span class="typo-sample typo-h1">H1 24px</span>
                </div>
              </div>

              <!-- COMPONENTS -->
              <div class="result-section">
                <div class="section-label">Components</div>
                <div class="component-pills">
                  @for (comp of templateMetadata()!.components; track comp) {
                    <span class="component-pill">{{ comp }}</span>
                  }
                </div>
              </div>

              <!-- LAYOUT -->
              <div class="result-section">
                <div class="section-label">Layout</div>
                <div class="layout-row">
                  <div class="layout-diagram">
                    <div class="layout-sidebar"></div>
                    <div class="layout-content"></div>
                  </div>
                  <div class="layout-details">
                    <div class="layout-detail-row">
                      <span class="layout-detail-label">Pattern</span>
                      <span class="layout-detail-value">{{ humanize(templateMetadata()!.layoutPattern) }}</span>
                    </div>
                    <div class="layout-detail-row">
                      <span class="layout-detail-label">Density</span>
                      <span class="layout-detail-value">{{ humanize(templateMetadata()!.density) }}</span>
                    </div>
                    <div class="layout-detail-row">
                      <span class="layout-detail-label">Radius</span>
                      <span class="layout-detail-value">{{ templateMetadata()!.designTokens['borderRadius'] || '6px' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- LIVE PREVIEW TAB -->
            @if (resultTab() === 'preview') {
              <div class="preview-frame" [ngStyle]="previewVars()">

                <!-- Buttons -->
                <div class="preview-group">
                  <div class="preview-group-label">Buttons</div>
                  <div class="preview-row">
                    <button class="preview-btn preview-btn-primary">Primary Action</button>
                    <button class="preview-btn preview-btn-secondary">Secondary</button>
                    <button class="preview-btn preview-btn-ghost">Ghost</button>
                    <button class="preview-btn preview-btn-destructive">Delete</button>
                  </div>
                </div>

                <!-- Badges -->
                <div class="preview-group">
                  <div class="preview-group-label">Status Badges</div>
                  <div class="preview-row">
                    <span class="preview-badge preview-badge-success">● Active</span>
                    <span class="preview-badge preview-badge-info">● In Review</span>
                    <span class="preview-badge preview-badge-warning">● Pending</span>
                    <span class="preview-badge preview-badge-error">● Blocked</span>
                    <span class="preview-badge preview-badge-default">Draft</span>
                  </div>
                </div>

                <!-- Card -->
                <div class="preview-group">
                  <div class="preview-group-label">Card</div>
                  <div class="preview-card-demo">
                    <div class="preview-card-header">
                      <div class="preview-card-title">Project Dashboard</div>
                      <span class="preview-badge preview-badge-success">● Active</span>
                    </div>
                    <div class="preview-card-desc">Manage your active projects and track progress across all SDLC phases from planning through deployment.</div>
                    <div class="preview-card-divider"></div>
                    <div class="preview-card-footer">
                      <button class="preview-btn preview-btn-primary preview-btn-sm">View Details</button>
                      <button class="preview-btn preview-btn-ghost preview-btn-sm">Dismiss</button>
                    </div>
                  </div>
                </div>

                <!-- Form Controls -->
                <div class="preview-group">
                  <div class="preview-group-label">Form Controls</div>
                  <div class="preview-form">
                    <div class="preview-form-row">
                      <div class="preview-input-wrap">
                        <label class="preview-label">Project Name</label>
                        <input class="preview-input" type="text" placeholder="Enter project name..." readonly />
                      </div>
                      <div class="preview-input-wrap">
                        <label class="preview-label">Status</label>
                        <div class="preview-select">
                          <span>Active</span>
                          <span class="preview-select-chevron">▾</span>
                        </div>
                      </div>
                    </div>
                    <div class="preview-form-row preview-form-row-controls">
                      <div class="preview-checkbox-row">
                        <div class="preview-checkbox"></div>
                        <span class="preview-control-label">Enable notifications</span>
                      </div>
                      <div class="preview-switch-row">
                        <span class="preview-control-label">Dark mode</span>
                        <div class="preview-switch"><div class="preview-switch-thumb"></div></div>
                      </div>
                      <div class="preview-radio-row">
                        <div class="preview-radio"></div>
                        <span class="preview-control-label">Default view</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Alert -->
                <div class="preview-group">
                  <div class="preview-group-label">Alert</div>
                  <div class="preview-alert preview-alert-info">
                    <span class="preview-alert-icon">ℹ</span>
                    <div>
                      <div class="preview-alert-title">Design system applied</div>
                      <div class="preview-alert-desc">Your selected template tokens have been applied to all components across the project.</div>
                    </div>
                  </div>
                </div>

                <!-- Progress + Data -->
                <div class="preview-group">
                  <div class="preview-group-label">Progress & Data</div>
                  <div class="preview-stats-row">
                    <div class="preview-stat-card">
                      <div class="preview-stat-value">24</div>
                      <div class="preview-stat-label">Requirements</div>
                    </div>
                    <div class="preview-stat-card">
                      <div class="preview-stat-value">8</div>
                      <div class="preview-stat-label">Epics</div>
                    </div>
                    <div class="preview-stat-card">
                      <div class="preview-stat-value">65%</div>
                      <div class="preview-stat-label">Complete</div>
                    </div>
                  </div>
                  <div class="preview-progress-wrap">
                    <div class="preview-progress-header">
                      <span>Phase completion</span>
                      <span>65%</span>
                    </div>
                    <div class="preview-progress-track">
                      <div class="preview-progress-fill" style="width: 65%"></div>
                    </div>
                  </div>
                </div>

                <!-- Avatars & Typography -->
                <div class="preview-group">
                  <div class="preview-group-label">Avatars & Typography</div>
                  <div class="preview-bottom-row">
                    <div class="preview-avatars">
                      <div class="preview-avatar">CH</div>
                      <div class="preview-avatar preview-avatar-accent">AB</div>
                      <div class="preview-avatar preview-avatar-muted">MK</div>
                      <div class="preview-avatar preview-avatar-muted">+4</div>
                    </div>
                    <div class="preview-type-samples">
                      <div class="preview-type-h1">Heading One</div>
                      <div class="preview-type-h2">Heading Two</div>
                      <div class="preview-type-body">Body text — clear, legible, well-spaced for sustained reading at small sizes.</div>
                    </div>
                  </div>
                </div>

              </div>
            }

          </div>

          <!-- Action bar — slides up after save -->
          @if (saved() && template()) {
            <div class="action-bar">
              <div class="action-bar-content">
                <div class="selected-info">
                  <img [src]="template()!.thumbnail" [alt]="template()!.name" class="selected-thumbnail" />
                  <div class="selected-details">
                    <span class="selected-label">Generated Design System</span>
                    <span class="selected-name">{{ template()!.name }}</span>
                  </div>
                </div>
                <button class="btn btn-primary btn-lg" (click)="navigateToPrototypes()">
                  Generate Prototypes
                  <lucide-icon name="arrow-right" [size]="18"></lucide-icon>
                </button>
              </div>
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .design-system-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 120px;
    }

    .header h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--foreground);
      margin: 0 0 6px;
    }

    .description {
      font-size: 14px;
      color: var(--muted-foreground);
      margin: 0;
    }

    /* Input grid */
    .input-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      transition: opacity 0.3s ease;
    }

    .input-grid.faded {
      opacity: 0.5;
      pointer-events: none;
    }

    .input-card {
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .template-card {
      padding: 0;
      overflow: hidden;
      background: var(--card);
    }

    .template-thumbnail {
      width: 100%;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      display: block;
    }

    .input-card-body {
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .input-card-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .input-card-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--foreground);
    }

    .input-card-sub {
      font-size: 12px;
      color: var(--muted-foreground);
    }

    /* Cards */
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px 24px;
    }

    /* Section labels */
    .section-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }

    .section-subtitle {
      font-size: 13px;
      color: var(--muted-foreground);
      margin: 0 0 20px;
    }

    /* Review card */
    .review-card {
      text-align: center;
    }

    .start-btn {
      max-width: 320px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 44px;
      font-size: 15px;
      font-weight: 600;
    }

    /* Generating card */
    .generating-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .generating-header {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 15px;
      font-weight: 500;
      color: var(--foreground);
    }

    .progress-bar-track {
      height: 6px;
      background: var(--border);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: var(--primary);
      border-radius: 3px;
      transition: width 0.6s ease;
    }

    .progress-pct {
      font-size: 13px;
      font-weight: 600;
      color: var(--foreground);
    }

    .progress-message {
      font-size: 13px;
      color: var(--muted-foreground);
      margin: 0;
    }

    /* Result card */
    .result-card {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .result-header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .result-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
    }

    .result-template-name {
      font-size: 12px;
      color: var(--muted-foreground);
    }

    .source-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 500;
    }

    .source-claude {
      background: color-mix(in srgb, #7c3aed 12%, transparent);
      color: #7c3aed;
      border: 1px solid color-mix(in srgb, #7c3aed 25%, transparent);
    }

    .result-header-actions {
      display: flex;
      gap: 4px;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      padding: 6px;
      border-radius: var(--radius);
      color: var(--muted-foreground);
      display: flex;
      align-items: center;
      transition: background 0.15s, color 0.15s;
    }

    .btn-icon:hover {
      background: var(--muted);
      color: var(--foreground);
    }

    /* Result sections */
    .result-section {
      border-top: 1px solid var(--border);
      padding-top: 16px;
    }

    /* Color swatches */
    .color-swatches {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .swatch-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .swatch-circle {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 1px solid var(--border);
      box-shadow: inset 0 0 0 1px rgba(0,0,0,0.1);
      flex-shrink: 0;
    }

    .swatch-info {
      display: flex;
      flex-direction: column;
    }

    .swatch-hex {
      font-size: 11px;
      font-weight: 500;
      color: var(--foreground);
      font-family: monospace;
    }

    .swatch-label {
      font-size: 10px;
      color: var(--muted-foreground);
    }

    /* Typography */
    .typography-row {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .typo-font {
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
    }

    .typo-sep {
      color: var(--border);
    }

    .typo-scale {
      font-size: 12px;
      color: var(--muted-foreground);
    }

    .typo-sample {
      padding: 2px 8px;
      background: var(--muted);
      border-radius: var(--radius);
      color: var(--foreground);
    }

    .typo-body { font-size: 13px; }
    .typo-h2 { font-size: 15px; font-weight: 600; }
    .typo-h1 { font-size: 18px; font-weight: 700; }

    /* Components */
    .component-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .component-pill {
      padding: 3px 10px;
      background: var(--muted);
      color: var(--foreground);
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 500;
    }

    /* Layout */
    .layout-row {
      display: flex;
      align-items: flex-start;
      gap: 24px;
    }

    .layout-diagram {
      display: flex;
      gap: 3px;
      flex-shrink: 0;
      border: 1px solid var(--border);
      border-radius: 4px;
      overflow: hidden;
      width: 80px;
      height: 52px;
    }

    .layout-sidebar {
      width: 22px;
      background: var(--muted);
      border-right: 1px solid var(--border);
    }

    .layout-content {
      flex: 1;
      background: var(--card);
    }

    .layout-details {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .layout-detail-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .layout-detail-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.4px;
      width: 56px;
    }

    .layout-detail-value {
      font-size: 13px;
      color: var(--foreground);
    }

    /* Tag badge */
    .tag-badge {
      display: inline-block;
      padding: 2px 8px;
      background: color-mix(in srgb, var(--primary) 15%, transparent);
      color: var(--primary);
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 500;
    }

    /* Skeleton */
    .skeleton {
      background: linear-gradient(
        90deg,
        var(--muted) 0%,
        color-mix(in srgb, var(--muted) 90%, var(--foreground)) 50%,
        var(--muted) 100%
      );
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s ease-in-out infinite;
      border-radius: var(--radius);
    }

    .skeleton-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .skeleton-card {
      height: 120px;
    }

    .skeleton-btn {
      height: 44px;
      max-width: 320px;
      margin: 0 auto;
    }

    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Spin */
    .spin {
      animation: spin 1.5s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* Action bar */
    .action-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--card);
      border-top: 1px solid var(--border);
      padding: 16px 24px;
      box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
      z-index: 50;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
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
    }

    /* ── Result tabs ────────────────────────────────── */
    .result-tabs {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--border);
      margin: 0 -24px;
      padding: 0 24px;
    }

    .result-tab {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 500;
      color: var(--muted-foreground);
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      cursor: pointer;
      margin-bottom: -1px;
      transition: color 0.15s, border-color 0.15s;
    }

    .result-tab:hover {
      color: var(--foreground);
    }

    .result-tab.active {
      color: var(--foreground);
      border-bottom-color: var(--primary);
      font-weight: 600;
    }

    /* ── Live Preview Frame ─────────────────────────── */
    .preview-frame {
      background: var(--preview-bg);
      border: 1px solid var(--preview-border);
      border-radius: var(--preview-radius);
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      font-family: var(--preview-font);
      margin-top: 4px;
    }

    .preview-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .preview-group-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      color: var(--preview-muted-fg);
    }

    .preview-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    /* Buttons */
    .preview-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 14px;
      height: 34px;
      border-radius: var(--preview-radius);
      font-size: 13px;
      font-weight: 500;
      cursor: default;
      border: none;
      font-family: var(--preview-font);
      white-space: nowrap;
    }

    .preview-btn-sm {
      height: 28px;
      padding: 0 10px;
      font-size: 12px;
    }

    .preview-btn-primary {
      background: var(--preview-primary);
      color: var(--preview-primary-fg);
    }

    .preview-btn-secondary {
      background: var(--preview-secondary);
      color: var(--preview-secondary-fg);
      border: 1px solid var(--preview-border);
    }

    .preview-btn-ghost {
      background: transparent;
      color: var(--preview-fg);
      border: 1px solid var(--preview-border);
    }

    .preview-btn-destructive {
      background: var(--preview-destructive);
      color: #fff;
    }

    /* Badges */
    .preview-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 10px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 500;
      white-space: nowrap;
    }

    .preview-badge-success {
      background: var(--preview-success);
      color: var(--preview-success-fg);
    }

    .preview-badge-info {
      background: var(--preview-info);
      color: var(--preview-info-fg);
    }

    .preview-badge-warning {
      background: var(--preview-warning);
      color: var(--preview-warning-fg);
    }

    .preview-badge-error {
      background: color-mix(in srgb, var(--preview-destructive) 15%, transparent);
      color: var(--preview-destructive);
    }

    .preview-badge-default {
      background: var(--preview-muted);
      color: var(--preview-muted-fg);
      border: 1px solid var(--preview-border);
    }

    /* Card */
    .preview-card-demo {
      background: var(--preview-card);
      border: 1px solid var(--preview-border);
      border-radius: var(--preview-radius);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .preview-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .preview-card-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--preview-fg);
    }

    .preview-card-desc {
      font-size: 12px;
      color: var(--preview-muted-fg);
      line-height: 1.5;
    }

    .preview-card-divider {
      height: 1px;
      background: var(--preview-border);
      margin: 2px 0;
    }

    .preview-card-footer {
      display: flex;
      gap: 8px;
    }

    /* Form */
    .preview-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .preview-form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .preview-form-row-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      grid-template-columns: unset;
    }

    .preview-input-wrap {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .preview-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--preview-fg);
    }

    .preview-input {
      height: 32px;
      border-radius: var(--preview-radius);
      border: 1px solid var(--preview-border);
      background: var(--preview-card);
      color: var(--preview-muted-fg);
      font-size: 13px;
      padding: 0 10px;
      font-family: var(--preview-font);
      outline: none;
      width: 100%;
      box-sizing: border-box;
    }

    .preview-select {
      height: 32px;
      border-radius: var(--preview-radius);
      border: 1px solid var(--preview-border);
      background: var(--preview-card);
      color: var(--preview-fg);
      font-size: 13px;
      padding: 0 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: default;
    }

    .preview-select-chevron {
      font-size: 10px;
      color: var(--preview-muted-fg);
    }

    .preview-checkbox-row,
    .preview-switch-row,
    .preview-radio-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .preview-control-label {
      font-size: 13px;
      color: var(--preview-fg);
      white-space: nowrap;
    }

    .preview-checkbox {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      background: var(--preview-primary);
      border: 2px solid var(--preview-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .preview-checkbox::after {
      content: '✓';
      font-size: 10px;
      color: var(--preview-primary-fg);
      font-weight: 700;
      line-height: 1;
    }

    .preview-radio {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid var(--preview-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .preview-radio::after {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--preview-primary);
    }

    .preview-switch {
      width: 36px;
      height: 20px;
      border-radius: 10px;
      background: var(--preview-primary);
      position: relative;
      cursor: default;
      flex-shrink: 0;
    }

    .preview-switch-thumb {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: white;
      position: absolute;
      top: 3px;
      right: 3px;
    }

    /* Alert */
    .preview-alert {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      border-radius: var(--preview-radius);
      border: 1px solid;
    }

    .preview-alert-info {
      background: var(--preview-info);
      color: var(--preview-info-fg);
      border-color: color-mix(in srgb, var(--preview-info-fg) 20%, transparent);
    }

    .preview-alert-icon {
      font-size: 16px;
      line-height: 1;
      margin-top: 1px;
      flex-shrink: 0;
    }

    .preview-alert-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .preview-alert-desc {
      font-size: 12px;
      opacity: 0.85;
    }

    /* Stats */
    .preview-stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 4px;
    }

    .preview-stat-card {
      background: var(--preview-card);
      border: 1px solid var(--preview-border);
      border-radius: var(--preview-radius);
      padding: 12px;
      text-align: center;
    }

    .preview-stat-value {
      font-size: 24px;
      font-weight: 800;
      color: var(--preview-primary);
      line-height: 1.1;
    }

    .preview-stat-label {
      font-size: 11px;
      color: var(--preview-muted-fg);
      margin-top: 2px;
    }

    /* Progress */
    .preview-progress-wrap {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .preview-progress-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--preview-muted-fg);
    }

    .preview-progress-track {
      height: 8px;
      background: var(--preview-border);
      border-radius: 4px;
      overflow: hidden;
    }

    .preview-progress-fill {
      height: 100%;
      background: var(--preview-primary);
      border-radius: 4px;
    }

    /* Avatars & type */
    .preview-bottom-row {
      display: flex;
      align-items: flex-start;
      gap: 20px;
    }

    .preview-avatars {
      display: flex;
      flex-shrink: 0;
    }

    .preview-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--preview-primary);
      color: var(--preview-primary-fg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      border: 2px solid var(--preview-bg);
      margin-left: -6px;
    }

    .preview-avatar:first-child {
      margin-left: 0;
    }

    .preview-avatar-accent {
      background: var(--preview-accent);
      color: var(--preview-accent-fg);
    }

    .preview-avatar-muted {
      background: var(--preview-muted);
      color: var(--preview-muted-fg);
    }

    .preview-type-samples {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
    }

    .preview-type-h1 {
      font-size: 22px;
      font-weight: 700;
      color: var(--preview-fg);
      line-height: 1.2;
    }

    .preview-type-h2 {
      font-size: 15px;
      font-weight: 600;
      color: var(--preview-fg);
    }

    .preview-type-body {
      font-size: 12px;
      color: var(--preview-muted-fg);
      line-height: 1.5;
    }
  `]
})
export class DesignSystemGenerationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private templateService = inject(TemplateService);
  private snackBar = inject(MatSnackBar);

  pageState = signal<'review' | 'generating' | 'result'>('review');
  resultTab = signal<ResultTab>('overview');
  project = signal<Project | null>(null);
  template = signal<TemplateEntry | null>(null);
  templateMetadata = signal<TemplateMetadata | null>(null);
  loading = signal(true);

  progress = signal(0);
  progressMessage = signal('Connecting to design system agent...');

  designSystemContent = signal<string | null>(null);
  saved = signal(false);

  private projectId!: string;

  colorSwatches = computed<ColorSwatch[]>(() => {
    const meta = this.templateMetadata();
    if (!meta) return [];
    return COLOR_DISPLAY_KEYS
      .filter(({ key }) => meta.designTokens[key])
      .map(({ key, label }) => ({ key, label, hex: meta.designTokens[key] as string }));
  });

  fontFamily = computed<string>(() => {
    const raw = this.templateMetadata()?.designTokens?.['fontFamily'];
    return (raw ?? 'Inter').split(',')[0].trim();
  });

  fontScale = computed<string>(() => {
    return this.templateMetadata()?.designTokens?.['fontScale'] ?? 'default';
  });

  previewVars = computed<Record<string, string>>(() => {
    const t = this.templateMetadata()?.designTokens;
    if (!t) return {} as Record<string, string>;
    return {
      '--preview-primary':      t['primary']              ?? '#171717',
      '--preview-primary-fg':   t['primaryForeground']    ?? '#ffffff',
      '--preview-secondary':    t['secondary']            ?? '#f5f5f5',
      '--preview-secondary-fg': t['secondaryForeground']  ?? '#171717',
      '--preview-bg':           t['background']           ?? '#fafafa',
      '--preview-card':         t['card']                 ?? '#ffffff',
      '--preview-fg':           t['foreground']           ?? '#171717',
      '--preview-muted':        t['muted']                ?? '#f5f5f5',
      '--preview-muted-fg':     t['mutedForeground']      ?? '#737373',
      '--preview-border':       t['border']               ?? '#e5e5e5',
      '--preview-accent':       t['accent']               ?? '#f5f5f5',
      '--preview-accent-fg':    t['accentForeground']     ?? '#171717',
      '--preview-destructive':  t['destructive']          ?? '#dc2626',
      '--preview-success':      t['success']              ?? '#dcfce7',
      '--preview-success-fg':   t['successForeground']    ?? '#166534',
      '--preview-info':         t['info']                 ?? '#dbeafe',
      '--preview-info-fg':      t['infoForeground']       ?? '#1e40af',
      '--preview-warning':      t['warning']              ?? '#fef9c3',
      '--preview-warning-fg':   t['warningForeground']    ?? '#854d0e',
      '--preview-radius':       t['borderRadius']         ?? '6px',
      '--preview-font':         t['fontFamily']           ?? 'Inter, sans-serif',
    } as Record<string, string>;
  });

  ngOnInit(): void {
    // Go up two levels: design-system -> ux-design -> projects/:id
    this.projectId = this.route.parent?.parent?.snapshot.paramMap.get('id')!;
    setTimeout(() => this.loadData());
  }

  private loadData(): void {
    this.projectService.getById(this.projectId).subscribe({
      next: (project) => {
        this.project.set(project);

        if (project.designSystemContent) {
          this.designSystemContent.set(project.designSystemContent);
          this.pageState.set('result');
          this.saved.set(true);
        }

        if (!project.selectedTemplateId) {
          this.loading.set(false);
          this.router.navigate(['/projects', this.projectId, 'ux-design', 'template-selection']);
          return;
        }

        this.loadTemplateData(project.selectedTemplateId);
      },
      error: () => {
        this.snackBar.open('Failed to load project', 'Dismiss', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }

  private loadTemplateData(templateId: string): void {
    this.templateService.getTemplates().pipe(
      switchMap(templates => {
        const entry = templates.find(t => t.id === templateId) ?? null;
        this.template.set(entry);
        return this.templateService.getMetadata(templateId);
      })
    ).subscribe({
      next: (metadata) => {
        this.templateMetadata.set(metadata);
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load template data', 'Dismiss', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }

  startGeneration(): void {
    this.pageState.set('generating');
    this.progress.set(0);
    this.progressMessage.set('Connecting to design system agent...');

    const url = `/api/projects/${this.projectId}/design-system/generate`;
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener('progress', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        this.handleProgressEvent(data);
        if (data.event === 'COMPLETE' || data.event === 'ERROR') {
          eventSource.close();
        }
      } catch { /* skip malformed */ }
    });

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) return;
      eventSource.close();
      if (this.pageState() === 'generating') {
        this.onGenerationError('Connection to agent lost');
      }
    };
  }

  private handleProgressEvent(event: { event: string; progress?: number; message?: string; content?: string }): void {
    if (event.event === 'COMPLETE') {
      this.progress.set(100);
      this.progressMessage.set('Design system generated successfully.');
      const content = event.content || '';
      this.designSystemContent.set(content);
      this.pageState.set('result');
      this.autoSave(content);
    } else if (event.event === 'ERROR') {
      this.snackBar.open(event.message || 'Generation failed', 'Dismiss', { duration: 5000 });
      this.pageState.set('review');
    } else {
      if (event.progress != null) this.progress.set(event.progress);
      if (event.message) this.progressMessage.set(event.message);
    }
  }

  private onGenerationError(msg: string): void {
    this.snackBar.open('Generation failed: ' + msg, 'Dismiss', { duration: 5000 });
    this.pageState.set('review');
  }

  private autoSave(content: string): void {
    this.projectService.saveDesignSystem(this.projectId, content).subscribe({
      next: () => this.saved.set(true),
      error: () => this.snackBar.open('Design system generated but could not be saved.', 'Dismiss', { duration: 4000 })
    });
  }

  regenerate(): void {
    this.designSystemContent.set(null);
    this.saved.set(false);
    this.resultTab.set('overview');
    this.pageState.set('review');
  }

  navigateToPrototypes(): void {
    this.router.navigate(['/projects', this.projectId, 'ux-design', 'prototypes']);
  }

  downloadContent(): void {
    const content = this.designSystemContent();
    if (!content) return;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `design-system-${this.project()?.name?.toLowerCase().replace(/\s+/g, '-') || 'export'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
  }

  humanize(str: string): string {
    return str
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }
}
