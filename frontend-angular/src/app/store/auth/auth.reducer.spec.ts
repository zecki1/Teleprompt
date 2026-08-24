import { authReducer, AuthState } from './auth.reducer';
import * as AuthActions from './auth.actions';
import { User, Role, UserStatus } from '@core/models/user.model';

describe('AuthReducer', () => {
  const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
    loading: false,
    error: null
  };

  it('should return the initial state', () => {
    const result = authReducer(undefined, { type: 'UNKNOWN' });
    expect(result).toEqual(initialState);
  });

  it('should set loading on login', () => {
    const result = authReducer(initialState, AuthActions.login({
      request: { email: 'test@test.com', password: 'pass' }
    }));
    expect(result.loading).toBeTrue();
    expect(result.error).toBeNull();
  });

  it('should set user and token on loginSuccess', () => {
    const response = {
      token: 'test-token',
      user: { id: '1', email: 'test@test.com' } as any
    };
    const result = authReducer(initialState, AuthActions.loginSuccess({ response }));
    expect(result.user).toEqual(response.user);
    expect(result.token).toBe('test-token');
    expect(result.isAuthenticated).toBeTrue();
    expect(result.loading).toBeFalse();
  });

  it('should set error on loginFailure', () => {
    const result = authReducer(initialState, AuthActions.loginFailure({ error: 'Invalid credentials' }));
    expect(result.error).toBe('Invalid credentials');
    expect(result.loading).toBeFalse();
  });

  it('should clear state on logout', () => {
    const loggedInState: AuthState = {
      user: { id: '1', email: 'test@test.com' } as any,
      token: 'test-token',
      isAuthenticated: true,
      loading: false,
      error: null
    };
    const result = authReducer(loggedInState, AuthActions.logout());
    expect(result).toEqual(initialState);
  });

  it('should set user on loadUserSuccess', () => {
    const user = { id: '1', email: 'test@test.com' } as any;
    const result = authReducer(initialState, AuthActions.loadUserSuccess({ user }));
    expect(result.user).toEqual(user);
    expect(result.isAuthenticated).toBeTrue();
  });

  it('should clear user on loadUserFailure', () => {
    const result = authReducer(initialState, AuthActions.loadUserFailure({ error: 'Session expired' }));
    expect(result.user).toBeNull();
    expect(result.isAuthenticated).toBeFalse();
  });

  it('should update token on refreshTokenSuccess', () => {
    const response = {
      token: 'new-token',
      user: { id: '1', email: 'test@test.com' } as any
    };
    const result = authReducer(initialState, AuthActions.refreshTokenSuccess({ response }));
    expect(result.token).toBe('new-token');
    expect(result.isAuthenticated).toBeTrue();
  });

  it('should clear state on refreshTokenFailure', () => {
    const loggedInState: AuthState = {
      user: { id: '1', email: 'test@test.com' } as any,
      token: 'test-token',
      isAuthenticated: true,
      loading: false,
      error: null
    };
    const result = authReducer(loggedInState, AuthActions.refreshTokenFailure());
    expect(result).toEqual(initialState);
  });
});
