import {
  SignalRService
} from "./chunk-VXOLMSSB.js";
import {
  ScriptStatus
} from "./chunk-SVMZWXYP.js";
import "./chunk-AJEFXTFW.js";
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
  ObservabilityService,
  environment
} from "./chunk-DHSNSXHE.js";
import {
  ActivatedRoute,
  Router,
  RouterLink
} from "./chunk-NJ75DOAS.js";
import "./chunk-3SDTMM4U.js";
import {
  CommonModule,
  DatePipe,
  __async,
  __spreadProps,
  __spreadValues,
  computed,
  inject,
  signal,
  ɵsetClassDebugInfo,
  ɵɵStandaloneFeature,
  ɵɵadvance,
  ɵɵclassProp,
  ɵɵconditional,
  ɵɵdefineComponent,
  ɵɵdefineInjectable,
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
  ɵɵstyleMap,
  ɵɵtemplate,
  ɵɵtext,
  ɵɵtextInterpolate,
  ɵɵtextInterpolate1,
  ɵɵtwoWayBindingSet,
  ɵɵtwoWayListener,
  ɵɵtwoWayProperty
} from "./chunk-SBUHLZV6.js";

// src/app/core/realtime/script-hub.service.ts
var ScriptHubService = class _ScriptHubService {
  constructor() {
    this.signalR = inject(SignalRService);
    this.hubName = "scriptHub";
    this.onlineUsers = signal(/* @__PURE__ */ new Map());
    this.connected = signal(false);
    this.onlineUsersReadonly = this.onlineUsers.asReadonly();
    this.isConnected = this.connected.asReadonly();
  }
  connect() {
    return __async(this, null, function* () {
      yield this.signalR.startConnection(this.hubName, environment.signalR.scriptHubUrl);
      this.connected.set(true);
    });
  }
  disconnect() {
    return __async(this, null, function* () {
      yield this.signalR.stopConnection(this.hubName);
      this.connected.set(false);
      this.onlineUsers.set(/* @__PURE__ */ new Map());
    });
  }
  joinScript(scriptId) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "JoinScript", scriptId);
    });
  }
  leaveScript(scriptId) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "LeaveScript", scriptId);
    });
  }
  contentChanged(scriptId, content, user) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "ContentChanged", scriptId, content, user);
    });
  }
  cursorMoved(scriptId, position, user) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "CursorMoved", scriptId, position, user);
    });
  }
  commentAdded(scriptId, comment) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "CommentAdded", scriptId, comment);
    });
  }
  commentResolved(scriptId, commentId) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "CommentResolved", scriptId, commentId);
    });
  }
  versionCreated(scriptId, version) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "VersionCreated", scriptId, version);
    });
  }
  lockChanged(scriptId, lockedBy) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "LockChanged", scriptId, lockedBy);
    });
  }
  checklistUpdated(scriptId, items) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "ChecklistUpdated", scriptId, items);
    });
  }
  onPresenceChanged(callback) {
    this.signalR.on(this.hubName, "PresenceChanged", (scriptId, info) => {
      this.updateOnlineUsers(scriptId, info);
      callback(scriptId, info);
    });
  }
  onContentChanged(callback) {
    this.signalR.on(this.hubName, "ContentChanged", (scriptId, content, user) => {
      callback({ scriptId, content, user });
    });
  }
  onCommentAdded(callback) {
    this.signalR.on(this.hubName, "CommentAdded", (scriptId, comment) => {
      callback({ scriptId, comment });
    });
  }
  onCommentResolved(callback) {
    this.signalR.on(this.hubName, "CommentResolved", (scriptId, commentId) => {
      callback({ scriptId, commentId });
    });
  }
  onVersionCreated(callback) {
    this.signalR.on(this.hubName, "VersionCreated", (scriptId, version) => {
      callback({ scriptId, version });
    });
  }
  onLockChanged(callback) {
    this.signalR.on(this.hubName, "LockChanged", (scriptId, lockedBy) => {
      callback({ scriptId, lockedBy });
    });
  }
  onChecklistUpdated(callback) {
    this.signalR.on(this.hubName, "ChecklistUpdated", callback);
  }
  updateOnlineUsers(scriptId, info) {
    const current = new Map(this.onlineUsers());
    const users = current.get(scriptId) || /* @__PURE__ */ new Set();
    if (info.joined) {
      users.add(info.user);
    } else {
      users.delete(info.user);
    }
    current.set(scriptId, users);
    this.onlineUsers.set(current);
  }
  static {
    this.\u0275fac = function ScriptHubService_Factory(t) {
      return new (t || _ScriptHubService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ScriptHubService, factory: _ScriptHubService.\u0275fac, providedIn: "root" });
  }
};

// src/app/features/scripts/editor/script-editor.component.ts
var _forTrack0 = ($index, $item) => $item.index;
var _forTrack1 = ($index, $item) => $item.id;
var _forTrack2 = ($index, $item) => $item.id || $item.label;
function ScriptEditorComponent_Conditional_0_Conditional_12_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "span", 23);
    \u0275\u0275elementStart(1, "span", 24);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("", ctx_r2.onlineUsers().size, " online");
  }
}
function ScriptEditorComponent_Conditional_0_Conditional_25_For_2_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 25)(1, "div", 26)(2, "span", 27);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(4, "div", 28)(5, "div", 29)(6, "p", 30);
    \u0275\u0275text(7);
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    const scene_r4 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("Cena ", scene_r4.index, "");
    \u0275\u0275advance(4);
    \u0275\u0275textInterpolate(scene_r4.content);
  }
}
function ScriptEditorComponent_Conditional_0_Conditional_25_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 14);
    \u0275\u0275repeaterCreate(1, ScriptEditorComponent_Conditional_0_Conditional_25_For_2_Template, 8, 2, "div", 25, _forTrack0);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275repeater(ctx_r2.scenes());
  }
}
function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_1_For_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 33)(1, "div", 35)(2, "span", 36);
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(4, "span", 37);
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "date");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "button", 38);
    \u0275\u0275listener("click", function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_1_For_5_Template_button_click_7_listener() {
      const v_r6 = \u0275\u0275restoreView(_r5).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.revertVersion(v_r6.versionNumber));
    });
    \u0275\u0275text(8, "Reverter");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const v_r6 = ctx.$implicit;
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("v", v_r6.versionNumber, "");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(6, 2, v_r6.createdAt, "short"));
  }
}
function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_1_ForEmpty_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 34);
    \u0275\u0275text(1, "Nenhuma vers\xE3o salva");
    \u0275\u0275elementEnd();
  }
}
function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 31)(1, "h3");
    \u0275\u0275text(2, "Hist\xF3rico de Vers\xF5es");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(3, "div", 32);
    \u0275\u0275repeaterCreate(4, ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_1_For_5_Template, 9, 5, "div", 33, _forTrack1, false, ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_1_ForEmpty_6_Template, 2, 0, "div", 34);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(4);
    \u0275\u0275repeater(ctx_r2.versions());
  }
}
function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_2_For_5_Conditional_7_Template(rf, ctx) {
  if (rf & 1) {
    const _r8 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 38);
    \u0275\u0275listener("click", function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_2_For_5_Conditional_7_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r8);
      const c_r9 = \u0275\u0275nextContext().$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.resolveComment(c_r9.id));
    });
    \u0275\u0275text(1, "Resolver");
    \u0275\u0275elementEnd();
  }
}
function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_2_For_5_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 43)(1, "p", 44);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "div", 45)(4, "span", 46);
    \u0275\u0275text(5);
    \u0275\u0275pipe(6, "date");
    \u0275\u0275elementEnd();
    \u0275\u0275template(7, ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_2_For_5_Conditional_7_Template, 2, 0, "button", 47);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const c_r9 = ctx.$implicit;
    \u0275\u0275classProp("resolved", c_r9.isResolved);
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(c_r9.body);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate(\u0275\u0275pipeBind2(6, 5, c_r9.createdAt, "short"));
    \u0275\u0275advance(2);
    \u0275\u0275conditional(7, !c_r9.isResolved ? 7 : -1);
  }
}
function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_2_ForEmpty_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 34);
    \u0275\u0275text(1, "Nenhum coment\xE1rio");
    \u0275\u0275elementEnd();
  }
}
function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 31)(1, "h3");
    \u0275\u0275text(2, "Coment\xE1rios");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(3, "div", 32);
    \u0275\u0275repeaterCreate(4, ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_2_For_5_Template, 8, 8, "div", 39, _forTrack1, false, ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_2_ForEmpty_6_Template, 2, 0, "div", 34);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(7, "div", 40)(8, "input", 41);
    \u0275\u0275twoWayListener("ngModelChange", function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_2_Template_input_ngModelChange_8_listener($event) {
      \u0275\u0275restoreView(_r7);
      const ctx_r2 = \u0275\u0275nextContext(3);
      \u0275\u0275twoWayBindingSet(ctx_r2.newComment, $event) || (ctx_r2.newComment = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("keyup.enter", function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_2_Template_input_keyup_enter_8_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.addComment());
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(9, "button", 42);
    \u0275\u0275listener("click", function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_2_Template_button_click_9_listener() {
      \u0275\u0275restoreView(_r7);
      const ctx_r2 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r2.addComment());
    });
    \u0275\u0275text(10, "Enviar");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(4);
    \u0275\u0275repeater(ctx_r2.comments());
    \u0275\u0275advance(4);
    \u0275\u0275twoWayProperty("ngModel", ctx_r2.newComment);
  }
}
function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_3_For_5_Conditional_4_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "span", 50);
    \u0275\u0275text(1, "*");
    \u0275\u0275elementEnd();
  }
}
function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_3_For_5_Template(rf, ctx) {
  if (rf & 1) {
    const _r10 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "label", 48)(1, "input", 49);
    \u0275\u0275listener("change", function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_3_For_5_Template_input_change_1_listener() {
      const item_r11 = \u0275\u0275restoreView(_r10).$implicit;
      const ctx_r2 = \u0275\u0275nextContext(4);
      return \u0275\u0275resetView(ctx_r2.toggleChecklistItem(item_r11));
    });
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(2, "span");
    \u0275\u0275text(3);
    \u0275\u0275elementEnd();
    \u0275\u0275template(4, ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_3_For_5_Conditional_4_Template, 2, 0, "span", 50);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const item_r11 = ctx.$implicit;
    \u0275\u0275advance();
    \u0275\u0275property("checked", item_r11.isChecked);
    \u0275\u0275advance();
    \u0275\u0275classProp("checked-text", item_r11.isChecked);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(item_r11.label);
    \u0275\u0275advance();
    \u0275\u0275conditional(4, item_r11.required ? 4 : -1);
  }
}
function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_3_ForEmpty_6_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 34);
    \u0275\u0275text(1, "Nenhum item na checklist");
    \u0275\u0275elementEnd();
  }
}
function ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 31)(1, "h3");
    \u0275\u0275text(2, "Checklist de Revis\xE3o");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(3, "div", 32);
    \u0275\u0275repeaterCreate(4, ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_3_For_5_Template, 5, 5, "label", 48, _forTrack2, false, ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_3_ForEmpty_6_Template, 2, 0, "div", 34);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(3);
    \u0275\u0275advance(4);
    \u0275\u0275repeater(ctx_r2.checklist());
  }
}
function ScriptEditorComponent_Conditional_0_Conditional_28_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 17);
    \u0275\u0275template(1, ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_1_Template, 7, 1)(2, ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_2_Template, 11, 2)(3, ScriptEditorComponent_Conditional_0_Conditional_28_Conditional_3_Template, 7, 1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r2 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275conditional(1, ctx_r2.showPanel() === "versions" ? 1 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(2, ctx_r2.showPanel() === "comments" ? 2 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(3, ctx_r2.showPanel() === "checklist" ? 3 : -1);
  }
}
function ScriptEditorComponent_Conditional_0_Conditional_36_Template(rf, ctx) {
  if (rf & 1) {
    const _r12 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 51);
    \u0275\u0275listener("click", function ScriptEditorComponent_Conditional_0_Conditional_36_Template_button_click_0_listener() {
      \u0275\u0275restoreView(_r12);
      const ctx_r2 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r2.openTeleprompter());
    });
    \u0275\u0275text(1, "Abrir Teleprompter");
    \u0275\u0275elementEnd();
  }
}
function ScriptEditorComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    const _r1 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 0)(1, "header", 1)(2, "div", 2)(3, "div", 3)(4, "a", 4);
    \u0275\u0275text(5, "\u2190 Voltar");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(6, "input", 5);
    \u0275\u0275twoWayListener("ngModelChange", function ScriptEditorComponent_Conditional_0_Template_input_ngModelChange_6_listener($event) {
      const s_r2 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(s_r2.title, $event) || (s_r2.title = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("blur", function ScriptEditorComponent_Conditional_0_Template_input_blur_6_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.saveTitle());
    });
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(7, "div", 6)(8, "span", 7);
    \u0275\u0275text(9);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(10, "span", 8);
    \u0275\u0275text(11);
    \u0275\u0275elementEnd();
    \u0275\u0275template(12, ScriptEditorComponent_Conditional_0_Conditional_12_Template, 3, 1);
    \u0275\u0275element(13, "div", 9);
    \u0275\u0275elementStart(14, "button", 10);
    \u0275\u0275listener("click", function ScriptEditorComponent_Conditional_0_Template_button_click_14_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.togglePanel("versions"));
    });
    \u0275\u0275text(15, "Hist\xF3rico");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "button", 10);
    \u0275\u0275listener("click", function ScriptEditorComponent_Conditional_0_Template_button_click_16_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.togglePanel("comments"));
    });
    \u0275\u0275text(17, "Coment\xE1rios");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(18, "button", 10);
    \u0275\u0275listener("click", function ScriptEditorComponent_Conditional_0_Template_button_click_18_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.togglePanel("checklist"));
    });
    \u0275\u0275text(19, "Checklist");
    \u0275\u0275elementEnd();
    \u0275\u0275element(20, "div", 9);
    \u0275\u0275elementStart(21, "button", 11);
    \u0275\u0275listener("click", function ScriptEditorComponent_Conditional_0_Template_button_click_21_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.saveScript());
    });
    \u0275\u0275text(22, " Salvar ");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(23, "div", 12)(24, "div", 13);
    \u0275\u0275template(25, ScriptEditorComponent_Conditional_0_Conditional_25_Template, 3, 0, "div", 14);
    \u0275\u0275elementStart(26, "div", 15)(27, "textarea", 16);
    \u0275\u0275twoWayListener("ngModelChange", function ScriptEditorComponent_Conditional_0_Template_textarea_ngModelChange_27_listener($event) {
      const s_r2 = \u0275\u0275restoreView(_r1);
      \u0275\u0275twoWayBindingSet(s_r2.content, $event) || (s_r2.content = $event);
      return \u0275\u0275resetView($event);
    });
    \u0275\u0275listener("input", function ScriptEditorComponent_Conditional_0_Template_textarea_input_27_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.onContentChange());
    });
    \u0275\u0275elementEnd()()();
    \u0275\u0275template(28, ScriptEditorComponent_Conditional_0_Conditional_28_Template, 4, 3, "div", 17);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(29, "div", 18)(30, "div", 19)(31, "button", 20);
    \u0275\u0275listener("click", function ScriptEditorComponent_Conditional_0_Template_button_click_31_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.exportJson());
    });
    \u0275\u0275text(32, "JSON");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(33, "button", 20);
    \u0275\u0275listener("click", function ScriptEditorComponent_Conditional_0_Template_button_click_33_listener() {
      \u0275\u0275restoreView(_r1);
      const ctx_r2 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r2.exportWord());
    });
    \u0275\u0275text(34, "Word");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(35, "div", 21);
    \u0275\u0275template(36, ScriptEditorComponent_Conditional_0_Conditional_36_Template, 2, 0, "button", 22);
    \u0275\u0275elementEnd()()();
  }
  if (rf & 2) {
    const s_r2 = ctx;
    const ctx_r2 = \u0275\u0275nextContext();
    \u0275\u0275advance(6);
    \u0275\u0275twoWayProperty("ngModel", s_r2.title);
    \u0275\u0275advance(3);
    \u0275\u0275textInterpolate1("v", s_r2.version, "");
    \u0275\u0275advance();
    \u0275\u0275styleMap(ctx_r2.getStatusStyle(s_r2.status));
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r2.getStatusLabel(s_r2.status), " ");
    \u0275\u0275advance();
    \u0275\u0275conditional(12, ctx_r2.onlineUsers().size > 0 ? 12 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275classProp("active", ctx_r2.showPanel() === "versions");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("active", ctx_r2.showPanel() === "comments");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("active", ctx_r2.showPanel() === "checklist");
    \u0275\u0275advance(3);
    \u0275\u0275property("disabled", !ctx_r2.hasChanges());
    \u0275\u0275advance(4);
    \u0275\u0275conditional(25, ctx_r2.scenes().length > 0 ? 25 : -1);
    \u0275\u0275advance(2);
    \u0275\u0275twoWayProperty("ngModel", s_r2.content);
    \u0275\u0275advance();
    \u0275\u0275conditional(28, ctx_r2.showPanel() ? 28 : -1);
    \u0275\u0275advance(8);
    \u0275\u0275conditional(36, s_r2.status === ctx_r2.ScriptStatus.Aprovado || s_r2.status === ctx_r2.ScriptStatus.Gravado ? 36 : -1);
  }
}
var ScriptEditorComponent = class _ScriptEditorComponent {
  constructor() {
    this.route = inject(ActivatedRoute);
    this.router = inject(Router);
    this.api = inject(ApiService);
    this.scriptHub = inject(ScriptHubService);
    this.observability = inject(ObservabilityService);
    this.ScriptStatus = ScriptStatus;
    this.script = signal(null);
    this.versions = signal([]);
    this.comments = signal([]);
    this.checklist = signal([]);
    this.onlineUsers = signal(/* @__PURE__ */ new Set());
    this.showPanel = signal(null);
    this.newComment = "";
    this.hasUnsavedChanges = false;
    this.scriptId = "";
    this.subscriptions = [];
    this.scenes = computed(() => {
      const content = this.script()?.content || "";
      if (!content)
        return [];
      const parts = content.split(/\[Cena\s+(\d+)\]/i);
      const scenes = [];
      for (let i = 1; i < parts.length; i += 2) {
        scenes.push({ index: parseInt(parts[i]), content: (parts[i + 1] || "").trim() });
      }
      return scenes.length > 0 ? scenes : [{ index: 1, content }];
    });
  }
  ngOnInit() {
    this.observability.trackPageView("script-editor");
    this.scriptId = this.route.snapshot.paramMap.get("id");
    if (this.scriptId === "new") {
      const projectId = this.route.snapshot.queryParamMap.get("projectId");
      this.createNewScript(projectId || "");
      return;
    }
    this.loadScript();
    this.setupRealtime();
  }
  ngOnDestroy() {
    this.scriptHub.leaveScript(this.scriptId);
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
  createNewScript(projectId) {
    this.api.createScript({
      projectId,
      title: "Novo Roteiro",
      content: ""
    }).subscribe({
      next: (script) => {
        this.scriptId = script.id;
        this.script.set(script);
        this.router.navigate(["/scripts", script.id], { replaceUrl: true });
        this.setupRealtime();
      }
    });
  }
  loadScript() {
    this.api.getScript(this.scriptId).subscribe({ next: (s) => this.script.set(s) });
    this.api.getScriptVersions(this.scriptId).subscribe({ next: (v) => this.versions.set(v) });
    this.api.getScriptComments(this.scriptId).subscribe({ next: (c) => this.comments.set(c) });
    this.api.getScriptChecklist(this.scriptId).subscribe({ next: (c) => this.checklist.set(c) });
  }
  setupRealtime() {
    return __async(this, null, function* () {
      yield this.scriptHub.connect();
      yield this.scriptHub.joinScript(this.scriptId);
      this.scriptHub.onContentChanged((data) => {
        if (data.user !== this.scriptId) {
          this.script.update((s) => s ? __spreadProps(__spreadValues({}, s), { content: data.content }) : s);
        }
      });
      this.scriptHub.onPresenceChanged((scriptId, info) => {
        if (scriptId === this.scriptId) {
          this.onlineUsers.update((users) => {
            const n = new Set(users);
            if (info.joined)
              n.add(info.user);
            else
              n.delete(info.user);
            return n;
          });
        }
      });
      this.scriptHub.onVersionCreated((data) => {
        if (data.scriptId === this.scriptId)
          this.loadScript();
      });
      this.scriptHub.onCommentAdded((data) => {
        if (data.scriptId === this.scriptId)
          this.comments.update((c) => [...c, data.comment]);
      });
    });
  }
  togglePanel(panel) {
    this.showPanel.update((p) => p === panel ? null : panel);
  }
  onContentChange() {
    this.hasUnsavedChanges = true;
    this.scriptHub.contentChanged(this.scriptId, this.script()?.content || "", this.scriptId);
  }
  hasChanges() {
    return this.hasUnsavedChanges;
  }
  saveScript() {
    const s = this.script();
    if (!s)
      return;
    this.api.updateScript(s.id, { content: s.content, title: s.title }).subscribe({
      next: () => {
        this.hasUnsavedChanges = false;
        this.api.createScriptVersion(s.id, { content: s.content }).subscribe();
      }
    });
  }
  saveTitle() {
    const s = this.script();
    if (!s)
      return;
    this.api.updateScript(s.id, { title: s.title }).subscribe();
  }
  revertVersion(versionNumber) {
    if (confirm(`Reverter para a vers\xE3o ${versionNumber}?`)) {
      this.api.revertScriptVersion(this.scriptId, versionNumber).subscribe({
        next: (script) => {
          this.script.set(script);
          this.loadScript();
        }
      });
    }
  }
  addComment() {
    if (this.newComment.trim()) {
      this.api.addScriptComment(this.scriptId, this.newComment).subscribe({
        next: (comment) => {
          this.comments.update((c) => [...c, comment]);
          this.newComment = "";
        }
      });
    }
  }
  resolveComment(commentId) {
    this.api.resolveScriptComment(this.scriptId, commentId).subscribe({
      next: (updated) => this.comments.update((c) => c.map((cm) => cm.id === commentId ? updated : cm))
    });
  }
  toggleChecklistItem(item) {
    item.isChecked = !item.isChecked;
    this.api.updateScriptChecklist(this.scriptId, this.checklist()).subscribe();
  }
  exportJson() {
    this.api.exportJson(this.scriptId).subscribe((blob) => this.downloadBlob(blob, "roteiro.json"));
  }
  exportWord() {
    this.api.exportWord(this.scriptId).subscribe((blob) => this.downloadBlob(blob, "roteiro.docx"));
  }
  openTeleprompter() {
    window.open(`/tp/${this.scriptId}`, "_blank");
  }
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  getStatusLabel(status) {
    const labels = {
      [ScriptStatus.Rascunho]: "Rascunho",
      [ScriptStatus.EmRevisao]: "Em Revis\xE3o",
      [ScriptStatus.Aprovado]: "Aprovado",
      [ScriptStatus.Gravado]: "Gravado",
      [ScriptStatus.Concluido]: "Conclu\xEDdo"
    };
    return labels[status] || "N/A";
  }
  getStatusStyle(status) {
    const styles = {
      [ScriptStatus.Rascunho]: "background:rgba(249,115,22,0.1);color:#f97316;",
      [ScriptStatus.EmRevisao]: "background:rgba(234,179,8,0.1);color:#eab308;",
      [ScriptStatus.Aprovado]: "background:rgba(16,185,129,0.1);color:#10b981;",
      [ScriptStatus.Gravado]: "background:rgba(59,130,246,0.1);color:#3b82f6;",
      [ScriptStatus.Concluido]: "background:rgba(113,113,122,0.1);color:#71717a;"
    };
    return styles[status] || "background:rgba(113,113,122,0.1);color:#71717a;";
  }
  static {
    this.\u0275fac = function ScriptEditorComponent_Factory(t) {
      return new (t || _ScriptEditorComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _ScriptEditorComponent, selectors: [["app-script-editor"]], standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 1, vars: 1, consts: [[1, "editor-layout"], [1, "editor-topbar"], [1, "topbar-inner"], [1, "topbar-left"], ["routerLink", "/dashboard", 1, "back-btn"], ["placeholder", "T\xEDtulo do roteiro", 1, "title-input", 3, "ngModelChange", "blur", "ngModel"], [1, "topbar-right"], [1, "version-badge"], [1, "status-badge"], [1, "topbar-divider"], [1, "panel-tab", 3, "click"], [1, "save-btn", 3, "click", "disabled"], [1, "editor-body"], [1, "editor-main"], [1, "scenes-container"], [1, "editor-textarea-wrapper"], ["placeholder", "Digite o conte\xFAdo do roteiro aqui...\n\nMarcadores suportados:\n[Cena 1] T\xEDtulo da Cena\n[Loc] Localiza\xE7\xE3o\n[Let] Lettering\n[Pron] Pron\xFAncia\n[Img] Imagem\n[Url] Fonte\n[Abe] Abertura\n[Enc] Encerramento", "spellcheck", "true", 1, "editor-textarea", 3, "ngModelChange", "input", "ngModel"], [1, "editor-sidebar"], [1, "editor-footer"], [1, "footer-left"], [1, "btn-outline-xs", 3, "click"], [1, "footer-right"], [1, "btn-primary-xs"], [1, "online-indicator"], [1, "online-text"], [1, "scene-card"], [1, "scene-header"], [1, "scene-number"], [1, "scene-body"], [1, "scene-content-block"], [1, "scene-text"], [1, "sidebar-header"], [1, "sidebar-body"], [1, "sidebar-item"], [1, "sidebar-empty"], [1, "sidebar-item-info"], [1, "version-num"], [1, "version-date"], [1, "btn-xs", 3, "click"], [1, "comment-card", 3, "resolved"], [1, "sidebar-footer"], ["placeholder", "Novo coment\xE1rio...", 1, "sidebar-input", 3, "ngModelChange", "keyup.enter", "ngModel"], [1, "btn-xs-primary", 3, "click"], [1, "comment-card"], [1, "comment-text"], [1, "comment-footer"], [1, "comment-date"], [1, "btn-xs"], [1, "checklist-row"], ["type", "checkbox", 3, "change", "checked"], [1, "required-mark"], [1, "btn-primary-xs", 3, "click"]], template: function ScriptEditorComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, ScriptEditorComponent_Conditional_0_Template, 37, 17, "div", 0);
      }
      if (rf & 2) {
        let tmp_0_0;
        \u0275\u0275conditional(0, (tmp_0_0 = ctx.script()) ? 0 : -1, tmp_0_0);
      }
    }, dependencies: [CommonModule, DatePipe, RouterLink, FormsModule, DefaultValueAccessor, NgControlStatus, NgModel], styles: ['\n\n.editor-layout[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  height: calc(100vh - 4rem);\n  background: var(--zinc-50);\n}\n.dark[_ngcontent-%COMP%]   .editor-layout[_ngcontent-%COMP%] {\n  background: var(--zinc-950);\n}\n.editor-topbar[_ngcontent-%COMP%] {\n  position: sticky;\n  top: 0;\n  z-index: 10;\n  background: rgba(255, 255, 255, 0.8);\n  backdrop-filter: blur(12px);\n  -webkit-backdrop-filter: blur(12px);\n  border-bottom: 1px solid var(--border);\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);\n}\n.dark[_ngcontent-%COMP%]   .editor-topbar[_ngcontent-%COMP%] {\n  background: rgba(39, 39, 42, 0.8);\n}\n.topbar-inner[_ngcontent-%COMP%] {\n  max-width: 80rem;\n  margin: 0 auto;\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 0.625rem 1rem;\n  flex-wrap: wrap;\n  gap: 0.5rem;\n}\n.topbar-left[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n  min-width: 0;\n  flex: 1;\n}\n.back-btn[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  color: var(--muted-foreground);\n  text-decoration: none;\n  white-space: nowrap;\n  font-weight: 500;\n}\n.back-btn[_ngcontent-%COMP%]:hover {\n  color: var(--foreground);\n}\n.title-input[_ngcontent-%COMP%] {\n  flex: 1;\n  min-width: 200px;\n  max-width: 350px;\n  background: transparent;\n  border: none;\n  color: var(--foreground);\n  font-size: 1.125rem;\n  font-weight: 800;\n  outline: none;\n  padding: 0;\n}\n.title-input[_ngcontent-%COMP%]::placeholder {\n  color: var(--muted-foreground);\n  opacity: 0.4;\n}\n.topbar-right[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.375rem;\n  flex-shrink: 0;\n}\n.topbar-divider[_ngcontent-%COMP%] {\n  width: 1px;\n  height: 1.25rem;\n  background: var(--border);\n  margin: 0 0.25rem;\n}\n.version-badge[_ngcontent-%COMP%] {\n  display: inline-flex;\n  padding: 0.125rem 0.5rem;\n  border-radius: 9999px;\n  background: rgba(59, 130, 246, 0.1);\n  color: var(--blue-500);\n  font-size: 0.75rem;\n  font-weight: 500;\n  font-family: monospace;\n}\n.status-badge[_ngcontent-%COMP%] {\n  display: inline-flex;\n  padding: 0.125rem 0.625rem;\n  border-radius: 9999px;\n  font-size: 0.75rem;\n  font-weight: 500;\n}\n.online-indicator[_ngcontent-%COMP%] {\n  width: 8px;\n  height: 8px;\n  border-radius: 50%;\n  background: var(--emerald-500);\n  display: inline-block;\n  animation: _ngcontent-%COMP%_pulse 2s infinite;\n}\n.online-text[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  color: var(--muted-foreground);\n}\n.panel-tab[_ngcontent-%COMP%] {\n  padding: 0.375rem 0.625rem;\n  border: none;\n  background: transparent;\n  color: var(--muted-foreground);\n  font-size: 0.8125rem;\n  font-weight: 500;\n  border-radius: 6px;\n  cursor: pointer;\n  transition: all 0.15s;\n}\n.panel-tab[_ngcontent-%COMP%]:hover, .panel-tab.active[_ngcontent-%COMP%] {\n  background: var(--accent);\n  color: var(--foreground);\n}\n.save-btn[_ngcontent-%COMP%] {\n  padding: 0.375rem 0.75rem;\n  border: none;\n  border-radius: 6px;\n  background: var(--primary);\n  color: var(--primary-foreground);\n  font-size: 0.8125rem;\n  font-weight: 600;\n  cursor: pointer;\n  transition: opacity 0.15s;\n}\n.save-btn[_ngcontent-%COMP%]:disabled {\n  opacity: 0.5;\n  cursor: not-allowed;\n}\n.editor-body[_ngcontent-%COMP%] {\n  display: flex;\n  flex: 1;\n  overflow: hidden;\n}\n.editor-main[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  flex-direction: column;\n  overflow-y: auto;\n}\n.scenes-container[_ngcontent-%COMP%] {\n  max-width: 56rem;\n  margin: 0 auto;\n  padding: 2.5rem 1rem 0;\n}\n.scene-card[_ngcontent-%COMP%] {\n  background: var(--card);\n  border: 1px solid var(--border);\n  border-radius: 8px;\n  overflow: hidden;\n  margin-bottom: 2rem;\n  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);\n}\n.scene-header[_ngcontent-%COMP%] {\n  padding: 0.875rem 1.25rem;\n  background: var(--zinc-50);\n  border-bottom: 1px solid var(--border);\n}\n.dark[_ngcontent-%COMP%]   .scene-header[_ngcontent-%COMP%] {\n  background: rgba(39, 39, 42, 0.3);\n}\n.scene-number[_ngcontent-%COMP%] {\n  display: inline-flex;\n  padding: 0.375rem 1rem;\n  border-radius: 4px;\n  font-size: 0.6875rem;\n  font-weight: 900;\n  letter-spacing: -0.025em;\n  background: var(--blue-600);\n  color: #fff;\n  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);\n}\n.scene-body[_ngcontent-%COMP%] {\n  padding: 1.25rem;\n}\n.scene-content-block[_ngcontent-%COMP%] {\n  padding: 1rem;\n  background: var(--muted);\n  border-radius: 6px;\n  border: 1px solid var(--border);\n}\n.scene-text[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  font-weight: 500;\n  line-height: 1.8;\n  color: var(--foreground);\n  white-space: pre-wrap;\n}\n.editor-textarea-wrapper[_ngcontent-%COMP%] {\n  max-width: 56rem;\n  margin: 0 auto;\n  padding: 0 1rem 8rem;\n}\n.editor-textarea[_ngcontent-%COMP%] {\n  width: 100%;\n  min-height: 400px;\n  padding: 1.5rem;\n  border: 1px solid var(--border);\n  border-radius: 8px;\n  background: var(--card);\n  color: var(--foreground);\n  font-family:\n    "SF Mono",\n    "Fira Code",\n    monospace;\n  font-size: 0.9375rem;\n  line-height: 1.8;\n  resize: vertical;\n  outline: none;\n}\n.editor-textarea[_ngcontent-%COMP%]::placeholder {\n  color: var(--muted-foreground);\n  opacity: 0.3;\n}\n.editor-textarea[_ngcontent-%COMP%]:focus {\n  border-color: var(--ring);\n  box-shadow: 0 0 0 2px rgba(161, 161, 170, 0.15);\n}\n.editor-sidebar[_ngcontent-%COMP%] {\n  width: 340px;\n  border-left: 1px solid var(--border);\n  background: var(--card);\n  display: flex;\n  flex-direction: column;\n  flex-shrink: 0;\n}\n.sidebar-header[_ngcontent-%COMP%] {\n  padding: 1rem 1.25rem;\n  border-bottom: 1px solid var(--border);\n}\n.sidebar-header[_ngcontent-%COMP%]   h3[_ngcontent-%COMP%] {\n  font-size: 0.9375rem;\n  font-weight: 700;\n  color: var(--foreground);\n}\n.sidebar-body[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow-y: auto;\n  padding: 0.5rem 0;\n}\n.sidebar-empty[_ngcontent-%COMP%] {\n  text-align: center;\n  padding: 2rem;\n  color: var(--muted-foreground);\n  font-size: 0.8125rem;\n}\n.sidebar-item[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 0.625rem 1.25rem;\n  border-bottom: 1px solid var(--border);\n}\n.sidebar-item-info[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n}\n.version-num[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  font-weight: 600;\n  color: var(--blue-500);\n  font-family: monospace;\n}\n.version-date[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  color: var(--muted-foreground);\n}\n.comment-card[_ngcontent-%COMP%] {\n  padding: 0.75rem 1.25rem;\n  border-bottom: 1px solid var(--border);\n}\n.comment-card.resolved[_ngcontent-%COMP%] {\n  opacity: 0.5;\n}\n.comment-text[_ngcontent-%COMP%] {\n  font-size: 0.8125rem;\n  color: var(--foreground);\n  margin-bottom: 0.375rem;\n  line-height: 1.5;\n}\n.comment-footer[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n}\n.comment-date[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  color: var(--muted-foreground);\n}\n.checklist-row[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.625rem 1.25rem;\n  cursor: pointer;\n  font-size: 0.8125rem;\n  color: var(--foreground);\n}\n.checklist-row[_ngcontent-%COMP%]   input[type=checkbox][_ngcontent-%COMP%] {\n  width: 1rem;\n  height: 1rem;\n  accent-color: var(--primary);\n}\n.checked-text[_ngcontent-%COMP%] {\n  text-decoration: line-through;\n  opacity: 0.5;\n}\n.required-mark[_ngcontent-%COMP%] {\n  color: var(--destructive);\n}\n.sidebar-footer[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.375rem;\n  padding: 0.75rem 1.25rem;\n  border-top: 1px solid var(--border);\n}\n.sidebar-input[_ngcontent-%COMP%] {\n  flex: 1;\n  padding: 0.375rem 0.625rem;\n  border: 1px solid var(--input);\n  border-radius: 6px;\n  background: transparent;\n  color: var(--foreground);\n  font-size: 0.8125rem;\n}\n.sidebar-input[_ngcontent-%COMP%]:focus {\n  outline: none;\n  border-color: var(--ring);\n}\n.btn-xs[_ngcontent-%COMP%] {\n  padding: 0.25rem 0.5rem;\n  border: none;\n  border-radius: 6px;\n  background: var(--muted);\n  color: var(--muted-foreground);\n  font-size: 0.75rem;\n  font-weight: 500;\n  cursor: pointer;\n}\n.btn-xs[_ngcontent-%COMP%]:hover {\n  background: var(--accent);\n  color: var(--foreground);\n}\n.btn-xs-primary[_ngcontent-%COMP%] {\n  padding: 0.375rem 0.75rem;\n  border: none;\n  border-radius: 6px;\n  background: var(--primary);\n  color: var(--primary-foreground);\n  font-size: 0.8125rem;\n  font-weight: 500;\n  cursor: pointer;\n}\n.editor-footer[_ngcontent-%COMP%] {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 0.625rem 1rem;\n  border-top: 1px solid var(--border);\n  background: var(--card);\n  flex-shrink: 0;\n}\n.footer-left[_ngcontent-%COMP%], .footer-right[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.375rem;\n}\n.btn-outline-xs[_ngcontent-%COMP%] {\n  padding: 0.375rem 0.625rem;\n  border: 1px solid var(--border);\n  border-radius: 6px;\n  background: transparent;\n  color: var(--muted-foreground);\n  font-size: 0.8125rem;\n  font-weight: 500;\n  cursor: pointer;\n}\n.btn-outline-xs[_ngcontent-%COMP%]:hover {\n  background: var(--accent);\n  color: var(--foreground);\n}\n.btn-primary-xs[_ngcontent-%COMP%] {\n  padding: 0.375rem 0.75rem;\n  border: none;\n  border-radius: 6px;\n  background: var(--primary);\n  color: var(--primary-foreground);\n  font-size: 0.8125rem;\n  font-weight: 600;\n  cursor: pointer;\n}\n@keyframes _ngcontent-%COMP%_pulse {\n  0%, 100% {\n    opacity: 1;\n  }\n  50% {\n    opacity: 0.5;\n  }\n}\n@media (max-width: 768px) {\n  .topbar-right[_ngcontent-%COMP%] {\n    display: none;\n  }\n  .editor-sidebar[_ngcontent-%COMP%] {\n    width: 100%;\n    border-left: none;\n    border-top: 1px solid var(--border);\n  }\n}\n/*# sourceMappingURL=script-editor.component.css.map */'] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(ScriptEditorComponent, { className: "ScriptEditorComponent", filePath: "src\\app\\features\\scripts\\editor\\script-editor.component.ts", lineNumber: 384 });
})();
export {
  ScriptEditorComponent
};
//# sourceMappingURL=chunk-JBLYDU5J.js.map
