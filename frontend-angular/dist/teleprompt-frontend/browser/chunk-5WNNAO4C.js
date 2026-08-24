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
  ɵɵclassMap,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵlistener,
  ɵɵnextContext,
  ɵɵpipe,
  ɵɵpipeBind2,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-SBUHLZV6.js";

// src/app/features/admin/debug-logs/debug-logs.component.ts
var _forTrack0 = ($index, $item) => $item.id;
function DebugLogsComponent_For_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 7)(1, "span", 9);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "span", 10);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 11);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "span", 12);
    \u0275\u0275text(8);
    \u0275\u0275pipe(9, "date");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const log_r1 = ctx.$implicit;
    const ctx_r1 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275classMap(ctx_r1.getBadgeClass(log_r1.level));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r1.getLogLevelLabel(log_r1.level));
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(log_r1.source);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(log_r1.message);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(9, 6, log_r1.createdAt, "short"));
  }
}
function DebugLogsComponent_ForEmpty_13_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 8)(1, "p");
    \u0275\u0275text(2, "Nenhum log encontrado");
    \u0275\u0275elementEnd()();
  }
}
var DebugLogsComponent = class _DebugLogsComponent {
  constructor() {
    this.api = inject(ApiService);
    this.observability = inject(ObservabilityService);
    this.logs = signal([]);
  }
  ngOnInit() {
    this.observability.trackPageView("debug-logs");
    this.loadLogs();
  }
  loadLogs() {
    this.api.getDebugLogs(200).subscribe({ next: (logs) => this.logs.set(logs) });
  }
  getLogLevelLabel(level) {
    const labels = { 0: "DEBUG", 1: "INFO", 2: "WARN", 3: "ERROR", 4: "FATAL" };
    return labels[level] || "UNKNOWN";
  }
  getBadgeClass(level) {
    const classes = { 0: "badge-muted", 1: "badge-blue", 2: "badge-amber", 3: "badge-red", 4: "badge-red" };
    return classes[level] || "badge-muted";
  }
  static {
    this.\u0275fac = function DebugLogsComponent_Factory(t) {
      return new (t || _DebugLogsComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DebugLogsComponent, selectors: [["app-debug-logs"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 14, vars: 1, consts: [[1, "page-container"], [1, "page-header"], [1, "page-title"], [1, "page-description"], [1, "btn-outline", 3, "click"], [1, "content-card"], [1, "card-body"], [1, "log-item"], [1, "empty-state"], [1, "badge"], [1, "log-source"], [1, "log-message"], [1, "log-time"]], template: function DebugLogsComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div")(3, "h1", 2);
        \u0275\u0275text(4, "Logs de Debug");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "p", 3);
        \u0275\u0275text(6, "Visualize logs de depura\xE7\xE3o do sistema");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(7, "button", 4);
        \u0275\u0275listener("click", function DebugLogsComponent_Template_button_click_7_listener() {
          return ctx.loadLogs();
        });
        \u0275\u0275text(8, "Atualizar");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(9, "div", 5)(10, "div", 6);
        \u0275\u0275repeaterCreate(11, DebugLogsComponent_For_12_Template, 10, 9, "div", 7, _forTrack0, false, DebugLogsComponent_ForEmpty_13_Template, 3, 0, "div", 8);
        \u0275\u0275elementEnd()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(11);
        \u0275\u0275repeater(ctx.logs());
      }
    }, dependencies: [CommonModule, DatePipe], styles: ["\n\n.page-container[_ngcontent-%COMP%] {\n  max-width: 1152px;\n  margin: 0 auto;\n  padding: 2rem 1rem;\n}\n@media (min-width: 640px) {\n  .page-container[_ngcontent-%COMP%] {\n    padding: 2rem 1.5rem;\n  }\n}\n.page-header[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: flex-start;\n  margin-bottom: 2rem;\n  flex-wrap: wrap;\n  gap: 1rem;\n}\n.page-title[_ngcontent-%COMP%] {\n  font-size: 1.875rem;\n  font-weight: 900;\n  letter-spacing: -0.025em;\n}\n.page-description[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  color: var(--muted-foreground);\n  margin-top: 0.25rem;\n}\n.btn-outline[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  padding: 0.5rem 1rem;\n  border-radius: 8px;\n  border: 1px solid var(--border);\n  background: transparent;\n  color: var(--foreground);\n  font-size: 0.875rem;\n  font-weight: 500;\n  cursor: pointer;\n}\n.btn-outline[_ngcontent-%COMP%]:hover {\n  background: var(--accent);\n}\n.content-card[_ngcontent-%COMP%] {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  overflow: hidden;\n}\n.card-body[_ngcontent-%COMP%] {\n  padding: 0.25rem 0;\n}\n.log-item[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  padding: 0.625rem 1.5rem;\n  border-bottom: 1px solid var(--border);\n  font-family: monospace;\n  font-size: 0.8125rem;\n}\n.log-item[_ngcontent-%COMP%]:last-child {\n  border-bottom: none;\n}\n.log-source[_ngcontent-%COMP%] {\n  color: var(--emerald-500);\n  min-width: 80px;\n}\n.log-message[_ngcontent-%COMP%] {\n  color: var(--foreground);\n  flex: 1;\n}\n.log-time[_ngcontent-%COMP%] {\n  color: var(--muted-foreground);\n  font-size: 0.75rem;\n  flex-shrink: 0;\n}\n.badge[_ngcontent-%COMP%] {\n  display: inline-flex;\n  padding: 0.125rem 0.5rem;\n  border-radius: 9999px;\n  font-size: 0.6875rem;\n  font-weight: 600;\n  text-transform: uppercase;\n  flex-shrink: 0;\n}\n.badge-muted[_ngcontent-%COMP%] {\n  background: var(--muted);\n  color: var(--muted-foreground);\n}\n.badge-blue[_ngcontent-%COMP%] {\n  background: oklch(0.623 0.214 259.815 / 0.1);\n  color: var(--blue-500);\n}\n.badge-amber[_ngcontent-%COMP%] {\n  background: oklch(0.769 0.188 70.08 / 0.1);\n  color: var(--amber-500);\n}\n.badge-red[_ngcontent-%COMP%] {\n  background: oklch(0.637 0.237 25.331 / 0.1);\n  color: var(--red-500);\n}\n.empty-state[_ngcontent-%COMP%] {\n  text-align: center;\n  padding: 3rem 1rem;\n  color: var(--muted-foreground);\n}\n/*# sourceMappingURL=debug-logs.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DebugLogsComponent, { className: "DebugLogsComponent", filePath: "src\\app\\features\\admin\\debug-logs\\debug-logs.component.ts", lineNumber: 63 });
})();
export {
  DebugLogsComponent
};
//# sourceMappingURL=chunk-5WNNAO4C.js.map
