import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { ObservabilityService } from '@core/services/observability.service';
import { Script, ScriptStatus } from '@core/models/script.model';

@Component({
  selector: 'app-script-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Roteiros</h1>
        <p class="page-description">Todos os seus roteiros</p>
      </div>

      <div class="content-card">
        <div class="card-body">
          @for (script of scripts(); track script.id) {
            <a [routerLink]="['/scripts', script.id]" class="list-item">
              <div class="list-item-main">
                <span class="item-name">{{ script.title }}</span>
                <span class="item-meta">v{{ script.version }} · {{ script.updatedAt | date:'short' }}</span>
              </div>
              <span class="badge" [class]="getBadgeClass(script.status)">
                {{ getStatusLabel(script.status) }}
              </span>
            </a>
          } @empty {
            <div class="empty-state">
              <p>Nenhum roteiro encontrado</p>
            </div>
          }
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

    .content-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .card-body { padding: 0.25rem 0; }

    .list-item {
      display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.5rem;
      text-decoration: none; color: var(--foreground); transition: background 0.15s;
      border-bottom: 1px solid var(--border);
    }
    .list-item:last-child { border-bottom: none; }
    .list-item:hover { background: var(--accent); }
    .list-item-main { min-width: 0; }
    .item-name { display: block; font-size: 0.875rem; font-weight: 500; }
    .item-meta { display: block; font-size: 0.75rem; color: var(--muted-foreground); margin-top: 2px; }

    .badge { display: inline-flex; padding: 0.125rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; flex-shrink: 0; }
    .badge-muted { background: var(--muted); color: var(--muted-foreground); }
    .badge-amber { background: oklch(0.769 0.188 70.08 / 0.1); color: var(--amber-500); }
    .badge-emerald { background: oklch(0.696 0.17 162.48 / 0.1); color: var(--emerald-500); }
    .badge-purple { background: oklch(0.627 0.265 303.9 / 0.1); color: var(--purple-500); }

    .empty-state { text-align: center; padding: 3rem 1rem; color: var(--muted-foreground); }
  `]
})
export class ScriptListComponent implements OnInit {
  private api = inject(ApiService);
  private observability = inject(ObservabilityService);
  scripts = signal<Script[]>([]);

  ngOnInit(): void {
    this.observability.trackPageView('script-list');
    this.api.getScripts().subscribe({ next: s => this.scripts.set(s) });
  }

  getStatusLabel(status: ScriptStatus): string {
    const labels: Record<number, string> = { 0: 'Rascunho', 1: 'Em Revisão', 2: 'Aprovado', 3: 'Gravado', 4: 'Concluído' };
    return labels[status] || 'N/A';
  }

  getBadgeClass(status: ScriptStatus): string {
    const classes: Record<number, string> = { 0: 'badge-muted', 1: 'badge-amber', 2: 'badge-emerald', 3: 'badge-purple', 4: 'badge-emerald' };
    return classes[status] || 'badge-muted';
  }
}
