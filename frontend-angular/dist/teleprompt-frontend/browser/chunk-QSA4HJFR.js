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
import "./chunk-NJ75DOAS.js";
import "./chunk-3SDTMM4U.js";
import {
  CommonModule,
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

// src/app/features/teams/team-list.component.ts
var _forTrack0 = ($index, $item) => $item.id;
function TeamListComponent_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " Fechar ");
  }
}
function TeamListComponent_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " + Novo Time ");
  }
}
function TeamListComponent_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 5)(1, "form", 9);
    \u0275\u0275listener("ngSubmit", function TeamListComponent_Conditional_10_Template_form_ngSubmit_1_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.createTeam());
    });
    \u0275\u0275elementStart(2, "div", 10)(3, "div", 11)(4, "label");
    \u0275\u0275text(5, "Nome do Time");
    \u0275\u0275elementEnd();
    \u0275\u0275element(6, "input", 12);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 13)(8, "button", 14);
    \u0275\u0275text(9, "Criar");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "button", 15);
    \u0275\u0275listener("click", function TeamListComponent_Conditional_10_Template_button_click_10_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r1 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r1.showCreateForm.set(false));
    });
    \u0275\u0275text(11, "Cancelar");
    \u0275\u0275elementEnd()()()()();
  }
  if (rf & 2) {
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275property("formGroup", ctx_r1.teamForm);
    \u0275\u0275advance(7);
    \u0275\u0275property("disabled", ctx_r1.teamForm.invalid);
  }
}
function TeamListComponent_For_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 7)(1, "h3", 16);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 17);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const team_r3 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(team_r3.name);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", team_r3.memberCount || 0, " membros");
  }
}
function TeamListComponent_ForEmpty_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8)(1, "p");
    \u0275\u0275text(2, "Nenhum time encontrado");
    \u0275\u0275elementEnd()();
  }
}
var TeamListComponent = class _TeamListComponent {
  constructor() {
    this.api = inject(ApiService);
    this.observability = inject(ObservabilityService);
    this.fb = inject(FormBuilder);
    this.teams = signal([]);
    this.showCreateForm = signal(false);
    this.teamForm = this.fb.group({ name: ["", Validators.required] });
  }
  ngOnInit() {
    this.observability.trackPageView("team-list");
    this.api.getTeams().subscribe({ next: (t) => this.teams.set(t) });
  }
  createTeam() {
    if (this.teamForm.valid) {
      this.api.createTeam(this.teamForm.value).subscribe({
        next: () => {
          this.api.getTeams().subscribe({ next: (t) => this.teams.set(t) });
          this.showCreateForm.set(false);
          this.teamForm.reset();
        }
      });
    }
  }
  static {
    this.\u0275fac = function TeamListComponent_Factory(t) {
      return new (t || _TeamListComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TeamListComponent, selectors: [["app-team-list"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 15, vars: 3, consts: [[1, "page-container"], [1, "page-header"], [1, "page-title"], [1, "page-description"], [1, "btn-primary", 3, "click"], [1, "create-card", "animate-slide-down"], [1, "projects-grid"], [1, "project-card"], [1, "empty-state"], [1, "create-form", 3, "ngSubmit", "formGroup"], [1, "form-row"], [1, "form-group", "flex-1"], ["formControlName", "name", "placeholder", "Ex: Equipe Alpha", 1, "form-input"], [1, "form-actions"], ["type", "submit", 1, "btn-primary", 3, "disabled"], ["type", "button", 1, "btn-ghost", 3, "click"], [1, "project-name"], [1, "project-meta"]], template: function TeamListComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div")(3, "h1", 2);
        \u0275\u0275text(4, "Times");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "p", 3);
        \u0275\u0275text(6, "Gerencie seus times de trabalho");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(7, "button", 4);
        \u0275\u0275listener("click", function TeamListComponent_Template_button_click_7_listener() {
          return ctx.showCreateForm.set(!ctx.showCreateForm());
        });
        \u0275\u0275template(8, TeamListComponent_Conditional_8_Template, 1, 0)(9, TeamListComponent_Conditional_9_Template, 1, 0);
        \u0275\u0275elementEnd()();
        \u0275\u0275template(10, TeamListComponent_Conditional_10_Template, 12, 2, "div", 5);
        \u0275\u0275elementStart(11, "div", 6);
        \u0275\u0275repeaterCreate(12, TeamListComponent_For_13_Template, 5, 2, "div", 7, _forTrack0, false, TeamListComponent_ForEmpty_14_Template, 3, 0, "div", 8);
        \u0275\u0275elementEnd()();
      }
      if (rf & 2) {
        \u0275\u0275advance(8);
        \u0275\u0275conditional(8, ctx.showCreateForm() ? 8 : 9);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(10, ctx.showCreateForm() ? 10 : -1);
        \u0275\u0275advance(2);
        \u0275\u0275repeater(ctx.teams());
      }
    }, dependencies: [CommonModule, ReactiveFormsModule, \u0275NgNoValidate, DefaultValueAccessor, NgControlStatus, NgControlStatusGroup, FormGroupDirective, FormControlName], styles: ["\n\n.page-container[_ngcontent-%COMP%] {\n  max-width: 1152px;\n  margin: 0 auto;\n  padding: 2rem 1rem;\n}\n@media (min-width: 640px) {\n  .page-container[_ngcontent-%COMP%] {\n    padding: 2rem 1.5rem;\n  }\n}\n.page-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  margin-bottom: 2rem;\n  flex-wrap: wrap;\n  gap: 1rem;\n}\n.page-title[_ngcontent-%COMP%] {\n  font-size: 1.875rem;\n  font-weight: 900;\n  letter-spacing: -0.025em;\n}\n.page-description[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  color: var(--muted-foreground);\n  margin-top: 0.25rem;\n}\n.btn-primary[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  padding: 0.5rem 1rem;\n  border-radius: 8px;\n  border: none;\n  background: var(--primary);\n  color: var(--primary-foreground);\n  font-size: 0.875rem;\n  font-weight: 500;\n  cursor: pointer;\n}\n.btn-primary[_ngcontent-%COMP%]:hover {\n  opacity: 0.9;\n}\n.btn-primary[_ngcontent-%COMP%]:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n.btn-ghost[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  padding: 0.5rem 1rem;\n  border-radius: 8px;\n  border: none;\n  background: transparent;\n  color: var(--muted-foreground);\n  font-size: 0.875rem;\n  font-weight: 500;\n  cursor: pointer;\n}\n.btn-ghost[_ngcontent-%COMP%]:hover {\n  background: var(--accent);\n  color: var(--foreground);\n}\n.create-card[_ngcontent-%COMP%] {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  padding: 1.25rem;\n  margin-bottom: 1.5rem;\n}\n.form-row[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.75rem;\n  align-items: flex-end;\n  flex-wrap: wrap;\n}\n.form-group[_ngcontent-%COMP%] {\n  margin-bottom: 0;\n}\n.form-group[_ngcontent-%COMP%]   label[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.8125rem;\n  font-weight: 500;\n  margin-bottom: 0.375rem;\n}\n.flex-1[_ngcontent-%COMP%] {\n  flex: 1;\n  min-width: 200px;\n}\n.form-input[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 0.5rem 0.75rem;\n  border: 1px solid var(--input);\n  border-radius: 8px;\n  background: transparent;\n  color: var(--foreground);\n  font-size: 0.875rem;\n}\n.form-input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: var(--ring);\n}\n.form-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n}\n.projects-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));\n  gap: 1rem;\n}\n.project-card[_ngcontent-%COMP%] {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  padding: 1.25rem;\n}\n.project-name[_ngcontent-%COMP%] {\n  font-size: 1rem;\n  font-weight: 600;\n  margin-bottom: 0.25rem;\n}\n.project-meta[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  color: var(--muted-foreground);\n}\n.empty-state[_ngcontent-%COMP%] {\n  grid-column: 1 / -1;\n  text-align: center;\n  padding: 3rem 1rem;\n  color: var(--muted-foreground);\n}\n/*# sourceMappingURL=team-list.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TeamListComponent, { className: "TeamListComponent", filePath: "src\\app\\features\\teams\\team-list.component.ts", lineNumber: 79 });
})();
export {
  TeamListComponent
};
//# sourceMappingURL=chunk-QSA4HJFR.js.map
