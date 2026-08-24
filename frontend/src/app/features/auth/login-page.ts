import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly mode = signal<'login' | 'register'>('login');
  protected readonly submitting = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    displayName: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected toggleMode(): void {
    this.mode.update((m) => (m === 'login' ? 'register' : 'login'));
    this.error.set(null);
  }

  protected async submit(): Promise<void> {
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { displayName, email, password } = this.form.getRawValue();
    this.submitting.set(true);
    try {
      if (this.mode() === 'register') {
        await this.auth.register({
          email,
          password,
          displayName: displayName.trim() || email.split('@')[0],
        });
      } else {
        await this.auth.login({ email, password });
      }
      void this.router.navigate(['/dashboard']);
    } catch (e) {
      this.error.set(this.humanize(e));
    } finally {
      this.submitting.set(false);
    }
  }

  private humanize(e: unknown): string {
    const status = (e as { status?: number }).status;
    if (status !== undefined) {
      if (status === 0) {
        return 'Não foi possível conectar à API. Verifique se o backend está rodando em http://localhost:5026.';
      }
      const serverMsg = (e as { error?: { message?: string } }).error?.message;
      return (
        serverMsg ??
        `Erro ${status}: ${
          this.mode() === 'login'
            ? 'não foi possível entrar.'
            : 'não foi possível criar a conta.'
        }`
      );
    }
    return 'Falha inesperada. Tente novamente.';
  }

  protected get isRegister(): boolean {
    return this.mode() === 'register';
  }
}
