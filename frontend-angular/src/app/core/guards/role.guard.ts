import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { Role } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    const user = this.authService.user();

    if (!user) {
      this.router.navigate(['/auth/login']);
      return false;
    }

    if (user.isSuperAdmin) {
      return true;
    }

    const adminRoles: Role[] = [
      Role.SuperAdmin,
      Role.Diretor,
      Role.Coordenador
    ];

    if (adminRoles.includes(user.role)) {
      return true;
    }

    this.router.navigate(['/dashboard']);
    return false;
  }
}
