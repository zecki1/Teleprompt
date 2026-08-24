import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class PermissionGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const requiredPermission = route.data['permission'] as keyof User;

    if (!requiredPermission) {
      return true;
    }

    if (this.authService.hasPermission(requiredPermission)) {
      return true;
    }

    this.router.navigate(['/dashboard']);
    return false;
  }
}
