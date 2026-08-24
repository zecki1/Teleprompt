import {
  ApiService
} from "./chunk-WFLGWPXD.js";
import {
  ObservabilityService
} from "./chunk-DHSNSXHE.js";
import "./chunk-3SDTMM4U.js";
import {
  CommonModule,
  inject,
  signal,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵdefineComponent,
  ɵɵelement,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵstyleProp,
  ɵɵtext,
  ɵɵtextInterpolate
} from "./chunk-SBUHLZV6.js";

// src/app/features/reports/reports.component.ts
var _forTrack0 = ($index, $item) => $item.label;
function ReportsComponent_For_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 5)(1, "p", 13);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 14);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const stat_r1 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(stat_r1.label);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(stat_r1.value);
  }
}
function ReportsComponent_For_16_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 11)(1, "span", 15);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 16);
    \u0275\u0275element(4, "div", 17);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 18);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const bar_r2 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(bar_r2.label);
    \u0275\u0275advance(2);
    \u0275\u0275styleProp("width", bar_r2.percent, "%")("background", bar_r2.color);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(bar_r2.count);
  }
}
function ReportsComponent_ForEmpty_17_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 12)(1, "p");
    \u0275\u0275text(2, "Sem dados dispon\xEDveis");
    \u0275\u0275elementEnd()();
  }
}
var ReportsComponent = class _ReportsComponent {
  constructor() {
    this.api = inject(ApiService);
    this.observability = inject(ObservabilityService);
    this.stats = signal([]);
    this.statusBars = signal([]);
  }
  ngOnInit() {
    this.observability.trackPageView("reports");
    this.api.getReports().subscribe({
      next: (data) => {
        this.stats.set([
          { label: "Total de Projetos", value: data.totalProjects || 0 },
          { label: "Total de Roteiros", value: data.totalScripts || 0 },
          { label: "Roteiros Gravados", value: data.recordedScripts || 0 },
          { label: "Usu\xE1rios Ativos", value: data.activeUsers || 0 }
        ]);
        if (data.scriptsByStatus) {
          const max = Math.max(...Object.values(data.scriptsByStatus).map((v) => Number(v)), 1);
          const colorMap = {
            "Rascunho": "#71717a",
            "Em Revis\xE3o": "#f59e0b",
            "Aprovado": "#10b981",
            "Gravado": "#8b5cf6",
            "Conclu\xEDdo": "#10b981"
          };
          this.statusBars.set(Object.entries(data.scriptsByStatus).map(([k, v]) => ({
            label: k,
            count: Number(v),
            percent: Number(v) / max * 100,
            color: colorMap[k] || "#71717a"
          })));
        }
      },
      error: () => {
        this.stats.set([
          { label: "Total de Projetos", value: "\u2014" },
          { label: "Total de Roteiros", value: "\u2014" },
          { label: "Roteiros Gravados", value: "\u2014" },
          { label: "Usu\xE1rios Ativos", value: "\u2014" }
        ]);
      }
    });
  }
  static {
    this.\u0275fac = function ReportsComponent_Factory(t) {
      return new (t || _ReportsComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ReportsComponent, selectors: [["app-reports"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 18, vars: 1, consts: [[1, "page-container"], [1, "page-header"], [1, "page-title"], [1, "page-description"], [1, "stats-grid"], [1, "stat-card"], [1, "content-grid"], [1, "content-card"], [1, "card-header"], [1, "card-title"], [1, "card-body"], [1, "chart-bar-row"], [1, "empty-state"], [1, "stat-label"], [1, "stat-value"], [1, "bar-label"], [1, "bar-track"], [1, "bar-fill"], [1, "bar-value"]], template: function ReportsComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "h1", 2);
        \u0275\u0275text(3, "Relat\xF3rios");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(4, "p", 3);
        \u0275\u0275text(5, "M\xE9tricas e insights dos seus projetos");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(6, "div", 4);
        \u0275\u0275repeaterCreate(7, ReportsComponent_For_8_Template, 5, 2, "div", 5, _forTrack0);
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(9, "div", 6)(10, "div", 7)(11, "div", 8)(12, "h2", 9);
        \u0275\u0275text(13, "Roteiros por Status");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(14, "div", 10);
        \u0275\u0275repeaterCreate(15, ReportsComponent_For_16_Template, 7, 6, "div", 11, _forTrack0, false, ReportsComponent_ForEmpty_17_Template, 3, 0, "div", 12);
        \u0275\u0275elementEnd()()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(7);
        \u0275\u0275repeater(ctx.stats());
        \u0275\u0275advance(8);
        \u0275\u0275repeater(ctx.statusBars());
      }
    }, dependencies: [CommonModule], styles: ["\n\n.page-container[_ngcontent-%COMP%] {\n  max-width: 1152px;\n  margin: 0 auto;\n  padding: 2rem 1rem;\n}\n@media (min-width: 640px) {\n  .page-container[_ngcontent-%COMP%] {\n    padding: 2rem 1.5rem;\n  }\n}\n.page-header[_ngcontent-%COMP%] {\n  margin-bottom: 2rem;\n}\n.page-title[_ngcontent-%COMP%] {\n  font-size: 1.875rem;\n  font-weight: 900;\n  letter-spacing: -0.025em;\n}\n.page-description[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  color: var(--muted-foreground);\n  margin-top: 0.25rem;\n}\n.stats-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));\n  gap: 1rem;\n  margin-bottom: 2rem;\n}\n.stat-card[_ngcontent-%COMP%] {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  padding: 1.5rem;\n}\n.stat-label[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  font-weight: 500;\n  color: var(--muted-foreground);\n  margin-bottom: 0.25rem;\n}\n.stat-value[_ngcontent-%COMP%] {\n  font-size: 2rem;\n  font-weight: 800;\n  letter-spacing: -0.025em;\n}\n.content-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));\n  gap: 1.5rem;\n}\n@media (max-width: 768px) {\n  .content-grid[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n}\n.content-card[_ngcontent-%COMP%] {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  overflow: hidden;\n}\n.card-header[_ngcontent-%COMP%] {\n  padding: 1rem 1.5rem;\n  border-bottom: 1px solid var(--border);\n}\n.card-title[_ngcontent-%COMP%] {\n  font-size: 1rem;\n  font-weight: 600;\n}\n.card-body[_ngcontent-%COMP%] {\n  padding: 1.25rem 1.5rem;\n}\n.chart-bar-row[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  margin-bottom: 0.75rem;\n}\n.chart-bar-row[_ngcontent-%COMP%]:last-child {\n  margin-bottom: 0;\n}\n.bar-label[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  font-weight: 500;\n  min-width: 100px;\n}\n.bar-track[_ngcontent-%COMP%] {\n  flex: 1;\n  height: 8px;\n  background: var(--muted);\n  border-radius: 9999px;\n  overflow: hidden;\n}\n.bar-fill[_ngcontent-%COMP%] {\n  height: 100%;\n  border-radius: 9999px;\n  transition: width 0.3s ease;\n}\n.bar-value[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  font-weight: 600;\n  min-width: 2rem;\n  text-align: right;\n}\n.empty-state[_ngcontent-%COMP%] {\n  text-align: center;\n  padding: 2rem;\n  color: var(--muted-foreground);\n}\n/*# sourceMappingURL=reports.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ReportsComponent, { className: "ReportsComponent", filePath: "src\\app\\features\\reports\\reports.component.ts", lineNumber: 73 });
})();
export {
  ReportsComponent
};
//# sourceMappingURL=chunk-47SLOMEK.js.map
