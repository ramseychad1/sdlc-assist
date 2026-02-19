import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';
import { forkJoin, of, switchMap } from 'rxjs';
import { ProjectService } from '../../../../core/services/project.service';
import { TemplateService } from '../../../../core/services/template.service';
import { Project } from '../../../../core/models/project.model';
import { TemplateEntry } from '../../../../core/models/template.model';
import { ScreenDefinition } from '../../../../core/models/screen-definition.model';
import { UxDesignStepperComponent } from '../components/ux-design-stepper/ux-design-stepper.component';
import { ScreenCardComponent } from './screen-card/screen-card.component';

type PageState = 'review-inputs' | 'extracting' | 'review-screens' | 'confirmed';
type ProtoState = 'generating' | 'preview';

@Component({
  selector: 'app-prototype-generation',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MatSnackBarModule, UxDesignStepperComponent, ScreenCardComponent],
  template: `
    <div class="prototype-page">
      <app-ux-design-stepper
        [currentStep]="3"
        [maxUnlockedStep]="screens().length > 0 && pageState() === 'confirmed' ? 4 : 3">
      </app-ux-design-stepper>

      <div class="header">
        <h2>Design Prototype Preparation</h2>
        <p class="description">
          AI identifies the UI screens from your PRD that need prototypes.
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

        @switch (pageState()) {

          <!-- ─── STATE 1: REVIEW INPUTS ─── -->
          @case ('review-inputs') {
            <div class="input-grid">
              <div class="input-card">
                <div class="input-card-label">
                  <lucide-icon name="file-text" [size]="14"></lucide-icon>
                  Product Requirements Document
                </div>
                <div class="input-card-title">{{ project()?.name }}</div>
                <div class="input-card-sub">PRD ready for screen extraction</div>
              </div>
              <div class="input-card input-card-design">
                <div class="input-card-label">
                  <lucide-icon name="palette" [size]="14"></lucide-icon>
                  Design System
                </div>
                <div class="input-card-title">{{ template()?.name ?? 'Design System' }}</div>
                <div class="input-card-sub">
                  @if (template()) {
                    <span class="tag-badge">{{ template()!.tag }}</span>
                  }
                </div>
              </div>
            </div>

            <div class="card review-card">
              <div class="section-label">Ready to Identify Screens</div>
              <p class="section-subtitle">
                The AI agent will read your PRD and identify every distinct UI screen needed.
              </p>
              <button class="btn btn-primary btn-lg start-btn" (click)="startExtraction()">
                <lucide-icon name="scan-search" [size]="18"></lucide-icon>
                Identify Screens
              </button>
            </div>
          }

          <!-- ─── STATE 2: EXTRACTING ─── -->
          @case ('extracting') {
            <div class="input-grid faded">
              <div class="input-card">
                <div class="input-card-label">
                  <lucide-icon name="file-text" [size]="14"></lucide-icon>
                  Product Requirements Document
                </div>
                <div class="input-card-title">{{ project()?.name }}</div>
                <div class="input-card-sub">PRD ready for screen extraction</div>
              </div>
              <div class="input-card input-card-design">
                <div class="input-card-label">
                  <lucide-icon name="palette" [size]="14"></lucide-icon>
                  Design System
                </div>
                <div class="input-card-title">{{ template()?.name ?? 'Design System' }}</div>
                <div class="input-card-sub">
                  @if (template()) {
                    <span class="tag-badge">{{ template()!.tag }}</span>
                  }
                </div>
              </div>
            </div>

            <div class="card generating-card">
              <div class="section-label">Extracting Screens</div>
              <div class="generating-header">
                <lucide-icon name="scan-search" [size]="18" class="spin"></lucide-icon>
                <span>Identifying UI screens from PRD...</span>
              </div>
              <div class="progress-bar-track">
                <div class="progress-bar-fill" [style.width.%]="progress()"></div>
              </div>
              <div class="progress-pct">{{ progress() }}%</div>
              <p class="progress-message">{{ progressMessage() }}</p>
            </div>
          }

          <!-- ─── STATE 3: REVIEW SCREENS ─── -->
          @case ('review-screens') {
            <div class="context-bar">
              <div class="context-item">
                <lucide-icon name="file-text" [size]="13"></lucide-icon>
                <span>{{ project()?.name }}</span>
              </div>
              @if (template()) {
                <div class="context-sep"></div>
                <div class="context-item">
                  <lucide-icon name="palette" [size]="13"></lucide-icon>
                  <span>{{ template()!.name }}</span>
                  <span class="tag-badge">{{ template()!.tag }}</span>
                </div>
              }
            </div>

            <div class="confirm-banner">
              <div class="banner-left">
                <lucide-icon name="circle-check" [size]="16" class="banner-icon"></lucide-icon>
                <span class="banner-count">{{ screens().length }} screens identified</span>
                <span class="banner-sub">Review and remove any you don't need, then confirm.</span>
              </div>
              <button
                class="btn btn-primary"
                [disabled]="screens().length === 0 || saving()"
                (click)="confirmScreens()">
                @if (saving()) {
                  <lucide-icon name="loader-circle" [size]="14" class="spin"></lucide-icon>
                  Saving...
                } @else {
                  <lucide-icon name="check" [size]="14"></lucide-icon>
                  Confirm Screen List
                }
              </button>
            </div>

            @if (screens().length === 0) {
              <div class="empty-state">
                <lucide-icon name="inbox" [size]="32"></lucide-icon>
                <p>All screens removed. Please run extraction again.</p>
                <button class="btn btn-secondary" (click)="reExtract()">Run Again</button>
              </div>
            } @else {
              <div class="screen-grid">
                @for (screen of screens(); track screen.id) {
                  <app-screen-card
                    [screen]="screen"
                    [pageState]="pageState()"
                    (remove)="removeScreen($event)">
                  </app-screen-card>
                }
              </div>
            }
          }

          <!-- ─── STATE 4: CONFIRMED ─── -->
          @case ('confirmed') {
            <div class="context-bar">
              <div class="context-item">
                <lucide-icon name="file-text" [size]="13"></lucide-icon>
                <span>{{ project()?.name }}</span>
              </div>
              @if (template()) {
                <div class="context-sep"></div>
                <div class="context-item">
                  <lucide-icon name="palette" [size]="13"></lucide-icon>
                  <span>{{ template()!.name }}</span>
                  <span class="tag-badge">{{ template()!.tag }}</span>
                </div>
              }
            </div>

            <div class="success-bar">
              <div class="success-left">
                <lucide-icon name="circle-check-big" [size]="16" class="success-icon"></lucide-icon>
                <span class="success-count">{{ screens().length }} screens confirmed</span>
                <span class="success-sub">Click any screen card to generate its prototype.</span>
              </div>
              <div class="success-actions">
                <span class="proto-count-badge">
                  {{ savedProtoCount() }} / {{ screens().length }} generated
                </span>
                <button class="btn btn-secondary btn-sm" (click)="reExtract()">
                  <lucide-icon name="refresh-cw" [size]="13"></lucide-icon>
                  Re-run
                </button>
              </div>
            </div>

            <div class="screen-grid">
              @for (screen of screens(); track screen.id) {
                <app-screen-card
                  [screen]="screen"
                  [pageState]="pageState()"
                  (openPrototype)="openPrototype($event)">
                </app-screen-card>
              }
            </div>
          }
        }
      }
    </div>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- PROTOTYPE GENERATION OVERLAY                            -->
    <!-- ═══════════════════════════════════════════════════════ -->
    @if (protoTarget()) {
      <div class="proto-overlay" (click)="onOverlayBackdropClick($event)">
        <div class="proto-panel" (click)="$event.stopPropagation()">

          <!-- Panel header -->
          <div class="proto-header">
            <div class="proto-header-meta">
              <span class="proto-screen-type">{{ protoTarget()!.screenType }}</span>
              <span class="proto-screen-name">{{ protoTarget()!.name }}</span>
            </div>
            <div class="proto-header-actions">
              @if (protoState() === 'preview') {
                <button class="btn-icon" title="Open in new tab" (click)="openInNewTab()">
                  <lucide-icon name="external-link" [size]="15"></lucide-icon>
                </button>
              }
              <button class="btn-icon" title="Close" (click)="closePrototype()">
                <lucide-icon name="x" [size]="15"></lucide-icon>
              </button>
            </div>
          </div>

          <!-- Panel body -->
          <div class="proto-body">

            <!-- Left sidebar -->
            <div class="proto-sidebar">
              <!-- Screen meta -->
              <div class="proto-meta-block">
                <div class="proto-meta-row">
                  <span class="proto-meta-label">Epic</span>
                  <span class="proto-meta-value">{{ protoTarget()!.epicName || '—' }}</span>
                </div>
                <div class="proto-meta-row">
                  <span class="proto-meta-label">Type</span>
                  <span class="proto-meta-value">{{ protoTarget()!.screenType }}</span>
                </div>
                <div class="proto-meta-row">
                  <span class="proto-meta-label">Complexity</span>
                  <span class="proto-meta-value">{{ protoTarget()!.complexity }}</span>
                </div>
                @if (protoTarget()!.userRole) {
                  <div class="proto-meta-row">
                    <span class="proto-meta-label">User Role</span>
                    <span class="proto-meta-value">{{ protoTarget()!.userRole }}</span>
                  </div>
                }
              </div>

              <div class="proto-desc">{{ protoTarget()!.description }}</div>

              @if (protoState() === 'generating') {
                <div class="proto-progress-block">
                  <div class="proto-progress-label">
                    <lucide-icon name="sparkles" [size]="13" class="spin"></lucide-icon>
                    Generating...
                  </div>
                  <div class="progress-bar-track">
                    <div class="progress-bar-fill" [style.width.%]="protoProgress()"></div>
                  </div>
                  <div class="proto-progress-pct">{{ protoProgress() }}%</div>
                  <p class="proto-progress-msg">{{ protoProgressMsg() }}</p>
                </div>
              }

              @if (protoState() === 'preview') {
                @if (protoDesignNotes()) {
                  <div class="proto-notes-block">
                    <div class="proto-notes-label">Design Notes</div>
                    <p class="proto-notes-text">{{ protoDesignNotes() }}</p>
                  </div>
                }

                <div class="proto-actions">
                  @if (!protoSaved()) {
                    <button
                      class="btn btn-primary"
                      [disabled]="protoSaving()"
                      (click)="savePrototype()">
                      @if (protoSaving()) {
                        <lucide-icon name="loader-circle" [size]="14" class="spin"></lucide-icon>
                        Saving...
                      } @else {
                        <lucide-icon name="save" [size]="14"></lucide-icon>
                        Save Prototype
                      }
                    </button>
                  } @else {
                    <div class="proto-saved-badge">
                      <lucide-icon name="check" [size]="13"></lucide-icon>
                      Saved
                    </div>
                  }
                  <button class="btn btn-secondary" (click)="regeneratePrototype()">
                    <lucide-icon name="refresh-cw" [size]="13"></lucide-icon>
                    Regenerate
                  </button>
                </div>
              }
            </div>

            <!-- Right preview area -->
            <div class="proto-preview-area">
              @if (protoState() === 'generating') {
                <div class="proto-skeleton-wrap">
                  <div class="proto-skeleton-browser">
                    <div class="proto-skeleton-bar">
                      <div class="proto-skeleton-dot"></div>
                      <div class="proto-skeleton-dot"></div>
                      <div class="proto-skeleton-dot"></div>
                      <div class="proto-skeleton-url"></div>
                    </div>
                    <div class="proto-skeleton-content">
                      <div class="proto-skeleton-header"></div>
                      <div class="proto-skeleton-body">
                        <div class="proto-skeleton-card"></div>
                        <div class="proto-skeleton-card"></div>
                        <div class="proto-skeleton-card"></div>
                        <div class="proto-skeleton-card"></div>
                      </div>
                      <div class="proto-skeleton-table">
                        <div class="proto-skeleton-row-item"></div>
                        <div class="proto-skeleton-row-item"></div>
                        <div class="proto-skeleton-row-item"></div>
                      </div>
                    </div>
                  </div>
                  <p class="proto-skeleton-hint">Generating your prototype...</p>
                </div>
              }

              @if (protoState() === 'preview' && protoHtml()) {
                <div class="browser-chrome">
                  <div class="browser-chrome-bar">
                    <div class="browser-chrome-dots">
                      <span class="chrome-dot chrome-dot-red"></span>
                      <span class="chrome-dot chrome-dot-yellow"></span>
                      <span class="chrome-dot chrome-dot-green"></span>
                    </div>
                    <div class="browser-chrome-url">
                      <span>prototype://{{ slugify(protoTarget()!.name) }}</span>
                    </div>
                  </div>
                  <iframe
                    class="proto-iframe"
                    sandbox="allow-same-origin"
                    [srcdoc]="protoSafeHtml()"
                    title="Prototype preview">
                  </iframe>
                </div>
              }
            </div>

          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .prototype-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
      padding-bottom: 60px;
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

    .input-card-design { background: var(--card); }

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
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px 24px;
    }

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

    .review-card { text-align: center; }

    .start-btn {
      max-width: 280px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      height: 44px;
      font-size: 15px;
      font-weight: 600;
    }

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

    .context-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 10px 16px;
      flex-wrap: wrap;
    }

    .context-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--foreground);
      font-weight: 500;
    }

    .context-sep {
      width: 1px;
      height: 16px;
      background: var(--border);
    }

    .confirm-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: color-mix(in srgb, var(--primary) 6%, var(--card));
      border: 1px solid color-mix(in srgb, var(--primary) 20%, var(--border));
      border-radius: var(--radius);
      padding: 14px 20px;
    }

    .banner-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .banner-icon { color: var(--primary); flex-shrink: 0; }

    .banner-count {
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
    }

    .banner-sub {
      font-size: 13px;
      color: var(--muted-foreground);
    }

    .success-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      background: color-mix(in srgb, #16a34a 8%, var(--card));
      border: 1px solid color-mix(in srgb, #16a34a 25%, var(--border));
      border-radius: var(--radius);
      padding: 14px 20px;
    }

    .success-left {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .success-icon { color: #16a34a; flex-shrink: 0; }

    .success-count {
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
    }

    .success-sub {
      font-size: 13px;
      color: var(--muted-foreground);
    }

    .success-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .proto-count-badge {
      font-size: 12px;
      font-weight: 600;
      padding: 3px 10px;
      background: color-mix(in srgb, var(--primary) 12%, transparent);
      color: var(--primary);
      border-radius: var(--radius-full);
    }

    .screen-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .tag-badge {
      display: inline-block;
      padding: 2px 8px;
      background: color-mix(in srgb, var(--primary) 15%, transparent);
      color: var(--primary);
      border-radius: var(--radius-full);
      font-size: 11px;
      font-weight: 500;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 24px;
      text-align: center;
      color: var(--muted-foreground);
      gap: 12px;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 16px;
      height: 36px;
      border-radius: var(--radius);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: opacity 0.15s;
    }

    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary { background: var(--primary); color: var(--primary-foreground); }
    .btn-secondary { background: var(--muted); color: var(--foreground); border: 1px solid var(--border); }
    .btn-sm { height: 30px; padding: 0 12px; font-size: 12px; }
    .btn-lg { height: 44px; padding: 0 24px; font-size: 15px; font-weight: 600; }

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

    .btn-icon:hover { background: var(--muted); color: var(--foreground); }

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

    .skeleton-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .skeleton-card { height: 120px; }
    .skeleton-btn { height: 44px; max-width: 280px; margin: 0 auto; }

    @keyframes skeleton-loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .spin { animation: spin 1.5s linear infinite; }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* ═══════════════════════════════════════ */
    /* PROTOTYPE OVERLAY                        */
    /* ═══════════════════════════════════════ */
    .proto-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 200;
      display: flex;
      align-items: stretch;
      justify-content: flex-end;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .proto-panel {
      width: min(1100px, 95vw);
      height: 100vh;
      background: var(--background);
      display: flex;
      flex-direction: column;
      animation: slideInRight 0.25s ease-out;
      overflow: hidden;
    }

    @keyframes slideInRight {
      from { transform: translateX(40px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .proto-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      background: var(--card);
      flex-shrink: 0;
    }

    .proto-header-meta {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .proto-screen-type {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: var(--muted);
      padding: 2px 8px;
      border-radius: var(--radius-full);
    }

    .proto-screen-name {
      font-size: 15px;
      font-weight: 600;
      color: var(--foreground);
    }

    .proto-header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .proto-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* Sidebar */
    .proto-sidebar {
      width: 260px;
      flex-shrink: 0;
      border-right: 1px solid var(--border);
      background: var(--card);
      display: flex;
      flex-direction: column;
      gap: 0;
      overflow-y: auto;
      padding: 16px;
    }

    .proto-meta-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
    }

    .proto-meta-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .proto-meta-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.4px;
      width: 72px;
      flex-shrink: 0;
      padding-top: 1px;
    }

    .proto-meta-value {
      font-size: 13px;
      color: var(--foreground);
      text-transform: capitalize;
    }

    .proto-desc {
      font-size: 12px;
      color: var(--muted-foreground);
      line-height: 1.6;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
    }

    .proto-progress-block {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .proto-progress-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
      color: var(--foreground);
    }

    .proto-progress-pct {
      font-size: 12px;
      font-weight: 600;
      color: var(--foreground);
    }

    .proto-progress-msg {
      font-size: 12px;
      color: var(--muted-foreground);
      margin: 0;
    }

    .proto-notes-block {
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 16px;
    }

    .proto-notes-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--muted-foreground);
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 6px;
    }

    .proto-notes-text {
      font-size: 12px;
      color: var(--muted-foreground);
      line-height: 1.6;
      margin: 0;
    }

    .proto-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .proto-saved-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: color-mix(in srgb, #16a34a 12%, transparent);
      color: #16a34a;
      border: 1px solid color-mix(in srgb, #16a34a 25%, transparent);
      border-radius: var(--radius);
      font-size: 13px;
      font-weight: 600;
    }

    /* Preview area */
    .proto-preview-area {
      flex: 1;
      background: var(--muted);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      padding: 20px;
    }

    /* Generating skeleton */
    .proto-skeleton-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      width: 100%;
      max-width: 700px;
    }

    .proto-skeleton-browser {
      width: 100%;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }

    .proto-skeleton-bar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 14px;
      background: var(--background);
      border-bottom: 1px solid var(--border);
    }

    .proto-skeleton-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--border);
    }

    .proto-skeleton-url {
      flex: 1;
      height: 8px;
      border-radius: 4px;
      background: var(--border);
      margin-left: 8px;
    }

    .proto-skeleton-content {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .proto-skeleton-header {
      height: 40px;
      border-radius: var(--radius);
      background: linear-gradient(90deg, var(--border) 0%, var(--muted) 50%, var(--border) 100%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s ease-in-out infinite;
    }

    .proto-skeleton-body {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
    }

    .proto-skeleton-card {
      height: 80px;
      border-radius: var(--radius);
      background: linear-gradient(90deg, var(--border) 0%, var(--muted) 50%, var(--border) 100%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s ease-in-out infinite;
    }

    .proto-skeleton-table {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .proto-skeleton-row-item {
      height: 32px;
      border-radius: var(--radius);
      background: linear-gradient(90deg, var(--border) 0%, var(--muted) 50%, var(--border) 100%);
      background-size: 200% 100%;
      animation: skeleton-loading 1.5s ease-in-out infinite;
    }

    .proto-skeleton-hint {
      font-size: 13px;
      color: var(--muted-foreground);
      margin: 0;
    }

    /* Browser chrome */
    .browser-chrome {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--border);
      box-shadow: 0 4px 24px rgba(0,0,0,0.15);
    }

    .browser-chrome-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      background: var(--card);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }

    .browser-chrome-dots {
      display: flex;
      gap: 5px;
      flex-shrink: 0;
    }

    .chrome-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .chrome-dot-red    { background: #ff5f57; }
    .chrome-dot-yellow { background: #ffbd2e; }
    .chrome-dot-green  { background: #28ca42; }

    .browser-chrome-url {
      flex: 1;
      background: var(--muted);
      border: 1px solid var(--border);
      border-radius: 4px;
      padding: 3px 10px;
      font-size: 11px;
      color: var(--muted-foreground);
      font-family: monospace;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .proto-iframe {
      flex: 1;
      width: 100%;
      border: none;
      background: white;
    }
  `]
})
export class PrototypeGenerationComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private templateService = inject(TemplateService);
  private snackBar = inject(MatSnackBar);
  private sanitizer = inject(DomSanitizer);

  // Page state
  pageState = signal<PageState>('review-inputs');
  project = signal<Project | null>(null);
  template = signal<TemplateEntry | null>(null);
  screens = signal<ScreenDefinition[]>([]);
  progress = signal(0);
  progressMessage = signal('Connecting to screen extraction agent...');
  saving = signal(false);
  loading = signal(true);

  // Prototype overlay state
  protoTarget = signal<ScreenDefinition | null>(null);
  protoState = signal<ProtoState>('generating');
  protoHtml = signal<string>('');
  protoDesignNotes = signal<string>('');
  protoProgress = signal(0);
  protoProgressMsg = signal('Connecting to screen generation agent...');
  protoSaving = signal(false);
  protoSaved = signal(false);

  savedProtoCount = computed(() => this.screens().filter(s => !!s.prototypeContent).length);

  protoSafeHtml = computed(() => {
    const html = this.protoHtml();
    return html ? this.sanitizer.bypassSecurityTrustHtml(html) : '';
  });

  private projectId!: string;

  ngOnInit(): void {
    this.projectId = this.route.parent?.parent?.snapshot.paramMap.get('id')!;
    setTimeout(() => this.loadData());
  }

  private loadData(): void {
    this.projectService.getById(this.projectId).pipe(
      switchMap(project => {
        this.project.set(project);
        const template$ = project.selectedTemplateId
          ? this.templateService.getTemplates()
          : of(null);
        const screens$ = this.projectService.getScreens(this.projectId);
        return forkJoin({ templates: template$, screens: screens$ });
      })
    ).subscribe({
      next: ({ templates, screens }) => {
        if (templates && this.project()?.selectedTemplateId) {
          const entry = templates.find((t: TemplateEntry) => t.id === this.project()!.selectedTemplateId) ?? null;
          this.template.set(entry);
        }
        if (screens && screens.length > 0) {
          this.screens.set(screens);
          this.pageState.set('confirmed');
        }
        this.loading.set(false);
      },
      error: () => {
        this.snackBar.open('Failed to load project data', 'Dismiss', { duration: 4000 });
        this.loading.set(false);
      }
    });
  }

  // ── Screen extraction ────────────────────────────────────────
  startExtraction(): void {
    this.pageState.set('extracting');
    this.progress.set(0);
    this.progressMessage.set('Connecting to screen extraction agent...');

    const url = `/api/projects/${this.projectId}/screens/extract`;
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener('progress', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        this.handleExtractionEvent(data);
        if (data.event === 'COMPLETE' || data.event === 'ERROR') {
          eventSource.close();
        }
      } catch { /* skip malformed */ }
    });

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) return;
      eventSource.close();
      if (this.pageState() === 'extracting') {
        this.snackBar.open('Connection to agent lost', 'Dismiss', { duration: 5000 });
        this.pageState.set('review-inputs');
      }
    };
  }

  private handleExtractionEvent(event: { event: string; progress?: number; message?: string; screens?: ScreenDefinition[] }): void {
    if (event.event === 'COMPLETE') {
      this.progress.set(100);
      if (event.screens && event.screens.length > 0) {
        this.screens.set(event.screens);
        this.pageState.set('review-screens');
      } else {
        this.snackBar.open('No screens found. Check your PRD and try again.', 'Dismiss', { duration: 5000 });
        this.pageState.set('review-inputs');
      }
    } else if (event.event === 'ERROR') {
      this.snackBar.open(event.message || 'Extraction failed', 'Dismiss', { duration: 5000 });
      this.pageState.set('review-inputs');
    } else {
      if (event.progress != null) this.progress.set(event.progress);
      if (event.message) this.progressMessage.set(event.message);
    }
  }

  removeScreen(id: string): void {
    this.screens.set(this.screens().filter(s => s.id !== id));
  }

  confirmScreens(): void {
    if (this.screens().length === 0) {
      this.snackBar.open('Please keep at least one screen.', 'Dismiss', { duration: 3000 });
      return;
    }
    this.saving.set(true);
    this.projectService.saveScreens(this.projectId, this.screens()).subscribe({
      next: (saved) => {
        this.screens.set(saved);
        this.saving.set(false);
        this.pageState.set('confirmed');
      },
      error: () => {
        this.snackBar.open('Failed to save screens.', 'Dismiss', { duration: 4000 });
        this.saving.set(false);
      }
    });
  }

  reExtract(): void {
    this.screens.set([]);
    this.pageState.set('review-inputs');
  }

  // ── Prototype overlay ────────────────────────────────────────
  openPrototype(screen: ScreenDefinition): void {
    this.protoTarget.set(screen);
    this.protoSaved.set(false);

    if (screen.prototypeContent) {
      // Already generated — go straight to preview
      this.protoHtml.set(screen.prototypeContent);
      this.protoDesignNotes.set('');
      this.protoState.set('preview');
      this.protoSaved.set(true);
    } else {
      // Start generation
      this.protoState.set('generating');
      this.protoProgress.set(0);
      this.protoProgressMsg.set('Connecting to screen generation agent...');
      this.startGeneration(screen);
    }
  }

  private startGeneration(screen: ScreenDefinition): void {
    const url = `/api/projects/${this.projectId}/screens/${screen.id}/generate`;
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.addEventListener('progress', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        this.handleGenerationEvent(data);
        if (data.event === 'COMPLETE' || data.event === 'ERROR') {
          eventSource.close();
        }
      } catch { /* skip malformed */ }
    });

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) return;
      eventSource.close();
      if (this.protoState() === 'generating') {
        this.snackBar.open('Connection to agent lost', 'Dismiss', { duration: 5000 });
        this.closePrototype();
      }
    };
  }

  private handleGenerationEvent(event: {
    event: string;
    progress?: number;
    message?: string;
    htmlContent?: string;
    designNotes?: string;
  }): void {
    if (event.event === 'COMPLETE') {
      this.protoProgress.set(100);
      this.protoHtml.set(event.htmlContent || '');
      this.protoDesignNotes.set(event.designNotes || '');
      this.protoState.set('preview');
    } else if (event.event === 'ERROR') {
      this.snackBar.open(event.message || 'Generation failed', 'Dismiss', { duration: 5000 });
      this.closePrototype();
    } else {
      if (event.progress != null) this.protoProgress.set(event.progress);
      if (event.message) this.protoProgressMsg.set(event.message);
    }
  }

  savePrototype(): void {
    const screen = this.protoTarget();
    const html = this.protoHtml();
    if (!screen || !html) return;

    this.protoSaving.set(true);
    this.projectService.savePrototype(this.projectId, screen.id, html).subscribe({
      next: (updated) => {
        // Update screen in local list
        this.screens.update(list =>
          list.map(s => s.id === updated.id ? { ...s, prototypeContent: updated.prototypeContent } : s)
        );
        this.protoSaving.set(false);
        this.protoSaved.set(true);
      },
      error: () => {
        this.snackBar.open('Failed to save prototype.', 'Dismiss', { duration: 4000 });
        this.protoSaving.set(false);
      }
    });
  }

  regeneratePrototype(): void {
    const screen = this.protoTarget();
    if (!screen) return;
    this.protoState.set('generating');
    this.protoProgress.set(0);
    this.protoHtml.set('');
    this.protoDesignNotes.set('');
    this.protoSaved.set(false);
    this.protoProgressMsg.set('Connecting to screen generation agent...');
    this.startGeneration(screen);
  }

  closePrototype(): void {
    this.protoTarget.set(null);
    this.protoHtml.set('');
  }

  onOverlayBackdropClick(event: MouseEvent): void {
    this.closePrototype();
  }

  slugify(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-');
  }

  openInNewTab(): void {
    const html = this.protoHtml();
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}
