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
                path: '',
                redirectTo: 'planning',
                pathMatch: 'full'
            }
        ]
    },
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: '**', redirectTo: '/login' }
];
