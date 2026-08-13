"use client";

import { api } from "./client";
import type { ScriptDto, VersionDto } from "./types";

export function listVersions(scriptId: string): Promise<VersionDto[]> {
  return api.get<VersionDto[]>(`/api/v1/scripts/${scriptId}/versions`);
}

export function createVersion(scriptId: string, content: string): Promise<VersionDto> {
  return api.post<VersionDto>(`/api/v1/scripts/${scriptId}/versions`, { content });
}

export function revertVersion(scriptId: string, versionNumber: number): Promise<ScriptDto> {
  return api.post<ScriptDto>(
    `/api/v1/scripts/${scriptId}/versions/${versionNumber}/revert`,
    undefined,
  );
}
