"use client";

import { api } from "./client";
import type { AuthResponse, UserDto } from "./types";

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** Cria conta (e-mail/senha). Retorna o token + perfil. */
export async function register(input: RegisterRequest): Promise<AuthResponse> {
  return api.post<AuthResponse>("/api/v1/auth/register", input, { skipAuth: true });
}

/** Autentica e emite o JWT. */
export async function login(input: LoginRequest): Promise<AuthResponse> {
  return api.post<AuthResponse>("/api/v1/auth/login", input, { skipAuth: true });
}

/** Perfil da sessão atual. */
export async function me(): Promise<UserDto> {
  return api.get<UserDto>("/api/v1/auth/me");
}

/** Encerra a sessão no servidor (JWT é stateless; o cliente descarta o token). */
export async function logout(): Promise<void> {
  await api.post<unknown>("/api/v1/auth/logout");
}
