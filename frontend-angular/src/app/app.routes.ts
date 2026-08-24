import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { PermissionGuard } from './core/guards/permission.guard';
import { RoleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'projects',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/projects/list/project-list.component').then(m => m.ProjectListComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/projects/detail/project-detail.component').then(m => m.ProjectDetailComponent)
      }
    ]
  },
  {
    path: 'scripts',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/scripts/list/script-list.component').then(m => m.ScriptListComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/scripts/editor/script-editor.component').then(m => m.ScriptEditorComponent)
      }
    ]
  },
  {
    path: 'tp/:id',
    loadComponent: () => import('./features/teleprompter/player/teleprompter-player.component').then(m => m.TeleprompterPlayerComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    children: [
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/user-management.component').then(m => m.UserManagementComponent),
        canActivate: [PermissionGuard],
        data: { permission: 'canManagePermissions' }
      },
      {
        path: 'debug-logs',
        loadComponent: () => import('./features/admin/debug-logs/debug-logs.component').then(m => m.DebugLogsComponent),
        canActivate: [PermissionGuard],
        data: { permission: 'canViewDebugLogs' }
      }
    ]
  },
  {
    path: 'teams',
    loadComponent: () => import('./features/teams/team-list.component').then(m => m.TeamListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'workspaces',
    loadComponent: () => import('./features/workspaces/workspace-list.component').then(m => m.WorkspaceListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'reports',
    loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent),
    canActivate: [AuthGuard, PermissionGuard],
    data: { permission: 'canViewReports' }
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
