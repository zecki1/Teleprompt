import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '@core/services/api.service';
import { ObservabilityService } from '@core/services/observability.service';
import { DebugLog, LogLevel } from '@core/models/common.model';

@Component({
  selector: 'app-debug-logs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Logs de Debug</h1>
          <p class="page-description">Visualize logs de depuração do sistema</p>
        </div>
        <button class="btn-outline" (click)="loadLogs()">Atualizar</button>
      </div>

      <div class="content-card">
        <div class="card-body">
          @for (log of logs(); track log.id) {
            <div class="log-item">
              <span class="badge" [class]="getBadgeClass(log.level)">{{ getLogLevelLabel(log.level) }}</span>
              <span class="log-source">{{ log.source }}</span>
              <span class="log-message">{{ log.message }}</span>
              <span class="log-time">{{ log.createdAt | date:'short' }}</span>
            </div>
          } @empty {
            <div class="empty-state"><p>Nenhum log encontrado</p></div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1152px; margin: 0 auto; padding: 2rem 1rem; }
    @media (min-width: 640px) { .page-container { padding: 2rem 1.5rem; } }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.875rem; font-weight: 900; letter-spacing: -0.025em; }
    .page-description { font-size: 0.875rem; color: var(--muted-foreground); margin-top: 0.25rem; }
    .btn-outline { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--foreground); font-size: 0.875rem; font-weight: 500; cursor: pointer; }
    .btn-outline:hover { background: var(--accent); }
    .content-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .card-body { padding: 0.25rem 0; }
    .log-item {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 1.5rem;
      border-bottom: 1px solid var(--border); font-family: monospace; font-size: 0.8125rem;
    }
    .log-item:last-child { border-bottom: none; }
    .log-source { color: var(--emerald-500); min-width: 80px; }
    .log-message { color: var(--foreground); flex: 1; }
    .log-time { color: var(--muted-foreground); font-size: 0.75rem; flex-shrink: 0; }
    .badge { display: inline-flex; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; flex-shrink: 0; }
    .badge-muted { background: var(--muted); color: var(--muted-foreground); }
    .badge-blue { background: oklch(0.623 0.214 259.815 / 0.1); color: var(--blue-500); }
    .badge-amber { background: oklch(0.769 0.188 70.08 / 0.1); color: var(--amber-500); }
    .badge-red { background: oklch(0.637 0.237 25.331 / 0.1); color: var(--red-500); }
    .empty-state { text-align: center; padding: 3rem 1rem; color: var(--muted-foreground); }
  `]
})
export class DebugLogsComponent implements OnInit {
  private api = inject(ApiService);
  private observability = inject(ObservabilityService);
  logs = signal<DebugLog[]>([]);

  ngOnInit(): void {
    this.observability.trackPageView('debug-logs');
    this.loadLogs();
  }

  loadLogs(): void {
    this.api.getDebugLogs(200).subscribe({ next: logs => this.logs.set(logs) });
  }

  getLogLevelLabel(level: LogLevel): string {
    const labels: Record<number, string> = { 0: 'DEBUG', 1: 'INFO', 2: 'WARN', 3: 'ERROR', 4: 'FATAL' };
    return labels[level] || 'UNKNOWN';
  }

  getBadgeClass(level: LogLevel): string {
    const classes: Record<number, string> = { 0: 'badge-muted', 1: 'badge-blue', 2: 'badge-amber', 3: 'badge-red', 4: 'badge-red' };
    return classes[level] || 'badge-muted';
  }
}
