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
  ɵɵclassMap,
  ɵɵdefineComponent,
  ɵɵelementEnd,
  ɵɵelementStart,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1
} from "./chunk-SBUHLZV6.js";

// src/app/features/admin/users/user-management.component.ts
var _forTrack0 = ($index, $item) => $item.id;
function UserManagementComponent_For_23_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td", 8);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "td", 9);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "td")(6, "span", 10);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(8, "td")(9, "span", 11);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const user_r1 = ctx.$implicit;
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(user_r1.displayName);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(user_r1.email);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(user_r1.role);
    \u0275\u0275advance(2);
    \u0275\u0275classMap(user_r1.status === "Active" ? "badge-emerald" : "badge-muted");
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", user_r1.status, " ");
  }
}
function UserManagementComponent_ForEmpty_24_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "tr")(1, "td", 12);
    \u0275\u0275text(2, "Nenhum usu\xE1rio encontrado");
    \u0275\u0275elementEnd()();
  }
}
var UserManagementComponent = class _UserManagementComponent {
  constructor() {
    this.api = inject(ApiService);
    this.observability = inject(ObservabilityService);
    this.users = signal([]);
  }
  ngOnInit() {
    this.observability.trackPageView("user-management");
    this.api.getUsers().subscribe({ next: (u) => this.users.set(u) });
  }
  static {
    this.\u0275fac = function UserManagementComponent_Factory(t) {
      return new (t || _UserManagementComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _UserManagementComponent, selectors: [["app-user-management"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 25, vars: 1, consts: [[1, "page-container"], [1, "page-header"], [1, "page-title"], [1, "page-description"], [1, "content-card"], [1, "card-body"], [1, "table-wrapper"], [1, "data-table"], [1, "font-medium"], [1, "text-muted-foreground", "text-sm"], [1, "badge", "badge-muted"], [1, "badge"], ["colspan", "4", 1, "empty-cell"]], template: function UserManagementComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div")(3, "h1", 2);
        \u0275\u0275text(4, "Gerenciamento de Usu\xE1rios");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(5, "p", 3);
        \u0275\u0275text(6, "Gerencie permiss\xF5es e acessos");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(7, "div", 4)(8, "div", 5)(9, "div", 6)(10, "table", 7)(11, "thead")(12, "tr")(13, "th");
        \u0275\u0275text(14, "Usu\xE1rio");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(15, "th");
        \u0275\u0275text(16, "E-mail");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(17, "th");
        \u0275\u0275text(18, "Fun\xE7\xE3o");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(19, "th");
        \u0275\u0275text(20, "Status");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(21, "tbody");
        \u0275\u0275repeaterCreate(22, UserManagementComponent_For_23_Template, 11, 6, "tr", null, _forTrack0, false, UserManagementComponent_ForEmpty_24_Template, 3, 0, "tr");
        \u0275\u0275elementEnd()()()()()();
      }
      if (rf & 2) {
        \u0275\u0275advance(22);
        \u0275\u0275repeater(ctx.users());
      }
    }, dependencies: [CommonModule], styles: ["\n\n.page-container[_ngcontent-%COMP%] {\n  max-width: 1152px;\n  margin: 0 auto;\n  padding: 2rem 1rem;\n}\n@media (min-width: 640px) {\n  .page-container[_ngcontent-%COMP%] {\n    padding: 2rem 1.5rem;\n  }\n}\n.page-header[_ngcontent-%COMP%] {\n  margin-bottom: 2rem;\n}\n.page-title[_ngcontent-%COMP%] {\n  font-size: 1.875rem;\n  font-weight: 900;\n  letter-spacing: -0.025em;\n}\n.page-description[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  color: var(--muted-foreground);\n  margin-top: 0.25rem;\n}\n.content-card[_ngcontent-%COMP%] {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  overflow: hidden;\n}\n.card-body[_ngcontent-%COMP%] {\n  overflow-x: auto;\n}\n.table-wrapper[_ngcontent-%COMP%] {\n  overflow-x: auto;\n}\n.data-table[_ngcontent-%COMP%] {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.875rem;\n}\n.data-table[_ngcontent-%COMP%]   th[_ngcontent-%COMP%] {\n  padding: 0.75rem 1.5rem;\n  text-align: left;\n  font-weight: 500;\n  color: var(--muted-foreground);\n  border-bottom: 1px solid var(--border);\n  background: var(--muted);\n  font-size: 0.8125rem;\n}\n.data-table[_ngcontent-%COMP%]   td[_ngcontent-%COMP%] {\n  padding: 0.75rem 1.5rem;\n  border-bottom: 1px solid var(--border);\n}\n.data-table[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]:last-child   td[_ngcontent-%COMP%] {\n  border-bottom: none;\n}\n.data-table[_ngcontent-%COMP%]   tr[_ngcontent-%COMP%]:hover   td[_ngcontent-%COMP%] {\n  background: var(--accent);\n}\n.font-medium[_ngcontent-%COMP%] {\n  font-weight: 500;\n}\n.badge[_ngcontent-%COMP%] {\n  display: inline-flex;\n  padding: 0.125rem 0.5rem;\n  border-radius: 9999px;\n  font-size: 0.75rem;\n  font-weight: 500;\n}\n.badge-muted[_ngcontent-%COMP%] {\n  background: var(--muted);\n  color: var(--muted-foreground);\n}\n.badge-emerald[_ngcontent-%COMP%] {\n  background: oklch(0.696 0.17 162.48 / 0.1);\n  color: var(--emerald-500);\n}\n.empty-cell[_ngcontent-%COMP%] {\n  text-align: center;\n  padding: 3rem !important;\n  color: var(--muted-foreground);\n}\n/*# sourceMappingURL=user-management.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(UserManagementComponent, { className: "UserManagementComponent", filePath: "src\\app\\features\\admin\\users\\user-management.component.ts", lineNumber: 78 });
})();
export {
  UserManagementComponent
};
//# sourceMappingURL=chunk-IEBVPMXW.js.map
