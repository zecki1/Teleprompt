import {
  ScriptStatus
} from "./chunk-SVMZWXYP.js";
import {
  AuthService
} from "./chunk-AJEFXTFW.js";
import {
  DefaultValueAccessor,
  FormsModule,
  NgControlStatus,
  NgModel
} from "./chunk-2IPTFUKK.js";
import {
  ApiService
} from "./chunk-WFLGWPXD.js";
import {
  ObservabilityService
} from "./chunk-DHSNSXHE.js";
import {
  Router,
  RouterLink
} from "./chunk-NJ75DOAS.js";
import "./chunk-3SDTMM4U.js";
import {
  CommonModule,
  DatePipe,
  computed,
  inject,
  signal,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassProp,
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
  ɵɵpureFunction0,
  ɵɵpureFunction1,
  ɵɵrepeater,
  ɵɵrepeaterCreate,
  ɵɵrepeaterTrackByIdentity,
  ɵɵresetView,
  ɵɵrestoreView,
  ɵɵstyleProp,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-SBUHLZV6.js";

// src/app/features/dashboard/dashboard.component.ts
var _forTrack0 = ($index, $item) => $item.key;
var _forTrack1 = ($index, $item) => $item.id;
var _forTrack2 = ($index, $item) => $item.projectName;
var _c0 = () => [1, 2, 3];
var _c1 = (a0) => ["/scripts", a0];
function DashboardComponent_Conditional_30_For_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 23);
  }
}
function DashboardComponent_Conditional_30_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, DashboardComponent_Conditional_30_For_1_Template, 1, 0, "div", 23, \u0275\u0275repeaterTrackByIdentity);
  }
  if (rf & 2) {
    \u0275\u0275repeater(\u0275\u0275pureFunction0(0, _c0));
  }
}
function DashboardComponent_Conditional_31_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 24)(1, "p", 25);
    \u0275\u0275text(2, "Nenhum projeto vinculado a este workspace.");
    \u0275\u0275elementEnd()();
  }
}
function DashboardComponent_Conditional_32_For_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 27);
    \u0275\u0275listener("click", function DashboardComponent_Conditional_32_For_1_Template_div_click_0_listener() {
      const project_r2 = \u0275\u0275restoreView(_r1).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.toggleProjectFilter(project_r2));
    });
    \u0275\u0275elementStart(1, "div", 28)(2, "span", 29);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "p", 30);
    \u0275\u0275text(5);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const project_r2 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275classProp("active", ctx_r2.projectIdFilter() === project_r2.id);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("active-badge", ctx_r2.projectIdFilter() === project_r2.id);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", project_r2.code || "PRJ", " ");
    \u0275\u0275advance();
    \u0275\u0275classProp("active-name", ctx_r2.projectIdFilter() === project_r2.id);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", project_r2.name, " ");
  }
}
function DashboardComponent_Conditional_32_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, DashboardComponent_Conditional_32_For_1_Template, 6, 8, "div", 26, _forTrack1);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275repeater(ctx_r2.projects());
  }
}
function DashboardComponent_For_37_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 19);
    \u0275\u0275listener("click", function DashboardComponent_For_37_Template_button_click_0_listener() {
      const entry_r5 = \u0275\u0275restoreView(_r4).$implicit;
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.statusFilter.set(entry_r5.key));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const entry_r5 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275classProp("filter-active", ctx_r2.statusFilter() === entry_r5.key);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", entry_r5.config.label, " ");
  }
}
function DashboardComponent_Conditional_38_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 21);
    \u0275\u0275element(1, "div", 31);
    \u0275\u0275elementStart(2, "p", 25);
    \u0275\u0275text(3, "Carregando...");
    \u0275\u0275elementEnd()();
  }
}
function DashboardComponent_Conditional_39_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 32)(1, "div", 33)(2, "span");
    \u0275\u0275text(3, "\u{1F4C4}");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "h3", 34);
    \u0275\u0275text(5, "Voc\xEA n\xE3o tem nenhum roteiro");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "p", 35);
    \u0275\u0275text(7, "Clique em um projeto e crie agora seu primeiro roteiro para come\xE7ar a gravar!");
    \u0275\u0275elementEnd()();
  }
}
function DashboardComponent_Conditional_40_For_1_Conditional_14_For_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 46)(1, "div", 47);
    \u0275\u0275element(2, "span", 48);
    \u0275\u0275elementStart(3, "span", 49);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(5, "a", 50);
    \u0275\u0275text(6);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 51)(8, "span");
    \u0275\u0275text(9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "span", 52);
    \u0275\u0275text(11, "\xB7");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(12, "span");
    \u0275\u0275text(13);
    \u0275\u0275pipe(14, "date");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(15, "div", 53)(16, "button", 54);
    \u0275\u0275listener("click", function DashboardComponent_Conditional_40_For_1_Conditional_14_For_2_Template_button_click_16_listener() {
      const script_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.openEditor(script_r9.id));
    });
    \u0275\u0275text(17, "\u270F");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "button", 55);
    \u0275\u0275listener("click", function DashboardComponent_Conditional_40_For_1_Conditional_14_For_2_Template_button_click_18_listener() {
      const script_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.openTeleprompter(script_r9.id));
    });
    \u0275\u0275text(19, "\u25B6");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(20, "button", 56);
    \u0275\u0275listener("click", function DashboardComponent_Conditional_40_For_1_Conditional_14_For_2_Template_button_click_20_listener() {
      const script_r9 = \u0275\u0275restoreView(_r8).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.confirmDelete(script_r9.id));
    });
    \u0275\u0275text(21, "\u{1F5D1}");
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const script_r9 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(4);
    \u0275\u0275advance(2);
    \u0275\u0275styleProp("background", ctx_r2.getStatusConfig(script_r9.status).color);
    \u0275\u0275advance();
    \u0275\u0275styleProp("color", ctx_r2.getStatusConfig(script_r9.status).color);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.getStatusConfig(script_r9.status).label, " ");
    \u0275\u0275advance();
    \u0275\u0275property("routerLink", \u0275\u0275pureFunction1(12, _c1, script_r9.id));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(script_r9.title);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("v", script_r9.version, "");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(14, 9, script_r9.updatedAt, "dd/MM/yyyy"));
  }
}
function DashboardComponent_Conditional_40_For_1_Conditional_14_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 45);
    \u0275\u0275repeaterCreate(1, DashboardComponent_Conditional_40_For_1_Conditional_14_For_2_Template, 22, 14, "div", 46, _forTrack1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const group_r7 = \u0275\u0275nextContext().$implicit;
    \u0275\u0275advance();
    \u0275\u0275repeater(group_r7.scripts);
  }
}
function DashboardComponent_Conditional_40_For_1_Template(rf, ctx) {
  if (rf & 1) {
    const _r6 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 36)(1, "div", 37);
    \u0275\u0275listener("click", function DashboardComponent_Conditional_40_For_1_Template_div_click_1_listener() {
      const group_r7 = \u0275\u0275restoreView(_r6).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.toggleCollapse(group_r7.projectName));
    });
    \u0275\u0275elementStart(2, "div", 38)(3, "span", 39);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "div", 40);
    \u0275\u0275text(6, "\u{1F4BC}");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "h2", 41);
    \u0275\u0275text(8);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "span", 42);
    \u0275\u0275text(10);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "div", 43)(12, "button", 44);
    \u0275\u0275listener("click", function DashboardComponent_Conditional_40_For_1_Template_button_click_12_listener($event) {
      const group_r7 = \u0275\u0275restoreView(_r6).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.createScriptInProject(group_r7.projectName, $event));
    });
    \u0275\u0275text(13, " \uFF0B Roteiro ");
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(14, DashboardComponent_Conditional_40_For_1_Conditional_14_Template, 3, 0, "div", 45);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const group_r7 = ctx.$implicit;
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(ctx_r2.collapsedProjects().has(group_r7.projectName) ? "\u203A" : "\u25BE");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(group_r7.projectName);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(group_r7.scripts.length);
    \u0275\u0275advance(4);
    \u0275\u0275conditional(14, !ctx_r2.collapsedProjects().has(group_r7.projectName) ? 14 : -1);
  }
}
function DashboardComponent_Conditional_40_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275repeaterCreate(0, DashboardComponent_Conditional_40_For_1_Template, 15, 4, "div", 36, _forTrack2);
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275repeater(ctx_r2.scriptsByProject());
  }
}
function DashboardComponent_Conditional_41_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 57);
    \u0275\u0275listener("click", function DashboardComponent_Conditional_41_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.showCreateProject.set(false));
    });
    \u0275\u0275elementStart(1, "div", 58);
    \u0275\u0275listener("click", function DashboardComponent_Conditional_41_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r10);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(2, "h3", 59);
    \u0275\u0275text(3, "Novo Projeto");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "p", 60);
    \u0275\u0275text(5, "O projeto ser\xE1 criado no Teleprompt.");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 61)(7, "div", 62)(8, "label", 63);
    \u0275\u0275text(9, "Nome do Projeto");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "input", 64);
    \u0275\u0275twoWayListener("ngModelChange", function DashboardComponent_Conditional_41_Template_input_ngModelChange_10_listener($event) {
      \u0275\u0275restoreView(_r10);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.newProjectName, $event) || (ctx_r2.newProjectName = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(11, "div", 62)(12, "label", 63);
    \u0275\u0275text(13, "C\xF3digo (ID)");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(14, "input", 65);
    \u0275\u0275twoWayListener("ngModelChange", function DashboardComponent_Conditional_41_Template_input_ngModelChange_14_listener($event) {
      \u0275\u0275restoreView(_r10);
      const ctx_r2 = \u0275\u0275nextContext();
      \u0275\u0275twoWayBindingSet(ctx_r2.newProjectCode, $event) || (ctx_r2.newProjectCode = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(15, "div", 66)(16, "button", 67);
    \u0275\u0275listener("click", function DashboardComponent_Conditional_41_Template_button_click_16_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.showCreateProject.set(false));
    });
    \u0275\u0275text(17, "Cancelar");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "button", 68);
    \u0275\u0275listener("click", function DashboardComponent_Conditional_41_Template_button_click_18_listener() {
      \u0275\u0275restoreView(_r10);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.createProject());
    });
    \u0275\u0275text(19, " CRIAR PROJETO ");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(10);
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.newProjectName);
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.newProjectCode);
    \u0275\u0275advance(4);
    \u0275\u0275property("disabled", !ctx_r2.newProjectName.trim());
  }
}
function DashboardComponent_Conditional_42_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 57);
    \u0275\u0275listener("click", function DashboardComponent_Conditional_42_Template_div_click_0_listener() {
      \u0275\u0275restoreView(_r11);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.deleteScriptId.set(null));
    });
    \u0275\u0275elementStart(1, "div", 69);
    \u0275\u0275listener("click", function DashboardComponent_Conditional_42_Template_div_click_1_listener($event) {
      \u0275\u0275restoreView(_r11);
      return \u0275\u0275resetView($event.stopPropagation());
    });
    \u0275\u0275elementStart(2, "h3", 59);
    \u0275\u0275text(3, "Excluir Roteiro");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "p", 60);
    \u0275\u0275text(5, "Tem certeza que deseja excluir este roteiro?");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "div", 66)(7, "button", 67);
    \u0275\u0275listener("click", function DashboardComponent_Conditional_42_Template_button_click_7_listener() {
      \u0275\u0275restoreView(_r11);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.deleteScriptId.set(null));
    });
    \u0275\u0275text(8, "Cancelar");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "button", 70);
    \u0275\u0275listener("click", function DashboardComponent_Conditional_42_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r11);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.deleteScript());
    });
    \u0275\u0275text(10, "Excluir");
    \u0275\u0275elementEnd()()()();
  }
}
var STATUS_CONFIG = {
  "Rascunho": { label: "Rascunho", color: "#f97316", bg: "rgba(249,115,22,0.1)" },
  "EmRevisao": { label: "Em Revis\xE3o", color: "#eab308", bg: "rgba(234,179,8,0.1)" },
  "Aprovado": { label: "Aprovado", color: "#10b981", bg: "rgba(16,185,129,0.1)" },
  "Gravado": { label: "Gravado", color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
  "Concluido": { label: "Conclu\xEDdo", color: "#71717a", bg: "rgba(113,113,122,0.1)" }
};
var DashboardComponent = class _DashboardComponent {
  constructor() {
    this.api = inject(ApiService);
    this.observability = inject(ObservabilityService);
    this.authService = inject(AuthService);
    this.router = inject(Router);
    this.projects = signal([]);
    this.scripts = signal([]);
    this.loading = signal(true);
    this.projectIdFilter = signal(null);
    this.statusFilter = signal("all");
    this.collapsedProjects = signal(/* @__PURE__ */ new Set());
    this.showCreateProject = signal(false);
    this.deleteScriptId = signal(null);
    this.newProjectName = "";
    this.newProjectCode = "";
    this.statusEntries = Object.entries(STATUS_CONFIG).map(([key, config]) => ({
      key,
      config
    }));
    this.totalScripts = computed(() => this.scripts().length);
    this.scriptsByProject = computed(() => {
      const filtered = this.scripts().filter((s) => {
        if (this.projectIdFilter())
          return s.projectId === this.projectIdFilter();
        if (this.statusFilter() !== "all")
          return ScriptStatus[s.status] === this.statusFilter();
        return true;
      });
      const groups = {};
      filtered.forEach((s) => {
        const name = this.getProjectName(s.projectId);
        if (!groups[name])
          groups[name] = [];
        groups[name].push(s);
      });
      return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0])).map(([projectName, scripts]) => ({ projectName, scripts }));
    });
  }
  ngOnInit() {
    this.observability.trackPageView("dashboard");
    this.loadData();
  }
  loadData() {
    this.api.getProjects().subscribe({
      next: (projects) => {
        this.projects.set(projects);
        this.loadScripts();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
  loadScripts() {
    this.api.getScripts().subscribe({
      next: (scripts) => {
        this.scripts.set(scripts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
  getProjectName(projectId) {
    const p = this.projects().find((pr) => pr.id === projectId);
    return p?.name || "Geral";
  }
  toggleProjectFilter(project) {
    if (this.projectIdFilter() === project.id) {
      this.projectIdFilter.set(null);
    } else {
      this.projectIdFilter.set(project.id);
    }
  }
  toggleCollapse(name) {
    const next = new Set(this.collapsedProjects());
    if (next.has(name))
      next.delete(name);
    else
      next.add(name);
    this.collapsedProjects.set(next);
  }
  getStatusConfig(status) {
    const key = ScriptStatus[status];
    return STATUS_CONFIG[key] || STATUS_CONFIG["Rascunho"];
  }
  copyInvite() {
    const user = this.authService.user();
    if (user?.workspaceId) {
      navigator.clipboard.writeText(user.workspaceId);
    }
  }
  createNewScript() {
    this.router.navigate(["/scripts/new"]);
  }
  createScriptInProject(projectName, event) {
    event.stopPropagation();
    const project = this.projects().find((p) => p.name === projectName);
    if (project) {
      this.router.navigate(["/scripts/new"], { queryParams: { projectId: project.id } });
    }
  }
  createProject() {
    if (!this.newProjectName.trim())
      return;
    this.api.createProject({
      name: this.newProjectName,
      code: this.newProjectCode || this.newProjectName.toUpperCase().slice(0, 3)
    }).subscribe({
      next: (project) => {
        this.projects.update((p) => [project, ...p]);
        this.showCreateProject.set(false);
        this.newProjectName = "";
        this.newProjectCode = "";
      }
    });
  }
  openEditor(scriptId) {
    this.router.navigate(["/scripts", scriptId]);
  }
  openTeleprompter(scriptId) {
    window.open(`/tp/${scriptId}`, "_blank");
  }
  confirmDelete(scriptId) {
    this.deleteScriptId.set(scriptId);
  }
  deleteScript() {
    const id = this.deleteScriptId();
    if (!id)
      return;
    this.api.deleteScript(id).subscribe({
      next: () => {
        this.scripts.update((s) => s.filter((sc) => sc.id !== id));
        this.deleteScriptId.set(null);
      }
    });
  }
  static {
    this.\u0275fac = function DashboardComponent_Factory(t) {
      return new (t || _DashboardComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _DashboardComponent, selectors: [["app-dashboard"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 43, vars: 7, consts: [[1, "container-6xl"], [1, "top-actions"], [1, "flex-gap-3"], [1, "btn-outline-sm", 3, "click"], [1, "icon-blue"], [1, "icon-emerald"], [1, "btn-primary-action", 3, "click"], [1, "page-header-block"], [1, "page-title-xl"], [1, "page-subtitle"], [1, "section-block"], [1, "section-header-row"], [1, "section-label"], [1, "section-icon"], [1, "section-controls"], [1, "view-btn", 3, "click"], [1, "chevron"], [1, "projects-scroll"], [1, "status-filters"], [1, "filter-pill", 3, "click"], [1, "filter-pill", 3, "filter-active"], [1, "loading-block"], [1, "dialog-overlay"], [1, "project-skeleton"], [1, "empty-dashed"], [1, "text-sm-muted"], [1, "project-card", 3, "active"], [1, "project-card", 3, "click"], [1, "project-card-top"], [1, "project-badge"], [1, "project-card-name"], [1, "spinner-large"], [1, "empty-block"], [1, "empty-icon-box"], [1, "empty-title"], [1, "empty-desc"], [1, "project-section"], [1, "project-section-header", 3, "click"], [1, "section-header-left"], [1, "collapse-icon"], [1, "project-icon-box"], [1, "project-section-title"], [1, "script-count-badge"], [1, "section-header-right"], [1, "btn-ghost-sm", 3, "click"], [1, "scripts-grid"], [1, "script-card"], [1, "script-card-header"], [1, "script-status-dot"], [1, "script-status-label"], [1, "script-card-title", 3, "routerLink"], [1, "script-card-meta"], [1, "meta-sep"], [1, "script-card-actions"], ["title", "Editar", 1, "action-btn", 3, "click"], ["title", "Teleprompter", 1, "action-btn", 3, "click"], ["title", "Excluir", 1, "action-btn", "btn-danger", 3, "click"], [1, "dialog-overlay", 3, "click"], [1, "dialog-card", 3, "click"], [1, "dialog-title"], [1, "dialog-desc"], [1, "dialog-body"], [1, "form-group"], [1, "form-label"], ["placeholder", "Ex: Curso de Excel", 1, "form-input-lg", 3, "ngModelChange", "ngModel"], ["placeholder", "Ex: EXC-001", 1, "form-input-lg", "mono", 3, "ngModelChange", "ngModel"], [1, "dialog-footer"], [1, "btn-ghost-lg", 3, "click"], [1, "btn-primary-lg", 3, "click", "disabled"], [1, "dialog-card-sm", 3, "click"], [1, "btn-danger-lg", 3, "click"]], template: function DashboardComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275elementStart(0, "div", 0)(1, "div", 1)(2, "div", 2)(3, "button", 3);
        \u0275\u0275listener("click", function DashboardComponent_Template_button_click_3_listener() {
          return ctx.copyInvite();
        });
        \u0275\u0275elementStart(4, "span", 4);
        \u0275\u0275text(5, "\u{1F517}");
        \u0275\u0275elementEnd();
        \u0275\u0275text(6, " Convidar Equipe ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(7, "button", 3);
        \u0275\u0275listener("click", function DashboardComponent_Template_button_click_7_listener() {
          return ctx.showCreateProject.set(true);
        });
        \u0275\u0275elementStart(8, "span", 5);
        \u0275\u0275text(9, "\u2295");
        \u0275\u0275elementEnd();
        \u0275\u0275text(10, " Novo Projeto ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(11, "button", 6);
        \u0275\u0275listener("click", function DashboardComponent_Template_button_click_11_listener() {
          return ctx.createNewScript();
        });
        \u0275\u0275text(12, " \uFF0B Novo Roteiro ");
        \u0275\u0275elementEnd()()();
        \u0275\u0275elementStart(13, "div", 7)(14, "h1", 8);
        \u0275\u0275text(15, "Meus Roteiros");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(16, "p", 9);
        \u0275\u0275text(17, "Gerencie seus Roteiros do Teleprompter aqui.");
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(18, "div", 10)(19, "div", 11)(20, "h2", 12)(21, "span", 13);
        \u0275\u0275text(22, "\u{1F4BC}");
        \u0275\u0275elementEnd();
        \u0275\u0275text(23, " Projetos Ativos ");
        \u0275\u0275elementEnd();
        \u0275\u0275elementStart(24, "div", 14)(25, "button", 15);
        \u0275\u0275listener("click", function DashboardComponent_Template_button_click_25_listener() {
          return ctx.router.navigate(["/projects"]);
        });
        \u0275\u0275text(26, " Ver Todos ");
        \u0275\u0275elementStart(27, "span", 16);
        \u0275\u0275text(28, "\u203A");
        \u0275\u0275elementEnd()()()();
        \u0275\u0275elementStart(29, "div", 17);
        \u0275\u0275template(30, DashboardComponent_Conditional_30_Template, 2, 1)(31, DashboardComponent_Conditional_31_Template, 3, 0)(32, DashboardComponent_Conditional_32_Template, 2, 0);
        \u0275\u0275elementEnd()();
        \u0275\u0275elementStart(33, "div", 18)(34, "button", 19);
        \u0275\u0275listener("click", function DashboardComponent_Template_button_click_34_listener() {
          return ctx.statusFilter.set("all");
        });
        \u0275\u0275text(35);
        \u0275\u0275elementEnd();
        \u0275\u0275repeaterCreate(36, DashboardComponent_For_37_Template, 2, 3, "button", 20, _forTrack0);
        \u0275\u0275elementEnd();
        \u0275\u0275template(38, DashboardComponent_Conditional_38_Template, 4, 0, "div", 21)(39, DashboardComponent_Conditional_39_Template, 8, 0)(40, DashboardComponent_Conditional_40_Template, 2, 0)(41, DashboardComponent_Conditional_41_Template, 20, 3, "div", 22)(42, DashboardComponent_Conditional_42_Template, 11, 0, "div", 22);
        \u0275\u0275elementEnd();
      }
      if (rf & 2) {
        \u0275\u0275advance(30);
        \u0275\u0275conditional(30, ctx.loading() ? 30 : ctx.projects().length === 0 ? 31 : 32);
        \u0275\u0275advance(4);
        \u0275\u0275classProp("filter-active", ctx.statusFilter() === "all");
        \u0275\u0275advance();
        \u0275\u0275textInterpolate1(" Todos (", ctx.totalScripts(), ") ");
        \u0275\u0275advance();
        \u0275\u0275repeater(ctx.statusEntries);
        \u0275\u0275advance(2);
        \u0275\u0275conditional(38, ctx.loading() ? 38 : ctx.scriptsByProject().length === 0 ? 39 : 40);
        \u0275\u0275advance(3);
        \u0275\u0275conditional(41, ctx.showCreateProject() ? 41 : -1);
        \u0275\u0275advance();
        \u0275\u0275conditional(42, ctx.deleteScriptId() ? 42 : -1);
      }
    }, dependencies: [CommonModule, DatePipe, RouterLink, FormsModule, DefaultValueAccessor, NgControlStatus, NgModel], styles: ["\n\n.container-6xl[_ngcontent-%COMP%] {\n  max-width: 72rem;\n  margin: 0 auto;\n  padding: 2.5rem 1rem;\n}\n@media (min-width: 640px) {\n  .container-6xl[_ngcontent-%COMP%] {\n    padding: 2.5rem 1.5rem;\n  }\n}\n.top-actions[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: flex-end;\n  align-items: center;\n  margin-bottom: 2rem;\n}\n.flex-gap-3[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.75rem;\n  flex-wrap: wrap;\n}\n.btn-outline-sm[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.5rem 1rem;\n  border-radius: 6px;\n  border: 1px solid var(--border);\n  background: transparent;\n  color: var(--foreground);\n  font-size: 0.875rem;\n  font-weight: 500;\n  cursor: pointer;\n  transition: background 0.15s;\n}\n.btn-outline-sm[_ngcontent-%COMP%]:hover {\n  background: var(--accent);\n}\n.icon-blue[_ngcontent-%COMP%] {\n  font-size: 14px;\n}\n.icon-emerald[_ngcontent-%COMP%] {\n  font-size: 14px;\n}\n.btn-primary-action[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.625rem 1.25rem;\n  border-radius: 6px;\n  background: var(--blue-600);\n  color: #fff;\n  border: none;\n  font-size: 0.875rem;\n  font-weight: 600;\n  cursor: pointer;\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);\n  transition: background 0.15s, box-shadow 0.15s;\n}\n.btn-primary-action[_ngcontent-%COMP%]:hover {\n  background: var(--blue-600);\n  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);\n}\n.page-header-block[_ngcontent-%COMP%] {\n  margin-bottom: 2rem;\n}\n.page-title-xl[_ngcontent-%COMP%] {\n  font-size: 1.875rem;\n  font-weight: 900;\n  letter-spacing: -0.025em;\n  color: var(--foreground);\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n}\n.page-subtitle[_ngcontent-%COMP%] {\n  color: var(--muted-foreground);\n  margin-top: 0.25rem;\n  font-size: 0.875rem;\n}\n.section-block[_ngcontent-%COMP%] {\n  margin-bottom: 2.5rem;\n}\n.section-header-row[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 1rem;\n}\n.section-label[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  font-size: 0.75rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.1em;\n  color: var(--zinc-500);\n}\n.section-icon[_ngcontent-%COMP%] {\n  font-size: 16px;\n}\n.section-controls[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.view-btn[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.25rem;\n  font-size: 0.75rem;\n  color: var(--blue-500);\n  background: none;\n  border: none;\n  cursor: pointer;\n  font-weight: 500;\n}\n.view-btn[_ngcontent-%COMP%]:hover {\n  color: var(--blue-600);\n}\n.chevron[_ngcontent-%COMP%] {\n  font-size: 14px;\n}\n.projects-scroll[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 1rem;\n  overflow-x: auto;\n  padding: 1.25rem;\n  scrollbar-width: thin;\n  scrollbar-color: var(--zinc-300) transparent;\n}\n.projects-scroll[_ngcontent-%COMP%]::-webkit-scrollbar {\n  height: 8px;\n}\n.projects-scroll[_ngcontent-%COMP%]::-webkit-scrollbar-thumb {\n  background: var(--zinc-300);\n  border-radius: 10px;\n}\n.project-skeleton[_ngcontent-%COMP%] {\n  min-width: 220px;\n  height: 96px;\n  background: var(--muted);\n  border-radius: 8px;\n  border: 1px solid var(--border);\n  animation: _ngcontent-%COMP%_pulse 1.5s ease-in-out infinite;\n}\n.empty-dashed[_ngcontent-%COMP%] {\n  width: 100%;\n  padding: 1.5rem 2rem;\n  text-align: center;\n  background: var(--muted);\n  border-radius: 8px;\n  border: 1px dashed var(--zinc-300);\n}\n.dark[_ngcontent-%COMP%]   .empty-dashed[_ngcontent-%COMP%] {\n  border-color: var(--zinc-700);\n}\n.text-sm-muted[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  color: var(--muted-foreground);\n}\n.project-card[_ngcontent-%COMP%] {\n  min-width: 220px;\n  max-width: 220px;\n  flex-shrink: 0;\n  background: var(--card);\n  border: 2px solid var(--border);\n  border-radius: 8px;\n  padding: 1rem;\n  cursor: pointer;\n  transition: all 0.2s;\n}\n.project-card[_ngcontent-%COMP%]:hover {\n  border-color: #93c5fd;\n}\n.project-card.active[_ngcontent-%COMP%] {\n  border-color: var(--blue-600);\n  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);\n  transform: scale(1.02);\n}\n.project-card-top[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  margin-bottom: 0.5rem;\n}\n.project-badge[_ngcontent-%COMP%] {\n  display: inline-flex;\n  padding: 0.125rem 0.5rem;\n  border-radius: 4px;\n  font-size: 0.625rem;\n  font-family: monospace;\n  text-transform: uppercase;\n  border: 1px solid var(--border);\n  color: var(--muted-foreground);\n  font-weight: 500;\n}\n.project-badge.active-badge[_ngcontent-%COMP%] {\n  background: var(--blue-600);\n  color: #fff;\n  border-color: var(--blue-600);\n}\n.project-card-name[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  font-weight: 600;\n  color: var(--foreground);\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.project-card-name.active-name[_ngcontent-%COMP%] {\n  color: var(--blue-600);\n}\n.status-filters[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n  margin-bottom: 2rem;\n  overflow-x: auto;\n  padding-bottom: 0.5rem;\n  scrollbar-width: none;\n}\n.status-filters[_ngcontent-%COMP%]::-webkit-scrollbar {\n  display: none;\n}\n.filter-pill[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.375rem 1rem;\n  border-radius: 9999px;\n  border: 1px solid var(--border);\n  background: transparent;\n  color: var(--foreground);\n  font-size: 0.8125rem;\n  font-weight: 500;\n  cursor: pointer;\n  white-space: nowrap;\n  transition: all 0.15s;\n}\n.filter-pill[_ngcontent-%COMP%]:hover {\n  background: var(--accent);\n}\n.filter-active[_ngcontent-%COMP%] {\n  background: var(--primary) !important;\n  color: var(--primary-foreground) !important;\n  border-color: var(--primary) !important;\n}\n.loading-block[_ngcontent-%COMP%] {\n  text-align: center;\n  padding: 4rem 0;\n}\n.spinner-large[_ngcontent-%COMP%] {\n  width: 2rem;\n  height: 2rem;\n  margin: 0 auto 1rem;\n  border: 3px solid var(--border);\n  border-top-color: var(--foreground);\n  border-radius: 50%;\n  animation: _ngcontent-%COMP%_spin 0.8s linear infinite;\n}\n.empty-block[_ngcontent-%COMP%] {\n  text-align: center;\n  padding: 4rem 1rem;\n  background: var(--muted);\n  border-radius: 1.5rem;\n  border: 1px dashed var(--border);\n}\n.empty-icon-box[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 4rem;\n  height: 4rem;\n  background: var(--zinc-100);\n  border-radius: 8px;\n  margin-bottom: 1rem;\n  font-size: 2rem;\n}\n.dark[_ngcontent-%COMP%]   .empty-icon-box[_ngcontent-%COMP%] {\n  background: var(--zinc-800);\n}\n.empty-title[_ngcontent-%COMP%] {\n  font-size: 1.125rem;\n  font-weight: 700;\n  color: var(--foreground);\n  margin-bottom: 0.5rem;\n}\n.empty-desc[_ngcontent-%COMP%] {\n  color: var(--muted-foreground);\n  max-width: 24rem;\n  margin: 0 auto 2rem;\n  font-size: 0.875rem;\n}\n.project-section[_ngcontent-%COMP%] {\n  margin-bottom: 4rem;\n}\n.project-section-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  border-bottom: 1px solid var(--border);\n  padding-bottom: 0.75rem;\n  cursor: pointer;\n  -webkit-user-select: none;\n  user-select: none;\n  margin-bottom: 1.5rem;\n}\n.section-header-left[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n}\n.collapse-icon[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 1.5rem;\n  height: 1.5rem;\n  border-radius: 4px;\n  color: var(--zinc-400);\n  font-size: 16px;\n  transition: background 0.15s;\n}\n.collapse-icon[_ngcontent-%COMP%]:hover {\n  background: var(--muted);\n}\n.project-icon-box[_ngcontent-%COMP%] {\n  padding: 0.5rem;\n  background: rgba(59, 130, 246, 0.1);\n  border-radius: 6px;\n  font-size: 18px;\n}\n.project-section-title[_ngcontent-%COMP%] {\n  font-size: 1.125rem;\n  font-weight: 900;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  color: var(--foreground);\n}\n.script-count-badge[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  min-width: 1.25rem;\n  height: 1.25rem;\n  padding: 0 0.375rem;\n  border-radius: 9999px;\n  background: var(--muted);\n  font-size: 0.625rem;\n  font-weight: 700;\n  color: var(--muted-foreground);\n}\n.section-header-right[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n}\n.btn-ghost-sm[_ngcontent-%COMP%] {\n  padding: 0.25rem 0.625rem;\n  border: none;\n  background: transparent;\n  color: var(--blue-500);\n  font-size: 0.75rem;\n  font-weight: 600;\n  cursor: pointer;\n  border-radius: 6px;\n  transition: background 0.15s;\n}\n.btn-ghost-sm[_ngcontent-%COMP%]:hover {\n  background: rgba(59, 130, 246, 0.1);\n}\n.scripts-grid[_ngcontent-%COMP%] {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));\n  gap: 1rem;\n}\n@media (max-width: 640px) {\n  .scripts-grid[_ngcontent-%COMP%] {\n    grid-template-columns: 1fr;\n  }\n}\n.script-card[_ngcontent-%COMP%] {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 8px;\n  padding: 1.25rem;\n  transition: border-color 0.15s, box-shadow 0.15s;\n}\n.script-card[_ngcontent-%COMP%]:hover {\n  border-color: var(--zinc-400);\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);\n}\n.script-card-header[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  margin-bottom: 0.75rem;\n}\n.script-status-dot[_ngcontent-%COMP%] {\n  width: 8px;\n  height: 8px;\n  border-radius: 50%;\n  flex-shrink: 0;\n}\n.script-status-label[_ngcontent-%COMP%] {\n  font-size: 0.625rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n}\n.script-card-title[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.9375rem;\n  font-weight: 700;\n  color: var(--foreground);\n  text-decoration: none;\n  margin-bottom: 0.5rem;\n  line-height: 1.3;\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n.script-card-title[_ngcontent-%COMP%]:hover {\n  color: var(--blue-500);\n}\n.script-card-meta[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.375rem;\n  font-size: 0.75rem;\n  color: var(--muted-foreground);\n  margin-bottom: 0.75rem;\n}\n.meta-sep[_ngcontent-%COMP%] {\n  opacity: 0.5;\n}\n.script-card-actions[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.375rem;\n}\n.action-btn[_ngcontent-%COMP%] {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 2rem;\n  height: 2rem;\n  border-radius: 6px;\n  border: 1px solid var(--border);\n  background: transparent;\n  color: var(--muted-foreground);\n  font-size: 14px;\n  cursor: pointer;\n  transition: all 0.15s;\n}\n.action-btn[_ngcontent-%COMP%]:hover {\n  background: var(--accent);\n  color: var(--foreground);\n}\n.action-btn.btn-danger[_ngcontent-%COMP%]:hover {\n  background: rgba(239, 68, 68, 0.1);\n  color: #ef4444;\n  border-color: rgba(239, 68, 68, 0.3);\n}\n.dialog-overlay[_ngcontent-%COMP%] {\n  position: fixed;\n  inset: 0;\n  z-index: 50;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  background: rgba(0, 0, 0, 0.5);\n  -webkit-backdrop-filter: blur(4px);\n  backdrop-filter: blur(4px);\n  padding: 1rem;\n}\n.dialog-card[_ngcontent-%COMP%] {\n  width: 100%;\n  max-width: 28rem;\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  padding: 2rem;\n  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);\n}\n.dialog-card-sm[_ngcontent-%COMP%] {\n  width: 100%;\n  max-width: 24rem;\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 12px;\n  padding: 2rem;\n  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);\n}\n.dialog-title[_ngcontent-%COMP%] {\n  font-size: 1.5rem;\n  font-weight: 900;\n  text-align: center;\n  text-transform: uppercase;\n  letter-spacing: 0.1em;\n  color: var(--foreground);\n  margin-bottom: 0.5rem;\n}\n.dialog-desc[_ngcontent-%COMP%] {\n  text-align: center;\n  color: var(--muted-foreground);\n  font-size: 0.875rem;\n  margin-bottom: 1.5rem;\n}\n.dialog-body[_ngcontent-%COMP%] {\n  padding: 1rem 0;\n}\n.dialog-footer[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.75rem;\n  padding-top: 1rem;\n}\n.form-group[_ngcontent-%COMP%] {\n  margin-bottom: 1rem;\n}\n.form-label[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.625rem;\n  font-weight: 900;\n  text-transform: uppercase;\n  letter-spacing: 0.1em;\n  color: var(--zinc-400);\n  margin-bottom: 0.375rem;\n  padding-left: 0.25rem;\n}\n.form-input-lg[_ngcontent-%COMP%] {\n  width: 100%;\n  height: 3rem;\n  padding: 0 1rem;\n  border: 1px solid var(--border);\n  border-radius: 8px;\n  background: var(--muted);\n  color: var(--foreground);\n  font-size: 0.875rem;\n  font-weight: 600;\n}\n.form-input-lg.mono[_ngcontent-%COMP%] {\n  font-family: monospace;\n}\n.form-input-lg[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: var(--ring);\n}\n.btn-ghost-lg[_ngcontent-%COMP%] {\n  flex: 1;\n  height: 3rem;\n  border: none;\n  background: transparent;\n  color: var(--foreground);\n  font-weight: 700;\n  border-radius: 8px;\n  cursor: pointer;\n  font-size: 0.875rem;\n}\n.btn-ghost-lg[_ngcontent-%COMP%]:hover {\n  background: var(--accent);\n}\n.btn-primary-lg[_ngcontent-%COMP%] {\n  flex: 2;\n  height: 3rem;\n  border: none;\n  border-radius: 8px;\n  background: var(--blue-600);\n  color: #fff;\n  font-weight: 900;\n  text-transform: uppercase;\n  letter-spacing: 0.1em;\n  font-size: 0.625rem;\n  cursor: pointer;\n  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n}\n.btn-primary-lg[_ngcontent-%COMP%]:hover {\n  background: #2563eb;\n}\n.btn-primary-lg[_ngcontent-%COMP%]:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n.btn-danger-lg[_ngcontent-%COMP%] {\n  flex: 2;\n  height: 3rem;\n  border: none;\n  border-radius: 8px;\n  background: #dc2626;\n  color: #fff;\n  font-weight: 700;\n  font-size: 0.875rem;\n  cursor: pointer;\n}\n.btn-danger-lg[_ngcontent-%COMP%]:hover {\n  background: #b91c1c;\n}\n@keyframes _ngcontent-%COMP%_pulse {\n  0%, 100% {\n    opacity: 1;\n  }\n  50% {\n    opacity: 0.5;\n  }\n}\n@keyframes _ngcontent-%COMP%_spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n/*# sourceMappingURL=dashboard.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(DashboardComponent, { className: "DashboardComponent", filePath: "src\\app\\features\\dashboard\\dashboard.component.ts", lineNumber: 491 });
})();
export {
  DashboardComponent
};
//# sourceMappingURL=chunk-5WUMI2CS.js.map
