"use client";

import { api } from "./client";
import type { PresenterDto } from "./types";

export interface CreatePresenterRequest {
  name: string;
  email?: string;
  phone?: string;
}

export function listPresenters(): Promise<PresenterDto[]> {
  return api.get<PresenterDto[]>("/api/v1/presenters");
}

export function createPresenter(input: CreatePresenterRequest): Promise<PresenterDto> {
  return api.post<PresenterDto>("/api/v1/presenters", input);
}

export function updatePresenter(
  id: string,
  input: CreatePresenterRequest,
): Promise<PresenterDto> {
  return api.put<PresenterDto>(`/api/v1/presenters/${id}`, input);
}

export function deletePresenter(id: string): Promise<void> {
  return api.del<void>(`/api/v1/presenters/${id}`);
}
