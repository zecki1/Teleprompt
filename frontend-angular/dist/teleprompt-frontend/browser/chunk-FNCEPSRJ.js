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
  ApiService
} from "./chunk-WFLGWPXD.js";
import {
  ObservabilityService
} from "./chunk-DHSNSXHE.js";
import "./chunk-3SDTMM4U.js";
import {
  CommonModule,
  DatePipe,
  inject,
  signal,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-SBUHLZV6.js";

// src/app/features/workspaces/workspace-list.component.ts
var _forTrack0 = ($index, $item) => $item.id;
function WorkspaceListComponent_Conditional_11_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Fechar ");
  }
}
function WorkspaceListComponent_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " + Novo Workspace ");
  }
}
function WorkspaceListComponent_Conditional_13_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 7)(1, "form", 11);
    \u0275\u0275listener("ngSubmit", function WorkspaceListComponent_Conditional_13_Template_form_ngSubmit_1_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.joinWorkspace());
    });
    \u0275\u0275elementStart(2, "div", 12)(3, "div", 13)(4, "label");
    \u0275\u0275text(5, "C\xF3digo do Workspace");
    \u0275\u0275elementEnd();
    \u0275\u0275element(6, "input", 14);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 15)(8, "button", 16);
    \u0275\u0275text(9, "Entrar");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "button", 17);
    \u0275\u0275listener("click", function WorkspaceListComponent_Conditional_13_Template_button_click_10_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.showJoinForm.set(false));
    });
    \u0275\u0275text(11, "Cancelar");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("formGroup", ctx_r1.joinForm);
    \u0275\u0275advance(7);
    \u0275\u0275property("disabled", ctx_r1.joinForm.invalid);
  }
}
function WorkspaceListComponent_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    const _r3 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 7)(1, "form", 11);
    \u0275\u0275listener("ngSubmit", function WorkspaceListComponent_Conditional_14_Template_form_ngSubmit_1_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.createWorkspace());
    });
    \u0275\u0275elementStart(2, "div", 12)(3, "div", 13)(4, "label");
    \u0275\u0275text(5, "Nome do Workspace");
    \u0275\u0275elementEnd();
    \u0275\u0275element(6, "input", 18);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 15)(8, "button", 16);
    \u0275\u0275text(9, "Criar");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "button", 17);
    \u0275\u0275listener("click", function WorkspaceListComponent_Conditional_14_Template_button_click_10_listener() {
      \u0275\u0275restoreView(_r3);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.showCreateForm.set(false));
    });
    \u0275\u0275text(11, "Cancelar");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("formGroup", ctx_r1.createForm);
    \u0275\u0275advance(7);
    \u0275\u0275property("disabled", ctx_r1.createForm.invalid);
  }
}
function WorkspaceListComponent_For_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 9)(1, "div", 19)(2, "h3", 20);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 21);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "p", 22);
    \u0275\u0275text(7);
    \u0275\u0275pipe(8, "date");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ws_r4 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(ws_r4.name);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ws_r4.plan || "Free");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("Criado em ", \u0275\u0275pipeBind2(8, 3, ws_r4.createdAt, "dd/MM/yyyy"), "");
  }
}
function WorkspaceListComponent_ForEmpty_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 10)(1, "p");
    \u0275\u0275text(2, "Nenhum workspace encontrado");
    \u0275\u0275elementEnd()();
  }
}
var WorkspaceListComponent = class _WorkspaceListComponent {
  constructor() {
    this.api = inject(ApiService);
    this.observability = inject(ObservabilityService);
    this.fb = inject(FormBuilder);
    this.workspaces = signal([]);
    this.showCreateForm = signal(false);
    this.showJoinForm = signal(false);
    this.createForm = this.fb.group({ name: ["", Validators.required] });
    this.joinForm = this.fb.group({ code: ["", Validators.required] });
  }
  ngOnInit() {
    this.observability.trackPageView("workspace-list");
    this.api.getMyWorkspaces().subscribe({ next: (w) => this.workspaces.set(w) });
  }
  createWorkspace() {
    if (this.createForm.valid) {
      this.api.createWorkspace(this.createForm.value).subscribe({
        next: () => {
          this.api.getMyWorkspaces().subscribe({ next: (w) => this.workspaces.set(w) });
          this.showCreateForm.set(false);
          this.createForm.reset();
        }
      });
    }
  }
  joinWorkspace() {
    if (this.joinForm.valid) {
      this.api.joinWorkspace(this.joinForm.value).subscribe({
        next: () => {
          this.api.getMyWorkspaces().subscribe({ next: (w) => this.workspaces.set(w) });
          this.showJoinForm.set(false);
          this.joinForm.reset();
        }
      });
    }
  }
  static {
    this.\u0275fac = function WorkspaceListComponent_Factory(t) {
      return new (t || _WorkspaceListComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _WorkspaceListComponent, selectors: [["app-workspace-list"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 19, vars: 4, consts: [[1, "page-container"], [1, "page-header"], [1, "page-title"], [1, "page-description"], [1, "header-actions"], [1, "btn-outline", 3, "click"], [1, "btn-primary", 3, "click"], [1, "create-card", "animate-slide-down"], [1, "projects-grid"], [1, "project-card"], [1, "empty-state"], [1, "create-form", 3, "ngSubmit", "formGroup"], [1, "form-row"], [1, "form-group", "flex-1"], ["formControlName", "code", "placeholder", "Cole o c\xF3digo", 1, "form-input"], [1, "form-actions"], ["type", "submit", 1, "btn-primary", 3, "disabled"], ["type", "button", 1, "btn-ghost", 3, "click"], ["formControlName", "name", "placeholder", "Ex: Meu Workspace", 1, "form-input"], [1, "card-top"], [1, "project-name"], [1, "badge", "badge-muted"], [1, "project-meta"]], template: function WorkspaceListComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div")(3, "h1", 2);
        \u0275\u0275text(4, "Workspaces");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "p", 3);
        \u0275\u0275text(6, "Gerencie seus ambientes de trabalho");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(7, "div", 4)(8, "button", 5);
        \u0275\u0275listener("click", function WorkspaceListComponent_Template_button_click_8_listener() {
          return ctx.showJoinForm.set(!ctx.showJoinForm());
        });
        \u0275\u0275text(9, "Entrar com c\xF3digo");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(10, "button", 6);
        \u0275\u0275listener("click", function WorkspaceListComponent_Template_button_click_10_listener() {
          return ctx.showCreateForm.set(!ctx.showCreateForm());
        });
        \u0275\u0275template(11, WorkspaceListComponent_Conditional_11_Template, 1, 0)(12, WorkspaceListComponent_Conditional_12_Template, 1, 0);
        \u0275\u0275elementEnd()()();
        \u0275\u0275template(13, WorkspaceListComponent_Conditional_13_Template, 12, 2, "div", 7)(14, WorkspaceListComponent_Conditional_14_Template, 12, 2, "div", 7);
        \u0275\u0275elementStart(15, "div", 8);
        \u0275\u0275repeaterCreate(16, WorkspaceListComponent_For_17_Template, 9, 6, "div", 9, _forTrack0, false, WorkspaceListComponent_ForEmpty_18_Template, 3, 0, "div", 10);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(11);
        \u0275\u0275conditional(11, ctx.showCreateForm() ? 11 : 12);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(13, ctx.showJoinForm() ? 13 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(14, ctx.showCreateForm() ? 14 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275repeater(ctx.workspaces());
      }
    }, dependencies: [CommonModule, DatePipe, ReactiveFormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, FormGroupDirective, FormControlName], styles: ["\n\n.page-container[_ngcontent-%COMP%] {\n  max-width: 1152px;\n  margin: 0 auto;\n  padding: 2rem 1rem;\n}\n@media (min-width: 640px) {\n  .page-container[_ngcontent-%COMP%] {\n    padding: 2rem 1.5rem;\n  }\n}\n.page-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  margin-bottom: 2rem;\n  flex-wrap: wrap;\n  gap: 1rem;\n}\n.page-title[_ngcontent-%COMP%] {\n  font-size: 1.875rem;\n  font-weight: 900;\n  letter-spacing: -0.025em;\n}\n.page-description[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  color: var(--muted-foreground);\n  margin-top: 0.25rem;\n}\n.header-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n}\n.btn-primary[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  padding: 0.5rem 1rem;\n  border-radius: 8px;\n  border: none;\n  background: var(--primary);\n  color: var(--primary-foreground);\n  font-size: 0.875rem;\n  font-weight: 500;\n  cursor: pointer;\n}\n.btn-primary[_ngcontent-%COMP%]:hover {\n  opacity: 0.9;\n}\n.btn-primary[_ngcontent-%COMP%]:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n.btn-outline[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  padding: 0.5rem 1rem;\n  border-radius: 8px;\n  border: 1px solid var(--border);\n  background: transparent;\n  color: var(--foreground);\n  font-size: 0.875rem;\n  font-weight: 500;\n  cursor: pointer;\n}\n.btn-outline[_ngcontent-%COMP%]:hover {\n  background: var(--accent);\n}\n.btn-ghost[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  padding: 0.5rem 1rem;\n  border-radius: 8px;\n  border: none;\n  background: transparent;\n  color: var(--muted-foreground);\n  font-size: 0.875rem;\n  font-weight: 500;\n  cursor: pointer;\n}\n.btn-ghost[_ngcontent-%COMP%]:hover {\n  background: var(--accent);\n  color: var(--foreground);\n}\n.create-card[_ngcontent-%COMP%] {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  padding: 1.25rem;\n  margin-bottom: 1.5rem;\n}\n.form-row[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.75rem;\n  align-items: flex-end;\n  flex-wrap: wrap;\n}\n.form-group[_ngcontent-%COMP%] {\n  margin-bottom: 0;\n}\n.form-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.8125rem;\n  font-weight: 500;\n  margin-bottom: 0.375rem;\n}\n.flex-1[_ngcontent-%COMP%] {\n  flex: 1;\n  min-width: 200px;\n}\n.form-input[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 0.5rem 0.75rem;\n  border: 1px solid var(--input);\n  border-radius: 8px;\n  background: transparent;\n  color: var(--foreground);\n  font-size: 0.875rem;\n}\n.form-input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: var(--ring);\n}\n.form-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n}\n.projects-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));\n  gap: 1rem;\n}\n.project-card[_ngcontent-%COMP%] {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  padding: 1.25rem;\n}\n.card-top[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  margin-bottom: 0.5rem;\n}\n.project-name[_ngcontent-%COMP%] {\n  font-size: 1rem;\n  font-weight: 600;\n}\n.badge[_ngcontent-%COMP%] {\n  display: inline-flex;\n  padding: 0.125rem 0.5rem;\n  border-radius: 9999px;\n  font-size: 0.75rem;\n  font-weight: 500;\n}\n.badge-muted[_ngcontent-%COMP%] {\n  background: var(--muted);\n  color: var(--muted-foreground);\n}\n.project-meta[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  color: var(--muted-foreground);\n}\n.empty-state[_ngcontent-%COMP%] {\n  grid-column: 1 / -1;\n  text-align: center;\n  padding: 3rem 1rem;\n  color: var(--muted-foreground);\n}\n/*# sourceMappingURL=workspace-list.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(WorkspaceListComponent, { className: "WorkspaceListComponent", filePath: "src\\app\\features\\workspaces\\workspace-list.component.ts", lineNumber: 107 });
})();
export {
  WorkspaceListComponent
};
//# sourceMappingURL=chunk-FNCEPSRJ.js.map
