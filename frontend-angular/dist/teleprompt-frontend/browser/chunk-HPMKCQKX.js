import {
  Store,
  selectUser
} from "./chunk-64SJ7QU4.js";
import {
  DefaultValueAccessor,
  FormBuilder,
  FormControlName,
  FormGroupDirective,
  NgControlStatus,
  NgControlStatusGroup,
  ReactiveFormsModule,
  ɵNgNoValidate
} from "./chunk-2IPTFUKK.js";
import {
  CommonModule,
  inject,
  signal,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵattribute,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-SBUHLZV6.js";

// src/app/features/profile/profile.component.ts
function ProfileComponent_Conditional_6_Conditional_32_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 20);
    \u0275\u0275text(1, "SuperAdmin");
    \u0275\u0275elementEnd();
  }
}
function ProfileComponent_Conditional_6_Conditional_33_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 21);
    \u0275\u0275text(1, "Editor");
    \u0275\u0275elementEnd();
  }
}
function ProfileComponent_Conditional_6_Conditional_34_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 22);
    \u0275\u0275text(1, "Revisor");
    \u0275\u0275elementEnd();
  }
}
function ProfileComponent_Conditional_6_Conditional_35_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 23);
    \u0275\u0275text(1, "Colaborador");
    \u0275\u0275elementEnd();
  }
}
function ProfileComponent_Conditional_6_Conditional_36_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 24);
    \u0275\u0275text(1, "Reverter");
    \u0275\u0275elementEnd();
  }
}
function ProfileComponent_Conditional_6_Conditional_37_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 23);
    \u0275\u0275text(1, "Relat\xF3rios");
    \u0275\u0275elementEnd();
  }
}
function ProfileComponent_Conditional_6_Conditional_38_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 23);
    \u0275\u0275text(1, "Hist\xF3rico");
    \u0275\u0275elementEnd();
  }
}
function ProfileComponent_Conditional_6_Conditional_39_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 23);
    \u0275\u0275text(1, "Debug Logs");
    \u0275\u0275elementEnd();
  }
}
function ProfileComponent_Conditional_6_Conditional_40_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 23);
    \u0275\u0275text(1, "Atribuir");
    \u0275\u0275elementEnd();
  }
}
function ProfileComponent_Conditional_6_Conditional_41_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 23);
    \u0275\u0275text(1, "Gerenciar");
    \u0275\u0275elementEnd();
  }
}
function ProfileComponent_Conditional_6_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 4)(1, "div", 5)(2, "div", 6)(3, "h2", 7);
    \u0275\u0275text(4, "Informa\xE7\xF5es Pessoais");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "div", 8)(6, "div", 9)(7, "div", 10);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "div")(10, "h3", 11);
    \u0275\u0275text(11);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "p", 12);
    \u0275\u0275text(13);
    \u0275\u0275elementEnd()()();
    \u0275\u0275element(14, "div", 13);
    \u0275\u0275elementStart(15, "form", 14);
    \u0275\u0275listener("ngSubmit", function ProfileComponent_Conditional_6_Template_form_ngSubmit_15_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.saveProfile());
    });
    \u0275\u0275elementStart(16, "div", 15)(17, "label");
    \u0275\u0275text(18, "Nome");
    \u0275\u0275elementEnd();
    \u0275\u0275element(19, "input", 16);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "div", 15)(21, "label");
    \u0275\u0275text(22, "E-mail");
    \u0275\u0275elementEnd();
    \u0275\u0275element(23, "input", 17);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(24, "button", 18);
    \u0275\u0275text(25, "Salvar Altera\xE7\xF5es");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(26, "div", 5)(27, "div", 6)(28, "h2", 7);
    \u0275\u0275text(29, "Permiss\xF5es");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(30, "div", 8)(31, "div", 19);
    \u0275\u0275template(32, ProfileComponent_Conditional_6_Conditional_32_Template, 2, 0, "span", 20)(33, ProfileComponent_Conditional_6_Conditional_33_Template, 2, 0, "span", 21)(34, ProfileComponent_Conditional_6_Conditional_34_Template, 2, 0, "span", 22)(35, ProfileComponent_Conditional_6_Conditional_35_Template, 2, 0, "span", 23)(36, ProfileComponent_Conditional_6_Conditional_36_Template, 2, 0, "span", 24)(37, ProfileComponent_Conditional_6_Conditional_37_Template, 2, 0, "span", 23)(38, ProfileComponent_Conditional_6_Conditional_38_Template, 2, 0, "span", 23)(39, ProfileComponent_Conditional_6_Conditional_39_Template, 2, 0, "span", 23)(40, ProfileComponent_Conditional_6_Conditional_40_Template, 2, 0, "span", 23)(41, ProfileComponent_Conditional_6_Conditional_41_Template, 2, 0, "span", 23);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate(ctx_r1.initials());
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ctx_r1.user().displayName);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r1.user().email);
    \u0275\u0275advance(2);
    \u0275\u0275property("formGroup", ctx_r1.profileForm);
    \u0275\u0275advance(8);
    \u0275\u0275attribute("disabled", true);
    \u0275\u0275advance(9);
    \u0275\u0275conditional(32, ctx_r1.user().isSuperAdmin ? 32 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(33, ctx_r1.user().isEditor ? 33 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(34, ctx_r1.user().isRevisor ? 34 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(35, ctx_r1.user().canCollaborate ? 35 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(36, ctx_r1.user().canRevert ? 36 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(37, ctx_r1.user().canViewReports ? 37 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(38, ctx_r1.user().canViewActivityHistory ? 38 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(39, ctx_r1.user().canViewDebugLogs ? 39 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(40, ctx_r1.user().canAssign ? 40 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(41, ctx_r1.user().canManagePermissions ? 41 : -1);
  }
}
var ProfileComponent = class _ProfileComponent {
  constructor() {
    this.store = inject(Store);
    this.fb = inject(FormBuilder);
    this.user = signal(null);
    this.initials = signal("");
    this.profileForm = this.fb.group({ displayName: [""], email: [""] });
  }
  ngOnInit() {
    this.store.select(selectUser).subscribe((u) => {
      if (u) {
        this.user.set(u);
        this.profileForm.patchValue({ displayName: u.displayName, email: u.email });
        this.initials.set((u.displayName || "").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2));
      }
    });
  }
  saveProfile() {
  }
  static {
    this.\u0275fac = function ProfileComponent_Factory(t) {
      return new (t || _ProfileComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ProfileComponent, selectors: [["app-profile"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 7, vars: 1, consts: [[1, "page-container"], [1, "page-header"], [1, "page-title"], [1, "page-description"], [1, "profile-layout"], [1, "content-card"], [1, "card-header"], [1, "card-title"], [1, "card-body"], [1, "profile-top"], [1, "avatar-lg"], [1, "profile-name"], [1, "text-sm", "text-muted-foreground"], [1, "divider"], [1, "profile-form", 3, "ngSubmit", "formGroup"], [1, "form-group"], ["formControlName", "displayName", 1, "form-input"], ["formControlName", "email", 1, "form-input"], ["type", "submit", 1, "btn-primary"], [1, "perm-grid"], [1, "badge", "badge-blue"], [1, "badge", "badge-emerald"], [1, "badge", "badge-purple"], [1, "badge", "badge-muted"], [1, "badge", "badge-amber"]], template: function ProfileComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h1", 2);
        \u0275\u0275text(3, "Perfil");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "p", 3);
        \u0275\u0275text(5, "Gerencie suas informa\xE7\xF5es pessoais");
        \u0275\u0275elementEnd()();
        \u0275\u0275template(6, ProfileComponent_Conditional_6_Template, 42, 15, "div", 4);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance(6);
        \u0275\u0275conditional(6, ctx.user() ? 6 : -1);
      }
    }, dependencies: [CommonModule, ReactiveFormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, FormGroupDirective, FormControlName], styles: ["\n\n.page-container[_ngcontent-%COMP%] {\n  max-width: 1152px;\n  margin: 0 auto;\n  padding: 2rem 1rem;\n}\n@media (min-width: 640px) {\n  .page-container[_ngcontent-%COMP%] {\n    padding: 2rem 1.5rem;\n  }\n}\n.page-header[_ngcontent-%COMP%] {\n  margin-bottom: 2rem;\n}\n.page-title[_ngcontent-%COMP%] {\n  font-size: 1.875rem;\n  font-weight: 900;\n  letter-spacing: -0.025em;\n}\n.page-description[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  color: var(--muted-foreground);\n  margin-top: 0.25rem;\n}\n.profile-layout[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));\n  gap: 1.5rem;\n}\n@media (max-width: 768px) {\n  .profile-layout[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n}\n.content-card[_ngcontent-%COMP%] {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  overflow: hidden;\n}\n.card-header[_ngcontent-%COMP%] {\n  padding: 1rem 1.5rem;\n  border-bottom: 1px solid var(--border);\n}\n.card-title[_ngcontent-%COMP%] {\n  font-size: 1rem;\n  font-weight: 600;\n}\n.card-body[_ngcontent-%COMP%] {\n  padding: 1.5rem;\n}\n.profile-top[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 1rem;\n  margin-bottom: 1.5rem;\n}\n.avatar-lg[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 4rem;\n  height: 4rem;\n  border-radius: 50%;\n  background: var(--muted);\n  color: var(--muted-foreground);\n  font-size: 1.25rem;\n  font-weight: 700;\n  flex-shrink: 0;\n}\n.profile-name[_ngcontent-%COMP%] {\n  font-size: 1.125rem;\n  font-weight: 700;\n  margin-bottom: 0.125rem;\n}\n.text-sm[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n}\n.text-muted-foreground[_ngcontent-%COMP%] {\n  color: var(--muted-foreground);\n}\n.divider[_ngcontent-%COMP%] {\n  height: 1px;\n  background: var(--border);\n  margin: 1.5rem 0;\n}\n.profile-form[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  gap: 1rem;\n}\n.form-group[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n}\n.form-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  font-weight: 500;\n  margin-bottom: 0.375rem;\n}\n.form-input[_ngcontent-%COMP%] {\n  padding: 0.625rem 0.75rem;\n  border: 1px solid var(--input);\n  border-radius: 8px;\n  background: transparent;\n  color: var(--foreground);\n  font-size: 0.875rem;\n}\n.form-input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: var(--ring);\n}\n.btn-primary[_ngcontent-%COMP%] {\n  align-self: flex-start;\n  padding: 0.5rem 1rem;\n  border-radius: 8px;\n  border: none;\n  background: var(--primary);\n  color: var(--primary-foreground);\n  font-size: 0.875rem;\n  font-weight: 500;\n  cursor: pointer;\n  transition: opacity 0.15s;\n}\n.btn-primary[_ngcontent-%COMP%]:hover {\n  opacity: 0.9;\n}\n.perm-grid[_ngcontent-%COMP%] {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.5rem;\n}\n.badge[_ngcontent-%COMP%] {\n  display: inline-flex;\n  padding: 0.25rem 0.75rem;\n  border-radius: 9999px;\n  font-size: 0.8125rem;\n  font-weight: 500;\n}\n.badge-blue[_ngcontent-%COMP%] {\n  background: oklch(0.623 0.214 259.815 / 0.1);\n  color: #3b82f6;\n}\n.badge-emerald[_ngcontent-%COMP%] {\n  background: oklch(0.696 0.17 162.48 / 0.1);\n  color: #10b981;\n}\n.badge-purple[_ngcontent-%COMP%] {\n  background: oklch(0.627 0.265 303.9 / 0.1);\n  color: #8b5cf6;\n}\n.badge-amber[_ngcontent-%COMP%] {\n  background: oklch(0.769 0.188 70.08 / 0.1);\n  color: #f59e0b;\n}\n.badge-muted[_ngcontent-%COMP%] {\n  background: var(--muted);\n  color: var(--muted-foreground);\n}\n/*# sourceMappingURL=profile.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ProfileComponent, { className: "ProfileComponent", filePath: "src\\app\\features\\profile\\profile.component.ts", lineNumber: 117 });
})();
export {
  ProfileComponent
};
//# sourceMappingURL=chunk-HPMKCQKX.js.map
