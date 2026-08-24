import {
  __async,
  __spreadValues,
  ɵɵdefineInjectable
} from "./chunk-SBUHLZV6.js";

// src/environments/environment.ts
var environment = {
  production: false,
  apiUrl: "http://localhost:5026/api/v1",
  signalR: {
    scriptHubUrl: "http://localhost:5026/hubs/script",
    tpHubUrl: "http://localhost:5026/hubs/tp"
  },
  jwt: {
    tokenKey: "teleprompt_token",
    refreshTokenKey: "teleprompt_refresh_token"
  },
  observability: {
    enabled: false,
    grafanaEndpoint: "http://localhost:3000",
    dynatraceEnabled: false,
    dynatraceTenantId: "",
    dynatraceApiToken: ""
  },
  features: {
    microfrontendEnabled: false,
    pwaEnabled: false
  }
};

// src/app/core/services/observability.service.ts
var ObservabilityService = class _ObservabilityService {
  constructor() {
    this.metricsBuffer = [];
    this.tracesBuffer = [];
    this.flushInterval = null;
    if (environment.observability.enabled) {
      this.startFlushInterval();
    }
  }
  startFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 3e4);
  }
  trackMetric(name, value, tags) {
    this.metricsBuffer.push({
      name,
      value,
      tags,
      timestamp: /* @__PURE__ */ new Date()
    });
  }
  trackTrace(operation, duration, status, tags) {
    this.tracesBuffer.push({
      operation,
      duration,
      status,
      tags
    });
  }
  trackPageView(pageName) {
    this.trackMetric("page_view", 1, { page: pageName });
  }
  trackUserAction(action, category, label) {
    this.trackMetric("user_action", 1, { action, category, label: label || "" });
  }
  trackError(error, context) {
    this.trackMetric("error", 1, __spreadValues({
      errorType: error.name,
      message: error.message
    }, context));
  }
  trackApiCall(endpoint, method, duration, status) {
    this.trackMetric("api_call", duration, {
      endpoint,
      method,
      status: status.toString()
    });
  }
  trackSignalREvent(hub, event, duration) {
    this.trackMetric("signalr_event", duration, { hub, event });
  }
  flush() {
    return __async(this, null, function* () {
      if (this.metricsBuffer.length === 0 && this.tracesBuffer.length === 0) {
        return;
      }
      const metrics = [...this.metricsBuffer];
      const traces = [...this.tracesBuffer];
      this.metricsBuffer = [];
      this.tracesBuffer = [];
      if (environment.observability.dynatraceEnabled) {
        yield this.sendToDynatrace(metrics, traces);
      }
      if (environment.observability.grafanaEndpoint) {
        yield this.sendToGrafana(metrics);
      }
    });
  }
  sendToDynatrace(metrics, traces) {
    return __async(this, null, function* () {
      try {
        const url = `https://${environment.observability.dynatraceTenantId}.live.dynatrace.com/api/v2/metrics/ingest`;
        const lines = metrics.map((m) => `${m.name},${Object.entries(m.tags || {}).map(([k, v]) => `${k}=${v}`).join(",")} ${m.value} ${m.timestamp.getTime()}`).join("\n");
        yield fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Api-Token ${environment.observability.dynatraceApiToken}`,
            "Content-Type": "text/plain"
          },
          body: lines
        });
      } catch (error) {
        console.error("[Observability] Failed to send to Dynatrace:", error);
      }
    });
  }
  sendToGrafana(metrics) {
    return __async(this, null, function* () {
      try {
        const payload = metrics.map((m) => ({
          name: m.name,
          labels: m.tags || {},
          value: m.value,
          timestamp: m.timestamp.toISOString()
        }));
        yield fetch(`${environment.observability.grafanaEndpoint}/api/v1/metrics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      } catch (error) {
        console.error("[Observability] Failed to send to Grafana:", error);
      }
    });
  }
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
  static {
    this.\u0275fac = function ObservabilityService_Factory(t) {
      return new (t || _ObservabilityService)();
    };
  }
  static {
    this.\u0275prov = /* @__PURE__ */ \u0275\u0275defineInjectable({ token: _ObservabilityService, factory: _ObservabilityService.\u0275fac, providedIn: "root" });
  }
};

export {
  environment,
  ObservabilityService
};
//# sourceMappingURL=chunk-DHSNSXHE.js.map
