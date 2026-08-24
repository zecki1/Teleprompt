import { Injectable } from '@angular/core';
import { environment } from '@env/environment';

export interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: Date;
}

export interface TraceSpan {
  operation: string;
  duration: number;
  status: 'ok' | 'error';
  tags?: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class ObservabilityService {
  private metricsBuffer: Metric[] = [];
  private tracesBuffer: TraceSpan[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (environment.observability.enabled) {
      this.startFlushInterval();
    }
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000);
  }

  trackMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.metricsBuffer.push({
      name,
      value,
      tags,
      timestamp: new Date()
    });
  }

  trackTrace(operation: string, duration: number, status: 'ok' | 'error', tags?: Record<string, string>): void {
    this.tracesBuffer.push({
      operation,
      duration,
      status,
      tags
    });
  }

  trackPageView(pageName: string): void {
    this.trackMetric('page_view', 1, { page: pageName });
  }

  trackUserAction(action: string, category: string, label?: string): void {
    this.trackMetric('user_action', 1, { action, category, label: label || '' });
  }

  trackError(error: Error, context?: Record<string, string>): void {
    this.trackMetric('error', 1, {
      errorType: error.name,
      message: error.message,
      ...context
    });
  }

  trackApiCall(endpoint: string, method: string, duration: number, status: number): void {
    this.trackMetric('api_call', duration, {
      endpoint,
      method,
      status: status.toString()
    });
  }

  trackSignalREvent(hub: string, event: string, duration: number): void {
    this.trackMetric('signalr_event', duration, { hub, event });
  }

  private async flush(): Promise<void> {
    if (this.metricsBuffer.length === 0 && this.tracesBuffer.length === 0) {
      return;
    }

    const metrics = [...this.metricsBuffer];
    const traces = [...this.tracesBuffer];
    this.metricsBuffer = [];
    this.tracesBuffer = [];

    if (environment.observability.dynatraceEnabled) {
      await this.sendToDynatrace(metrics, traces);
    }

    if (environment.observability.grafanaEndpoint) {
      await this.sendToGrafana(metrics);
    }
  }

  private async sendToDynatrace(metrics: Metric[], traces: TraceSpan[]): Promise<void> {
    try {
      const url = `https://${environment.observability.dynatraceTenantId}.live.dynatrace.com/api/v2/metrics/ingest`;
      const lines = metrics.map(m =>
        `${m.name},${Object.entries(m.tags || {}).map(([k, v]) => `${k}=${v}`).join(',')} ${m.value} ${m.timestamp.getTime()}`
      ).join('\n');

      await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Api-Token ${environment.observability.dynatraceApiToken}`,
          'Content-Type': 'text/plain'
        },
        body: lines
      });
    } catch (error) {
      console.error('[Observability] Failed to send to Dynatrace:', error);
    }
  }

  private async sendToGrafana(metrics: Metric[]): Promise<void> {
    try {
      const payload = metrics.map(m => ({
        name: m.name,
        labels: m.tags || {},
        value: m.value,
        timestamp: m.timestamp.toISOString()
      }));

      await fetch(`${environment.observability.grafanaEndpoint}/api/v1/metrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('[Observability] Failed to send to Grafana:', error);
    }
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush();
  }
}
