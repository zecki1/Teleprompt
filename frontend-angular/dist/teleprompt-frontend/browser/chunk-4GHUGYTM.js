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
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtextInterpolate2
} from "./chunk-SBUHLZV6.js";

// src/app/features/scripts/list/script-list.component.ts
var _forTrack0 = ($index, $item) => $item.id;
var _c0 = (a0) => ["/scripts", a0];
function ScriptListComponent_For_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "a", 6)(1, "div", 8)(2, "span", 9);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 10);
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "date");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "span", 11);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const script_r1 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275property("routerLink", \u0275\u0275pureFunction1(10, _c0, script_r1.id));
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(script_r1.title);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate2("v", script_r1.version, " \xB7 ", \u0275\u0275pipeBind2(6, 7, script_r1.updatedAt, "short"), "");
    \u0275\u0275advance(2);
    \u0275\u0275classMap(ctx_r1.getBadgeClass(script_r1.status));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r1.getStatusLabel(script_r1.status), " ");
  }
}
function ScriptListComponent_ForEmpty_10_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 7)(1, "p");
    \u0275\u0275text(2, "Nenhum roteiro encontrado");
    \u0275\u0275elementEnd()();
  }
}
var ScriptListComponent = class _ScriptListComponent {
  constructor() {
    this.api = inject(ApiService);
    this.observability = inject(ObservabilityService);
    this.scripts = signal([]);
  }
  ngOnInit() {
    this.observability.trackPageView("script-list");
    this.api.getScripts().subscribe({ next: (s) => this.scripts.set(s) });
  }
  getStatusLabel(status) {
    const labels = { 0: "Rascunho", 1: "Em Revis\xE3o", 2: "Aprovado", 3: "Gravado", 4: "Conclu\xEDdo" };
    return labels[status] || "N/A";
  }
  getBadgeClass(status) {
    const classes = { 0: "badge-muted", 1: "badge-amber", 2: "badge-emerald", 3: "badge-purple", 4: "badge-emerald" };
    return classes[status] || "badge-muted";
  }
  static {
    this.\u0275fac = function ScriptListComponent_Factory(t) {
      return new (t || _ScriptListComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ScriptListComponent, selectors: [["app-script-list"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 11, vars: 1, consts: [[1, "page-container"], [1, "page-header"], [1, "page-title"], [1, "page-description"], [1, "content-card"], [1, "card-body"], [1, "list-item", 3, "routerLink"], [1, "empty-state"], [1, "list-item-main"], [1, "item-name"], [1, "item-meta"], [1, "badge"]], template: function ScriptListComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h1", 2);
        \u0275\u0275text(3, "Roteiros");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "p", 3);
        \u0275\u0275text(5, "Todos os seus roteiros");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(6, "div", 4)(7, "div", 5);
        \u0275\u0275repeaterCreate(8, ScriptListComponent_For_9_Template, 9, 12, "a", 6, _forTrack0, false, ScriptListComponent_ForEmpty_10_Template, 3, 0, "div", 7);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(8);
        \u0275\u0275repeater(ctx.scripts());
      }
    }, dependencies: [CommonModule, DatePipe, RouterLink], styles: ["\n\n.page-container[_ngcontent-%COMP%] {\n  max-width: 1152px;\n  margin: 0 auto;\n  padding: 2rem 1rem;\n}\n@media (min-width: 640px) {\n  .page-container[_ngcontent-%COMP%] {\n    padding: 2rem 1.5rem;\n  }\n}\n.page-header[_ngcontent-%COMP%] {\n  margin-bottom: 2rem;\n}\n.page-title[_ngcontent-%COMP%] {\n  font-size: 1.875rem;\n  font-weight: 900;\n  letter-spacing: -0.025em;\n}\n.page-description[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  color: var(--muted-foreground);\n  margin-top: 0.25rem;\n}\n.content-card[_ngcontent-%COMP%] {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  overflow: hidden;\n}\n.card-body[_ngcontent-%COMP%] {\n  padding: 0.25rem 0;\n}\n.list-item[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0.75rem 1.5rem;\n  text-decoration: none;\n  color: var(--foreground);\n  transition: background 0.15s;\n  border-bottom: 1px solid var(--border);\n}\n.list-item[_ngcontent-%COMP%]:last-child {\n  border-bottom: none;\n}\n.list-item[_ngcontent-%COMP%]:hover {\n  background: var(--accent);\n}\n.list-item-main[_ngcontent-%COMP%] {\n  min-width: 0;\n}\n.item-name[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.875rem;\n  font-weight: 500;\n}\n.item-meta[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.75rem;\n  color: var(--muted-foreground);\n  margin-top: 2px;\n}\n.badge[_ngcontent-%COMP%] {\n  display: inline-flex;\n  padding: 0.125rem 0.625rem;\n  border-radius: 9999px;\n  font-size: 0.75rem;\n  font-weight: 500;\n  flex-shrink: 0;\n}\n.badge-muted[_ngcontent-%COMP%] {\n  background: var(--muted);\n  color: var(--muted-foreground);\n}\n.badge-amber[_ngcontent-%COMP%] {\n  background: oklch(0.769 0.188 70.08 / 0.1);\n  color: var(--amber-500);\n}\n.badge-emerald[_ngcontent-%COMP%] {\n  background: oklch(0.696 0.17 162.48 / 0.1);\n  color: var(--emerald-500);\n}\n.badge-purple[_ngcontent-%COMP%] {\n  background: oklch(0.627 0.265 303.9 / 0.1);\n  color: var(--purple-500);\n}\n.empty-state[_ngcontent-%COMP%] {\n  text-align: center;\n  padding: 3rem 1rem;\n  color: var(--muted-foreground);\n}\n/*# sourceMappingURL=script-list.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ScriptListComponent, { className: "ScriptListComponent", filePath: "src\\app\\features\\scripts\\list\\script-list.component.ts", lineNumber: 70 });
})();
export {
  ScriptListComponent
};
//# sourceMappingURL=chunk-4GHUGYTM.js.map
