import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '@core/services/api.service';
import { ObservabilityService } from '@core/services/observability.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Relatórios</h1>
        <p class="page-description">Métricas e insights dos seus projetos</p>
      </div>

      <div class="stats-grid">
        @for (stat of stats(); track stat.label) {
          <div class="stat-card">
            <p class="stat-label">{{ stat.label }}</p>
            <p class="stat-value">{{ stat.value }}</p>
          </div>
        }
      </div>

      <div class="content-grid">
        <div class="content-card">
          <div class="card-header">
            <h2 class="card-title">Roteiros por Status</h2>
          </div>
          <div class="card-body">
            @for (bar of statusBars(); track bar.label) {
              <div class="chart-bar-row">
                <span class="bar-label">{{ bar.label }}</span>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="bar.percent" [style.background]="bar.color"></div>
                </div>
                <span class="bar-value">{{ bar.count }}</span>
              </div>
            } @empty {
              <div class="empty-state"><p>Sem dados disponíveis</p></div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1152px; margin: 0 auto; padding: 2rem 1rem; }
    @media (min-width: 640px) { .page-container { padding: 2rem 1.5rem; } }
    .page-header { margin-bottom: 2rem; }
    .page-title { font-size: 1.875rem; font-weight: 900; letter-spacing: -0.025em; }
    .page-description { font-size: 0.875rem; color: var(--muted-foreground); margin-top: 0.25rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; }
    .stat-label { font-size: 0.875rem; font-weight: 500; color: var(--muted-foreground); margin-bottom: 0.25rem; }
    .stat-value { font-size: 2rem; font-weight: 800; letter-spacing: -0.025em; }
    .content-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; }
    @media (max-width: 768px) { .content-grid { grid-template-columns: 1fr; } }
    .content-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .card-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); }
    .card-title { font-size: 1rem; font-weight: 600; }
    .card-body { padding: 1.25rem 1.5rem; }
    .chart-bar-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .chart-bar-row:last-child { margin-bottom: 0; }
    .bar-label { font-size: 0.8125rem; font-weight: 500; min-width: 100px; }
    .bar-track { flex: 1; height: 8px; background: var(--muted); border-radius: 9999px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 9999px; transition: width 0.3s ease; }
    .bar-value { font-size: 0.8125rem; font-weight: 600; min-width: 2rem; text-align: right; }
    .empty-state { text-align: center; padding: 2rem; color: var(--muted-foreground); }
  `]
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);
  private observability = inject(ObservabilityService);
  stats = signal<{label: string; value: number | string}[]>([]);
  statusBars = signal<{label: string; count: number; percent: number; color: string}[]>([]);

  ngOnInit(): void {
    this.observability.trackPageView('reports');
    this.api.getReports().subscribe({
      next: (data: any) => {
        this.stats.set([
          { label: 'Total de Projetos', value: data.totalProjects || 0 },
          { label: 'Total de Roteiros', value: data.totalScripts || 0 },
          { label: 'Roteiros Gravados', value: data.recordedScripts || 0 },
          { label: 'Usuários Ativos', value: data.activeUsers || 0 }
        ]);

        if (data.scriptsByStatus) {
          const max = Math.max(...Object.values(data.scriptsByStatus).map((v: any) => Number(v)), 1);
          const colorMap: Record<string, string> = {
            'Rascunho': '#71717a', 'Em Revisão': '#f59e0b', 'Aprovado': '#10b981',
            'Gravado': '#8b5cf6', 'Concluído': '#10b981'
          };
          this.statusBars.set(
            Object.entries(data.scriptsByStatus).map(([k, v]: [string, any]) => ({
              label: k, count: Number(v), percent: (Number(v) / max) * 100, color: colorMap[k] || '#71717a'
            }))
          );
        }
      },
      error: () => {
        this.stats.set([
          { label: 'Total de Projetos', value: '—' },
          { label: 'Total de Roteiros', value: '—' },
          { label: 'Roteiros Gravados', value: '—' },
          { label: 'Usuários Ativos', value: '—' }
        ]);
      }
    });
  }
}
