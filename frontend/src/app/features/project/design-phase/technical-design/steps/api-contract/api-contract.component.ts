import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MarkdownComponent } from 'ngx-markdown';
import { ProjectService } from '../../../../../../core/services/project.service';
import { Project } from '../../../../../../core/models/project.model';
import { TechDesignService } from '../../services/tech-design.service';

type PageState = 'ready' | 'generating' | 'result';

const ARTIFACT_STEP_STYLES = `
  .step-page { display: flex; flex-direction: column; gap: 20px; }
  .context-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .context-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; }
  .context-card-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px; color: var(--muted-foreground); margin-bottom: 8px; }
  .context-card-value { font-size: 13px; }
  .ctx-available { color: var(--foreground); }
  .ctx-missing { color: var(--muted-foreground); font-style: italic; }
  .guidelines-bar { display: flex; align-items: center; gap: 8px; padding: 8px 14px; background: var(--muted); border: 1px solid var(--border); border-radius: var(--radius); font-size: 12px; color: var(--muted-foreground); }
  .generate-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 48px 24px; display: flex; align-items: center; justify-content: center; }
  .generating-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 40px 32px; display: flex; flex-direction: column; gap: 16px; }
  .gen-header { display: flex; align-items: center; gap: 12px; font-size: 16px; font-weight: 600; color: var(--foreground); }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .progress-wrap { display: flex; align-items: center; gap: 12px; }
  .progress-bar { flex: 1; height: 8px; background: var(--muted); border-radius: 99px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--primary); border-radius: 99px; transition: width 0.4s ease; }
  .progress-pct { font-size: 13px; font-weight: 600; color: var(--primary); min-width: 36px; text-align: right; }
  .progress-message { font-size: 13px; color: var(--muted-foreground); font-style: italic; }
  .result-card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
  .result-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); }
  .result-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: var(--foreground); }
  .result-date { font-size: 12px; font-weight: 400; color: var(--muted-foreground); margin-left: 4px; }
  .artifact-content { padding: 24px; max-height: 60vh; overflow-y: auto; font-size: 14px; line-height: 1.7; color: var(--foreground); }
  .artifact-content ::ng-deep h1 { font-size: 20px; font-weight: 700; margin-bottom: 16px; }
  .artifact-content ::ng-deep h2 { font-size: 15px; font-weight: 600; margin: 20px 0 8px; }
  .artifact-content ::ng-deep h3 { font-size: 13px; font-weight: 600; margin: 14px 0 6px; }
  .artifact-content ::ng-deep p { margin-bottom: 12px; }
  .artifact-content ::ng-deep table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .artifact-content ::ng-deep th, .artifact-content ::ng-deep td { padding: 8px 12px; border: 1px solid var(--border); text-align: left; font-size: 13px; }
  .artifact-content ::ng-deep th { background: var(--muted); font-weight: 600; }
  .artifact-content ::ng-deep code { background: var(--muted); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; }
  .artifact-content ::ng-deep pre { background: var(--muted); padding: 16px; border-radius: var(--radius); overflow-x: auto; margin-bottom: 16px; }
  .artifact-content ::ng-deep pre code { background: none; padding: 0; }
  .artifact-content ::ng-deep ul, .artifact-content ::ng-deep ol { padding-left: 20px; margin-bottom: 12px; }
  .artifact-content ::ng-deep li { margin-bottom: 4px; }
  .artifact-content ::ng-deep .mermaid { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; overflow-x: auto; margin-bottom: 16px; }
  .action-bar { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); }
  .action-bar-left { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--muted-foreground); }
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 0 16px; height: 36px; border-radius: var(--radius); font-size: 13px; font-weight: 500; cursor: pointer; border: 1px solid var(--border); background: transparent; color: var(--muted-foreground); transition: background 0.15s, color 0.15s; font-family: var(--font-family); white-space: nowrap; }
  .btn:hover { background: var(--muted); color: var(--foreground); }
  .btn.btn-sm { height: 30px; padding: 0 10px; font-size: 12px; }
  .btn.btn-lg { height: 44px; padding: 0 24px; font-size: 14px; }
  .btn.btn-primary { background: var(--primary); color: var(--primary-foreground); border-color: var(--primary); }
  .btn.btn-primary:hover:not(:disabled) { opacity: 0.88; }
  .btn.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn.btn-ghost { border-color: transparent; }
`;

@Component({
  selector: 'app-api-contract',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, MarkdownComponent],
  template: `
    <div class="step-page">
      @if (pageState() === 'ready') {
        <div class="context-row">
          <div class="context-card">
            <div class="context-card-label">
              <lucide-icon name="cpu" [size]="14"></lucide-icon>
              Architecture Overview
            </div>
            <div class="context-card-value">
              @if (project()?.archOverviewContent) {
                <span class="ctx-available">Architecture Overview generated</span>
              } @else {
                <span class="ctx-missing">Generate Architecture first</span>
              }
            </div>
          </div>
          <div class="context-card">
            <div class="context-card-label">
              <lucide-icon name="database" [size]="14"></lucide-icon>
              Data Model
            </div>
            <div class="context-card-value">
              @if (project()?.dataModelContent) {
                <span class="ctx-available">Data Model generated</span>
              } @else {
                <span class="ctx-missing">Generate Data Model first</span>
              }
            </div>
          </div>
        </div>

        <div class="guidelines-bar">
          <lucide-icon name="book-open" [size]="14"></lucide-icon>
          Guidelines: Global Generic{{ project()?.corporateGuidelinesFilename ? ' + ' + project()!.corporateGuidelinesFilename : ' only' }}
        </div>

        <div class="generate-card">
          <button class="btn btn-primary btn-lg" [disabled]="!canGenerate()" (click)="startGeneration()">
            <lucide-icon name="code-2" [size]="16"></lucide-icon>
            Generate API Contract
          </button>
        </div>
      }

      @if (pageState() === 'generating') {
        <div class="generating-card">
          <div class="gen-header">
            <lucide-icon name="loader" [size]="20" class="spin"></lucide-icon>
            <span>Generating API Contract...</span>
          </div>
          <div class="progress-wrap">
            <div class="progress-bar"><div class="progress-fill" [style.width.%]="progress()"></div></div>
            <span class="progress-pct">{{ progress() }}%</span>
          </div>
          <div class="progress-message">{{ progressMessage() }}</div>
        </div>
      }

      @if (pageState() === 'result') {
        <div class="result-card">
          <div class="result-header">
            <div class="result-title">
              <lucide-icon name="code-2" [size]="16"></lucide-icon>
              API Contract
              <span class="result-date">Generated {{ project()?.apiContractGeneratedAt | date:'MMM d, yyyy' }}</span>
            </div>
            <button class="btn btn-ghost btn-sm" (click)="regenerate()">
              <lucide-icon name="refresh-ccw" [size]="14"></lucide-icon>
              Regenerate
            </button>
          </div>
          <div class="artifact-content">
            <markdown [data]="project()!.apiContractContent!"></markdown>
          </div>
        </div>

        <div class="action-bar">
          <div class="action-bar-left">
            <lucide-icon name="check-circle" [size]="16"></lucide-icon>
            <span>API Contract generated</span>
          </div>
          <button class="btn btn-primary" (click)="continueToSequenceDiagrams()">
            Generate Sequence Diagrams
            <lucide-icon name="arrow-right" [size]="14"></lucide-icon>
          </button>
        </div>
      }
    </div>
  `,
  styles: [ARTIFACT_STEP_STYLES]
})
export class ApiContractComponent implements OnInit {
  project = signal<Project | null>(null);
  pageState = signal<PageState>('ready');
  progress = signal(0);
  progressMessage = signal('');

  canGenerate = computed(() => !!this.project()?.dataModelContent);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);
  private techDesignService = inject(TechDesignService);

  private get projectId(): string | null {
    return this.route.parent?.parent?.snapshot.paramMap.get('id') ?? null;
  }

  ngOnInit(): void {
    const id = this.projectId;
    if (id) {
      this.projectService.getById(id).subscribe(proj => {
        this.project.set(proj);
        if (proj.apiContractContent) this.pageState.set('result');
      });
    }
  }

  startGeneration(): void {
    const id = this.projectId;
    if (!id) return;
    this.pageState.set('generating');
    this.progress.set(0);
    this.techDesignService.generateArtifact(id, 'api-contract').subscribe({
      next: event => {
        this.progress.set(event.progress);
        this.progressMessage.set(event.message);
        if (event.event === 'COMPLETE') {
          this.projectService.getById(id).subscribe(proj => {
            this.project.set(proj);
            this.pageState.set('result');
            this.projectService.notifyProjectChanged(id);
          });
        }
      },
      error: () => this.pageState.set('ready'),
    });
  }

  regenerate(): void {
    const id = this.projectId;
    if (!id) return;
    this.projectService.clearArtifact(id, 'api-contract').subscribe(proj => {
      this.project.set(proj);
      this.pageState.set('ready');
      this.projectService.notifyProjectChanged(id);
    });
  }

  continueToSequenceDiagrams(): void {
    const id = this.projectId;
    if (id) this.router.navigate(['/projects', id, 'technical-design', 'sequence-diagrams']);
  }
}
