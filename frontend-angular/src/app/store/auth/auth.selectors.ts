import { createSelector } from '@ngrx/store';
import { authFeature } from './auth.reducer';

export const selectAuthState = authFeature.selectAuthState;
export const selectUser = authFeature.selectUser;
export const selectToken = authFeature.selectToken;
export const selectIsAuthenticated = authFeature.selectIsAuthenticated;
export const selectLoading = authFeature.selectLoading;
export const selectError = authFeature.selectError;

export const selectDisplayName = createSelector(
  authFeature.selectUser,
  user => user?.displayName || user?.email || 'Usuário'
);

export const selectIsSuperAdmin = createSelector(
  authFeature.selectUser,
  user => user?.isSuperAdmin || false
);

export const selectCanManagePermissions = createSelector(
  authFeature.selectUser,
  user => user?.canManagePermissions || false
);

export const selectCanViewAdmin = createSelector(
  authFeature.selectUser,
  user => user?.canViewAdmin || false
);

export const selectCanViewReports = createSelector(
  authFeature.selectUser,
  user => user?.canViewReports || false
);

export const selectCanViewActivityHistory = createSelector(
  authFeature.selectUser,
  user => user?.canViewActivityHistory || false
);

export const selectCanEdit = createSelector(
  authFeature.selectUser,
  user => user?.isEditor || user?.isSuperAdmin || false
);

export const selectCanRevert = createSelector(
  authFeature.selectUser,
  user => user?.canRevert || user?.isSuperAdmin || false
);
