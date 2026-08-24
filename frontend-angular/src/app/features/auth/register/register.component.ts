import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import * as AuthActions from '@store/auth/auth.actions';
import { selectLoading, selectError } from '@store/auth/auth.selectors';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-card">
      <div class="auth-header">
        <div class="auth-logo">
          <span class="auth-logo-icon">▶</span>
        </div>
        <h1>Criar conta</h1>
        <p>Preencha os dados para se cadastrar</p>
      </div>

      @if (error$ | async; as error) {
        <div class="alert alert-error">
          <span class="alert-icon">⚠</span>
          {{ error }}
        </div>
      }

      <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="displayName">Nome</label>
          <input id="displayName" type="text" formControlName="displayName" placeholder="Seu nome completo" class="form-input" />
        </div>

        <div class="form-group">
          <label for="email">E-mail</label>
          <input id="email" type="email" formControlName="email" placeholder="seu@email.com" autocomplete="email" class="form-input" />
          @if (registerForm.get('email')?.touched && registerForm.get('email')?.errors) {
            <p class="form-error">
              @if (registerForm.get('email')?.errors?.['required']) { E-mail é obrigatório }
              @if (registerForm.get('email')?.errors?.['email']) { E-mail inválido }
            </p>
          }
        </div>

        <div class="form-group">
          <label for="password">Senha</label>
          <input id="password" type="password" formControlName="password" placeholder="Mínimo 8 caracteres" autocomplete="new-password" class="form-input" />
          @if (registerForm.get('password')?.touched && registerForm.get('password')?.errors) {
            <p class="form-error">
              @if (registerForm.get('password')?.errors?.['required']) { Senha é obrigatória }
              @if (registerForm.get('password')?.errors?.['minlength']) { Mínimo 8 caracteres }
            </p>
          }
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmar Senha</label>
          <input id="confirmPassword" type="password" formControlName="confirmPassword" placeholder="Repita a senha" autocomplete="new-password" class="form-input" />
          @if (registerForm.get('confirmPassword')?.touched && registerForm.hasError('passwordMismatch')) {
            <p class="form-error">As senhas não conferem</p>
          }
        </div>

        <button type="submit" class="btn-primary" [disabled]="(loading$ | async) || registerForm.invalid">
          @if (loading$ | async) {
            <span class="btn-loading"></span>
            Criando...
          } @else {
            Criar Conta
          }
        </button>
      </form>

      <div class="auth-footer">
        <p>Já tem conta?
          <a routerLink="/auth/login">Fazer login</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-card {
      width: 100%;
      max-width: 400px;
      background: var(--card);
      color: var(--card-foreground);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1);
    }

    .auth-header { text-align: center; margin-bottom: 1.5rem; }
    .auth-logo {
      display: inline-flex; align-items: center; justify-content: center;
      width: 48px; height: 48px; border-radius: 12px;
      background: var(--foreground); color: var(--background);
      font-size: 1.25rem; font-weight: 900; margin-bottom: 1rem;
    }
    .auth-header h1 { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.025em; color: var(--foreground); margin-bottom: 0.25rem; }
    .auth-header p { font-size: 0.875rem; color: var(--muted-foreground); }

    .alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; margin-bottom: 1rem; }
    .alert-error { background: oklch(0.577 0.245 27.325 / 0.1); color: var(--destructive); border: 1px solid oklch(0.577 0.245 27.325 / 0.2); }

    .form-group { margin-bottom: 1rem; }
    label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--foreground); margin-bottom: 0.375rem; }
    .form-input {
      width: 100%; padding: 0.625rem 0.75rem; border: 1px solid var(--input); border-radius: 8px;
      background: transparent; color: var(--foreground); font-size: 0.875rem;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .form-input::placeholder { color: var(--muted-foreground); opacity: 0.6; }
    .form-input:focus { outline: none; border-color: var(--ring); box-shadow: 0 0 0 2px oklch(0.705 0.015 286.067 / 0.2); }
    .form-error { font-size: 0.75rem; color: var(--destructive); margin-top: 0.375rem; }

    .btn-primary {
      width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.625rem 1rem; margin-top: 0.5rem; background: var(--primary); color: var(--primary-foreground);
      border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: opacity 0.15s;
    }
    .btn-primary:hover { opacity: 0.9; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-loading { width: 1rem; height: 1rem; border: 2px solid transparent; border-top-color: currentColor; border-radius: 50%; animation: spin 0.6s linear infinite; }

    .auth-footer { text-align: center; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border); }
    .auth-footer p { font-size: 0.875rem; color: var(--muted-foreground); }
    .auth-footer a { color: var(--foreground); font-weight: 600; text-decoration: none; }
    .auth-footer a:hover { text-decoration: underline; }

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private store = inject(Store);

  loading$ = this.store.select(selectLoading);
  error$ = this.store.select(selectError);

  registerForm: FormGroup = this.fb.group({
    displayName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.registerForm.valid) {
      const { displayName, email, password } = this.registerForm.value;
      this.store.dispatch(AuthActions.register({ request: { displayName, email, password } }));
    }
  }
}
