import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/layout/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard-page').then(
            (m) => m.DashboardPage,
          ),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/projects-page').then(
            (m) => m.ProjectsPage,
          ),
      },
      {
        path: 'editor/:id',
        loadComponent: () =>
          import('./features/editor/editor-page').then((m) => m.EditorPage),
      },
      {
        path: 'activities',
        loadComponent: () =>
          import('./features/activities/activities-page').then(
            (m) => m.ActivitiesPage,
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile-page').then((m) => m.ProfilePage),
      },
    ],
  },
  {
    // Teleprompter em tela cheia (fora do shell)
    path: 'tp/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tp/tp-page').then((m) => m.TpPage),
  },
  { path: '**', redirectTo: '' },
];
