import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { selectUser } from '@store/auth/auth.selectors';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Perfil</h1>
        <p class="page-description">Gerencie suas informações pessoais</p>
      </div>

      @if (user()) {
        <div class="profile-layout">
          <div class="content-card">
            <div class="card-header">
              <h2 class="card-title">Informações Pessoais</h2>
            </div>
            <div class="card-body">
              <div class="profile-top">
                <div class="avatar-lg">{{ initials() }}</div>
                <div>
                  <h3 class="profile-name">{{ user()!.displayName }}</h3>
                  <p class="text-sm text-muted-foreground">{{ user()!.email }}</p>
                </div>
              </div>

              <div class="divider"></div>

              <form [formGroup]="profileForm" (ngSubmit)="saveProfile()" class="profile-form">
                <div class="form-group">
                  <label>Nome</label>
                  <input formControlName="displayName" class="form-input" />
                </div>
                <div class="form-group">
                  <label>E-mail</label>
                  <input formControlName="email" class="form-input" [attr.disabled]="true" />
                </div>
                <button type="submit" class="btn-primary">Salvar Alterações</button>
              </form>
            </div>
          </div>

          <div class="content-card">
            <div class="card-header">
              <h2 class="card-title">Permissões</h2>
            </div>
            <div class="card-body">
              <div class="perm-grid">
                @if (user()!.isSuperAdmin) { <span class="badge badge-blue">SuperAdmin</span> }
                @if (user()!.isEditor) { <span class="badge badge-emerald">Editor</span> }
                @if (user()!.isRevisor) { <span class="badge badge-purple">Revisor</span> }
                @if (user()!.canCollaborate) { <span class="badge badge-muted">Colaborador</span> }
                @if (user()!.canRevert) { <span class="badge badge-amber">Reverter</span> }
                @if (user()!.canViewReports) { <span class="badge badge-muted">Relatórios</span> }
                @if (user()!.canViewActivityHistory) { <span class="badge badge-muted">Histórico</span> }
                @if (user()!.canViewDebugLogs) { <span class="badge badge-muted">Debug Logs</span> }
                @if (user()!.canAssign) { <span class="badge badge-muted">Atribuir</span> }
                @if (user()!.canManagePermissions) { <span class="badge badge-muted">Gerenciar</span> }
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 1152px; margin: 0 auto; padding: 2rem 1rem; }
    @media (min-width: 640px) { .page-container { padding: 2rem 1.5rem; } }
    .page-header { margin-bottom: 2rem; }
    .page-title { font-size: 1.875rem; font-weight: 900; letter-spacing: -0.025em; }
    .page-description { font-size: 0.875rem; color: var(--muted-foreground); margin-top: 0.25rem; }
    .profile-layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap: 1.5rem; }
    @media (max-width: 768px) { .profile-layout { grid-template-columns: 1fr; } }
    .content-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .card-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); }
    .card-title { font-size: 1rem; font-weight: 600; }
    .card-body { padding: 1.5rem; }
    .profile-top { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .avatar-lg {
      display: inline-flex; align-items: center; justify-content: center;
      width: 4rem; height: 4rem; border-radius: 50%; background: var(--muted);
      color: var(--muted-foreground); font-size: 1.25rem; font-weight: 700; flex-shrink: 0;
    }
    .profile-name { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.125rem; }
    .text-sm { font-size: 0.875rem; }
    .text-muted-foreground { color: var(--muted-foreground); }
    .divider { height: 1px; background: var(--border); margin: 1.5rem 0; }
    .profile-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; }
    .form-group label { font-size: 0.875rem; font-weight: 500; margin-bottom: 0.375rem; }
    .form-input {
      padding: 0.625rem 0.75rem; border: 1px solid var(--input); border-radius: 8px;
      background: transparent; color: var(--foreground); font-size: 0.875rem;
    }
    .form-input:focus { outline: none; border-color: var(--ring); }
    .btn-primary {
      align-self: flex-start; padding: 0.5rem 1rem; border-radius: 8px;
      border: none; background: var(--primary); color: var(--primary-foreground);
      font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: opacity 0.15s;
    }
    .btn-primary:hover { opacity: 0.9; }
    .perm-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .badge { display: inline-flex; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.8125rem; font-weight: 500; }
    .badge-blue { background: oklch(0.623 0.214 259.815 / 0.1); color: #3b82f6; }
    .badge-emerald { background: oklch(0.696 0.17 162.48 / 0.1); color: #10b981; }
    .badge-purple { background: oklch(0.627 0.265 303.9 / 0.1); color: #8b5cf6; }
    .badge-amber { background: oklch(0.769 0.188 70.08 / 0.1); color: #f59e0b; }
    .badge-muted { background: var(--muted); color: var(--muted-foreground); }
  `]
})
export class ProfileComponent implements OnInit {
  private store = inject(Store);
  private fb = inject(FormBuilder);

  user = signal<any>(null);
  initials = signal('');
  profileForm: FormGroup = this.fb.group({ displayName: [''], email: [''] });

  ngOnInit(): void {
    this.store.select(selectUser).subscribe(u => {
      if (u) {
        this.user.set(u);
        this.profileForm.patchValue({ displayName: u.displayName, email: u.email });
        this.initials.set((u.displayName || '').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2));
      }
    });
  }

  saveProfile(): void {
    // Profile save would call API
  }
}
