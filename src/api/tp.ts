"use client";

import { api } from "./client";
import type { TpSessionDto } from "./types";

export interface CreateTpSessionRequest {
  scriptId: string;
  mode?: string;
  speed?: number;
}

export interface UpdateTpSessionRequest {
  mode?: string;
  speed?: number;
  scrollStateJson?: string;
}

export interface MarkRecordedRequest {
  scriptId: string;
}

export function createTpSession(input: CreateTpSessionRequest): Promise<TpSessionDto> {
  return api.post<TpSessionDto>("/api/v1/tp/sessions", input);
}

export function getTpSession(id: string): Promise<TpSessionDto> {
  return api.get<TpSessionDto>(`/api/v1/tp/sessions/${id}`);
}

export function updateTpSession(
  id: string,
  input: UpdateTpSessionRequest,
): Promise<TpSessionDto> {
  return api.put<TpSessionDto>(`/api/v1/tp/sessions/${id}`, input);
}

export function markRecorded(id: string, input: MarkRecordedRequest): Promise<unknown> {
  return api.post<unknown>(`/api/v1/tp/sessions/${id}/recorded`, input);
}
