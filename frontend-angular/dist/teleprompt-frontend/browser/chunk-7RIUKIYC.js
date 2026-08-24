import {
  Store,
  login,
  selectError,
  selectLoading
} from "./chunk-64SJ7QU4.js";
import {
  DefaultValueAccessor,
  FormBuilder,
  FormControlName,
  FormGroupDirective,
  NgControlStatus,
  NgControlStatusGroup,
  ReactiveFormsModule,
  Validators,
  ɵNgNoValidate
} from "./chunk-2IPTFUKK.js";
import {
  Router
} from "./chunk-NJ75DOAS.js";
import "./chunk-3SDTMM4U.js";
import {
  AsyncPipe,
  CommonModule,
  inject,
  signal,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind1,
  ɵɵproperty,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-SBUHLZV6.js";

// src/app/features/auth/login/login.component.ts
function LoginComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 2)(1, "span");
    \u0275\u0275text(2, "\u26A0");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span");
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx);
  }
}
function LoginComponent_Conditional_13_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " E-mail \xE9 obrigat\xF3rio ");
  }
}
function LoginComponent_Conditional_13_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " E-mail inv\xE1lido ");
  }
}
function LoginComponent_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 7);
    \u0275\u0275template(1, LoginComponent_Conditional_13_Conditional_1_Template, 1, 0)(2, LoginComponent_Conditional_13_Conditional_2_Template, 1, 0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_1_0;
    let tmp_2_0;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ((tmp_1_0 = ctx_r0.loginForm.get("email")) == null ? null : tmp_1_0.errors == null ? null : tmp_1_0.errors["required"]) ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(2, ((tmp_2_0 = ctx_r0.loginForm.get("email")) == null ? null : tmp_2_0.errors == null ? null : tmp_2_0.errors["email"]) ? 2 : -1);
  }
}
function LoginComponent_Conditional_22_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Ocultar ");
  }
}
function LoginComponent_Conditional_23_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Mostrar ");
  }
}
function LoginComponent_Conditional_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 7);
    \u0275\u0275text(1, "Senha \xE9 obrigat\xF3ria");
    \u0275\u0275elementEnd();
  }
}
function LoginComponent_Conditional_27_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "span", 16);
    \u0275\u0275text(1, " Entrando... ");
  }
}
function LoginComponent_Conditional_29_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Entrar ");
  }
}
var LoginComponent = class _LoginComponent {
  constructor() {
    this.fb = inject(FormBuilder);
    this.store = inject(Store);
    this.router = inject(Router);
    this.showPassword = signal(false);
    this.loading$ = this.store.select(selectLoading);
    this.error$ = this.store.select(selectError);
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", Validators.required]
    });
  }
  onSubmit() {
    if (this.loginForm.valid) {
      this.store.dispatch(login({ request: this.loginForm.value }));
    }
  }
  goToRegister() {
    this.router.navigate(["/auth/register"]);
  }
  static {
    this.\u0275fac = function LoginComponent_Factory(t) {
      return new (t || _LoginComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _LoginComponent, selectors: [["app-login"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 35, vars: 16, consts: [[1, "auth-card"], [1, "auth-header"], [1, "alert", "alert-error"], [1, "auth-form", 3, "ngSubmit", "formGroup"], [1, "form-group"], ["for", "email"], ["id", "email", "type", "email", "formControlName", "email", "placeholder", "seu@email.com", "autocomplete", "email", 1, "form-input"], [1, "form-error"], [1, "label-row"], ["for", "password"], ["type", "button", 1, "link-button"], ["id", "password", "formControlName", "password", "placeholder", "Sua senha", "autocomplete", "current-password", 1, "form-input", 3, "type"], ["type", "button", 1, "password-toggle", 3, "click"], ["type", "submit", 1, "btn-primary", 3, "disabled"], [1, "auth-footer"], [1, "link-button", "font-semibold", 3, "click"], [1, "spinner"]], template: function LoginComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h1");
        \u0275\u0275text(3, "Bem-vindo(a)!");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "p");
        \u0275\u0275text(5, "Fa\xE7a login para acessar seu painel.");
        \u0275\u0275elementEnd()();
        \u0275\u0275template(6, LoginComponent_Conditional_6_Template, 5, 1, "div", 2);
        \u0275\u0275pipe(7, "async");
        \u0275\u0275elementStart(8, "form", 3);
        \u0275\u0275listener("ngSubmit", function LoginComponent_Template_form_ngSubmit_8_listener() {
          return ctx.onSubmit();
        });
        \u0275\u0275elementStart(9, "div", 4)(10, "label", 5);
        \u0275\u0275text(11, "E-mail");
        \u0275\u0275elementEnd();
        \u0275\u0275element(12, "input", 6);
        \u0275\u0275template(13, LoginComponent_Conditional_13_Template, 3, 2, "p", 7);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(14, "div", 4)(15, "div", 8)(16, "label", 9);
        \u0275\u0275text(17, "Senha");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(18, "button", 10);
        \u0275\u0275text(19, "Esqueceu a senha?");
        \u0275\u0275elementEnd()();
        \u0275\u0275element(20, "input", 11);
        \u0275\u0275elementStart(21, "button", 12);
        \u0275\u0275listener("click", function LoginComponent_Template_button_click_21_listener() {
          return ctx.showPassword.set(!ctx.showPassword());
        });
        \u0275\u0275template(22, LoginComponent_Conditional_22_Template, 1, 0)(23, LoginComponent_Conditional_23_Template, 1, 0);
        \u0275\u0275elementEnd();
        \u0275\u0275template(24, LoginComponent_Conditional_24_Template, 2, 0, "p", 7);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(25, "button", 13);
        \u0275\u0275pipe(26, "async");
        \u0275\u0275template(27, LoginComponent_Conditional_27_Template, 2, 0);
        \u0275\u0275pipe(28, "async");
        \u0275\u0275template(29, LoginComponent_Conditional_29_Template, 1, 0);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(30, "div", 14)(31, "p");
        \u0275\u0275text(32, "N\xE3o tem uma conta? ");
        \u0275\u0275elementStart(33, "button", 15);
        \u0275\u0275listener("click", function LoginComponent_Template_button_click_33_listener() {
          return ctx.goToRegister();
        });
        \u0275\u0275text(34, "Cadastre-se");
        \u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        let tmp_0_0;
        let tmp_2_0;
        let tmp_3_0;
        let tmp_6_0;
        \u0275\u0275advance(6);
        \u0275\u0275conditional(6, (tmp_0_0 = \u0275\u0275pipeBind1(7, 10, ctx.error$)) ? 6 : -1, tmp_0_0);
        \u0275\u0275advance(2);
        \u0275\u0275property("formGroup", ctx.loginForm);
        \u0275\u0275advance(4);
        \u0275\u0275classProp("form-input-error", ((tmp_2_0 = ctx.loginForm.get("email")) == null ? null : tmp_2_0.touched) && ((tmp_2_0 = ctx.loginForm.get("email")) == null ? null : tmp_2_0.errors));
        \u0275\u0275advance();
        \u0275\u0275conditional(13, ((tmp_3_0 = ctx.loginForm.get("email")) == null ? null : tmp_3_0.touched) && ((tmp_3_0 = ctx.loginForm.get("email")) == null ? null : tmp_3_0.errors) ? 13 : -1);
        \u0275\u0275advance(7);
        \u0275\u0275property("type", ctx.showPassword() ? "text" : "password");
        \u0275\u0275advance(2);
        \u0275\u0275conditional(22, ctx.showPassword() ? 22 : 23);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(24, ((tmp_6_0 = ctx.loginForm.get("password")) == null ? null : tmp_6_0.touched) && ((tmp_6_0 = ctx.loginForm.get("password")) == null ? null : tmp_6_0.errors) ? 24 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("disabled", \u0275\u0275pipeBind1(26, 12, ctx.loading$) || ctx.loginForm.invalid);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(27, \u0275\u0275pipeBind1(28, 14, ctx.loading$) ? 27 : 29);
      }
    }, dependencies: [CommonModule, AsyncPipe, ReactiveFormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, FormGroupDirective, FormControlName], styles: ["\n\n.auth-card[_ngcontent-%COMP%] {\n  width: 100%;\n  max-width: 28rem;\n  background: var(--card);\n  color: var(--card-foreground);\n  border: 1px solid var(--border);\n  border-radius: 1rem;\n  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);\n  overflow: hidden;\n}\n.dark[_nghost-%COMP%]   .auth-card[_ngcontent-%COMP%], .dark   [_nghost-%COMP%]   .auth-card[_ngcontent-%COMP%] {\n  background: rgba(39, 39, 42, 0.7);\n  -webkit-backdrop-filter: blur(12px);\n  backdrop-filter: blur(12px);\n}\n.auth-header[_ngcontent-%COMP%] {\n  text-align: center;\n  padding: 2rem 1rem 0.5rem;\n}\n.auth-header[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n  font-size: 1.875rem;\n  font-weight: 700;\n  color: var(--foreground);\n  margin-bottom: 0.25rem;\n}\n.auth-header[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  color: var(--muted-foreground);\n}\n.auth-form[_ngcontent-%COMP%] {\n  padding: 1.5rem 1.5rem 0;\n}\n.alert[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.75rem 1rem;\n  border-radius: 8px;\n  font-size: 0.875rem;\n  margin: 1rem 1.5rem 0;\n}\n.alert-error[_ngcontent-%COMP%] {\n  background: rgba(239, 68, 68, 0.1);\n  color: var(--destructive);\n  border: 1px solid rgba(239, 68, 68, 0.2);\n}\n.form-group[_ngcontent-%COMP%] {\n  margin-bottom: 1rem;\n}\nlabel[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.875rem;\n  font-weight: 500;\n  color: var(--foreground);\n  margin-bottom: 0.375rem;\n}\n.label-row[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 0.375rem;\n}\n.label-row[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  margin-bottom: 0;\n}\n.link-button[_ngcontent-%COMP%] {\n  background: none;\n  border: none;\n  color: var(--primary);\n  font-size: 0.75rem;\n  font-weight: 500;\n  cursor: pointer;\n  padding: 0;\n}\n.link-button[_ngcontent-%COMP%]:hover {\n  text-decoration: underline;\n}\n.form-input[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 0.625rem 0.75rem;\n  border: 1px solid var(--input);\n  border-radius: 8px;\n  background: rgba(255, 255, 255, 0.5);\n  color: var(--foreground);\n  font-size: 0.875rem;\n  transition: border-color 0.15s, box-shadow 0.15s;\n}\n.dark[_nghost-%COMP%]   .form-input[_ngcontent-%COMP%], .dark   [_nghost-%COMP%]   .form-input[_ngcontent-%COMP%] {\n  background: rgba(255, 255, 255, 0.05);\n}\n.form-input[_ngcontent-%COMP%]::placeholder {\n  color: var(--muted-foreground);\n  opacity: 0.6;\n}\n.form-input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: var(--ring);\n  box-shadow: 0 0 0 2px rgba(161, 161, 170, 0.2);\n}\n.form-input-error[_ngcontent-%COMP%] {\n  border-color: var(--destructive);\n}\n.password-toggle[_ngcontent-%COMP%] {\n  position: absolute;\n  right: 0.75rem;\n  top: 50%;\n  transform: translateY(-50%);\n  background: none;\n  border: none;\n  color: var(--muted-foreground);\n  font-size: 0.75rem;\n  cursor: pointer;\n}\n.password-toggle[_ngcontent-%COMP%]:hover {\n  color: var(--foreground);\n}\n.form-group[_ngcontent-%COMP%]:has(.password-toggle) {\n  position: relative;\n}\n.form-error[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  color: var(--destructive);\n  margin-top: 0.375rem;\n}\n.btn-primary[_ngcontent-%COMP%] {\n  width: 100%;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 0.5rem;\n  padding: 0.625rem 1rem;\n  margin-top: 0.5rem;\n  margin-bottom: 1rem;\n  background: var(--primary);\n  color: var(--primary-foreground);\n  border: none;\n  border-radius: 8px;\n  font-size: 0.875rem;\n  font-weight: 600;\n  cursor: pointer;\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);\n  transition: opacity 0.15s;\n}\n.btn-primary[_ngcontent-%COMP%]:hover {\n  opacity: 0.9;\n}\n.btn-primary[_ngcontent-%COMP%]:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n.spinner[_ngcontent-%COMP%] {\n  width: 1rem;\n  height: 1rem;\n  border: 2px solid transparent;\n  border-top-color: currentColor;\n  border-radius: 50%;\n  animation: _ngcontent-%COMP%_spin 2s linear infinite;\n}\n.auth-footer[_ngcontent-%COMP%] {\n  text-align: center;\n  padding: 1rem 1.5rem 2rem;\n  font-size: 0.875rem;\n  color: var(--muted-foreground);\n}\n.auth-footer[_ngcontent-%COMP%]   .link-button[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n}\n.font-semibold[_ngcontent-%COMP%] {\n  font-weight: 600;\n}\n@keyframes _ngcontent-%COMP%_spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n/*# sourceMappingURL=login.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(LoginComponent, { className: "LoginComponent", filePath: "src\\app\\features\\auth\\login\\login.component.ts", lineNumber: 250 });
})();
export {
  LoginComponent
};
//# sourceMappingURL=chunk-7RIUKIYC.js.map
