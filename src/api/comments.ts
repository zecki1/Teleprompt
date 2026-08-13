"use client";

import { api } from "./client";
import type { ChecklistItemDto, CommentDto } from "./types";

export function listComments(scriptId: string): Promise<CommentDto[]> {
  return api.get<CommentDto[]>(`/api/v1/scripts/${scriptId}/comments`);
}

export function addComment(scriptId: string, body: string): Promise<CommentDto> {
  return api.post<CommentDto>(`/api/v1/scripts/${scriptId}/comments`, { body });
}

export function resolveComment(scriptId: string, commentId: string): Promise<CommentDto> {
  return api.put<CommentDto>(`/api/v1/scripts/${scriptId}/comments/${commentId}`);
}

export function getChecklist(scriptId: string): Promise<ChecklistItemDto[]> {
  return api.get<ChecklistItemDto[]>(`/api/v1/scripts/${scriptId}/checklist`);
}

export function updateChecklist(
  scriptId: string,
  items: ChecklistItemDto[],
): Promise<void> {
  return api.put<void>(`/api/v1/scripts/${scriptId}/checklist`, { items });
}
