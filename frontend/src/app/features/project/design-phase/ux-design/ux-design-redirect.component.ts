import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ProjectService } from '../../../../core/services/project.service';

/**
 * Smart redirect for the ux-design root path.
 * Navigates to the furthest sub-step the user has unlocked:
 *   no template selected   → template-selection (step 1)
 *   template, no DS        → design-system      (step 2)
 *   design system exists   → prototypes          (step 3)
 */
@Component({
  selector: 'app-ux-design-redirect',
  standalone: true,
  template: '',
})
export class UxDesignRedirectComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private projectService = inject(ProjectService);

  ngOnInit(): void {
    // Route depth: '' -> ux-design -> projects/:id
    const projectId = this.route.parent?.parent?.snapshot.paramMap.get('id');
    if (!projectId) {
      this.navigate('template-selection', projectId);
      return;
    }

    forkJoin({
      project: this.projectService.getById(projectId),
      screens: this.projectService.getScreens(projectId).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ project }) => {
        let target = 'template-selection';
        if (project.selectedTemplateId) target = 'design-system';
        if (project.designSystemContent) target = 'prototypes';
        this.navigate(target, projectId);
      },
      error: () => this.navigate('template-selection', projectId),
    });
  }

  private navigate(sub: string, projectId: string | null | undefined): void {
    if (projectId) {
      this.router.navigate(['/projects', projectId, 'ux-design', sub], { replaceUrl: true });
    } else {
      this.router.navigate(['template-selection'], { relativeTo: this.route, replaceUrl: true });
    }
  }
}
