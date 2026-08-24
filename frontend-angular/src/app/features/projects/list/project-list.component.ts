import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '@core/services/api.service';
import { ObservabilityService } from '@core/services/observability.service';
import { Project } from '@core/models/project.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Projetos</h1>
          <p class="page-description">Gerencie seus projetos de roteiro</p>
        </div>
        <button class="btn-primary" (click)="showCreateForm.set(!showCreateForm())">
          @if (showCreateForm()) { Fechar } @else { + Novo Projeto }
        </button>
      </div>

      @if (showCreateForm()) {
        <div class="create-card animate-slide-down">
          <form [formGroup]="projectForm" (ngSubmit)="createProject()" class="create-form">
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Nome do Projeto</label>
                <input formControlName="name" placeholder="Ex: Campanha 2026" class="form-input" />
              </div>
              <div class="form-group" style="width: 140px;">
                <label>Código</label>
                <input formControlName="code" placeholder="CAM-01" class="form-input" />
              </div>
              <div class="form-actions">
                <button type="submit" class="btn-primary" [disabled]="projectForm.invalid">Criar</button>
                <button type="button" class="btn-ghost" (click)="showCreateForm.set(false)">Cancelar</button>
              </div>
            </div>
          </form>
        </div>
      }

      <div class="projects-grid">
        @for (project of projects(); track project.id) {
          <a [routerLink]="['/projects', project.id]" class="project-card">
            <div class="card-top">
              <h3 class="project-name">{{ project.name }}</h3>
              @if (project.code) {
                <span class="project-code">{{ project.code }}</span>
              }
            </div>
            <div class="card-bottom">
              <span class="badge" [class]="getStatusBadgeClass(project.status)">
                {{ getStatusLabel(project.status) }}
              </span>
              <span class="project-date">{{ project.createdAt | date:'dd/MM/yyyy' }}</span>
            </div>
          </a>
        } @empty {
          <div class="empty-state">
            <p>Nenhum projeto encontrado</p>
            <p class="empty-hint">Clique em "Novo Projeto" para criar o primeiro</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container { max-width: 1152px; margin: 0 auto; padding: 2rem 1rem; }
    @media (min-width: 640px) { .page-container { padding: 2rem 1.5rem; } }

    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.875rem; font-weight: 900; letter-spacing: -0.025em; }
    .page-description { font-size: 0.875rem; color: var(--muted-foreground); margin-top: 0.25rem; }

    .btn-primary {
      display: inline-flex; align-items: center; padding: 0.5rem 1rem; border-radius: 8px;
      border: none; background: var(--primary); color: var(--primary-foreground);
      font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: opacity 0.15s;
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-ghost {
      display: inline-flex; align-items: center; padding: 0.5rem 1rem; border-radius: 8px;
      border: none; background: transparent; color: var(--muted-foreground);
      font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background 0.15s;
    }
    .btn-ghost:hover { background: var(--accent); color: var(--foreground); }

    .create-card {
      background: var(--card); border: 1px solid var(--border); border-radius: 12px;
      padding: 1.25rem; margin-bottom: 1.5rem;
    }
    .form-row { display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap; }
    .form-group { margin-bottom: 0; }
    .form-group label { display: block; font-size: 0.8125rem; font-weight: 500; margin-bottom: 0.375rem; }
    .flex-1 { flex: 1; min-width: 200px; }
    .form-input {
      width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--input); border-radius: 8px;
      background: transparent; color: var(--foreground); font-size: 0.875rem;
    }
    .form-input::placeholder { color: var(--muted-foreground); opacity: 0.6; }
    .form-input:focus { outline: none; border-color: var(--ring); }
    .form-actions { display: flex; gap: 0.5rem; }

    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem; }

    .project-card {
      display: flex; flex-direction: column; justify-content: space-between;
      background: var(--card); border: 1px solid var(--border); border-radius: 12px;
      padding: 1.25rem; text-decoration: none; color: var(--foreground);
      transition: box-shadow 0.15s, border-color 0.15s;
    }
    .project-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); border-color: oklch(0.705 0.015 286.067); }

    .card-top { margin-bottom: 1rem; }
    .project-name { font-size: 1rem; font-weight: 600; margin-bottom: 0.25rem; }
    .project-code { font-size: 0.75rem; color: var(--muted-foreground); font-family: monospace; }

    .card-bottom { display: flex; justify-content: space-between; align-items: center; }

    .badge { display: inline-flex; padding: 0.125rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .badge-blue { background: oklch(0.623 0.214 259.815 / 0.1); color: var(--blue-500); }
    .badge-amber { background: oklch(0.769 0.188 70.08 / 0.1); color: var(--amber-500); }
    .badge-emerald { background: oklch(0.696 0.17 162.48 / 0.1); color: var(--emerald-500); }
    .badge-red { background: oklch(0.637 0.237 25.331 / 0.1); color: var(--red-500); }
    .badge-muted { background: var(--muted); color: var(--muted-foreground); }

    .project-date { font-size: 0.75rem; color: var(--muted-foreground); }

    .empty-state { grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--muted-foreground); }
    .empty-state p { margin-bottom: 0.25rem; }
    .empty-hint { font-size: 0.8125rem; }
  `]
})
export class ProjectListComponent implements OnInit {
  private api = inject(ApiService);
  private observability = inject(ObservabilityService);
  private fb = inject(FormBuilder);

  projects = signal<Project[]>([]);
  showCreateForm = signal(false);

  projectForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    code: ['']
  });

  ngOnInit(): void {
    this.observability.trackPageView('project-list');
    this.loadProjects();
  }

  loadProjects(): void {
    this.api.getProjects().subscribe({
      next: projects => this.projects.set(projects)
    });
  }

  createProject(): void {
    if (this.projectForm.valid) {
      this.api.createProject(this.projectForm.value).subscribe({
        next: () => {
          this.loadProjects();
          this.showCreateForm.set(false);
          this.projectForm.reset();
        }
      });
    }
  }

  getStatusLabel(status?: number): string {
    const labels: Record<number, string> = {
      0: 'Aguardando', 1: 'Em Andamento', 2: 'Concluído', 3: 'Pausado', 4: 'Atrasado', 5: 'Backlog'
    };
    return status !== undefined ? labels[status] || 'N/A' : 'Sem status';
  }

  getStatusBadgeClass(status?: number): string {
    const classes: Record<number, string> = {
      0: 'badge-blue', 1: 'badge-amber', 2: 'badge-emerald', 3: 'badge-muted', 4: 'badge-red', 5: 'badge-muted'
    };
    return status !== undefined ? classes[status] || 'badge-muted' : 'badge-muted';
  }
}
