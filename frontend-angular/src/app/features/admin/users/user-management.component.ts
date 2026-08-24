import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '@core/services/api.service';
import { ObservabilityService } from '@core/services/observability.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Gerenciamento de Usuários</h1>
          <p class="page-description">Gerencie permissões e acessos</p>
        </div>
      </div>

      <div class="content-card">
        <div class="card-body">
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>E-mail</th>
                  <th>Função</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (user of users(); track user.id) {
                  <tr>
                    <td class="font-medium">{{ user.displayName }}</td>
                    <td class="text-muted-foreground text-sm">{{ user.email }}</td>
                    <td>
                      <span class="badge badge-muted">{{ user.role }}</span>
                    </td>
                    <td>
                      <span class="badge" [class]="user.status === 'Active' ? 'badge-emerald' : 'badge-muted'">
                        {{ user.status }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="4" class="empty-cell">Nenhum usuário encontrado</td>
                  </tr>
                }
              </tbody>
            </table>
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
    .content-card { background: var(--card); border: 1px solid var(--border); border-radius: 12px; overflow: hidden; }
    .card-body { overflow-x: auto; }
    .table-wrapper { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .data-table th { padding: 0.75rem 1.5rem; text-align: left; font-weight: 500; color: var(--muted-foreground); border-bottom: 1px solid var(--border); background: var(--muted); font-size: 0.8125rem; }
    .data-table td { padding: 0.75rem 1.5rem; border-bottom: 1px solid var(--border); }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: var(--accent); }
    .font-medium { font-weight: 500; }
    .badge { display: inline-flex; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .badge-muted { background: var(--muted); color: var(--muted-foreground); }
    .badge-emerald { background: oklch(0.696 0.17 162.48 / 0.1); color: var(--emerald-500); }
    .empty-cell { text-align: center; padding: 3rem !important; color: var(--muted-foreground); }
  `]
})
export class UserManagementComponent implements OnInit {
  private api = inject(ApiService);
  private observability = inject(ObservabilityService);
  users = signal<any[]>([]);

  ngOnInit(): void {
    this.observability.trackPageView('user-management');
    this.api.getUsers().subscribe({ next: u => this.users.set(u) });
  }
}
