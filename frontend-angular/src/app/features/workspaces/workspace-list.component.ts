import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '@core/services/api.service';
import { ObservabilityService } from '@core/services/observability.service';

@Component({
  selector: 'app-workspace-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Workspaces</h1>
          <p class="page-description">Gerencie seus ambientes de trabalho</p>
        </div>
        <div class="header-actions">
          <button class="btn-outline" (click)="showJoinForm.set(!showJoinForm())">Entrar com código</button>
          <button class="btn-primary" (click)="showCreateForm.set(!showCreateForm())">
            @if (showCreateForm()) { Fechar } @else { + Novo Workspace }
          </button>
        </div>
      </div>

      @if (showJoinForm()) {
        <div class="create-card animate-slide-down">
          <form [formGroup]="joinForm" (ngSubmit)="joinWorkspace()" class="create-form">
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Código do Workspace</label>
                <input formControlName="code" placeholder="Cole o código" class="form-input" />
              </div>
              <div class="form-actions">
                <button type="submit" class="btn-primary" [disabled]="joinForm.invalid">Entrar</button>
                <button type="button" class="btn-ghost" (click)="showJoinForm.set(false)">Cancelar</button>
              </div>
            </div>
          </form>
        </div>
      }

      @if (showCreateForm()) {
        <div class="create-card animate-slide-down">
          <form [formGroup]="createForm" (ngSubmit)="createWorkspace()" class="create-form">
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Nome do Workspace</label>
                <input formControlName="name" placeholder="Ex: Meu Workspace" class="form-input" />
              </div>
              <div class="form-actions">
                <button type="submit" class="btn-primary" [disabled]="createForm.invalid">Criar</button>
                <button type="button" class="btn-ghost" (click)="showCreateForm.set(false)">Cancelar</button>
              </div>
            </div>
          </form>
        </div>
      }

      <div class="projects-grid">
        @for (ws of workspaces(); track ws.id) {
          <div class="project-card">
            <div class="card-top">
              <h3 class="project-name">{{ ws.name }}</h3>
              <span class="badge badge-muted">{{ ws.plan || 'Free' }}</span>
            </div>
            <p class="project-meta">Criado em {{ ws.createdAt | date:'dd/MM/yyyy' }}</p>
          </div>
        } @empty {
          <div class="empty-state"><p>Nenhum workspace encontrado</p></div>
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
    .header-actions { display: flex; gap: 0.5rem; }
    .btn-primary { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border-radius: 8px; border: none; background: var(--primary); color: var(--primary-foreground); font-size: 0.875rem; font-weight: 500; cursor: pointer; }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-outline { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid var(--border); background: transparent; color: var(--foreground); font-size: 0.875rem; font-weight: 500; cursor: pointer; }
    .btn-outline:hover { background: var(--accent); }
    .btn-ghost { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border-radius: 8px; border: none; background: transparent; color: var(--muted-foreground); font-size: 0.875rem; font-weight: 500; cursor: pointer; }
    .btn-ghost:hover { background: var(--accent); color: var(--foreground); }
    .create-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; }
    .form-row { display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap; }
    .form-group { margin-bottom: 0; }
    .form-group label { display: block; font-size: 0.8125rem; font-weight: 500; margin-bottom: 0.375rem; }
    .flex-1 { flex: 1; min-width: 200px; }
    .form-input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--input); border-radius: 8px; background: transparent; color: var(--foreground); font-size: 0.875rem; }
    .form-input:focus { outline: none; border-color: var(--ring); }
    .form-actions { display: flex; gap: 0.5rem; }
    .projects-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
    .project-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem; }
    .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; }
    .project-name { font-size: 1rem; font-weight: 600; }
    .badge { display: inline-flex; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .badge-muted { background: var(--muted); color: var(--muted-foreground); }
    .project-meta { font-size: 0.8125rem; color: var(--muted-foreground); }
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--muted-foreground); }
  `]
})
export class WorkspaceListComponent implements OnInit {
  private api = inject(ApiService);
  private observability = inject(ObservabilityService);
  private fb = inject(FormBuilder);
  workspaces = signal<any[]>([]);
  showCreateForm = signal(false);
  showJoinForm = signal(false);
  createForm: FormGroup = this.fb.group({ name: ['', Validators.required] });
  joinForm: FormGroup = this.fb.group({ code: ['', Validators.required] });

  ngOnInit(): void {
    this.observability.trackPageView('workspace-list');
    this.api.getMyWorkspaces().subscribe({ next: w => this.workspaces.set(w) });
  }

  createWorkspace(): void {
    if (this.createForm.valid) {
      this.api.createWorkspace(this.createForm.value).subscribe({
        next: () => { this.api.getMyWorkspaces().subscribe({ next: w => this.workspaces.set(w) }); this.showCreateForm.set(false); this.createForm.reset(); }
      });
    }
  }

  joinWorkspace(): void {
    if (this.joinForm.valid) {
      this.api.joinWorkspace(this.joinForm.value).subscribe({
        next: () => { this.api.getMyWorkspaces().subscribe({ next: w => this.workspaces.set(w) }); this.showJoinForm.set(false); this.joinForm.reset(); }
      });
    }
  }
}
