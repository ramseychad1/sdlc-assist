import { Component, DestroyRef, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LucideAngularModule } from 'lucide-angular';
import { Subscription } from 'rxjs';
import { SectionService } from '../../../core/services/section.service';
import { RequirementSection } from '../../../core/models/section.model';
import { FileService } from '../../../core/services/file.service';
import { ProjectFile } from '../../../core/models/file.model';
import { HasUnsavedChanges } from '../../../core/guards/unsaved-changes.guard';

@Component({
    selector: 'app-planning-analysis',
    standalone: true,
    imports: [CommonModule, FormsModule, MatSnackBarModule, LucideAngularModule],
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
                    [disabled]="uploadedFiles().length === 0">
              <lucide-icon name="sparkles" [size]="16"></lucide-icon>
              Analyze with AI
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
              <button class="btn-icon" (click)="deleteFile(file)" title="Remove file">
                <lucide-icon name="x" [size]="14"></lucide-icon>
              </button>
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
                AI Generating...
              </h4>
              <div class="ai-result-actions">
                <button class="btn btn-destructive btn-sm" (click)="stopAnalysis()">
                  <lucide-icon name="square" [size]="14"></lucide-icon>
                  Stop
                </button>
              </div>
            } @else {
              <h4>AI Suggestions</h4>
              <div class="ai-result-actions">
                <button class="btn btn-primary btn-sm" (click)="acceptAiResult()">
                  <lucide-icon name="check" [size]="14"></lucide-icon>
                  Accept & Save
                </button>
                <button class="btn btn-outline btn-sm" (click)="triggerAnalysis()">
                  <lucide-icon name="refresh-cw" [size]="14"></lucide-icon>
                  Regenerate
                </button>
                <button class="btn btn-ghost btn-sm" (click)="rejectAiResult()">
                  <lucide-icon name="x" [size]="14"></lucide-icon>
                  Dismiss
                </button>
              </div>
            }
          </div>
          <div class="ai-result-content" #resultContent>
            <pre>{{ aiResult() }}</pre>
          </div>
        </div>
      }
    </div>

    <!-- Sections -->
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
  `,
    ],
})
export class PlanningAnalysisComponent implements OnInit, HasUnsavedChanges {
    sections = signal<RequirementSection[]>([]);
    loading = signal(true);
    savingId = signal<string | null>(null);
    uploadedFiles = signal<ProjectFile[]>([]);
    uploading = signal(false);
    analyzing = signal(false);
    aiResult = signal<string | null>(null);

    fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
    resultContent = viewChild<ElementRef<HTMLDivElement>>('resultContent');

    private projectId = '';
    private originalContent = new Map<string, string>();
    private destroyRef = inject(DestroyRef);
    private streamSubscription: Subscription | null = null;

    constructor(
        private route: ActivatedRoute,
        private sectionService: SectionService,
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
                this.loadSections();
                this.loadFiles();
            }
        });
    }

    hasUnsavedChanges(): boolean {
        return this.sections().some(s => {
            const original = this.originalContent.get(s.id);
            return original !== undefined && s.content !== original;
        });
    }

    private resetState(): void {
        this.streamSubscription?.unsubscribe();
        this.streamSubscription = null;
        this.sections.set([]);
        this.loading.set(true);
        this.uploadedFiles.set([]);
        this.uploading.set(false);
        this.analyzing.set(false);
        this.aiResult.set(null);
        this.savingId.set(null);
        this.originalContent.clear();
    }

    private loadSections(): void {
        this.sectionService.getByProject(this.projectId).subscribe({
            next: sections => {
                this.sections.set(sections);
                this.originalContent.clear();
                sections.forEach(s => this.originalContent.set(s.id, s.content || ''));
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.snackBar.open('Failed to load sections', 'Close', { duration: 3000 });
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

    acceptAiResult(): void {
        const content = this.aiResult();
        if (!content) return;

        // Populate the first section (Project Description) with the AI output
        const current = this.sections();
        if (current.length > 0) {
            const first = current[0];
            first.content = content;
            this.saveSection(first);
            this.aiResult.set(null);
            this.snackBar.open('AI suggestions applied to Project Description', 'Close', { duration: 3000 });
        }
    }

    rejectAiResult(): void {
        this.aiResult.set(null);
    }

    saveSection(section: RequirementSection): void {
        this.savingId.set(section.id);
        this.sectionService.update(this.projectId, section.id, { content: section.content }).subscribe({
            next: updated => {
                const current = this.sections();
                this.sections.set(current.map(s => (s.id === updated.id ? updated : s)));
                this.originalContent.set(updated.id, updated.content || '');
                this.savingId.set(null);
                this.snackBar.open('Section saved', 'Close', { duration: 2000 });
            },
            error: () => {
                this.savingId.set(null);
                this.snackBar.open('Failed to save section', 'Close', { duration: 3000 });
            },
        });
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
