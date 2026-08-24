import { TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { AuthEffects } from './auth.effects';
import { AuthService } from '@core/auth/auth.service';
import { ObservabilityService } from '@core/services/observability.service';
import { Router } from '@angular/router';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import * as AuthActions from './auth.actions';
import { User, Role, UserStatus, AuthResponse } from '@core/models/user.model';

describe('AuthEffects', () => {
  let effects: AuthEffects;
  let actions$: Observable<any>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let observabilitySpy: jasmine.SpyObj<ObservabilityService>;

  const mockUser: User = {
    id: '1',
    email: 'test@test.com',
    displayName: 'Test User',
    role: Role.Estagiario,
    isSuperAdmin: false,
    canManagePermissions: false,
    canCollaborate: true,
    isEditor: true,
    isRevisor: false,
    canRevert: false,
    canViewAdmin: false,
    canViewReports: false,
    canViewActivityHistory: false,
    canViewDebugLogs: false,
    canAssign: false,
    requiresChecklist: true,
    status: UserStatus.Active,
    workspaceId: null,
    avatarUrl: null
  };

  const mockResponse: AuthResponse = {
    token: 'test-token',
    user: mockUser
  };

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'register', 'logout', 'getMe', 'refreshToken']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    observabilitySpy = jasmine.createSpyObj('ObservabilityService', ['trackUserAction', 'trackError']);

    TestBed.configureTestingModule({
      providers: [
        AuthEffects,
        provideMockActions(() => actions$),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ObservabilityService, useValue: observabilitySpy }
      ]
    });

    effects = TestBed.inject(AuthEffects);
  });

  describe('login$', () => {
    it('should dispatch loginSuccess on successful login', (done) => {
      authServiceSpy.login.and.returnValue(of(mockResponse));

      actions$ = of(AuthActions.login({ request: { email: 'test@test.com', password: 'pass' } }));

      effects.login$.subscribe(action => {
        expect(action.type).toBe('[Auth] Login Success');
        expect((action as any).response.token).toBe('test-token');
        done();
      });
    });

    it('should dispatch loginFailure on error', (done) => {
      const error = { error: { message: 'Invalid credentials' } };
      authServiceSpy.login.and.returnValue(throwError(() => error));

      actions$ = of(AuthActions.login({ request: { email: 'test@test.com', password: 'wrong' } }));

      effects.login$.subscribe(action => {
        expect(action.type).toBe('[Auth] Login Failure');
        expect((action as any).error).toBe('Invalid credentials');
        done();
      });
    });
  });

  describe('logout$', () => {
    it('should call authService.logout', (done) => {
      actions$ = of(AuthActions.logout());

      effects.logout$.subscribe(() => {
        expect(authServiceSpy.logout).toHaveBeenCalled();
        done();
      });
    });
  });
});
