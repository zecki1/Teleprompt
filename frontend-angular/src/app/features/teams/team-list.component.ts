import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '@core/services/api.service';
import { ObservabilityService } from '@core/services/observability.service';

@Component({
  selector: 'app-team-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Times</h1>
          <p class="page-description">Gerencie seus times de trabalho</p>
        </div>
        <button class="btn-primary" (click)="showCreateForm.set(!showCreateForm())">
          @if (showCreateForm()) { Fechar } @else { + Novo Time }
        </button>
      </div>

      @if (showCreateForm()) {
        <div class="create-card animate-slide-down">
          <form [formGroup]="teamForm" (ngSubmit)="createTeam()" class="create-form">
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Nome do Time</label>
                <input formControlName="name" placeholder="Ex: Equipe Alpha" class="form-input" />
              </div>
              <div class="form-actions">
                <button type="submit" class="btn-primary" [disabled]="teamForm.invalid">Criar</button>
                <button type="button" class="btn-ghost" (click)="showCreateForm.set(false)">Cancelar</button>
              </div>
            </div>
          </form>
        </div>
      }

      <div class="projects-grid">
        @for (team of teams(); track team.id) {
          <div class="project-card">
            <h3 class="project-name">{{ team.name }}</h3>
            <p class="project-meta">{{ team.memberCount || 0 }} membros</p>
          </div>
        } @empty {
          <div class="empty-state"><p>Nenhum time encontrado</p></div>
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
    .btn-primary { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border-radius: 8px; border: none; background: var(--primary); color: var(--primary-foreground); font-size: 0.875rem; font-weight: 500; cursor: pointer; }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
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
    .project-name { font-size: 1rem; font-weight: 600; margin-bottom: 0.25rem; }
    .project-meta { font-size: 0.8125rem; color: var(--muted-foreground); }
    .empty-state { grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--muted-foreground); }
  `]
})
export class TeamListComponent implements OnInit {
  private api = inject(ApiService);
  private observability = inject(ObservabilityService);
  private fb = inject(FormBuilder);
  teams = signal<any[]>([]);
  showCreateForm = signal(false);
  teamForm: FormGroup = this.fb.group({ name: ['', Validators.required] });

  ngOnInit(): void {
    this.observability.trackPageView('team-list');
    this.api.getTeams().subscribe({ next: t => this.teams.set(t) });
  }

  createTeam(): void {
    if (this.teamForm.valid) {
      this.api.createTeam(this.teamForm.value).subscribe({
        next: () => { this.api.getTeams().subscribe({ next: t => this.teams.set(t) }); this.showCreateForm.set(false); this.teamForm.reset(); }
      });
    }
  }
}
