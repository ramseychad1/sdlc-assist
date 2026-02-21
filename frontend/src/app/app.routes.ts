import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { unsavedChangesGuard } from './core/guards/unsaved-changes.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
    },
    {
        path: 'admin/users',
        canActivate: [authGuard],
        loadComponent: () => import('./features/admin/user-management.component').then(m => m.UserManagement)
    },
    {
        path: 'projects/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./features/project/project-layout.component').then(m => m.ProjectLayoutComponent),
        children: [
            {
                path: 'planning',
                loadComponent: () => import('./features/project/planning-analysis/planning-analysis.component').then(m => m.PlanningAnalysisComponent),
                canDeactivate: [unsavedChangesGuard]
            },
            {
                path: 'ux-design',
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        loadComponent: () => import('./features/project/design-phase/ux-design/ux-design-redirect.component').then(m => m.UxDesignRedirectComponent)
                    },
                    {
                        path: 'template-selection',
                        loadComponent: () => import('./features/project/design-phase/ux-design/ux-design.component').then(m => m.UxDesignComponent)
                    },
                    {
                        path: 'design-system',
                        loadComponent: () => import('./features/project/design-phase/design-system-generation/design-system-generation.component').then(m => m.DesignSystemGenerationComponent)
                    },
                    {
                        path: 'prototypes',
                        loadComponent: () => import('./features/project/design-phase/prototype-generation/prototype-generation.component').then(m => m.PrototypeGenerationComponent)
                    }
                ]
            },
            {
                path: 'technical-design',
                loadComponent: () => import('./features/project/design-phase/technical-design/technical-design.component').then(m => m.TechnicalDesignComponent),
                children: [
                    {
                        path: '',
                        pathMatch: 'full',
                        redirectTo: 'tech-preferences'
                    },
                    {
                        path: 'tech-preferences',
                        loadComponent: () => import('./features/project/design-phase/technical-design/steps/tech-preferences/tech-preferences.component').then(m => m.TechPreferencesComponent)
                    },
                    {
                        path: 'architecture',
                        loadComponent: () => import('./features/project/design-phase/technical-design/steps/architecture-overview/architecture-overview.component').then(m => m.ArchitectureOverviewComponent)
                    },
                    {
                        path: 'data-model',
                        loadComponent: () => import('./features/project/design-phase/technical-design/steps/data-model/data-model.component').then(m => m.DataModelComponent)
                    },
                    {
                        path: 'api-contract',
                        loadComponent: () => import('./features/project/design-phase/technical-design/steps/api-contract/api-contract.component').then(m => m.ApiContractComponent)
                    },
                    {
                        path: 'sequence-diagrams',
                        loadComponent: () => import('./features/project/design-phase/technical-design/steps/sequence-diagrams/sequence-diagrams.component').then(m => m.SequenceDiagramsComponent)
                    }
                ]
            },
            {
                path: '',
                redirectTo: 'planning',
                pathMatch: 'full'
            }
        ]
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' }
];
