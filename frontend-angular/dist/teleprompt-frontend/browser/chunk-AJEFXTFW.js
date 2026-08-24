import {
  environment
} from "./chunk-DHSNSXHE.js";
import {
  Router
} from "./chunk-NJ75DOAS.js";
import {
  HttpClient
} from "./chunk-3SDTMM4U.js";
import {
  catchError,
  computed,
  signal,
  tap,
  throwError,
  ɵɵdefineInjectable,
  ɵɵinject
} from "./chunk-SBUHLZV6.js";

// src/app/core/auth/auth.service.ts
var AuthService = class _AuthService {
  constructor(http, router) {
    this.http = http;
    this.router = router;
    this.currentUser = signal(null);
    this.token = signal(null);
    this.isLoading = signal(false);
    this.user = this.currentUser.asReadonly();
    this.isAuthenticated = computed(() => !!this.token());
    this.loading = this.isLoading.asReadonly();
    this.loadFromStorage();
  }
  loadFromStorage() {
    const storedToken = localStorage.getItem(environment.jwt.tokenKey);
    const storedUser = localStorage.getItem("teleprompt_user");
    if (storedToken && storedUser) {
      this.token.set(storedToken);
      this.currentUser.set(JSON.parse(storedUser));
    }
  }
  login(request) {
    this.isLoading.set(true);
    return this.http.post(`${environment.apiUrl}/auth/login`, request).pipe(tap((response) => {
      this.setSession(response);
      this.isLoading.set(false);
    }), catchError((error) => {
      this.isLoading.set(false);
      return throwError(() => error);
    }));
  }
  register(request) {
    this.isLoading.set(true);
    return this.http.post(`${environment.apiUrl}/auth/register`, request).pipe(tap((response) => {
      this.setSession(response);
      this.isLoading.set(false);
    }), catchError((error) => {
      this.isLoading.set(false);
      return throwError(() => error);
    }));
  }
  logout() {
    localStorage.removeItem(environment.jwt.tokenKey);
    localStorage.removeItem(environment.jwt.refreshTokenKey);
    localStorage.removeItem("teleprompt_user");
    this.token.set(null);
    this.currentUser.set(null);
    this.router.navigate(["/auth/login"]);
  }
  refreshToken() {
    const currentToken = this.token();
    if (!currentToken) {
      return throwError(() => new Error("No token available"));
    }
    return this.http.post(`${environment.apiUrl}/auth/refresh`, { token: currentToken }).pipe(tap((response) => this.setSession(response)));
  }
  getMe() {
    return this.http.get(`${environment.apiUrl}/auth/me`).pipe(tap((user) => {
      this.currentUser.set(user);
      localStorage.setItem("teleprompt_user", JSON.stringify(user));
    }));
  }
  getToken() {
    return this.token();
  }
  hasPermission(permission) {
    const user = this.currentUser();
    if (!user)
      return false;
    return !!user[permission];
  }
  getTheme() {
    return localStorage.getItem("teleprompt_theme") || "light";
  }
  setTheme(theme) {
    localStorage.setItem("teleprompt_theme", theme);
  }
  setSession(response) {
    localStorage.setItem(environment.jwt.tokenKey, response.token);
    localStorage.setItem("teleprompt_user", JSON.stringify(response.user));
    this.token.set(response.token);
    this.currentUser.set(response.user);
  }
  static {
    this.\u0275fac = function AuthService_Factory(t) {
      return new (t || _AuthService)(\u0275\u0275inject(HttpClient), \u0275\u0275inject(Router));
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _AuthService, factory: _AuthService.\u0275fac, providedIn: "root" });
  }
};

export {
  AuthService
};
//# sourceMappingURL=chunk-AJEFXTFW.js.map
