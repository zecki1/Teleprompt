import {
  SignalRService
} from "./chunk-VXOLMSSB.js";
import "./chunk-AJEFXTFW.js";
import {
  FormsModule,
  NgControlStatus,
  NgModel,
  NgSelectOption,
  SelectControlValueAccessor,
  ɵNgSelectMultipleOption
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
  RouterLink
} from "./chunk-NJ75DOAS.js";
import "./chunk-3SDTMM4U.js";
import {
  CommonModule,
  __async,
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
  ɵɵloadQuery,
  ɵɵnextContext,
  ɵɵproperty,
  ɵɵpureFunction1,
  ɵɵqueryRefresh,
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
  ɵɵviewQuery
} from "./chunk-SBUHLZV6.js";

// src/app/core/realtime/tp-hub.service.ts
var TpHubService = class _TpHubService {
  constructor() {
    this.signalR = inject(SignalRService);
    this.hubName = "tpHub";
    this.participants = signal([]);
    this.connected = signal(false);
    this.scrollState = signal(null);
    this.participantsReadonly = this.participants.asReadonly();
    this.isConnected = this.connected.asReadonly();
    this.scrollStateReadonly = this.scrollState.asReadonly();
  }
  connect() {
    return __async(this, null, function* () {
      yield this.signalR.startConnection(this.hubName, environment.signalR.tpHubUrl);
      this.connected.set(true);
    });
  }
  disconnect() {
    return __async(this, null, function* () {
      yield this.signalR.stopConnection(this.hubName);
      this.connected.set(false);
      this.participants.set([]);
      this.scrollState.set(null);
    });
  }
  joinTp(tpSessionId, role) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "JoinTp", tpSessionId, role);
    });
  }
  joinSession(scriptId) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "JoinTp", scriptId, "operator");
    });
  }
  leaveSession(scriptId) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "LeaveTp", scriptId);
    });
  }
  scrollStateChanged(tpSessionId, position, speed, mode) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "ScrollStateChanged", tpSessionId, position, speed, mode);
    });
  }
  modeChanged(tpSessionId, mode) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "ModeChanged", tpSessionId, mode);
    });
  }
  speedChanged(tpSessionId, speed) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "SpeedChanged", tpSessionId, speed);
    });
  }
  remoteCommand(tpSessionId, command) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "RemoteCommand", tpSessionId, command);
    });
  }
  recorded(tpSessionId, scriptId) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "Recorded", tpSessionId, scriptId);
    });
  }
  orderChanged(tpSessionId, recordingOrder) {
    return __async(this, null, function* () {
      yield this.signalR.invoke(this.hubName, "OrderChanged", tpSessionId, recordingOrder);
    });
  }
  onParticipantJoined(callback) {
    this.signalR.on(this.hubName, "ParticipantJoined", (tpSessionId, participant) => {
      this.participants.update((p) => [...p, participant]);
      callback(tpSessionId, participant);
    });
  }
  onScrollStateChanged(callback) {
    this.signalR.on(this.hubName, "ScrollStateChanged", (tpSessionId, position, speed, mode) => {
      const event = { tpSessionId, position, speed, mode };
      this.scrollState.set(event);
      callback(event);
    });
  }
  onModeChanged(callback) {
    this.signalR.on(this.hubName, "ModeChanged", callback);
  }
  onSpeedChanged(callback) {
    this.signalR.on(this.hubName, "SpeedChanged", callback);
  }
  onRemoteCommand(callback) {
    this.signalR.on(this.hubName, "RemoteCommand", callback);
  }
  onRecorded(callback) {
    this.signalR.on(this.hubName, "Recorded", callback);
  }
  onOrderChanged(callback) {
    this.signalR.on(this.hubName, "OrderChanged", callback);
  }
  static {
    this.\u0275fac = function TpHubService_Factory(t) {
      return new (t || _TpHubService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _TpHubService, factory: _TpHubService.\u0275fac, providedIn: "root" });
  }
};

// src/app/features/teleprompter/player/teleprompter-player.component.ts
var _c0 = ["scrollArea"];
var _c1 = ["scrollContent"];
var _forTrack0 = ($index, $item) => $item.index;
var _forTrack1 = ($index, $item) => $item.value;
var _c2 = (a0) => ["/scripts", a0];
function TeleprompterPlayerComponent_Conditional_0_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 2);
    \u0275\u0275element(1, "div", 3);
    \u0275\u0275elementStart(2, "p", 4);
    \u0275\u0275text(3, "Carregando roteiro...");
    \u0275\u0275elementEnd()();
  }
}
function TeleprompterPlayerComponent_Conditional_1_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 5)(1, "p", 6);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "a", 7);
    \u0275\u0275text(4, "\u2190 Voltar ao Dashboard");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(ctx_r0.error());
  }
}
function TeleprompterPlayerComponent_Conditional_2_Conditional_3_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275element(0, "div", 10);
  }
}
function TeleprompterPlayerComponent_Conditional_2_For_7_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 17)(1, "span", 18);
    \u0275\u0275text(2);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(3, "p", 13);
    \u0275\u0275text(4);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const scene_r3 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275styleProp("margin-bottom", ctx_r0.sceneGap());
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate1("Cena ", scene_r3.index, "");
    \u0275\u0275advance(2);
    \u0275\u0275textInterpolate(scene_r3.content);
  }
}
function TeleprompterPlayerComponent_Conditional_2_Conditional_8_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "p", 13);
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(ctx_r0.formattedContent());
  }
}
function TeleprompterPlayerComponent_Conditional_2_Conditional_9_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275elementStart(0, "div", 19);
    \u0275\u0275element(1, "span", 20);
    \u0275\u0275elementStart(2, "span", 21);
    \u0275\u0275text(3, "PAUSADO");
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    \u0275\u0275classProp("mirror-mode", false);
  }
}
function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Conditional_31_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " \u23F8 ");
  }
}
function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Conditional_32_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " \u25B6 ");
  }
}
function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Conditional_36_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " \u22A1 ");
  }
}
function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Conditional_37_Template(rf, ctx) {
  if (rf & 1) {
    \u0275\u0275text(0, " \u2922 ");
  }
}
function TeleprompterPlayerComponent_Conditional_2_Conditional_10_For_43_Template(rf, ctx) {
  if (rf & 1) {
    const _r5 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 39);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_For_43_Template_button_click_0_listener() {
      const size_r6 = \u0275\u0275restoreView(_r5).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.fontSize.set(size_r6.value));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const size_r6 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275classProp("active", ctx_r0.fontSize() === size_r6.value);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(size_r6.label);
  }
}
function TeleprompterPlayerComponent_Conditional_2_Conditional_10_For_69_Template(rf, ctx) {
  if (rf & 1) {
    const _r7 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 39);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_For_69_Template_button_click_0_listener() {
      const w_r8 = \u0275\u0275restoreView(_r7).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.maxWidth.set(w_r8.value));
    });
    \u0275\u0275text(1);
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const w_r8 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275classProp("active", ctx_r0.maxWidth() === w_r8.value);
    \u0275\u0275advance();
    \u0275\u0275textInterpolate(w_r8.label);
  }
}
function TeleprompterPlayerComponent_Conditional_2_Conditional_10_For_78_Template(rf, ctx) {
  if (rf & 1) {
    const _r9 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 53);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_For_78_Template_button_click_0_listener() {
      const c_r10 = \u0275\u0275restoreView(_r9).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.bgColor.set(c_r10));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const c_r10 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275styleProp("background", c_r10);
    \u0275\u0275classProp("active-swatch", ctx_r0.bgColor() === c_r10);
  }
}
function TeleprompterPlayerComponent_Conditional_2_Conditional_10_For_84_Template(rf, ctx) {
  if (rf & 1) {
    const _r11 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "button", 53);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_For_84_Template_button_click_0_listener() {
      const c_r12 = \u0275\u0275restoreView(_r11).$implicit;
      const ctx_r0 = \u0275\u0275nextContext(3);
      return \u0275\u0275resetView(ctx_r0.textColor.set(c_r12));
    });
    \u0275\u0275elementEnd();
  }
  if (rf & 2) {
    const c_r12 = ctx.$implicit;
    const ctx_r0 = \u0275\u0275nextContext(3);
    \u0275\u0275styleProp("background", c_r12);
    \u0275\u0275classProp("active-swatch", ctx_r0.textColor() === c_r12);
  }
}
function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Template(rf, ctx) {
  if (rf & 1) {
    const _r4 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 15)(1, "div", 22)(2, "div", 23)(3, "span", 24);
    \u0275\u0275text(4, "\u2699");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(5, "span", 25);
    \u0275\u0275text(6, "Master Control");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(7, "div", 26)(8, "div", 27)(9, "span", 28);
    \u0275\u0275text(10, "Roteiro");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(11, "p", 29);
    \u0275\u0275text(12);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(13, "div", 27)(14, "span", 28);
    \u0275\u0275text(15, "Velocidade");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(16, "div", 30)(17, "button", 31);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Template_button_click_17_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.decreaseSpeed());
    });
    \u0275\u0275text(18, "\u2212");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(19, "div", 32)(20, "span", 33);
    \u0275\u0275text(21);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(22, "span", 34);
    \u0275\u0275text(23, "x");
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(24, "button", 31);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Template_button_click_24_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.increaseSpeed());
    });
    \u0275\u0275text(25, "\uFF0B");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(26, "div", 27)(27, "span", 28);
    \u0275\u0275text(28, "Controles");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(29, "div", 35)(30, "button", 36);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Template_button_click_30_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.togglePlay());
    });
    \u0275\u0275template(31, TeleprompterPlayerComponent_Conditional_2_Conditional_10_Conditional_31_Template, 1, 0)(32, TeleprompterPlayerComponent_Conditional_2_Conditional_10_Conditional_32_Template, 1, 0);
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(33, "button", 36);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Template_button_click_33_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.resetScroll());
    });
    \u0275\u0275text(34, "\u21BA");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(35, "button", 36);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Template_button_click_35_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.toggleFullscreen());
    });
    \u0275\u0275template(36, TeleprompterPlayerComponent_Conditional_2_Conditional_10_Conditional_36_Template, 1, 0)(37, TeleprompterPlayerComponent_Conditional_2_Conditional_10_Conditional_37_Template, 1, 0);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(38, "div", 27)(39, "span", 28);
    \u0275\u0275text(40, "Tamanho");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(41, "div", 37);
    \u0275\u0275repeaterCreate(42, TeleprompterPlayerComponent_Conditional_2_Conditional_10_For_43_Template, 2, 3, "button", 38, _forTrack1);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(44, "div", 27)(45, "span", 28);
    \u0275\u0275text(46, "Espessura");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(47, "div", 37)(48, "button", 39);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Template_button_click_48_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.fontWeight.set("normal"));
    });
    \u0275\u0275text(49, "Normal");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(50, "button", 39);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Template_button_click_50_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.fontWeight.set("500"));
    });
    \u0275\u0275text(51, "M\xE9dio");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(52, "button", 39);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Template_button_click_52_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.fontWeight.set("bold"));
    });
    \u0275\u0275text(53, "Bold");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(54, "div", 27)(55, "span", 28);
    \u0275\u0275text(56, "Alinhamento");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(57, "div", 37)(58, "button", 39);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Template_button_click_58_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.textAlign.set("left"));
    });
    \u0275\u0275text(59, "\u25C0 Esq");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(60, "button", 39);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Template_button_click_60_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.textAlign.set("center"));
    });
    \u0275\u0275text(61, "\u25A0 Centro");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(62, "button", 39);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Template_button_click_62_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.textAlign.set("right"));
    });
    \u0275\u0275text(63, "\u25B6 Dir");
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(64, "div", 27)(65, "span", 28);
    \u0275\u0275text(66, "Largura");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(67, "div", 37);
    \u0275\u0275repeaterCreate(68, TeleprompterPlayerComponent_Conditional_2_Conditional_10_For_69_Template, 2, 3, "button", 38, _forTrack1);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(70, "div", 27)(71, "span", 28);
    \u0275\u0275text(72, "Cores");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(73, "div", 40)(74, "span", 41);
    \u0275\u0275text(75, "Fundo");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(76, "div", 42);
    \u0275\u0275repeaterCreate(77, TeleprompterPlayerComponent_Conditional_2_Conditional_10_For_78_Template, 1, 4, "button", 43, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(79, "div", 40)(80, "span", 41);
    \u0275\u0275text(81, "Texto");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(82, "div", 42);
    \u0275\u0275repeaterCreate(83, TeleprompterPlayerComponent_Conditional_2_Conditional_10_For_84_Template, 1, 4, "button", 43, \u0275\u0275repeaterTrackByIdentity);
    \u0275\u0275elementEnd()()();
    \u0275\u0275elementStart(85, "div", 27)(86, "span", 28);
    \u0275\u0275text(87, "Op\xE7\xF5es");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(88, "label", 44)(89, "span");
    \u0275\u0275text(90, "Faixa de leitura");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(91, "button", 45);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Template_button_click_91_listener() {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.showReadingStrip.set(!ctx_r0.showReadingStrip()));
    });
    \u0275\u0275element(92, "span", 46);
    \u0275\u0275elementEnd()();
    \u0275\u0275elementStart(93, "label", 44)(94, "span");
    \u0275\u0275text(95, "Espa\xE7o entre cenas");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(96, "select", 47);
    \u0275\u0275listener("ngModelChange", function TeleprompterPlayerComponent_Conditional_2_Conditional_10_Template_select_ngModelChange_96_listener($event) {
      \u0275\u0275restoreView(_r4);
      const ctx_r0 = \u0275\u0275nextContext(2);
      return \u0275\u0275resetView(ctx_r0.sceneGap.set($event));
    });
    \u0275\u0275elementStart(97, "option", 48);
    \u0275\u0275text(98, "Pequeno");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(99, "option", 49);
    \u0275\u0275text(100, "M\xE9dio");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(101, "option", 50);
    \u0275\u0275text(102, "Grande");
    \u0275\u0275elementEnd();
    \u0275\u0275elementStart(103, "option", 51);
    \u0275\u0275text(104, "Extra");
    \u0275\u0275elementEnd()()()();
    \u0275\u0275elementStart(105, "div", 27)(106, "a", 52);
    \u0275\u0275text(107, "\u2190 Voltar ao Editor");
    \u0275\u0275elementEnd()()()();
  }
  if (rf & 2) {
    let tmp_4_0;
    const ctx_r0 = \u0275\u0275nextContext(2);
    \u0275\u0275advance(12);
    \u0275\u0275textInterpolate(((tmp_4_0 = ctx_r0.script()) == null ? null : tmp_4_0.title) || "Teleprompter");
    \u0275\u0275advance(9);
    \u0275\u0275textInterpolate(ctx_r0.speed());
    \u0275\u0275advance(9);
    \u0275\u0275classProp("playing", ctx_r0.isPlaying());
    \u0275\u0275advance();
    \u0275\u0275conditional(31, ctx_r0.isPlaying() ? 31 : 32);
    \u0275\u0275advance(5);
    \u0275\u0275conditional(36, ctx_r0.isFullscreen() ? 36 : 37);
    \u0275\u0275advance(6);
    \u0275\u0275repeater(ctx_r0.fontSizeOptions);
    \u0275\u0275advance(6);
    \u0275\u0275classProp("active", ctx_r0.fontWeight() === "normal");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("active", ctx_r0.fontWeight() === "500");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("active", ctx_r0.fontWeight() === "bold");
    \u0275\u0275advance(6);
    \u0275\u0275classProp("active", ctx_r0.textAlign() === "left");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("active", ctx_r0.textAlign() === "center");
    \u0275\u0275advance(2);
    \u0275\u0275classProp("active", ctx_r0.textAlign() === "right");
    \u0275\u0275advance(6);
    \u0275\u0275repeater(ctx_r0.maxWidthOptions);
    \u0275\u0275advance(9);
    \u0275\u0275repeater(ctx_r0.bgColors);
    \u0275\u0275advance(6);
    \u0275\u0275repeater(ctx_r0.textColors);
    \u0275\u0275advance(8);
    \u0275\u0275classProp("toggle-on", ctx_r0.showReadingStrip());
    \u0275\u0275advance(5);
    \u0275\u0275property("ngModel", ctx_r0.sceneGap());
    \u0275\u0275advance(10);
    \u0275\u0275property("routerLink", \u0275\u0275pureFunction1(22, _c2, ctx_r0.scriptId));
  }
}
function TeleprompterPlayerComponent_Conditional_2_Template(rf, ctx) {
  if (rf & 1) {
    const _r2 = \u0275\u0275getCurrentView();
    \u0275\u0275elementStart(0, "div", 8)(1, "div", 9, 0);
    \u0275\u0275template(3, TeleprompterPlayerComponent_Conditional_2_Conditional_3_Template, 1, 0, "div", 10);
    \u0275\u0275elementStart(4, "div", 11, 1);
    \u0275\u0275repeaterCreate(6, TeleprompterPlayerComponent_Conditional_2_For_7_Template, 5, 4, "div", 12, _forTrack0);
    \u0275\u0275template(8, TeleprompterPlayerComponent_Conditional_2_Conditional_8_Template, 2, 1, "p", 13);
    \u0275\u0275elementEnd();
    \u0275\u0275template(9, TeleprompterPlayerComponent_Conditional_2_Conditional_9_Template, 4, 2, "div", 14);
    \u0275\u0275elementEnd();
    \u0275\u0275template(10, TeleprompterPlayerComponent_Conditional_2_Conditional_10_Template, 108, 24, "div", 15);
    \u0275\u0275elementStart(11, "button", 16);
    \u0275\u0275listener("click", function TeleprompterPlayerComponent_Conditional_2_Template_button_click_11_listener() {
      \u0275\u0275restoreView(_r2);
      const ctx_r0 = \u0275\u0275nextContext();
      return \u0275\u0275resetView(ctx_r0.showSidebar.set(!ctx_r0.showSidebar()));
    });
    \u0275\u0275text(12);
    \u0275\u0275elementEnd()();
  }
  if (rf & 2) {
    const ctx_r0 = \u0275\u0275nextContext();
    \u0275\u0275advance();
    \u0275\u0275styleProp("background", ctx_r0.bgColor());
    \u0275\u0275advance(2);
    \u0275\u0275conditional(3, ctx_r0.showReadingStrip() ? 3 : -1);
    \u0275\u0275advance();
    \u0275\u0275styleProp("font-size", ctx_r0.fontSize())("font-weight", ctx_r0.fontWeight())("line-height", ctx_r0.lineHeight())("max-width", ctx_r0.maxWidth())("color", ctx_r0.textColor())("text-align", ctx_r0.textAlign());
    \u0275\u0275advance(2);
    \u0275\u0275repeater(ctx_r0.scenes());
    \u0275\u0275advance(2);
    \u0275\u0275conditional(8, ctx_r0.scenes().length === 0 ? 8 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(9, ctx_r0.isPaused() ? 9 : -1);
    \u0275\u0275advance();
    \u0275\u0275conditional(10, ctx_r0.showSidebar() ? 10 : -1);
    \u0275\u0275advance();
    \u0275\u0275classProp("shifted", ctx_r0.showSidebar());
    \u0275\u0275advance();
    \u0275\u0275textInterpolate1(" ", ctx_r0.showSidebar() ? "\u203A" : "\u2039", " ");
  }
}
var TeleprompterPlayerComponent = class _TeleprompterPlayerComponent {
  constructor() {
    this.route = inject(ActivatedRoute);
    this.api = inject(ApiService);
    this.tpHub = inject(TpHubService);
    this.observability = inject(ObservabilityService);
    this.script = signal(null);
    this.loading = signal(true);
    this.error = signal(null);
    this.speed = signal(1);
    this.isPlaying = signal(false);
    this.isFullscreen = signal(false);
    this.isPaused = signal(true);
    this.formattedContent = signal("");
    this.showSidebar = signal(true);
    this.bgColor = signal("#000000");
    this.textColor = signal("#ffffff");
    this.fontSize = signal("4.5rem");
    this.fontWeight = signal("500");
    this.lineHeight = signal("1.6");
    this.maxWidth = signal("56rem");
    this.textAlign = signal("left");
    this.showReadingStrip = signal(true);
    this.sceneGap = signal("8rem");
    this.fontSizeOptions = [
      { label: "M", value: "2.5rem" },
      { label: "L", value: "3.5rem" },
      { label: "XL", value: "4.5rem" },
      { label: "2XL", value: "6rem" },
      { label: "3XL", value: "8rem" }
    ];
    this.maxWidthOptions = [
      { label: "S", value: "40rem" },
      { label: "M", value: "56rem" },
      { label: "L", value: "72rem" },
      { label: "XL", value: "none" }
    ];
    this.bgColors = ["#000000", "#0a192f", "#064e3b", "#18181b", "#ffffff"];
    this.textColors = ["#ffffff", "#ffff00", "#22d3ee", "#18181b"];
    this.scenes = computed(() => {
      const content = this.script()?.content || "";
      if (!content)
        return [];
      const parts = content.split(/\[Cena\s+(\d+)\]/i);
      const scenes = [];
      for (let i = 1; i < parts.length; i += 2) {
        scenes.push({ index: parseInt(parts[i]), content: (parts[i + 1] || "").trim() });
      }
      return scenes;
    });
    this.scriptId = "";
    this.handleKeydown = (e) => {
      switch (e.key) {
        case " ":
          e.preventDefault();
          this.togglePlay();
          break;
        case "ArrowUp":
          e.preventDefault();
          this.decreaseSpeed();
          break;
        case "ArrowDown":
          e.preventDefault();
          this.increaseSpeed();
          break;
        case "f":
          this.toggleFullscreen();
          break;
      }
    };
  }
  ngOnInit() {
    this.observability.trackPageView("teleprompter-player");
    this.scriptId = this.route.snapshot.paramMap.get("id");
    this.loadScript();
    this.setupRealtime();
    this.setupKeyboard();
  }
  ngOnDestroy() {
    this.stopScrolling();
    this.tpHub.leaveSession(this.scriptId);
    document.removeEventListener("keydown", this.handleKeydown);
  }
  loadScript() {
    if (!this.scriptId) {
      this.loading.set(false);
      this.error.set("ID do roteiro n\xE3o encontrado na URL.");
      return;
    }
    this.api.getScript(this.scriptId).subscribe({
      next: (script) => {
        this.script.set(script);
        this.formattedContent.set(script.content || "");
        this.loading.set(false);
      },
      error: (err) => {
        console.error("Erro ao carregar roteiro:", err);
        this.loading.set(false);
        this.error.set("Erro ao carregar o roteiro. Verifique se o backend est\xE1 rodando.");
      }
    });
  }
  setupRealtime() {
    return __async(this, null, function* () {
      yield this.tpHub.connect();
      yield this.tpHub.joinSession(this.scriptId);
    });
  }
  setupKeyboard() {
    document.addEventListener("keydown", this.handleKeydown);
  }
  togglePlay() {
    this.isPlaying.update((p) => !p);
    this.isPaused.set(this.isPlaying());
    if (this.isPlaying())
      this.startScrolling();
    else
      this.stopScrolling();
  }
  startScrolling() {
    this.scrollInterval = setInterval(() => {
      const el = this.scrollArea?.nativeElement;
      if (el)
        el.scrollTop += this.speed();
    }, 16);
  }
  stopScrolling() {
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
      this.scrollInterval = null;
    }
  }
  increaseSpeed() {
    this.speed.update((s) => Math.min(s + 0.25, 5));
  }
  decreaseSpeed() {
    this.speed.update((s) => Math.max(s - 0.25, 0.25));
  }
  resetScroll() {
    this.scrollArea?.nativeElement?.scrollTo({ top: 0, behavior: "smooth" });
    this.isPlaying.set(false);
    this.isPaused.set(true);
    this.stopScrolling();
  }
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      this.isFullscreen.set(true);
    } else {
      document.exitFullscreen();
      this.isFullscreen.set(false);
    }
  }
  static {
    this.\u0275fac = function TeleprompterPlayerComponent_Factory(t) {
      return new (t || _TeleprompterPlayerComponent)();
    };
  }
  static {
    this.\u0275cmp = /* @__PURE__ */ \u0275\u0275defineComponent({ type: _TeleprompterPlayerComponent, selectors: [["app-teleprompter-player"]], viewQuery: function TeleprompterPlayerComponent_Query(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275viewQuery(_c0, 5);
        \u0275\u0275viewQuery(_c1, 5);
      }
      if (rf & 2) {
        let _t;
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.scrollArea = _t.first);
        \u0275\u0275queryRefresh(_t = \u0275\u0275loadQuery()) && (ctx.scrollContent = _t.first);
      }
    }, standalone: true, features: [\u0275\u0275StandaloneFeature], decls: 3, vars: 1, consts: [["scrollArea", ""], ["scrollContent", ""], [1, "tp-loading"], [1, "tp-spinner"], [1, "tp-loading-text"], [1, "tp-error"], [1, "tp-error-text"], ["routerLink", "/dashboard", 1, "tp-error-link"], [1, "tp-layout"], [1, "tp-scroll-area"], [1, "reading-strip"], [1, "tp-content"], [1, "tp-scene", 3, "marginBottom"], [1, "tp-text"], [1, "paused-indicator", 3, "mirror-mode"], [1, "tp-sidebar"], [1, "sidebar-toggle", 3, "click"], [1, "tp-scene"], [1, "tp-marker"], [1, "paused-indicator"], [1, "paused-dot"], [1, "paused-label"], [1, "sidebar-top"], [1, "sidebar-title-row"], [1, "sidebar-icon"], [1, "sidebar-title-text"], [1, "sidebar-scroll"], [1, "sidebar-section"], [1, "sidebar-section-label"], [1, "sidebar-script-title"], [1, "speed-control"], [1, "speed-btn", 3, "click"], [1, "speed-value-box"], [1, "speed-value"], [1, "speed-suffix"], [1, "controls-grid"], [1, "control-btn", 3, "click"], [1, "style-btns"], [1, "style-btn", 3, "active"], [1, "style-btn", 3, "click"], [1, "color-row"], [1, "color-label"], [1, "color-swatches"], [1, "swatch", 3, "background", "active-swatch"], [1, "toggle-row"], [1, "toggle-switch", 3, "click"], [1, "toggle-thumb"], [1, "select-sm", 3, "ngModelChange", "ngModel"], ["value", "2rem"], ["value", "4rem"], ["value", "8rem"], ["value", "12rem"], [1, "back-edit-link", 3, "routerLink"], [1, "swatch", 3, "click"]], template: function TeleprompterPlayerComponent_Template(rf, ctx) {
      if (rf & 1) {
        \u0275\u0275template(0, TeleprompterPlayerComponent_Conditional_0_Template, 4, 0, "div", 2)(1, TeleprompterPlayerComponent_Conditional_1_Template, 5, 1)(2, TeleprompterPlayerComponent_Conditional_2_Template, 13, 21);
      }
      if (rf & 2) {
        \u0275\u0275conditional(0, ctx.loading() ? 0 : ctx.error() ? 1 : 2);
      }
    }, dependencies: [CommonModule, FormsModule, NgSelectOption, \u0275NgSelectMultipleOption, SelectControlValueAccessor, NgControlStatus, NgModel, RouterLink], styles: ["\n\n.tp-layout[_ngcontent-%COMP%] {\n  display: flex;\n  height: 100vh;\n  overflow: hidden;\n  position: relative;\n}\n.tp-scroll-area[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow-y: auto;\n  position: relative;\n  -ms-overflow-style: none;\n  scrollbar-width: none;\n}\n.tp-scroll-area[_ngcontent-%COMP%]::-webkit-scrollbar {\n  display: none;\n}\n.reading-strip[_ngcontent-%COMP%] {\n  position: fixed;\n  top: 50%;\n  left: 0;\n  width: 100%;\n  height: 8rem;\n  background: rgba(255, 255, 255, 0.05);\n  pointer-events: none;\n  transform: translateY(-50%);\n  z-index: 10;\n  border-top: 1px solid rgba(255, 255, 255, 0.1);\n  border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n  box-shadow: 0 0 30px rgba(0, 0, 0, 0.3);\n}\n.tp-content[_ngcontent-%COMP%] {\n  max-width: 56rem;\n  margin: 0 auto;\n  padding: 40vh 2rem 60vh;\n  position: relative;\n  z-index: 1;\n}\n.tp-scene[_ngcontent-%COMP%] {\n  padding-bottom: 2rem;\n}\n.tp-marker[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.875rem;\n  font-weight: 600;\n  color: var(--blue-500);\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  margin-bottom: 0.5rem;\n}\n.tp-text[_ngcontent-%COMP%] {\n  white-space: pre-wrap;\n}\n.paused-indicator[_ngcontent-%COMP%] {\n  position: fixed;\n  bottom: 1.5rem;\n  left: 1.5rem;\n  display: flex;\n  align-items: center;\n  gap: 0.5rem;\n  padding: 0.5rem 1rem;\n  border-radius: 1rem;\n  -webkit-backdrop-filter: blur(12px);\n  backdrop-filter: blur(12px);\n  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);\n  z-index: 20;\n  background: rgba(16, 185, 129, 0.15);\n}\n.paused-indicator.mirror-mode[_ngcontent-%COMP%] {\n  background: rgba(239, 68, 68, 0.25);\n}\n.paused-dot[_ngcontent-%COMP%] {\n  width: 8px;\n  height: 8px;\n  border-radius: 50%;\n  animation: _ngcontent-%COMP%_pulse 2s infinite;\n}\n.paused-indicator[_ngcontent-%COMP%]:not(.mirror-mode)   .paused-dot[_ngcontent-%COMP%] {\n  background: #10b981;\n}\n.paused-indicator.mirror-mode[_ngcontent-%COMP%]   .paused-dot[_ngcontent-%COMP%] {\n  background: #ef4444;\n}\n.paused-label[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  font-weight: 900;\n  text-transform: uppercase;\n  letter-spacing: 0.3em;\n}\n.tp-sidebar[_ngcontent-%COMP%] {\n  width: 400px;\n  flex-shrink: 0;\n  height: 100%;\n  background: var(--zinc-950);\n  border-left: 1px solid rgba(255, 255, 255, 0.1);\n  display: flex;\n  flex-direction: column;\n  z-index: 20;\n  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.3);\n}\n.sidebar-top[_ngcontent-%COMP%] {\n  padding: 1.25rem 1.5rem;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.1);\n}\n.sidebar-title-row[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  gap: 0.75rem;\n}\n.sidebar-icon[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 2rem;\n  height: 2rem;\n  border-radius: 8px;\n  background: rgba(255, 255, 255, 0.1);\n  font-size: 14px;\n}\n.sidebar-title-text[_ngcontent-%COMP%] {\n  font-size: 0.625rem;\n  font-weight: 900;\n  text-transform: uppercase;\n  letter-spacing: 0.2em;\n  color: #71717a;\n  font-family: monospace;\n}\n.sidebar-scroll[_ngcontent-%COMP%] {\n  flex: 1;\n  overflow-y: auto;\n  padding: 0.5rem 0;\n}\n.sidebar-section[_ngcontent-%COMP%] {\n  padding: 1rem 1.5rem;\n  border-bottom: 1px solid rgba(255, 255, 255, 0.05);\n}\n.sidebar-section-label[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.625rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.1em;\n  color: #71717a;\n  margin-bottom: 0.75rem;\n}\n.sidebar-script-title[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  font-weight: 700;\n  color: #fff;\n}\n.speed-control[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  gap: 1rem;\n}\n.speed-btn[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  width: 2.5rem;\n  height: 2.5rem;\n  border-radius: 8px;\n  border: 1px solid rgba(255, 255, 255, 0.15);\n  background: transparent;\n  color: #fff;\n  font-size: 1.125rem;\n  cursor: pointer;\n  transition: background 0.15s;\n}\n.speed-btn[_ngcontent-%COMP%]:hover {\n  background: rgba(255, 255, 255, 0.1);\n}\n.speed-value-box[_ngcontent-%COMP%] {\n  text-align: center;\n}\n.speed-value[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 1.5rem;\n  font-weight: 900;\n  color: #fff;\n}\n.speed-suffix[_ngcontent-%COMP%] {\n  font-size: 0.625rem;\n  font-weight: 700;\n  color: #71717a;\n  text-transform: uppercase;\n}\n.controls-grid[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n}\n.control-btn[_ngcontent-%COMP%] {\n  flex: 1;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  height: 2.5rem;\n  border-radius: 8px;\n  border: 1px solid rgba(255, 255, 255, 0.15);\n  background: transparent;\n  color: #fff;\n  font-size: 1rem;\n  cursor: pointer;\n  transition: all 0.15s;\n}\n.control-btn[_ngcontent-%COMP%]:hover {\n  background: rgba(255, 255, 255, 0.1);\n}\n.control-btn.playing[_ngcontent-%COMP%] {\n  background: rgba(239, 68, 68, 0.2);\n  border-color: rgba(239, 68, 68, 0.5);\n  color: #ef4444;\n}\n.style-btns[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.375rem;\n  flex-wrap: wrap;\n}\n.style-btn[_ngcontent-%COMP%] {\n  padding: 0.375rem 0.75rem;\n  border-radius: 8px;\n  border: 1px solid rgba(255, 255, 255, 0.15);\n  background: transparent;\n  color: #a1a1aa;\n  font-size: 0.625rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.05em;\n  cursor: pointer;\n  transition: all 0.15s;\n}\n.style-btn[_ngcontent-%COMP%]:hover {\n  background: rgba(255, 255, 255, 0.1);\n  color: #fff;\n}\n.style-btn.active[_ngcontent-%COMP%] {\n  background: rgba(255, 255, 255, 0.15);\n  color: #fff;\n  border-color: rgba(255, 255, 255, 0.3);\n}\n.color-row[_ngcontent-%COMP%] {\n  margin-bottom: 0.75rem;\n}\n.color-label[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.5625rem;\n  font-weight: 700;\n  text-transform: uppercase;\n  letter-spacing: 0.1em;\n  color: #52525b;\n  margin-bottom: 0.5rem;\n}\n.color-swatches[_ngcontent-%COMP%] {\n  display: flex;\n  gap: 0.5rem;\n}\n.swatch[_ngcontent-%COMP%] {\n  width: 2rem;\n  height: 2rem;\n  border-radius: 50%;\n  border: 2px solid transparent;\n  cursor: pointer;\n  transition: all 0.15s;\n  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);\n}\n.swatch[_ngcontent-%COMP%]:hover {\n  transform: scale(1.1);\n}\n.active-swatch[_ngcontent-%COMP%] {\n  border-color: #3b82f6;\n  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);\n}\n.toggle-row[_ngcontent-%COMP%] {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  margin-bottom: 0.75rem;\n  cursor: pointer;\n}\n.toggle-row[_ngcontent-%COMP%]   span[_ngcontent-%COMP%] {\n  font-size: 0.75rem;\n  color: #d4d4d8;\n}\n.toggle-switch[_ngcontent-%COMP%] {\n  width: 2.75rem;\n  height: 1.5rem;\n  border-radius: 9999px;\n  border: none;\n  background: rgba(255, 255, 255, 0.15);\n  position: relative;\n  cursor: pointer;\n  transition: background 0.2s;\n}\n.toggle-on[_ngcontent-%COMP%] {\n  background: var(--emerald-500);\n}\n.toggle-thumb[_ngcontent-%COMP%] {\n  position: absolute;\n  top: 2px;\n  left: 2px;\n  width: 1.25rem;\n  height: 1.25rem;\n  border-radius: 50%;\n  background: #fff;\n  transition: transform 0.2s;\n}\n.toggle-on[_ngcontent-%COMP%]   .toggle-thumb[_ngcontent-%COMP%] {\n  transform: translateX(1.25rem);\n}\n.select-sm[_ngcontent-%COMP%] {\n  padding: 0.25rem 0.5rem;\n  border-radius: 6px;\n  border: 1px solid rgba(255, 255, 255, 0.15);\n  background: rgba(255, 255, 255, 0.05);\n  color: #d4d4d8;\n  font-size: 0.75rem;\n}\n.select-sm[_ngcontent-%COMP%]   option[_ngcontent-%COMP%] {\n  background: #18181b;\n  color: #d4d4d8;\n}\n.back-edit-link[_ngcontent-%COMP%] {\n  display: block;\n  font-size: 0.8125rem;\n  color: var(--blue-500);\n  text-decoration: none;\n  font-weight: 500;\n}\n.back-edit-link[_ngcontent-%COMP%]:hover {\n  color: #60a5fa;\n}\n.sidebar-toggle[_ngcontent-%COMP%] {\n  position: fixed;\n  right: 0;\n  top: 50%;\n  transform: translateY(-50%);\n  width: 2rem;\n  height: 4rem;\n  border-radius: 8px 0 0 8px;\n  border: 1px solid rgba(255, 255, 255, 0.15);\n  border-right: none;\n  background: var(--zinc-900);\n  color: #d4d4d8;\n  font-size: 1.125rem;\n  cursor: pointer;\n  z-index: 30;\n  transition: right 0.3s;\n}\n.sidebar-toggle.shifted[_ngcontent-%COMP%] {\n  right: 400px;\n}\n.sidebar-toggle[_ngcontent-%COMP%]:hover {\n  background: var(--zinc-800);\n}\n@keyframes _ngcontent-%COMP%_pulse {\n  0%, 100% {\n    opacity: 1;\n  }\n  50% {\n    opacity: 0.5;\n  }\n}\n.tp-loading[_ngcontent-%COMP%], .tp-error[_ngcontent-%COMP%] {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: 100vh;\n  background: #000;\n  color: #fff;\n  gap: 1rem;\n}\n.tp-spinner[_ngcontent-%COMP%] {\n  width: 2rem;\n  height: 2rem;\n  border: 3px solid rgba(255, 255, 255, 0.15);\n  border-top-color: var(--blue-500);\n  border-radius: 50%;\n  animation: _ngcontent-%COMP%_spin 0.8s linear infinite;\n}\n.tp-loading-text[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  color: #a1a1aa;\n}\n.tp-error-text[_ngcontent-%COMP%] {\n  font-size: 1rem;\n  color: #f87171;\n  text-align: center;\n  max-width: 24rem;\n}\n.tp-error-link[_ngcontent-%COMP%] {\n  font-size: 0.875rem;\n  color: var(--blue-500);\n  text-decoration: none;\n}\n.tp-error-link[_ngcontent-%COMP%]:hover {\n  text-decoration: underline;\n}\n@keyframes _ngcontent-%COMP%_spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n@media (max-width: 768px) {\n  .tp-sidebar[_ngcontent-%COMP%] {\n    width: 100%;\n    position: fixed;\n    inset: 0;\n    z-index: 40;\n  }\n  .sidebar-toggle.shifted[_ngcontent-%COMP%] {\n    right: 0;\n  }\n}\n/*# sourceMappingURL=teleprompter-player.component.css.map */"] });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && \u0275setClassDebugInfo(TeleprompterPlayerComponent, { className: "TeleprompterPlayerComponent", filePath: "src\\app\\features\\teleprompter\\player\\teleprompter-player.component.ts", lineNumber: 418 });
})();
export {
  TeleprompterPlayerComponent
};
//# sourceMappingURL=chunk-QFF5KICE.js.map
