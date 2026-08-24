import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '@core/services/api.service';
import { ObservabilityService } from '@core/services/observability.service';
import { Project } from '@core/models/project.model';
import { Script, ScriptStatus } from '@core/models/script.model';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container" *ngIf="project() as p">
      <div class="page-header">
        <div>
          <a routerLink="/projects" class="back-link">← Projetos</a>
          <h1 class="page-title">{{ p.name }}</h1>
          @if (p.code) {
            <span class="item-code">{{ p.code }}</span>
          }
        </div>
        <button class="btn-primary" (click)="createScript()">+ Novo Roteiro</button>
      </div>

      <div class="content-card">
        <div class="card-header">
          <h2 class="card-title">Roteiros</h2>
          <span class="count-badge">{{ scripts().length }}</span>
        </div>
        <div class="card-body">
          @for (script of scripts(); track script.id) {
            <a [routerLink]="['/scripts', script.id]" class="list-item">
              <div class="list-item-main">
                <span class="item-name">{{ script.title }}</span>
                <span class="item-meta">v{{ script.version }}</span>
              </div>
              <div class="list-item-right">
                @if (script.isLocked) {
                  <span class="lock-badge">🔒 Bloqueado</span>
                }
                <span class="badge" [class]="getScriptBadgeClass(script.status)">
                  {{ getScriptStatusLabel(script.status) }}
                </span>
              </div>
            </a>
          } @empty {
            <div class="empty-state">
              <p>Nenhum roteiro neste projeto</p>
              <p class="empty-hint">Clique em "Novo Roteiro" para criar</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1152px; margin: 0 auto; padding: 2rem 1rem; }
    @media (min-width: 640px) { .page-container { padding: 2rem 1.5rem; } }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .back-link { font-size: 0.8125rem; color: var(--muted-foreground); text-decoration: none; display: block; margin-bottom: 0.5rem; transition: color 0.15s; }
    .back-link:hover { color: var(--foreground); }
    .page-title { font-size: 1.875rem; font-weight: 900; letter-spacing: -0.025em; }
    .item-code { font-size: 0.8125rem; color: var(--muted-foreground); font-family: monospace; }

    .btn-primary {
      display: inline-flex; align-items: center; padding: 0.5rem 1rem; border-radius: 8px;
      border: none; background: var(--primary); color: var(--primary-foreground);
      font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: opacity 0.15s;
    }
    .btn-primary:hover { opacity: 0.9; }

    .content-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .card-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1rem 1.5rem; border-bottom: 1px solid var(--border);
    }
    .card-title { font-size: 1rem; font-weight: 600; }
    .count-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 1.5rem; height: 1.5rem; padding: 0 0.375rem;
      border-radius: 9999px; background: var(--muted); color: var(--muted-foreground);
      font-size: 0.75rem; font-weight: 500;
    }

    .card-body { padding: 0.25rem 0; }

    .list-item {
      display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.5rem;
      text-decoration: none; color: var(--foreground); transition: background 0.15s;
      border-bottom: 1px solid var(--border);
    }
    .list-item:last-child { border-bottom: none; }
    .list-item:hover { background: var(--accent); }

    .list-item-main { display: flex; align-items: center; gap: 0.75rem; min-width: 0; }
    .item-name { font-size: 0.875rem; font-weight: 500; }
    .item-meta { font-size: 0.75rem; color: var(--muted-foreground); font-family: monospace; }

    .list-item-right { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

    .lock-badge { font-size: 0.75rem; color: var(--amber-500); }

    .badge { display: inline-flex; padding: 0.125rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .badge-blue { background: oklch(0.623 0.214 259.815 / 0.1); color: var(--blue-500); }
    .badge-amber { background: oklch(0.769 0.188 70.08 / 0.1); color: var(--amber-500); }
    .badge-emerald { background: oklch(0.696 0.17 162.48 / 0.1); color: var(--emerald-500); }
    .badge-purple { background: oklch(0.627 0.265 303.9 / 0.1); color: var(--purple-500); }
    .badge-orange { background: oklch(0.705 0.213 47.604 / 0.1); color: var(--orange-500); }
    .badge-muted { background: var(--muted); color: var(--muted-foreground); }

    .empty-state { text-align: center; padding: 2.5rem 1rem; color: var(--muted-foreground); }
    .empty-state p { margin-bottom: 0.25rem; }
    .empty-hint { font-size: 0.8125rem; }
  `]
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  private observability = inject(ObservabilityService);

  project = signal<Project | null>(null);
  scripts = signal<Script[]>([]);

  ngOnInit(): void {
    this.observability.trackPageView('project-detail');
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getProject(id).subscribe({ next: p => this.project.set(p) });
    this.api.getScripts(id).subscribe({ next: s => this.scripts.set(s) });
  }

  createScript(): void {
    const projectId = this.route.snapshot.paramMap.get('id')!;
    this.api.createScript({ projectId, title: 'Novo Roteiro' }).subscribe({
      next: script => this.scripts.update(s => [...s, script])
    });
  }

  getScriptStatusLabel(status: ScriptStatus): string {
    const labels: Record<number, string> = {
      0: 'Rascunho', 1: 'Em Revisão', 2: 'Aprovado', 3: 'Gravado', 4: 'Concluído', 5: 'Rascunho', 6: 'Publicado'
    };
    return labels[status] || 'N/A';
  }

  getScriptBadgeClass(status: ScriptStatus): string {
    const classes: Record<number, string> = {
      0: 'badge-muted', 1: 'badge-amber', 2: 'badge-emerald', 3: 'badge-purple', 4: 'badge-emerald', 5: 'badge-orange', 6: 'badge-blue'
    };
    return classes[status] || 'badge-muted';
  }
}
