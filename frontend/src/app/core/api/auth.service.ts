import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL, API_PREFIX } from '../config';
import { ApiError } from './api-error';
import type {
  ApiMessage,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserDto,
} from './types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private url(path: string): string {
    return `${this.baseUrl}${API_PREFIX}${path}`;
  }

  register(input: RegisterRequest): Promise<AuthResponse> {
    return firstValueFrom(
      this.http.post<AuthResponse>(this.url('/auth/register'), input),
    ).catch((e) => {
      throw this.toApiError(e);
    });
  }

  login(input: LoginRequest): Promise<AuthResponse> {
    return firstValueFrom(
      this.http.post<AuthResponse>(this.url('/auth/login'), input),
    ).catch((e) => {
      throw this.toApiError(e);
    });
  }

  me(): Promise<UserDto> {
    return firstValueFrom(this.http.get<UserDto>(this.url('/auth/me'))).catch(
      (e) => {
        throw this.toApiError(e);
      },
    );
  }

  logout(): Promise<ApiMessage | void> {
    return firstValueFrom(
      this.http.post<ApiMessage>(this.url('/auth/logout'), {}),
    ).catch(() => undefined);
  }

  private toApiError(e: unknown): unknown {
    if (e instanceof HttpErrorResponse) {
      const data = e.error as { message?: string; Message?: string } | null;
      const message =
        data?.message || data?.Message || `Erro ${e.status}`;
      return new ApiError(message, e.status, e.error);
    }
    return e;
  }
}
