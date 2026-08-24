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
import {
  RouterLink
} from "./chunk-NJ75DOAS.js";
import "./chunk-3SDTMM4U.js";
import {
  CommonModule,
  DatePipe,
  inject,
  signal,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
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
  ɵɵpureFunction1,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-SBUHLZV6.js";

// src/app/features/projects/list/project-list.component.ts
var _forTrack0 = ($index, $item) => $item.id;
var _c0 = (a0) => ["/projects", a0];
function ProjectListComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Fechar ");
  }
}
function ProjectListComponent_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " + Novo Projeto ");
  }
}
function ProjectListComponent_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 5)(1, "form", 9);
    \u0275\u0275listener("ngSubmit", function ProjectListComponent_Conditional_10_Template_form_ngSubmit_1_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.createProject());
    });
    \u0275\u0275elementStart(2, "div", 10)(3, "div", 11)(4, "label");
    \u0275\u0275text(5, "Nome do Projeto");
    \u0275\u0275elementEnd();
    \u0275\u0275element(6, "input", 12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 13)(8, "label");
    \u0275\u0275text(9, "C\xF3digo");
    \u0275\u0275elementEnd();
    \u0275\u0275element(10, "input", 14);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "div", 15)(12, "button", 16);
    \u0275\u0275text(13, "Criar");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "button", 17);
    \u0275\u0275listener("click", function ProjectListComponent_Conditional_10_Template_button_click_14_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.showCreateForm.set(false));
    });
    \u0275\u0275text(15, "Cancelar");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("formGroup", ctx_r1.projectForm);
    \u0275\u0275advance(11);
    \u0275\u0275property("disabled", ctx_r1.projectForm.invalid);
  }
}
function ProjectListComponent_For_13_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 20);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const project_r3 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(project_r3.code);
  }
}
function ProjectListComponent_For_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 7)(1, "div", 18)(2, "h3", 19);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, ProjectListComponent_For_13_Conditional_4_Template, 2, 1, "span", 20);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 21)(6, "span", 22);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "span", 23);
    \u0275\u0275text(9);
    \u0275\u0275pipe(10, "date");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const project_r3 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("routerLink", \u0275\u0275pureFunction1(10, _c0, project_r3.id));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(project_r3.name);
    \u0275\u0275advance();
    \u0275\u0275conditional(4, project_r3.code ? 4 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275classMap(ctx_r1.getStatusBadgeClass(project_r3.status));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.getStatusLabel(project_r3.status), " ");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(10, 7, project_r3.createdAt, "dd/MM/yyyy"));
  }
}
function ProjectListComponent_ForEmpty_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8)(1, "p");
    \u0275\u0275text(2, "Nenhum projeto encontrado");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 24);
    \u0275\u0275text(4, 'Clique em "Novo Projeto" para criar o primeiro');
    \u0275\u0275elementEnd()();
  }
}
var ProjectListComponent = class _ProjectListComponent {
  constructor() {
    this.api = inject(ApiService);
    this.observability = inject(ObservabilityService);
    this.fb = inject(FormBuilder);
    this.projects = signal([]);
    this.showCreateForm = signal(false);
    this.projectForm = this.fb.group({
      name: ["", Validators.required],
      code: [""]
    });
  }
  ngOnInit() {
    this.observability.trackPageView("project-list");
    this.loadProjects();
  }
  loadProjects() {
    this.api.getProjects().subscribe({
      next: (projects) => this.projects.set(projects)
    });
  }
  createProject() {
    if (this.projectForm.valid) {
      this.api.createProject(this.projectForm.value).subscribe({
        next: () => {
          this.loadProjects();
          this.showCreateForm.set(false);
          this.projectForm.reset();
        }
      });
    }
  }
  getStatusLabel(status) {
    const labels = {
      0: "Aguardando",
      1: "Em Andamento",
      2: "Conclu\xEDdo",
      3: "Pausado",
      4: "Atrasado",
      5: "Backlog"
    };
    return status !== void 0 ? labels[status] || "N/A" : "Sem status";
  }
  getStatusBadgeClass(status) {
    const classes = {
      0: "badge-blue",
      1: "badge-amber",
      2: "badge-emerald",
      3: "badge-muted",
      4: "badge-red",
      5: "badge-muted"
    };
    return status !== void 0 ? classes[status] || "badge-muted" : "badge-muted";
  }
  static {
    this.\u0275fac = function ProjectListComponent_Factory(t) {
      return new (t || _ProjectListComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ProjectListComponent, selectors: [["app-project-list"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 15, vars: 3, consts: [[1, "page-container"], [1, "page-header"], [1, "page-title"], [1, "page-description"], [1, "btn-primary", 3, "click"], [1, "create-card", "animate-slide-down"], [1, "projects-grid"], [1, "project-card", 3, "routerLink"], [1, "empty-state"], [1, "create-form", 3, "ngSubmit", "formGroup"], [1, "form-row"], [1, "form-group", "flex-1"], ["formControlName", "name", "placeholder", "Ex: Campanha 2026", 1, "form-input"], [1, "form-group", 2, "width", "140px"], ["formControlName", "code", "placeholder", "CAM-01", 1, "form-input"], [1, "form-actions"], ["type", "submit", 1, "btn-primary", 3, "disabled"], ["type", "button", 1, "btn-ghost", 3, "click"], [1, "card-top"], [1, "project-name"], [1, "project-code"], [1, "card-bottom"], [1, "badge"], [1, "project-date"], [1, "empty-hint"]], template: function ProjectListComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div")(3, "h1", 2);
        \u0275\u0275text(4, "Projetos");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "p", 3);
        \u0275\u0275text(6, "Gerencie seus projetos de roteiro");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(7, "button", 4);
        \u0275\u0275listener("click", function ProjectListComponent_Template_button_click_7_listener() {
          return ctx.showCreateForm.set(!ctx.showCreateForm());
        });
        \u0275\u0275template(8, ProjectListComponent_Conditional_8_Template, 1, 0)(9, ProjectListComponent_Conditional_9_Template, 1, 0);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(10, ProjectListComponent_Conditional_10_Template, 16, 2, "div", 5);
        \u0275\u0275elementStart(11, "div", 6);
        \u0275\u0275repeaterCreate(12, ProjectListComponent_For_13_Template, 11, 12, "a", 7, _forTrack0, false, ProjectListComponent_ForEmpty_14_Template, 5, 0, "div", 8);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(8);
        \u0275\u0275conditional(8, ctx.showCreateForm() ? 8 : 9);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(10, ctx.showCreateForm() ? 10 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275repeater(ctx.projects());
      }
    }, dependencies: [CommonModule, DatePipe, RouterLink, ReactiveFormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, FormGroupDirective, FormControlName], styles: ["\n\n.page-container[_ngcontent-%COMP%] {\n  max-width: 1152px;\n  margin: 0 auto;\n  padding: 2rem 1rem;\n}\n@media (min-width: 640px) {\n  .page-container[_ngcontent-%COMP%] {\n    padding: 2rem 1.5rem;\n  }\n}\n.page-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  margin-bottom: 2rem;\n  flex-wrap: wrap;\n  gap: 1rem;\n}\n.page-title[_ngcontent-%COMP%] {\n  font-size: 1.875rem;\n  font-weight: 900;\n  letter-spacing: -0.025em;\n}\n.page-description[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  color: var(--muted-foreground);\n  margin-top: 0.25rem;\n}\n.btn-primary[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  padding: 0.5rem 1rem;\n  border-radius: 8px;\n  border: none;\n  background: var(--primary);\n  color: var(--primary-foreground);\n  font-size: 0.875rem;\n  font-weight: 500;\n  cursor: pointer;\n  transition: opacity 0.15s;\n}\n.btn-primary[_ngcontent-%COMP%]:hover {\n  opacity: 0.9;\n}\n.btn-primary[_ngcontent-%COMP%]:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n.btn-ghost[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  padding: 0.5rem 1rem;\n  border-radius: 8px;\n  border: none;\n  background: transparent;\n  color: var(--muted-foreground);\n  font-size: 0.875rem;\n  font-weight: 500;\n  cursor: pointer;\n  transition: background 0.15s;\n}\n.btn-ghost[_ngcontent-%COMP%]:hover {\n  background: var(--accent);\n  color: var(--foreground);\n}\n.create-card[_ngcontent-%COMP%] {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  padding: 1.25rem;\n  margin-bottom: 1.5rem;\n}\n.form-row[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.75rem;\n  align-items: flex-end;\n  flex-wrap: wrap;\n}\n.form-group[_ngcontent-%COMP%] {\n  margin-bottom: 0;\n}\n.form-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.8125rem;\n  font-weight: 500;\n  margin-bottom: 0.375rem;\n}\n.flex-1[_ngcontent-%COMP%] {\n  flex: 1;\n  min-width: 200px;\n}\n.form-input[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 0.5rem 0.75rem;\n  border: 1px solid var(--input);\n  border-radius: 8px;\n  background: transparent;\n  color: var(--foreground);\n  font-size: 0.875rem;\n}\n.form-input[_ngcontent-%COMP%]::placeholder {\n  color: var(--muted-foreground);\n  opacity: 0.6;\n}\n.form-input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: var(--ring);\n}\n.form-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n}\n.projects-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));\n  gap: 1rem;\n}\n.project-card[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  justify-content: space-between;\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  padding: 1.25rem;\n  text-decoration: none;\n  color: var(--foreground);\n  transition: box-shadow 0.15s, border-color 0.15s;\n}\n.project-card[_ngcontent-%COMP%]:hover {\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);\n  border-color: oklch(0.705 0.015 286.067);\n}\n.card-top[_ngcontent-%COMP%] {\n  margin-bottom: 1rem;\n}\n.project-name[_ngcontent-%COMP%] {\n  font-size: 1rem;\n  font-weight: 600;\n  margin-bottom: 0.25rem;\n}\n.project-code[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  color: var(--muted-foreground);\n  font-family: monospace;\n}\n.card-bottom[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n.badge[_ngcontent-%COMP%] {\n  display: inline-flex;\n  padding: 0.125rem 0.625rem;\n  border-radius: 9999px;\n  font-size: 0.75rem;\n  font-weight: 500;\n}\n.badge-blue[_ngcontent-%COMP%] {\n  background: oklch(0.623 0.214 259.815 / 0.1);\n  color: var(--blue-500);\n}\n.badge-amber[_ngcontent-%COMP%] {\n  background: oklch(0.769 0.188 70.08 / 0.1);\n  color: var(--amber-500);\n}\n.badge-emerald[_ngcontent-%COMP%] {\n  background: oklch(0.696 0.17 162.48 / 0.1);\n  color: var(--emerald-500);\n}\n.badge-red[_ngcontent-%COMP%] {\n  background: oklch(0.637 0.237 25.331 / 0.1);\n  color: var(--red-500);\n}\n.badge-muted[_ngcontent-%COMP%] {\n  background: var(--muted);\n  color: var(--muted-foreground);\n}\n.project-date[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  color: var(--muted-foreground);\n}\n.empty-state[_ngcontent-%COMP%] {\n  grid-column: 1 / -1;\n  text-align: center;\n  padding: 3rem 1rem;\n  color: var(--muted-foreground);\n}\n.empty-state[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin-bottom: 0.25rem;\n}\n.empty-hint[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n}\n/*# sourceMappingURL=project-list.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ProjectListComponent, { className: "ProjectListComponent", filePath: "src\\app\\features\\projects\\list\\project-list.component.ts", lineNumber: 140 });
})();
export {
  ProjectListComponent
};
//# sourceMappingURL=chunk-5MQECOSH.js.map
