import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import * as AuthActions from '@store/auth/auth.actions';
import { selectLoading, selectError } from '@store/auth/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-card">
      <div class="auth-header">
        <h1>Bem-vindo(a)!</h1>
        <p>Faça login para acessar seu painel.</p>
      </div>

      @if (error$ | async; as error) {
        <div class="alert alert-error">
          <span>⚠</span>
          <span>{{ error }}</span>
        </div>
      }

      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="auth-form">
        <div class="form-group">
          <label for="email">E-mail</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            placeholder="seu@email.com"
            autocomplete="email"
            class="form-input"
            [class.form-input-error]="loginForm.get('email')?.touched && loginForm.get('email')?.errors"
          />
          @if (loginForm.get('email')?.touched && loginForm.get('email')?.errors) {
            <p class="form-error">
              @if (loginForm.get('email')?.errors?.['required']) { E-mail é obrigatório }
              @if (loginForm.get('email')?.errors?.['email']) { E-mail inválido }
            </p>
          }
        </div>

        <div class="form-group">
          <div class="label-row">
            <label for="password">Senha</label>
            <button type="button" class="link-button">Esqueceu a senha?</button>
          </div>
          <input
            id="password"
            [type]="showPassword() ? 'text' : 'password'"
            formControlName="password"
            placeholder="Sua senha"
            autocomplete="current-password"
            class="form-input"
          />
          <button type="button" class="password-toggle" (click)="showPassword.set(!showPassword())">
            @if (showPassword()) { Ocultar } @else { Mostrar }
          </button>
          @if (loginForm.get('password')?.touched && loginForm.get('password')?.errors) {
            <p class="form-error">Senha é obrigatória</p>
          }
        </div>

        <button type="submit" class="btn-primary" [disabled]="(loading$ | async) || loginForm.invalid">
          @if (loading$ | async) {
            <span class="spinner"></span>
            Entrando...
          } @else {
            Entrar
          }
        </button>
      </form>

      <div class="auth-footer">
        <p>Não tem uma conta?
          <button (click)="goToRegister()" class="link-button font-semibold">Cadastre-se</button>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-card {
      width: 100%;
      max-width: 28rem;
      background: var(--card);
      color: var(--card-foreground);
      border: 1px solid var(--border);
      border-radius: 1rem;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
      overflow: hidden;
    }
    :host-context(.dark) .auth-card {
      background: rgba(39,39,42,0.7);
      backdrop-filter: blur(12px);
    }

    .auth-header {
      text-align: center;
      padding: 2rem 1rem 0.5rem;
    }
    .auth-header h1 {
      font-size: 1.875rem;
      font-weight: 700;
      color: var(--foreground);
      margin-bottom: 0.25rem;
    }
    .auth-header p {
      font-size: 0.875rem;
      color: var(--muted-foreground);
    }

    .auth-form {
      padding: 1.5rem 1.5rem 0;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      margin: 1rem 1.5rem 0;
    }
    .alert-error {
      background: rgba(239,68,68,0.1);
      color: var(--destructive);
      border: 1px solid rgba(239,68,68,0.2);
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--foreground);
      margin-bottom: 0.375rem;
    }

    .label-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.375rem;
    }
    .label-row label { margin-bottom: 0; }

    .link-button {
      background: none;
      border: none;
      color: var(--primary);
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      padding: 0;
    }
    .link-button:hover { text-decoration: underline; }

    .form-input {
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1px solid var(--input);
      border-radius: 8px;
      background: rgba(255,255,255,0.5);
      color: var(--foreground);
      font-size: 0.875rem;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    :host-context(.dark) .form-input { background: rgba(255,255,255,0.05); }
    .form-input::placeholder { color: var(--muted-foreground); opacity: 0.6; }
    .form-input:focus {
      outline: none;
      border-color: var(--ring);
      box-shadow: 0 0 0 2px rgba(161,161,170,0.2);
    }
    .form-input-error { border-color: var(--destructive); }

    .password-toggle {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--muted-foreground);
      font-size: 0.75rem;
      cursor: pointer;
    }
    .password-toggle:hover { color: var(--foreground); }

    .form-group:has(.password-toggle) { position: relative; }

    .form-error {
      font-size: 0.75rem;
      color: var(--destructive);
      margin-top: 0.375rem;
    }

    .btn-primary {
      width: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      margin-top: 0.5rem;
      margin-bottom: 1rem;
      background: var(--primary);
      color: var(--primary-foreground);
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      transition: opacity 0.15s;
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 2s linear infinite;
    }

    .auth-footer {
      text-align: center;
      padding: 1rem 1.5rem 2rem;
      font-size: 0.875rem;
      color: var(--muted-foreground);
    }
    .auth-footer .link-button { font-size: 0.875rem; }

    .font-semibold { font-weight: 600; }

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private router = inject(Router);

  showPassword = signal(false);
  loading$ = this.store.select(selectLoading);
  error$ = this.store.select(selectError);

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.store.dispatch(AuthActions.login({ request: this.loginForm.value }));
    }
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register']);
  }
}
