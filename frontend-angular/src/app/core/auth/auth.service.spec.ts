import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { environment } from '@env/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: routerSpy },
        { provide: Store, useValue: { dispatch: jasmine.createSpy('dispatch') } }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with no user', () => {
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('should login successfully', () => {
    const mockResponse = {
      token: 'test-token',
      user: {
        id: '1',
        email: 'test@test.com',
        displayName: 'Test User',
        role: 11,
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
        status: 0,
        workspaceId: null,
        avatarUrl: null
      }
    };

    service.login({ email: 'test@test.com', password: 'password' }).subscribe(response => {
      expect(response.token).toBe('test-token');
      expect(service.isAuthenticated()).toBeTrue();
      expect(service.user()?.email).toBe('test@test.com');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should logout and clear storage', () => {
    localStorage.setItem(environment.jwt.tokenKey, 'test-token');
    localStorage.setItem('teleprompt_user', JSON.stringify({ id: '1', email: 'test@test.com' }));

    service.logout();

    expect(localStorage.getItem(environment.jwt.tokenKey)).toBeNull();
    expect(service.user()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should check permissions correctly', () => {
    const mockUser = {
      id: '1',
      email: 'test@test.com',
      isSuperAdmin: true,
      canManagePermissions: false,
      canCollaborate: true,
      isEditor: false,
      isRevisor: false,
      canRevert: false,
      canViewAdmin: false,
      canViewReports: false,
      canViewActivityHistory: false,
      canViewDebugLogs: false,
      canAssign: false,
      requiresChecklist: true,
      status: 0,
      role: 0,
      workspaceId: null,
      avatarUrl: null,
      displayName: 'Test'
    };

    localStorage.setItem(environment.jwt.tokenKey, 'test-token');
    localStorage.setItem('teleprompt_user', JSON.stringify(mockUser));

    service.loadFromStorage();

    expect(service.hasPermission('isSuperAdmin')).toBeTrue();
    expect(service.hasPermission('canManagePermissions')).toBeFalse();
    expect(service.hasPermission('canCollaborate')).toBeTrue();
  });

  it('should return false for permissions when no user', () => {
    expect(service.hasPermission('isSuperAdmin')).toBeFalse();
  });
});
