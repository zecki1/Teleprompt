import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/services/api.service';
import { ObservabilityService } from '@core/services/observability.service';
import { AuthService } from '@core/auth/auth.service';
import { Project } from '@core/models/project.model';
import { Script, ScriptStatus } from '@core/models/script.model';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'Rascunho': { label: 'Rascunho', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
  'EmRevisao': { label: 'Em Revisão', color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
  'Aprovado': { label: 'Aprovado', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  'Gravado': { label: 'Gravado', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  'Concluido': { label: 'Concluído', color: '#71717a', bg: 'rgba(113,113,122,0.1)' },
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="container-6xl">
      <div class="top-actions">
        <div class="flex-gap-3">
          <button class="btn-outline-sm" (click)="copyInvite()">
            <span class="icon-blue">🔗</span> Convidar Equipe
          </button>
          <button class="btn-outline-sm" (click)="showCreateProject.set(true)">
            <span class="icon-emerald">⊕</span> Novo Projeto
          </button>
          <button class="btn-primary-action" (click)="createNewScript()">
            ＋ Novo Roteiro
          </button>
        </div>
      </div>

      <div class="page-header-block">
        <h1 class="page-title-xl">Meus Roteiros</h1>
        <p class="page-subtitle">Gerencie seus Roteiros do Teleprompter aqui.</p>
      </div>

      <div class="section-block">
        <div class="section-header-row">
          <h2 class="section-label">
            <span class="section-icon">💼</span> Projetos Ativos
          </h2>
          <div class="section-controls">
            <button class="view-btn" (click)="router.navigate(['/projects'])">
              Ver Todos <span class="chevron">›</span>
            </button>
          </div>
        </div>

        <div class="projects-scroll">
          @if (loading()) {
            @for (i of [1,2,3]; track i) {
              <div class="project-skeleton"></div>
            }
          } @else if (projects().length === 0) {
            <div class="empty-dashed">
              <p class="text-sm-muted">Nenhum projeto vinculado a este workspace.</p>
            </div>
          } @else {
            @for (project of projects(); track project.id) {
              <div class="project-card" [class.active]="projectIdFilter() === project.id"
                   (click)="toggleProjectFilter(project)">
                <div class="project-card-top">
                  <span class="project-badge" [class.active-badge]="projectIdFilter() === project.id">
                    {{ project.code || 'PRJ' }}
                  </span>
                </div>
                <p class="project-card-name" [class.active-name]="projectIdFilter() === project.id">
                  {{ project.name }}
                </p>
              </div>
            }
          }
        </div>
      </div>

      <div class="status-filters">
        <button class="filter-pill" [class.filter-active]="statusFilter() === 'all'"
                (click)="statusFilter.set('all')">
          Todos ({{ totalScripts() }})
        </button>
        @for (entry of statusEntries; track entry.key) {
          <button class="filter-pill" [class.filter-active]="statusFilter() === entry.key"
                  (click)="statusFilter.set(entry.key)">
            {{ entry.config.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="loading-block">
          <div class="spinner-large"></div>
          <p class="text-sm-muted">Carregando...</p>
        </div>
      } @else if (scriptsByProject().length === 0) {
        <div class="empty-block">
          <div class="empty-icon-box">
            <span>📄</span>
          </div>
          <h3 class="empty-title">Você não tem nenhum roteiro</h3>
          <p class="empty-desc">Clique em um projeto e crie agora seu primeiro roteiro para começar a gravar!</p>
        </div>
      } @else {
        @for (group of scriptsByProject(); track group.projectName) {
          <div class="project-section">
            <div class="project-section-header" (click)="toggleCollapse(group.projectName)">
              <div class="section-header-left">
                <span class="collapse-icon">{{ collapsedProjects().has(group.projectName) ? '›' : '▾' }}</span>
                <div class="project-icon-box">💼</div>
                <h2 class="project-section-title">{{ group.projectName }}</h2>
                <span class="script-count-badge">{{ group.scripts.length }}</span>
              </div>
              <div class="section-header-right">
                <button class="btn-ghost-sm" (click)="createScriptInProject(group.projectName, $event)">
                  ＋ Roteiro
                </button>
              </div>
            </div>

            @if (!collapsedProjects().has(group.projectName)) {
              @for (row of folderRowsOf(group.projectName); track (row.key || 'raiz')) {
                @if (row.segments.length > 0) {
                  <div class="folder-row" [style.marginLeft.px]="(row.segments.length - 1) * 18">
                    <span class="folder-arrow">▸</span>
                    <span class="folder-name">{{ row.segments.join(' › ') }}</span>
                    <span class="folder-count">{{ row.scripts.length }}</span>
                  </div>
                }
                <div class="scripts-grid"
                     [class.folder-cards]="row.segments.length > 0"
                     [style.marginLeft.px]="row.segments.length * 18">
                  @for (script of row.scripts; track script.id) {
                    <div class="script-card">
                      <div class="script-card-header">
                        <span class="script-status-dot" [style.background]="getStatusConfig(script.status).color"></span>
                        <span class="script-status-label" [style.color]="getStatusConfig(script.status).color">
                          {{ getStatusConfig(script.status).label }}
                        </span>
                      </div>
                      <a [routerLink]="['/scripts', script.id]" class="script-card-title">{{ script.title }}</a>
                      <div class="script-card-meta">
                        <span>v{{ script.version }}</span>
                        <span class="meta-sep">·</span>
                        <span>{{ script.updatedAt | date:'dd/MM/yyyy' }}</span>
                      </div>
                      <div class="script-card-actions">
                        <button class="action-btn" (click)="openEditor(script.id)" title="Editar">✏</button>
                        <button class="action-btn" (click)="openTeleprompter(script.id)" title="Teleprompter">▶</button>
                        <button class="action-btn btn-danger" (click)="confirmDelete(script.id)" title="Excluir">🗑</button>
                      </div>
                    </div>
                  }
                </div>
              }
            }
          </div>
        }
      }

      @if (showCreateProject()) {
        <div class="dialog-overlay" (click)="showCreateProject.set(false)">
          <div class="dialog-card" (click)="$event.stopPropagation()">
            <h3 class="dialog-title">Novo Projeto</h3>
            <p class="dialog-desc">O projeto será criado no Teleprompt.</p>
            <div class="dialog-body">
              <div class="form-group">
                <label class="form-label">Nome do Projeto</label>
                <input class="form-input-lg" placeholder="Ex: Curso de Excel"
                       [(ngModel)]="newProjectName" />
              </div>
              <div class="form-group">
                <label class="form-label">Código (ID)</label>
                <input class="form-input-lg mono" placeholder="Ex: EXC-001"
                       [(ngModel)]="newProjectCode" />
              </div>
            </div>
            <div class="dialog-footer">
              <button class="btn-ghost-lg" (click)="showCreateProject.set(false)">Cancelar</button>
              <button class="btn-primary-lg" (click)="createProject()" [disabled]="!newProjectName.trim()">
                CRIAR PROJETO
              </button>
            </div>
          </div>
        </div>
      }

      @if (deleteScriptId()) {
        <div class="dialog-overlay" (click)="deleteScriptId.set(null)">
          <div class="dialog-card-sm" (click)="$event.stopPropagation()">
            <h3 class="dialog-title">Excluir Roteiro</h3>
            <p class="dialog-desc">Tem certeza que deseja excluir este roteiro?</p>
            <div class="dialog-footer">
              <button class="btn-ghost-lg" (click)="deleteScriptId.set(null)">Cancelar</button>
              <button class="btn-danger-lg" (click)="deleteScript()">Excluir</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .container-6xl {
      max-width: 72rem; margin: 0 auto; padding: 2.5rem 1rem;
    }
    @media (min-width: 640px) { .container-6xl { padding: 2.5rem 1.5rem; } }

    .top-actions { display: flex; justify-content: flex-end; align-items: center; margin-bottom: 2rem; }
    .flex-gap-3 { display: flex; gap: 0.75rem; flex-wrap: wrap; }

    .btn-outline-sm {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.5rem 1rem; border-radius: 6px;
      border: 1px solid var(--border); background: transparent;
      color: var(--foreground); font-size: 0.875rem; font-weight: 500;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-outline-sm:hover { background: var(--accent); }
    .icon-blue { font-size: 14px; }
    .icon-emerald { font-size: 14px; }

    .btn-primary-action {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.625rem 1.25rem; border-radius: 6px;
      background: var(--blue-600); color: #fff; border: none;
      font-size: 0.875rem; font-weight: 600; cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      transition: background 0.15s, box-shadow 0.15s;
    }
    .btn-primary-action:hover { background: var(--blue-600); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }

    .page-header-block { margin-bottom: 2rem; }
    .page-title-xl {
      font-size: 1.875rem; font-weight: 900; letter-spacing: -0.025em;
      color: var(--foreground); display: flex; align-items: center; gap: 0.75rem;
    }
    .page-subtitle { color: var(--muted-foreground); margin-top: 0.25rem; font-size: 0.875rem; }

    .section-block { margin-bottom: 2.5rem; }
    .section-header-row {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;
    }
    .section-label {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.1em; color: var(--zinc-500);
    }
    .section-icon { font-size: 16px; }
    .section-controls { display: flex; align-items: center; gap: 0.5rem; }
    .view-btn {
      display: flex; align-items: center; gap: 0.25rem;
      font-size: 0.75rem; color: var(--blue-500); background: none; border: none;
      cursor: pointer; font-weight: 500;
    }
    .view-btn:hover { color: var(--blue-600); }
    .chevron { font-size: 14px; }

    .projects-scroll {
      display: flex; gap: 1rem; overflow-x: auto; padding: 1.25rem;
      scrollbar-width: thin; scrollbar-color: var(--zinc-300) transparent;
    }
    .projects-scroll::-webkit-scrollbar { height: 8px; }
    .projects-scroll::-webkit-scrollbar-thumb { background: var(--zinc-300); border-radius: 10px; }

    .project-skeleton {
      min-width: 220px; height: 96px; background: var(--muted);
      border-radius: 8px; border: 1px solid var(--border);
      animation: pulse 1.5s ease-in-out infinite;
    }

    .empty-dashed {
      width: 100%; padding: 1.5rem 2rem; text-align: center;
      background: var(--muted); border-radius: 8px;
      border: 1px dashed var(--zinc-300);
    }
    .dark .empty-dashed { border-color: var(--zinc-700); }

    .text-sm-muted { font-size: 0.875rem; color: var(--muted-foreground); }

    .project-card {
      min-width: 220px; max-width: 220px; flex-shrink: 0;
      background: var(--card); border: 2px solid var(--border); border-radius: 8px;
      padding: 1rem; cursor: pointer; transition: all 0.2s;
    }
    .project-card:hover { border-color: #93c5fd; }
    .project-card.active {
      border-color: var(--blue-600); box-shadow: 0 0 0 4px rgba(59,130,246,0.1);
      transform: scale(1.02);
    }

    .project-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .project-badge {
      display: inline-flex; padding: 0.125rem 0.5rem; border-radius: 4px;
      font-size: 0.625rem; font-family: monospace; text-transform: uppercase;
      border: 1px solid var(--border); color: var(--muted-foreground);
      font-weight: 500;
    }
    .project-badge.active-badge {
      background: var(--blue-600); color: #fff; border-color: var(--blue-600);
    }

    .project-card-name {
      font-size: 0.875rem; font-weight: 600; color: var(--foreground);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .project-card-name.active-name { color: var(--blue-600); }

    .status-filters {
      display: flex; gap: 0.5rem; margin-bottom: 2rem;
      overflow-x: auto; padding-bottom: 0.5rem;
      scrollbar-width: none;
    }
    .status-filters::-webkit-scrollbar { display: none; }

    .filter-pill {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.375rem 1rem; border-radius: 9999px;
      border: 1px solid var(--border); background: transparent;
      color: var(--foreground); font-size: 0.8125rem; font-weight: 500;
      cursor: pointer; white-space: nowrap; transition: all 0.15s;
    }
    .filter-pill:hover { background: var(--accent); }
    .filter-active {
      background: var(--primary) !important; color: var(--primary-foreground) !important;
      border-color: var(--primary) !important;
    }

    .loading-block { text-align: center; padding: 4rem 0; }
    .spinner-large {
      width: 2rem; height: 2rem; margin: 0 auto 1rem;
      border: 3px solid var(--border); border-top-color: var(--foreground);
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }

    .empty-block {
      text-align: center; padding: 4rem 1rem;
      background: var(--muted); border-radius: 1.5rem;
      border: 1px dashed var(--border);
    }
    .empty-icon-box {
      display: inline-flex; align-items: center; justify-content: center;
      width: 4rem; height: 4rem; background: var(--zinc-100);
      border-radius: 8px; margin-bottom: 1rem; font-size: 2rem;
    }
    .dark .empty-icon-box { background: var(--zinc-800); }
    .empty-title { font-size: 1.125rem; font-weight: 700; color: var(--foreground); margin-bottom: 0.5rem; }
    .empty-desc { color: var(--muted-foreground); max-width: 24rem; margin: 0 auto 2rem; font-size: 0.875rem; }

    .project-section { margin-bottom: 4rem; }
    .project-section-header {
      display: flex; align-items: center; justify-content: space-between;
      border-bottom: 1px solid var(--border); padding-bottom: 0.75rem;
      cursor: pointer; user-select: none; margin-bottom: 1.5rem;
    }
    .section-header-left { display: flex; align-items: center; gap: 0.75rem; }
    .collapse-icon {
      display: flex; align-items: center; justify-content: center;
      width: 1.5rem; height: 1.5rem; border-radius: 4px;
      color: var(--zinc-400); font-size: 16px; transition: background 0.15s;
    }
    .collapse-icon:hover { background: var(--muted); }
    .project-icon-box {
      padding: 0.5rem; background: rgba(59,130,246,0.1);
      border-radius: 6px; font-size: 18px;
    }
    .project-section-title {
      font-size: 1.125rem; font-weight: 900; text-transform: uppercase;
      letter-spacing: 0.05em; color: var(--foreground);
    }
    .script-count-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 1.25rem; height: 1.25rem; padding: 0 0.375rem;
      border-radius: 9999px; background: var(--muted);
      font-size: 0.625rem; font-weight: 700; color: var(--muted-foreground);
    }
    .section-header-right { display: flex; gap: 0.5rem; }
    .btn-ghost-sm {
      padding: 0.25rem 0.625rem; border: none; background: transparent;
      color: var(--blue-500); font-size: 0.75rem; font-weight: 600;
      cursor: pointer; border-radius: 6px; transition: background 0.15s;
    }
    .btn-ghost-sm:hover { background: rgba(59,130,246,0.1); }

    .scripts-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }
    @media (max-width: 640px) { .scripts-grid { grid-template-columns: 1fr; } }

    .folder-row {
      display: flex; align-items: center; gap: 0.5rem;
      margin: 1.1rem 0 0.4rem; padding: 0.4rem 0.5rem;
      font-size: 0.8rem; font-weight: 700; letter-spacing: 0.02em;
      color: var(--primary); border-bottom: 1px solid var(--border);
    }
    .folder-row .folder-arrow { font-size: 0.6rem; opacity: 0.8; }
    .folder-row .folder-name { text-transform: uppercase; }
    .folder-row .folder-count {
      margin-left: auto; font-size: 0.7rem; font-weight: 600;
      color: var(--muted-foreground); background: color-mix(in srgb, var(--primary) 12%, transparent);
      padding: 0.125rem 0.5rem; border-radius: 999px;
    }
    .folder-cards { margin-top: 0.4rem; }

    .script-card {
      background: var(--card); border: 1px solid var(--border); border-radius: 8px;
      padding: 1.25rem; transition: border-color 0.15s, box-shadow 0.15s;
    }
    .script-card:hover { border-color: var(--zinc-400); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }

    .script-card-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }
    .script-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .script-status-label { font-size: 0.625rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }

    .script-card-title {
      display: block; font-size: 0.9375rem; font-weight: 700;
      color: var(--foreground); text-decoration: none;
      margin-bottom: 0.5rem; line-height: 1.3;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .script-card-title:hover { color: var(--blue-500); }

    .script-card-meta {
      display: flex; align-items: center; gap: 0.375rem;
      font-size: 0.75rem; color: var(--muted-foreground); margin-bottom: 0.75rem;
    }
    .meta-sep { opacity: 0.5; }

    .script-card-actions { display: flex; gap: 0.375rem; }
    .action-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 2rem; height: 2rem; border-radius: 6px;
      border: 1px solid var(--border); background: transparent;
      color: var(--muted-foreground); font-size: 14px; cursor: pointer;
      transition: all 0.15s;
    }
    .action-btn:hover { background: var(--accent); color: var(--foreground); }
    .action-btn.btn-danger:hover { background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3); }

    .dialog-overlay {
      position: fixed; inset: 0; z-index: 50;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
      padding: 1rem;
    }

    .dialog-card {
      width: 100%; max-width: 28rem; background: var(--card);
      border: 1px solid var(--border); border-radius: 12px;
      padding: 2rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    }
    .dialog-card-sm {
      width: 100%; max-width: 24rem; background: var(--card);
      border: 1px solid var(--border); border-radius: 12px;
      padding: 2rem; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
    }

    .dialog-title {
      font-size: 1.5rem; font-weight: 900; text-align: center;
      text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--foreground); margin-bottom: 0.5rem;
    }
    .dialog-desc {
      text-align: center; color: var(--muted-foreground);
      font-size: 0.875rem; margin-bottom: 1.5rem;
    }
    .dialog-body { padding: 1rem 0; }
    .dialog-footer { display: flex; gap: 0.75rem; padding-top: 1rem; }

    .form-group { margin-bottom: 1rem; }
    .form-label {
      display: block; font-size: 0.625rem; font-weight: 900;
      text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--zinc-400); margin-bottom: 0.375rem; padding-left: 0.25rem;
    }
    .form-input-lg {
      width: 100%; height: 3rem; padding: 0 1rem;
      border: 1px solid var(--border); border-radius: 8px;
      background: var(--muted); color: var(--foreground);
      font-size: 0.875rem; font-weight: 600;
    }
    .form-input-lg.mono { font-family: monospace; }
    .form-input-lg:focus { outline: none; border-color: var(--ring); }

    .btn-ghost-lg {
      flex: 1; height: 3rem; border: none; background: transparent;
      color: var(--foreground); font-weight: 700; border-radius: 8px;
      cursor: pointer; font-size: 0.875rem;
    }
    .btn-ghost-lg:hover { background: var(--accent); }

    .btn-primary-lg {
      flex: 2; height: 3rem; border: none; border-radius: 8px;
      background: var(--blue-600); color: #fff;
      font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em;
      font-size: 0.625rem; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .btn-primary-lg:hover { background: #2563eb; }
    .btn-primary-lg:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-danger-lg {
      flex: 2; height: 3rem; border: none; border-radius: 8px;
      background: #dc2626; color: #fff;
      font-weight: 700; font-size: 0.875rem; cursor: pointer;
    }
    .btn-danger-lg:hover { background: #b91c1c; }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private observability = inject(ObservabilityService);
  private authService = inject(AuthService);
  router = inject(Router);

  projects = signal<Project[]>([]);
  scripts = signal<Script[]>([]);
  loading = signal(true);

  projectIdFilter = signal<string | null>(null);
  statusFilter = signal<string>('all');
  collapsedProjects = signal<Set<string>>(new Set());
  showCreateProject = signal(false);
  deleteScriptId = signal<string | null>(null);

  newProjectName = '';
  newProjectCode = '';

  statusEntries = Object.entries(STATUS_CONFIG).map(([key, config]) => ({
    key,
    config
  }));

  totalScripts = computed(() => this.scripts().filter(s => !s.isPlaceholder).length);

  /** Uma "linha" de pasta: roteiros que moram exatamente nesse caminho. */
  folderRowsByProject = computed(() => {
    const out = new Map<string, { key: string; segments: string[]; scripts: Script[] }[]>();
    for (const group of this.scriptsByProject()) {
      const buckets = new Map<string, Script[]>();
      const rows: { key: string; segments: string[]; scripts: Script[] }[] = [];
      for (const s of group.scripts) {
        const segments = [s.folder, s.subfolder, s.lesson].filter(
          (x): x is string => Boolean(x),
        );
        if (segments.length === 0) {
          rows.push({ key: '', segments: [], scripts: [] });
          rows[rows.length - 1].scripts.push(s);
          continue;
        }
        const key = segments.join('\u0000');
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key)!.push(s);
      }
      for (const [key, scripts] of buckets) {
        rows.push({ key, segments: key.split('\u0000'), scripts });
      }
      rows.sort((a, b) =>
        a.segments.length !== b.segments.length
          ? a.segments.length - b.segments.length
          : a.key.localeCompare(b.key),
      );
      out.set(group.projectName, rows);
    }
    return out;
  });

  folderRowsOf(projectName: string): { key: string; segments: string[]; scripts: Script[] }[] {
    return this.folderRowsByProject().get(projectName) ?? [];
  }

  scriptsByProject = computed(() => {
    const filtered = this.scripts().filter(s =>
      !s.isPlaceholder &&
      (!this.projectIdFilter() || s.projectId === this.projectIdFilter()) &&
      (this.statusFilter() === 'all' || ScriptStatus[s.status] === this.statusFilter())
    );

    const groups: Record<string, Script[]> = {};
    filtered.forEach(s => {
      const name = this.getProjectName(s.projectId);
      if (!groups[name]) groups[name] = [];
      groups[name].push(s);
    });

    return Object.entries(groups)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([projectName, scripts]) => ({ projectName, scripts }));
  });

  ngOnInit(): void {
    this.observability.trackPageView('dashboard');
    this.loadData();
  }

  private loadData(): void {
    this.api.getProjects().subscribe({
      next: projects => {
        this.projects.set(projects);
        this.loadScripts();
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private loadScripts(): void {
    this.api.getScripts().subscribe({
      next: scripts => {
        this.scripts.set(scripts);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private getProjectName(projectId: string): string {
    const p = this.projects().find(pr => pr.id === projectId);
    return p?.name || 'Geral';
  }

  toggleProjectFilter(project: Project): void {
    if (this.projectIdFilter() === project.id) {
      this.projectIdFilter.set(null);
    } else {
      this.projectIdFilter.set(project.id);
    }
  }

  toggleCollapse(name: string): void {
    const next = new Set(this.collapsedProjects());
    if (next.has(name)) next.delete(name); else next.add(name);
    this.collapsedProjects.set(next);
  }

  getStatusConfig(status: ScriptStatus): { label: string; color: string; bg: string } {
    const key = ScriptStatus[status];
    return STATUS_CONFIG[key] || STATUS_CONFIG['Rascunho'];
  }

  copyInvite(): void {
    const user = this.authService.user();
    if (user?.workspaceId) {
      navigator.clipboard.writeText(user.workspaceId);
    }
  }

  createNewScript(): void {
    this.router.navigate(['/scripts/new']);
  }

  createScriptInProject(projectName: string, event: Event): void {
    event.stopPropagation();
    const project = this.projects().find(p => p.name === projectName);
    if (project) {
      this.router.navigate(['/scripts/new'], { queryParams: { projectId: project.id } });
    }
  }

  createProject(): void {
    if (!this.newProjectName.trim()) return;
    this.api.createProject({
      name: this.newProjectName,
      code: this.newProjectCode || this.newProjectName.toUpperCase().slice(0, 3)
    }).subscribe({
      next: project => {
        this.projects.update(p => [project, ...p]);
        this.showCreateProject.set(false);
        this.newProjectName = '';
        this.newProjectCode = '';
      }
    });
  }

  openEditor(scriptId: string): void {
    this.router.navigate(['/scripts', scriptId]);
  }

  openTeleprompter(scriptId: string): void {
    window.open(`/tp/${scriptId}`, '_blank');
  }

  confirmDelete(scriptId: string): void {
    this.deleteScriptId.set(scriptId);
  }

  deleteScript(): void {
    const id = this.deleteScriptId();
    if (!id) return;
    this.api.deleteScript(id).subscribe({
      next: () => {
        this.scripts.update(s => s.filter(sc => sc.id !== id));
        this.deleteScriptId.set(null);
      }
    });
  }
}
