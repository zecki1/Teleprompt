import {
  ApiService
} from "./chunk-WFLGWPXD.js";
import {
  ObservabilityService
} from "./chunk-DHSNSXHE.js";
import {
  ActivatedRoute,
  RouterLink
} from "./chunk-NJ75DOAS.js";
import "./chunk-3SDTMM4U.js";
import {
  CommonModule,
  NgIf,
  inject,
  signal,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassMap,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵgetCurrentView,
  ɵɵlistener,
  ɵɵnextContext,
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

// src/app/features/projects/detail/project-detail.component.ts
var _forTrack0 = ($index, $item) => $item.id;
var _c0 = (a0) => ["/scripts", a0];
function ProjectDetailComponent_div_0_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 5);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const p_r2 = \u0275\u0275nextContext().ngIf;
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(p_r2.code);
  }
}
function ProjectDetailComponent_div_0_For_18_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 18);
    \u0275\u0275text(1, "\u{1F512} Bloqueado");
    \u0275\u0275elementEnd();
  }
}
function ProjectDetailComponent_div_0_For_18_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 12)(1, "div", 14)(2, "span", 15);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 16);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(6, "div", 17);
    \u0275\u0275template(7, ProjectDetailComponent_div_0_For_18_Conditional_7_Template, 2, 0, "span", 18);
    \u0275\u0275elementStart(8, "span", 19);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const script_r4 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275property("routerLink", \u0275\u0275pureFunction1(7, _c0, script_r4.id));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(script_r4.title);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("v", script_r4.version, "");
    \u0275\u0275advance(2);
    \u0275\u0275conditional(7, script_r4.isLocked ? 7 : -1);
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r2.getScriptBadgeClass(script_r4.status));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.getScriptStatusLabel(script_r4.status), " ");
  }
}
function ProjectDetailComponent_div_0_ForEmpty_19_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 13)(1, "p");
    \u0275\u0275text(2, "Nenhum roteiro neste projeto");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 20);
    \u0275\u0275text(4, 'Clique em "Novo Roteiro" para criar');
    \u0275\u0275elementEnd()();
  }
}
function ProjectDetailComponent_div_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 1)(1, "div", 2)(2, "div")(3, "a", 3);
    \u0275\u0275text(4, "\u2190 Projetos");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "h1", 4);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275template(7, ProjectDetailComponent_div_0_Conditional_7_Template, 2, 1, "span", 5);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(8, "button", 6);
    \u0275\u0275listener("click", function ProjectDetailComponent_div_0_Template_button_click_8_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.createScript());
    });
    \u0275\u0275text(9, "+ Novo Roteiro");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(10, "div", 7)(11, "div", 8)(12, "h2", 9);
    \u0275\u0275text(13, "Roteiros");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "span", 10);
    \u0275\u0275text(15);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(16, "div", 11);
    \u0275\u0275repeaterCreate(17, ProjectDetailComponent_div_0_For_18_Template, 10, 9, "a", 12, _forTrack0, false, ProjectDetailComponent_div_0_ForEmpty_19_Template, 5, 0, "div", 13);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const p_r2 = ctx.ngIf;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(6);
    \u0275\u0275textInterpolate(p_r2.name);
    \u0275\u0275advance();
    \u0275\u0275conditional(7, p_r2.code ? 7 : -1);
    \u0275\u0275advance(8);
    \u0275\u0275textInterpolate(ctx_r2.scripts().length);
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r2.scripts());
  }
}
var ProjectDetailComponent = class _ProjectDetailComponent {
  constructor() {
    this.route = inject(ActivatedRoute);
    this.api = inject(ApiService);
    this.observability = inject(ObservabilityService);
    this.project = signal(null);
    this.scripts = signal([]);
  }
  ngOnInit() {
    this.observability.trackPageView("project-detail");
    const id = this.route.snapshot.paramMap.get("id");
    this.api.getProject(id).subscribe({ next: (p) => this.project.set(p) });
    this.api.getScripts(id).subscribe({ next: (s) => this.scripts.set(s) });
  }
  createScript() {
    const projectId = this.route.snapshot.paramMap.get("id");
    this.api.createScript({ projectId, title: "Novo Roteiro" }).subscribe({
      next: (script) => this.scripts.update((s) => [...s, script])
    });
  }
  getScriptStatusLabel(status) {
    const labels = {
      0: "Rascunho",
      1: "Em Revis\xE3o",
      2: "Aprovado",
      3: "Gravado",
      4: "Conclu\xEDdo",
      5: "Rascunho",
      6: "Publicado"
    };
    return labels[status] || "N/A";
  }
  getScriptBadgeClass(status) {
    const classes = {
      0: "badge-muted",
      1: "badge-amber",
      2: "badge-emerald",
      3: "badge-purple",
      4: "badge-emerald",
      5: "badge-orange",
      6: "badge-blue"
    };
    return classes[status] || "badge-muted";
  }
  static {
    this.\u0275fac = function ProjectDetailComponent_Factory(t) {
      return new (t || _ProjectDetailComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ProjectDetailComponent, selectors: [["app-project-detail"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 1, vars: 1, consts: [["class", "page-container", 4, "ngIf"], [1, "page-container"], [1, "page-header"], ["routerLink", "/projects", 1, "back-link"], [1, "page-title"], [1, "item-code"], [1, "btn-primary", 3, "click"], [1, "content-card"], [1, "card-header"], [1, "card-title"], [1, "count-badge"], [1, "card-body"], [1, "list-item", 3, "routerLink"], [1, "empty-state"], [1, "list-item-main"], [1, "item-name"], [1, "item-meta"], [1, "list-item-right"], [1, "lock-badge"], [1, "badge"], [1, "empty-hint"]], template: function ProjectDetailComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, ProjectDetailComponent_div_0_Template, 20, 4, "div", 0);
      }
      if (rf & 2) {
        \u0275\u0275property("ngIf", ctx.project());
      }
    }, dependencies: [CommonModule, NgIf, RouterLink], styles: ["\n\n.page-container[_ngcontent-%COMP%] {\n  max-width: 1152px;\n  margin: 0 auto;\n  padding: 2rem 1rem;\n}\n@media (min-width: 640px) {\n  .page-container[_ngcontent-%COMP%] {\n    padding: 2rem 1.5rem;\n  }\n}\n.page-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  margin-bottom: 2rem;\n  flex-wrap: wrap;\n  gap: 1rem;\n}\n.back-link[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  color: var(--muted-foreground);\n  text-decoration: none;\n  display: block;\n  margin-bottom: 0.5rem;\n  transition: color 0.15s;\n}\n.back-link[_ngcontent-%COMP%]:hover {\n  color: var(--foreground);\n}\n.page-title[_ngcontent-%COMP%] {\n  font-size: 1.875rem;\n  font-weight: 900;\n  letter-spacing: -0.025em;\n}\n.item-code[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  color: var(--muted-foreground);\n  font-family: monospace;\n}\n.btn-primary[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  padding: 0.5rem 1rem;\n  border-radius: 8px;\n  border: none;\n  background: var(--primary);\n  color: var(--primary-foreground);\n  font-size: 0.875rem;\n  font-weight: 500;\n  cursor: pointer;\n  transition: opacity 0.15s;\n}\n.btn-primary[_ngcontent-%COMP%]:hover {\n  opacity: 0.9;\n}\n.content-card[_ngcontent-%COMP%] {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  overflow: hidden;\n}\n.card-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 1rem 1.5rem;\n  border-bottom: 1px solid var(--border);\n}\n.card-title[_ngcontent-%COMP%] {\n  font-size: 1rem;\n  font-weight: 600;\n}\n.count-badge[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 1.5rem;\n  height: 1.5rem;\n  padding: 0 0.375rem;\n  border-radius: 9999px;\n  background: var(--muted);\n  color: var(--muted-foreground);\n  font-size: 0.75rem;\n  font-weight: 500;\n}\n.card-body[_ngcontent-%COMP%] {\n  padding: 0.25rem 0;\n}\n.list-item[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0.75rem 1.5rem;\n  text-decoration: none;\n  color: var(--foreground);\n  transition: background 0.15s;\n  border-bottom: 1px solid var(--border);\n}\n.list-item[_ngcontent-%COMP%]:last-child {\n  border-bottom: none;\n}\n.list-item[_ngcontent-%COMP%]:hover {\n  background: var(--accent);\n}\n.list-item-main[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  min-width: 0;\n}\n.item-name[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  font-weight: 500;\n}\n.item-meta[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  color: var(--muted-foreground);\n  font-family: monospace;\n}\n.list-item-right[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  flex-shrink: 0;\n}\n.lock-badge[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  color: var(--amber-500);\n}\n.badge[_ngcontent-%COMP%] {\n  display: inline-flex;\n  padding: 0.125rem 0.625rem;\n  border-radius: 9999px;\n  font-size: 0.75rem;\n  font-weight: 500;\n}\n.badge-blue[_ngcontent-%COMP%] {\n  background: oklch(0.623 0.214 259.815 / 0.1);\n  color: var(--blue-500);\n}\n.badge-amber[_ngcontent-%COMP%] {\n  background: oklch(0.769 0.188 70.08 / 0.1);\n  color: var(--amber-500);\n}\n.badge-emerald[_ngcontent-%COMP%] {\n  background: oklch(0.696 0.17 162.48 / 0.1);\n  color: var(--emerald-500);\n}\n.badge-purple[_ngcontent-%COMP%] {\n  background: oklch(0.627 0.265 303.9 / 0.1);\n  color: var(--purple-500);\n}\n.badge-orange[_ngcontent-%COMP%] {\n  background: oklch(0.705 0.213 47.604 / 0.1);\n  color: var(--orange-500);\n}\n.badge-muted[_ngcontent-%COMP%] {\n  background: var(--muted);\n  color: var(--muted-foreground);\n}\n.empty-state[_ngcontent-%COMP%] {\n  text-align: center;\n  padding: 2.5rem 1rem;\n  color: var(--muted-foreground);\n}\n.empty-state[_ngcontent-%COMP%]   p[_ngcontent-%COMP%] {\n  margin-bottom: 0.25rem;\n}\n.empty-hint[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n}\n/*# sourceMappingURL=project-detail.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ProjectDetailComponent, { className: "ProjectDetailComponent", filePath: "src\\app\\features\\projects\\detail\\project-detail.component.ts", lineNumber: 118 });
})();
export {
  ProjectDetailComponent
};
//# sourceMappingURL=chunk-S7ZQJ23J.js.map
