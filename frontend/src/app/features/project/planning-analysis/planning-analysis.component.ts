import { Component, DestroyRef, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { ProjectService } from '../../../core/services/project.service';
import { Project } from '../../../core/models/project.model';
import { FileService } from '../../../core/services/file.service';
import { ProjectFile } from '../../../core/models/file.model';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';
import { MarkdownPipe } from '../../../shared/pipes/markdown.pipe';
import { marked } from 'marked';

@Component({
    selector: 'app-planning-analysis',
    standalone: true,
    imports: [CommonModule, FormsModule, MatSnackBarModule, LucideAngularModule, MarkdownPipe],
    template: `
    <!-- Upload & AI Analysis Section -->
    <div class="ai-section card">
      <div class="ai-header">
        <div class="ai-title">
          <lucide-icon name="sparkles" [size]="20"></lucide-icon>
          <h3>AI Requirements Analysis</h3>
        </div>
        <div class="ai-actions">
          <button class="btn btn-outline" (click)="fileInput.click()" [disabled]="uploading()">
            <lucide-icon name="upload" [size]="16"></lucide-icon>
            Upload Document
          </button>
          @if (analyzing()) {
            <button class="btn btn-destructive" (click)="stopAnalysis()">
              <lucide-icon name="square" [size]="16"></lucide-icon>
              Stop
            </button>
          } @else {
            <button class="btn btn-primary"
                    (click)="triggerAnalysis()"
                    [disabled]="uploadedFiles().length === 0 || geminiAnalyzing()">
              <lucide-icon name="sparkles" [size]="16"></lucide-icon>
              Generate with Claude
            </button>
            <button class="btn btn-outline btn-gemini"
                    (click)="triggerGeminiAnalysis()"
                    [disabled]="uploadedFiles().length === 0 || analyzing()">
              @if (geminiAnalyzing()) {
                <lucide-icon name="loader" [size]="16" class="spin"></lucide-icon>
                Gemini Processing...
              } @else {
                <lucide-icon name="cpu" [size]="16"></lucide-icon>
                Generate with Gemini
              }
            </button>
          }
        </div>
        <input #fileInput type="file" hidden
               accept=".pdf,.docx,.txt,.md"
               multiple
               (change)="onFilesSelected($event)" />
      </div>

      <!-- File List -->
      @if (uploadedFiles().length > 0) {
        <div class="file-list">
          @for (file of uploadedFiles(); track file.id) {
            <div class="file-item">
              <div class="file-info">
                <lucide-icon name="file-text" [size]="16"></lucide-icon>
                <span class="file-name">{{ file.originalFilename }}</span>
                <span class="file-size">{{ formatFileSize(file.fileSize) }}</span>
              </div>
              <div class="file-actions">
                <a class="btn-icon" [href]="getDownloadUrl(file)" title="Download file" target="_blank">
                  <lucide-icon name="download" [size]="14"></lucide-icon>
                </a>
                <button class="btn-icon" (click)="deleteFile(file)" title="Remove file">
                  <lucide-icon name="x" [size]="14"></lucide-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Upload Progress -->
      @if (uploading()) {
        <div class="processing-card">
          <lucide-icon name="loader" [size]="20" class="spin"></lucide-icon>
          <span>Uploading files...</span>
        </div>
      }

      <!-- Gemini Progress (batch, non-streaming) -->
      @if (geminiAnalyzing()) {
        <div class="gemini-progress">
          <div class="gemini-progress-bar">
            <div class="gemini-progress-fill" [style.width.%]="geminiProgress()"></div>
          </div>
          <p class="gemini-progress-message">{{ geminiProgressMessage() }}</p>
        </div>
      }

      <!-- AI Processing (streaming indicator) -->
      @if (analyzing() && !aiResult()) {
        <div class="processing-card">
          <lucide-icon name="loader" [size]="20" class="spin"></lucide-icon>
          <div class="processing-text">
            <span class="processing-title">Connecting to AI...</span>
            <span class="processing-subtitle">Streaming will begin shortly</span>
          </div>
        </div>
      }

      <!-- AI Result -->
      @if (aiResult()) {
        <div class="ai-result">
          <div class="ai-result-header">
            @if (analyzing()) {
              <h4>
                <lucide-icon name="loader" [size]="14" class="spin"></lucide-icon>
                Generating with Claude...
              </h4>
              <div class="ai-result-actions">
                <button class="btn btn-destructive btn-sm" (click)="stopAnalysis()">
                  <lucide-icon name="square" [size]="14"></lucide-icon>
                  Stop
                </button>
              </div>
            } @else {
              <h4>
                Generated PRD
                @if (aiResultSource() === 'claude') {
                  <span class="source-badge source-claude">
                    <lucide-icon name="sparkles" [size]="12"></lucide-icon>
                    Claude
                  </span>
                } @else if (aiResultSource() === 'gemini') {
                  <span class="source-badge source-gemini">
                    <lucide-icon name="cpu" [size]="12"></lucide-icon>
                    Gemini
                  </span>
                }
              </h4>
              <div class="ai-result-actions">
                <button class="btn btn-primary btn-sm" (click)="saveAiResultAsPrd()" [disabled]="savingPrd()">
                  <lucide-icon name="save" [size]="14"></lucide-icon>
                  @if (savingPrd()) { Saving... } @else { Save PRD }
                </button>
                <button class="btn btn-outline btn-sm" (click)="downloadAiResult()">
                  <lucide-icon name="download" [size]="14"></lucide-icon>
                  Download .md
                </button>
                <button class="btn btn-outline btn-sm" (click)="editAiResultBeforeSave()">
                  <lucide-icon name="pencil" [size]="14"></lucide-icon>
                  Edit
                </button>
                <button class="btn btn-outline btn-sm" (click)="triggerAnalysis()">
                  <lucide-icon name="refresh-cw" [size]="14"></lucide-icon>
                  Regenerate
                </button>
                <button class="btn btn-ghost btn-sm" (click)="dismissAiResult()">
                  <lucide-icon name="x" [size]="14"></lucide-icon>
                  Dismiss
                </button>
              </div>
            }
          </div>
          @if (editingAiResult()) {
            <div class="prd-editor">
              <textarea class="prd-textarea"
                        [ngModel]="aiResult()"
                        (ngModelChange)="aiResult.set($event)"></textarea>
            </div>
          } @else {
            <div class="ai-result-content" #resultContent>
              @if (analyzing()) {
                <pre>{{ aiResult() }}</pre>
              } @else {
                <div class="markdown-body" [innerHTML]="aiResult() | markdown"></div>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- Saved PRD -->
    @if (prdContent() && !aiResult()) {
      <div class="prd-section card">
        <div class="prd-header">
          <div class="prd-title">
            <lucide-icon name="file-text" [size]="20"></lucide-icon>
            <h3>Product Requirements Document</h3>
          </div>
          <div class="prd-actions">
            @if (!editing()) {
              <button class="btn btn-outline btn-sm" (click)="downloadMarkdown()">
                <lucide-icon name="download" [size]="14"></lucide-icon>
                Download .md
              </button>
              <button class="btn btn-outline btn-sm" (click)="printPrd()">
                <lucide-icon name="printer" [size]="14"></lucide-icon>
                Save as PDF
              </button>
              <button class="btn btn-outline btn-sm" (click)="editPrd()">
                <lucide-icon name="pencil" [size]="14"></lucide-icon>
                Edit
              </button>
              <button class="btn btn-outline btn-sm" (click)="triggerAnalysis()">
                <lucide-icon name="refresh-cw" [size]="14"></lucide-icon>
                Regenerate
              </button>
            }
          </div>
        </div>
        <div class="prd-body">
          @if (editing()) {
            <div class="prd-editor">
              <textarea class="prd-textarea"
                        [(ngModel)]="prdDraft"></textarea>
            </div>
            <div class="prd-edit-actions">
              <button class="btn btn-primary" (click)="savePrd()" [disabled]="savingPrd()">
                <lucide-icon name="save" [size]="16"></lucide-icon>
                @if (savingPrd()) {
                  Saving...
                } @else {
                  Save Changes
                }
              </button>
              <button class="btn btn-outline" (click)="cancelEdit()">
                Cancel
              </button>
            </div>
          } @else {
            <div class="prd-content markdown-body" [innerHTML]="prdContent() | markdown"></div>
          }
        </div>
      </div>
    }

    <!-- Empty State -->
    @if (!prdContent() && !aiResult() && uploadedFiles().length === 0 && !loading() && !uploading() && !analyzing()) {
      <div class="empty-state card">
        <lucide-icon name="file-plus" [size]="48" class="empty-icon"></lucide-icon>
        <h3>Get Started</h3>
        <p>Upload planning documents and use AI to generate a Product Requirements Document for your project.</p>
        <button class="btn btn-primary" (click)="fileInput.click()">
          <lucide-icon name="upload" [size]="16"></lucide-icon>
          Upload Documents
        </button>
      </div>
    }

    @if (loading()) {
      <div class="loading">Loading...</div>
    }
  `,
    styles: [
        `
    .ai-section {
      margin-bottom: 24px;
      padding: 20px 24px;
    }

    .ai-header {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .ai-title {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .ai-title h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground);
      margin: 0;
    }

    .ai-actions {
      display: flex;
      gap: 8px;
    }

    .file-list {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: var(--muted);
      border-radius: 6px;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .file-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--foreground);
    }

    .file-size {
      font-size: 12px;
      color: var(--muted-foreground);
    }

    .file-actions {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      color: var(--muted-foreground);
      display: flex;
      align-items: center;
    }

    .btn-icon:hover {
      background: var(--accent);
      color: var(--foreground);
    }

    .processing-card {
      margin-top: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--muted);
      border-radius: 8px;
      color: var(--muted-foreground);
    }

    .processing-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .processing-title {
      font-weight: 500;
      color: var(--foreground);
    }

    .processing-subtitle {
      font-size: 13px;
    }

    .spin {
      animation: spin 1.5s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .ai-result {
      margin-top: 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }

    .ai-result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--muted);
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
      gap: 8px;
    }

    .ai-result-header h4 {
      font-size: 14px;
      font-weight: 600;
      color: var(--foreground);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .ai-result-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn-sm {
      font-size: 13px;
      padding: 4px 10px;
    }

    .btn-ghost {
      background: none;
      border: 1px solid transparent;
      color: var(--muted-foreground);
      cursor: pointer;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-ghost:hover {
      background: var(--accent);
      color: var(--foreground);
    }

    .btn-destructive {
      background: var(--destructive, #ef4444);
      color: white;
      border: none;
      cursor: pointer;
      border-radius: 6px;
      padding: 6px 12px;
      font-size: 14px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .btn-destructive:hover {
      opacity: 0.9;
    }

    .ai-result-content {
      padding: 16px;
      max-height: 500px;
      overflow-y: auto;
    }

    .ai-result-content pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 13px;
      line-height: 1.6;
      color: var(--foreground);
      margin: 0;
      font-family: inherit;
    }

    /* Saved PRD */
    .prd-section {
      margin-bottom: 24px;
      overflow: hidden;
    }

    .prd-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .prd-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .prd-title h3 {
      font-size: 16px;
      font-weight: 600;
      color: var(--foreground);
      margin: 0;
    }

    .prd-actions {
      display: flex;
      gap: 8px;
    }

    .prd-body {
      padding: 0 24px 24px;
    }

    .prd-content pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-size: 13px;
      line-height: 1.6;
      color: var(--foreground);
      margin: 0;
      font-family: inherit;
    }

    :host ::ng-deep .markdown-body {
      font-size: 14px;
      line-height: 1.7;
      color: var(--foreground);

      h1, h2, h3, h4, h5, h6 {
        margin: 24px 0 12px;
        font-weight: 600;
        color: var(--foreground);
        line-height: 1.3;
      }
      h1 { font-size: 24px; border-bottom: 1px solid var(--border); padding-bottom: 8px; }
      h2 { font-size: 20px; border-bottom: 1px solid var(--border); padding-bottom: 6px; }
      h3 { font-size: 16px; }
      h4 { font-size: 14px; }

      p { margin: 0 0 12px; }

      ul, ol {
        margin: 0 0 12px;
        padding-left: 24px;
      }

      li { margin-bottom: 4px; }

      strong { font-weight: 600; }

      code {
        background: var(--muted);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 13px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      }

      pre {
        background: var(--muted);
        padding: 16px;
        border-radius: 8px;
        overflow-x: auto;
        margin: 0 0 12px;
      }

      pre code {
        background: none;
        padding: 0;
      }

      blockquote {
        border-left: 3px solid var(--border);
        margin: 0 0 12px;
        padding: 4px 16px;
        color: var(--muted-foreground);
      }

      table {
        border-collapse: collapse;
        width: 100%;
        margin: 0 0 12px;
      }

      th, td {
        border: 1px solid var(--border);
        padding: 8px 12px;
        text-align: left;
      }

      th {
        background: var(--muted);
        font-weight: 600;
      }

      hr {
        border: none;
        border-top: 1px solid var(--border);
        margin: 24px 0;
      }

      & > *:first-child { margin-top: 0; }
      & > *:last-child { margin-bottom: 0; }
    }

    .prd-editor {
      padding: 16px;
    }

    .prd-textarea {
      width: 100%;
      min-height: 400px;
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--background);
      color: var(--foreground);
      font-size: 13px;
      line-height: 1.6;
      font-family: inherit;
      resize: vertical;
      box-sizing: border-box;
    }

    .prd-textarea:focus {
      outline: none;
      border-color: var(--ring);
      box-shadow: 0 0 0 2px var(--ring);
    }

    .prd-edit-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      padding-top: 12px;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      text-align: center;
      gap: 16px;
    }

    .empty-icon {
      color: var(--muted-foreground);
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: 18px;
      font-weight: 600;
      color: var(--foreground);
      margin: 0;
    }

    .empty-state p {
      font-size: 14px;
      color: var(--muted-foreground);
      max-width: 400px;
      margin: 0;
      line-height: 1.5;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: var(--muted-foreground);
    }

    .source-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      vertical-align: middle;
      margin-left: 8px;
      letter-spacing: 0.02em;
    }

    .source-claude {
      background: rgba(139, 92, 246, 0.15);
      color: #8b5cf6;
      border: 1px solid rgba(139, 92, 246, 0.3);
    }

    .source-gemini {
      background: rgba(66, 133, 244, 0.12);
      color: #4285f4;
      border: 1px solid rgba(66, 133, 244, 0.3);
    }

    .btn-gemini {
      border-color: #4285f4;
      color: #4285f4;
    }

    .btn-gemini:hover:not(:disabled) {
      background: rgba(66, 133, 244, 0.08);
    }

    .btn-gemini:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .gemini-progress {
      margin-top: 16px;
      padding: 16px;
      background: var(--muted);
      border-radius: 8px;
    }

    .gemini-progress-bar {
      width: 100%;
      height: 6px;
      background: var(--border);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .gemini-progress-fill {
      height: 100%;
      background: #4285f4;
      border-radius: 3px;
      transition: width 0.6s ease;
    }

    .gemini-progress-message {
      font-size: 13px;
      color: var(--muted-foreground);
      margin: 0;
    }
  `,
    ],
})
export class PlanningAnalysisComponent implements OnInit, HasUnsavedChanges {
    prdContent = signal<string | null>(null);
    prdDraft = signal<string>('');
    savingPrd = signal(false);
    editing = signal(false);
    editingAiResult = signal(false);
    loading = signal(true);
    uploadedFiles = signal<ProjectFile[]>([]);
    uploading = signal(false);
    analyzing = signal(false);
    aiResult = signal<string | null>(null);
    geminiAnalyzing = signal(false);
    geminiProgress = signal(0);
    geminiProgressMessage = signal('Initializing...');
    aiResultSource = signal<'claude' | 'gemini' | null>(null);

    fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
    resultContent = viewChild<ElementRef<HTMLDivElement>>('resultContent');

    private projectId = '';
    private projectName = '';
    private destroyRef = inject(DestroyRef);
    private streamSubscription: Subscription | null = null;

    constructor(
        private route: ActivatedRoute,
        private projectService: ProjectService,
        private fileService: FileService,
        private snackBar: MatSnackBar,
    ) {
        this.destroyRef.onDestroy(() => {
            this.streamSubscription?.unsubscribe();
        });
    }

    ngOnInit(): void {
        this.route.parent!.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
            const projectId = params.get('id') || '';
            if (projectId && projectId !== this.projectId) {
                this.projectId = projectId;
                this.resetState();
                this.loadProject();
                this.loadFiles();
            }
        });
    }

    hasUnsavedChanges(): boolean {
        return !!this.aiResult() || this.editing();
    }

    private resetState(): void {
        this.streamSubscription?.unsubscribe();
        this.streamSubscription = null;
        this.prdContent.set(null);
        this.prdDraft.set('');
        this.savingPrd.set(false);
        this.editing.set(false);
        this.editingAiResult.set(false);
        this.loading.set(true);
        this.uploadedFiles.set([]);
        this.uploading.set(false);
        this.analyzing.set(false);
        this.aiResult.set(null);
        this.geminiAnalyzing.set(false);
        this.geminiProgress.set(0);
        this.geminiProgressMessage.set('Initializing...');
        this.aiResultSource.set(null);
    }

    private loadProject(): void {
        this.projectService.getById(this.projectId).subscribe({
            next: project => {
                this.projectName = project.name;
                this.prdContent.set(project.prdContent);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.snackBar.open('Failed to load project', 'Close', { duration: 3000 });
            },
        });
    }

    private loadFiles(): void {
        this.fileService.getByProject(this.projectId).subscribe({
            next: files => this.uploadedFiles.set(files),
            error: () => {},
        });
    }

    onFilesSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files?.length) return;

        const files = Array.from(input.files).slice(0, 3);
        this.uploading.set(true);

        this.fileService.upload(this.projectId, files).subscribe({
            next: uploaded => {
                this.uploadedFiles.set([...uploaded, ...this.uploadedFiles()]);
                this.uploading.set(false);
                this.snackBar.open(`${uploaded.length} file(s) uploaded`, 'Close', { duration: 2000 });
            },
            error: () => {
                this.uploading.set(false);
                this.snackBar.open('Failed to upload files', 'Close', { duration: 3000 });
            },
        });

        input.value = '';
    }

    deleteFile(file: ProjectFile): void {
        this.fileService.delete(this.projectId, file.id).subscribe({
            next: () => {
                this.uploadedFiles.set(this.uploadedFiles().filter(f => f.id !== file.id));
                this.snackBar.open('File removed', 'Close', { duration: 2000 });
            },
            error: () => {
                this.snackBar.open('Failed to remove file', 'Close', { duration: 3000 });
            },
        });
    }

    triggerAnalysis(): void {
        this.streamSubscription?.unsubscribe();
        this.analyzing.set(true);
        this.aiResult.set(null);
        this.aiResultSource.set('claude');
        this.prdDraft.set('');
        this.editing.set(false);
        this.editingAiResult.set(false);

        this.streamSubscription = this.fileService.analyzeStream(this.projectId).subscribe({
            next: chunk => {
                const current = this.aiResult() ?? '';
                this.aiResult.set(current + chunk);
                this.autoScrollResult();
            },
            error: () => {
                this.analyzing.set(false);
                if (this.aiResult()) {
                    this.snackBar.open('Stream interrupted — partial result shown', 'Close', {
                        duration: 4000,
                    });
                } else {
                    this.snackBar.open('AI analysis failed. Please try again.', 'Close', {
                        duration: 3000,
                    });
                }
            },
            complete: () => {
                this.analyzing.set(false);
            },
        });
    }

    stopAnalysis(): void {
        this.streamSubscription?.unsubscribe();
        this.streamSubscription = null;
        this.analyzing.set(false);
        if (this.aiResult()) {
            this.snackBar.open('Analysis stopped — partial result shown', 'Close', { duration: 3000 });
        }
    }

    triggerGeminiAnalysis(): void {
        // Clear previous result and source first so the UI resets visibly
        this.aiResult.set(null);
        this.aiResultSource.set(null);
        this.editing.set(false);
        this.editingAiResult.set(false);

        this.geminiAnalyzing.set(true);
        this.geminiProgress.set(0);
        this.geminiProgressMessage.set('Sending documents to Gemini...');

        const steps = [
            { pct: 15, msg: 'Analyzing uploaded documents...' },
            { pct: 35, msg: 'Identifying key requirements...' },
            { pct: 55, msg: 'Structuring PRD sections...' },
            { pct: 75, msg: 'Generating functional requirements...' },
            { pct: 85, msg: 'Finalizing document...' },
        ];
        let stepIdx = 0;
        const interval = setInterval(() => {
            if (!this.geminiAnalyzing()) { clearInterval(interval); return; }
            if (stepIdx < steps.length) {
                this.geminiProgress.set(steps[stepIdx].pct);
                this.geminiProgressMessage.set(steps[stepIdx].msg);
                stepIdx++;
            }
        }, 3000);

        this.fileService.analyzeWithGemini(this.projectId).subscribe({
            next: response => {
                clearInterval(interval);
                this.geminiProgress.set(100);
                this.geminiProgressMessage.set('Complete!');
                this.geminiAnalyzing.set(false);
                // Use queueMicrotask to guarantee the null → new-value transition
                // renders even when content is identical to a previous result
                queueMicrotask(() => {
                    this.aiResultSource.set('gemini');
                    this.aiResult.set(response.content);
                });
            },
            error: () => {
                clearInterval(interval);
                this.geminiAnalyzing.set(false);
                this.geminiProgress.set(0);
                this.snackBar.open('Gemini generation failed. Check backend logs.', 'Close', { duration: 4000 });
            },
        });
    }

    saveAiResultAsPrd(): void {
        const content = this.aiResult();
        if (!content) return;

        this.savingPrd.set(true);
        this.projectService.savePrd(this.projectId, content).subscribe({
            next: project => {
                this.prdContent.set(project.prdContent);
                this.aiResult.set(null);
                this.editingAiResult.set(false);
                this.savingPrd.set(false);
                this.snackBar.open('PRD saved successfully', 'Close', { duration: 3000 });
            },
            error: () => {
                this.savingPrd.set(false);
                this.snackBar.open('Failed to save PRD', 'Close', { duration: 3000 });
            },
        });
    }

    editAiResultBeforeSave(): void {
        this.editingAiResult.set(true);
    }

    dismissAiResult(): void {
        this.aiResult.set(null);
        this.editingAiResult.set(false);
        this.aiResultSource.set(null);
    }

    editPrd(): void {
        this.prdDraft.set(this.prdContent() || '');
        this.editing.set(true);
    }

    cancelEdit(): void {
        this.prdDraft.set('');
        this.editing.set(false);
    }

    savePrd(): void {
        this.savingPrd.set(true);
        this.projectService.savePrd(this.projectId, this.prdDraft()).subscribe({
            next: project => {
                this.prdContent.set(project.prdContent);
                this.editing.set(false);
                this.prdDraft.set('');
                this.savingPrd.set(false);
                this.snackBar.open('PRD updated successfully', 'Close', { duration: 3000 });
            },
            error: () => {
                this.savingPrd.set(false);
                this.snackBar.open('Failed to save PRD', 'Close', { duration: 3000 });
            },
        });
    }

    downloadMarkdown(): void {
        const content = this.prdContent();
        if (!content) return;
        this.triggerDownload(content, this.projectName);
    }

    downloadAiResult(): void {
        const content = this.aiResult();
        if (!content) return;
        this.triggerDownload(content, this.projectName);
    }

    private triggerDownload(content: string, projectName: string): void {
        const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const filename = `${slug}-prd.md`;
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    printPrd(): void {
        const content = this.prdContent();
        if (!content) return;
        const html = marked.parse(content) as string;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`<!DOCTYPE html>
<html><head>
<title>${this.projectName} — PRD</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; font-size: 14px; line-height: 1.7; }
  h1 { font-size: 24px; border-bottom: 2px solid #e5e5e5; padding-bottom: 8px; }
  h2 { font-size: 20px; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; margin-top: 32px; }
  h3 { font-size: 16px; margin-top: 24px; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #d0d0d0; padding: 8px 12px; text-align: left; }
  th { background: #f5f5f5; font-weight: 600; }
  code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
  pre { background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  blockquote { border-left: 3px solid #d0d0d0; margin: 12px 0; padding: 4px 16px; color: #666; }
  hr { border: none; border-top: 1px solid #e5e5e5; margin: 24px 0; }
  @media print { body { margin: 0; } }
</style>
</head><body>${html}</body></html>`);
        printWindow.document.close();
        printWindow.onload = () => {
            printWindow.print();
        };
    }

    getDownloadUrl(file: ProjectFile): string {
        return this.fileService.getDownloadUrl(this.projectId, file.id);
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    private autoScrollResult(): void {
        queueMicrotask(() => {
            const el = this.resultContent()?.nativeElement;
            if (el) {
                el.scrollTop = el.scrollHeight;
            }
        });
    }
}
