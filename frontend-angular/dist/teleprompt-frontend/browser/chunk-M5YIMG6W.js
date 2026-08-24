import {
  Store,
  register,
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
  RouterLink
} from "./chunk-NJ75DOAS.js";
import "./chunk-3SDTMM4U.js";
import {
  AsyncPipe,
  CommonModule,
  inject,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
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
  ɵɵtextInterpolate1
} from "./chunk-SBUHLZV6.js";

// src/app/features/auth/register/register.component.ts
function RegisterComponent_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 4)(1, "span", 19);
    \u0275\u0275text(2, "\u26A0");
    \u0275\u0275elementEnd();
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1(" ", ctx, " ");
  }
}
function RegisterComponent_Conditional_20_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " E-mail \xE9 obrigat\xF3rio ");
  }
}
function RegisterComponent_Conditional_20_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " E-mail inv\xE1lido ");
  }
}
function RegisterComponent_Conditional_20_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 11);
    \u0275\u0275template(1, RegisterComponent_Conditional_20_Conditional_1_Template, 1, 0)(2, RegisterComponent_Conditional_20_Conditional_2_Template, 1, 0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_1_0;
    let tmp_2_0;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ((tmp_1_0 = ctx_r0.registerForm.get("email")) == null ? null : tmp_1_0.errors == null ? null : tmp_1_0.errors["required"]) ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(2, ((tmp_2_0 = ctx_r0.registerForm.get("email")) == null ? null : tmp_2_0.errors == null ? null : tmp_2_0.errors["email"]) ? 2 : -1);
  }
}
function RegisterComponent_Conditional_25_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Senha \xE9 obrigat\xF3ria ");
  }
}
function RegisterComponent_Conditional_25_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " M\xEDnimo 8 caracteres ");
  }
}
function RegisterComponent_Conditional_25_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 11);
    \u0275\u0275template(1, RegisterComponent_Conditional_25_Conditional_1_Template, 1, 0)(2, RegisterComponent_Conditional_25_Conditional_2_Template, 1, 0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    let tmp_1_0;
    let tmp_2_0;
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ((tmp_1_0 = ctx_r0.registerForm.get("password")) == null ? null : tmp_1_0.errors == null ? null : tmp_1_0.errors["required"]) ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(2, ((tmp_2_0 = ctx_r0.registerForm.get("password")) == null ? null : tmp_2_0.errors == null ? null : tmp_2_0.errors["minlength"]) ? 2 : -1);
  }
}
function RegisterComponent_Conditional_30_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 11);
    \u0275\u0275text(1, "As senhas n\xE3o conferem");
    \u0275\u0275elementEnd();
  }
}
function RegisterComponent_Conditional_33_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "span", 20);
    \u0275\u0275text(1, " Criando... ");
  }
}
function RegisterComponent_Conditional_35_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Criar Conta ");
  }
}
var RegisterComponent = class _RegisterComponent {
  constructor() {
    this.fb = inject(FormBuilder);
    this.store = inject(Store);
    this.loading$ = this.store.select(selectLoading);
    this.error$ = this.store.select(selectError);
    this.registerForm = this.fb.group({
      displayName: [""],
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(8)]],
      confirmPassword: ["", Validators.required]
    });
  }
  onSubmit() {
    if (this.registerForm.valid) {
      const { displayName, email, password } = this.registerForm.value;
      this.store.dispatch(register({ request: { displayName, email, password } }));
    }
  }
  static {
    this.\u0275fac = function RegisterComponent_Factory(t) {
      return new (t || _RegisterComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _RegisterComponent, selectors: [["app-register"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 41, vars: 13, consts: [[1, "auth-card"], [1, "auth-header"], [1, "auth-logo"], [1, "auth-logo-icon"], [1, "alert", "alert-error"], [3, "ngSubmit", "formGroup"], [1, "form-group"], ["for", "displayName"], ["id", "displayName", "type", "text", "formControlName", "displayName", "placeholder", "Seu nome completo", 1, "form-input"], ["for", "email"], ["id", "email", "type", "email", "formControlName", "email", "placeholder", "seu@email.com", "autocomplete", "email", 1, "form-input"], [1, "form-error"], ["for", "password"], ["id", "password", "type", "password", "formControlName", "password", "placeholder", "M\xEDnimo 8 caracteres", "autocomplete", "new-password", 1, "form-input"], ["for", "confirmPassword"], ["id", "confirmPassword", "type", "password", "formControlName", "confirmPassword", "placeholder", "Repita a senha", "autocomplete", "new-password", 1, "form-input"], ["type", "submit", 1, "btn-primary", 3, "disabled"], [1, "auth-footer"], ["routerLink", "/auth/login"], [1, "alert-icon"], [1, "btn-loading"]], template: function RegisterComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "span", 3);
        \u0275\u0275text(4, "\u25B6");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(5, "h1");
        \u0275\u0275text(6, "Criar conta");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(7, "p");
        \u0275\u0275text(8, "Preencha os dados para se cadastrar");
        \u0275\u0275elementEnd()();
        \u0275\u0275template(9, RegisterComponent_Conditional_9_Template, 4, 1, "div", 4);
        \u0275\u0275pipe(10, "async");
        \u0275\u0275elementStart(11, "form", 5);
        \u0275\u0275listener("ngSubmit", function RegisterComponent_Template_form_ngSubmit_11_listener() {
          return ctx.onSubmit();
        });
        \u0275\u0275elementStart(12, "div", 6)(13, "label", 7);
        \u0275\u0275text(14, "Nome");
        \u0275\u0275elementEnd();
        \u0275\u0275element(15, "input", 8);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(16, "div", 6)(17, "label", 9);
        \u0275\u0275text(18, "E-mail");
        \u0275\u0275elementEnd();
        \u0275\u0275element(19, "input", 10);
        \u0275\u0275template(20, RegisterComponent_Conditional_20_Template, 3, 2, "p", 11);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(21, "div", 6)(22, "label", 12);
        \u0275\u0275text(23, "Senha");
        \u0275\u0275elementEnd();
        \u0275\u0275element(24, "input", 13);
        \u0275\u0275template(25, RegisterComponent_Conditional_25_Template, 3, 2, "p", 11);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(26, "div", 6)(27, "label", 14);
        \u0275\u0275text(28, "Confirmar Senha");
        \u0275\u0275elementEnd();
        \u0275\u0275element(29, "input", 15);
        \u0275\u0275template(30, RegisterComponent_Conditional_30_Template, 2, 0, "p", 11);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(31, "button", 16);
        \u0275\u0275pipe(32, "async");
        \u0275\u0275template(33, RegisterComponent_Conditional_33_Template, 2, 0);
        \u0275\u0275pipe(34, "async");
        \u0275\u0275template(35, RegisterComponent_Conditional_35_Template, 1, 0);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(36, "div", 17)(37, "p");
        \u0275\u0275text(38, "J\xE1 tem conta? ");
        \u0275\u0275elementStart(39, "a", 18);
        \u0275\u0275text(40, "Fazer login");
        \u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        let tmp_0_0;
        let tmp_2_0;
        let tmp_3_0;
        let tmp_4_0;
        \u0275\u0275advance(9);
        \u0275\u0275conditional(9, (tmp_0_0 = \u0275\u0275pipeBind1(10, 7, ctx.error$)) ? 9 : -1, tmp_0_0);
        \u0275\u0275advance(2);
        \u0275\u0275property("formGroup", ctx.registerForm);
        \u0275\u0275advance(9);
        \u0275\u0275conditional(20, ((tmp_2_0 = ctx.registerForm.get("email")) == null ? null : tmp_2_0.touched) && ((tmp_2_0 = ctx.registerForm.get("email")) == null ? null : tmp_2_0.errors) ? 20 : -1);
        \u0275\u0275advance(5);
        \u0275\u0275conditional(25, ((tmp_3_0 = ctx.registerForm.get("password")) == null ? null : tmp_3_0.touched) && ((tmp_3_0 = ctx.registerForm.get("password")) == null ? null : tmp_3_0.errors) ? 25 : -1);
        \u0275\u0275advance(5);
        \u0275\u0275conditional(30, ((tmp_4_0 = ctx.registerForm.get("confirmPassword")) == null ? null : tmp_4_0.touched) && ctx.registerForm.hasError("passwordMismatch") ? 30 : -1);
        \u0275\u0275advance();
        \u0275\u0275property("disabled", \u0275\u0275pipeBind1(32, 9, ctx.loading$) || ctx.registerForm.invalid);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(33, \u0275\u0275pipeBind1(34, 11, ctx.loading$) ? 33 : 35);
      }
    }, dependencies: [CommonModule, AsyncPipe, ReactiveFormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, FormGroupDirective, FormControlName, RouterLink], styles: ["\n\n.auth-card[_ngcontent-%COMP%] {\n  width: 100%;\n  max-width: 400px;\n  background: var(--card);\n  color: var(--card-foreground);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  padding: 2rem;\n  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);\n}\n.auth-header[_ngcontent-%COMP%] {\n  text-align: center;\n  margin-bottom: 1.5rem;\n}\n.auth-logo[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 48px;\n  height: 48px;\n  border-radius: 12px;\n  background: var(--foreground);\n  color: var(--background);\n  font-size: 1.25rem;\n  font-weight: 900;\n  margin-bottom: 1rem;\n}\n.auth-header[_ngcontent-%COMP%]   h1[_ngcontent-%COMP%] {\n  font-size: 1.5rem;\n  font-weight: 800;\n  letter-spacing: -0.025em;\n  color: var(--foreground);\n  margin-bottom: 0.25rem;\n}\n.auth-header[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  color: var(--muted-foreground);\n}\n.alert[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.75rem 1rem;\n  border-radius: 8px;\n  font-size: 0.875rem;\n  margin-bottom: 1rem;\n}\n.alert-error[_ngcontent-%COMP%] {\n  background: oklch(0.577 0.245 27.325 / 0.1);\n  color: var(--destructive);\n  border: 1px solid oklch(0.577 0.245 27.325 / 0.2);\n}\n.form-group[_ngcontent-%COMP%] {\n  margin-bottom: 1rem;\n}\nlabel[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.875rem;\n  font-weight: 500;\n  color: var(--foreground);\n  margin-bottom: 0.375rem;\n}\n.form-input[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 0.625rem 0.75rem;\n  border: 1px solid var(--input);\n  border-radius: 8px;\n  background: transparent;\n  color: var(--foreground);\n  font-size: 0.875rem;\n  transition: border-color 0.15s, box-shadow 0.15s;\n}\n.form-input[_ngcontent-%COMP%]::placeholder {\n  color: var(--muted-foreground);\n  opacity: 0.6;\n}\n.form-input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: var(--ring);\n  box-shadow: 0 0 0 2px oklch(0.705 0.015 286.067 / 0.2);\n}\n.form-error[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  color: var(--destructive);\n  margin-top: 0.375rem;\n}\n.btn-primary[_ngcontent-%COMP%] {\n  width: 100%;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  gap: 0.5rem;\n  padding: 0.625rem 1rem;\n  margin-top: 0.5rem;\n  background: var(--primary);\n  color: var(--primary-foreground);\n  border: none;\n  border-radius: 8px;\n  font-size: 0.875rem;\n  font-weight: 500;\n  cursor: pointer;\n  transition: opacity 0.15s;\n}\n.btn-primary[_ngcontent-%COMP%]:hover {\n  opacity: 0.9;\n}\n.btn-primary[_ngcontent-%COMP%]:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n.btn-loading[_ngcontent-%COMP%] {\n  width: 1rem;\n  height: 1rem;\n  border: 2px solid transparent;\n  border-top-color: currentColor;\n  border-radius: 50%;\n  animation: _ngcontent-%COMP%_spin 0.6s linear infinite;\n}\n.auth-footer[_ngcontent-%COMP%] {\n  text-align: center;\n  margin-top: 1.5rem;\n  padding-top: 1rem;\n  border-top: 1px solid var(--border);\n}\n.auth-footer[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  color: var(--muted-foreground);\n}\n.auth-footer[_ngcontent-%COMP%]   a[_ngcontent-%COMP%] {\n  color: var(--foreground);\n  font-weight: 600;\n  text-decoration: none;\n}\n.auth-footer[_ngcontent-%COMP%]   a[_ngcontent-%COMP%]:hover {\n  text-decoration: underline;\n}\n@keyframes _ngcontent-%COMP%_spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n/*# sourceMappingURL=register.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(RegisterComponent, { className: "RegisterComponent", filePath: "src\\app\\features\\auth\\register\\register.component.ts", lineNumber: 136 });
})();
export {
  RegisterComponent
};
//# sourceMappingURL=chunk-M5YIMG6W.js.map
