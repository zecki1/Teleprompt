import { TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.guard';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { signal } from '@angular/core';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: signal(false)
          }
        },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
  });

  it('should allow access when authenticated', () => {
    const authService = TestBed.inject(AuthService);
    authService.isAuthenticated.set(true);
    const mockRoute = { data: {} } as any;
    const mockState = { url: '/dashboard' } as any;

    expect(guard.canActivate(mockRoute, mockState)).toBeTrue();
  });

  it('should deny access and redirect when not authenticated', () => {
    const authService = TestBed.inject(AuthService);
    authService.isAuthenticated.set(false);
    const mockRoute = { data: {} } as any;
    const mockState = { url: '/dashboard' } as any;

    expect(guard.canActivate(mockRoute, mockState)).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/auth/login'],
      { queryParams: { returnUrl: '/dashboard' } }
    );
  });
});
