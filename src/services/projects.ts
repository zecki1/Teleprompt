"use client";

import {
  listProjects,
  createProject as apiCreateProject,
  updateProject as apiUpdateProject,
  deleteProject as apiDeleteProject,
  listProjectScripts,
} from "@/api/projects";
import { listScripts } from "@/api/scripts";
import { toProject, toScriptDoc } from "@/lib/script-mappers";
import type { ProjectDto } from "@/api/types";
import { ScriptDoc } from "@/types/script";
import { isPublicDemoMode, getDemoProjects, getDemoScripts } from "@/services/demo-data";

export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  id: string;
  name: string;
  code?: string;
  externalLink?: string;
  links?: ProjectLink[];
  workspaceId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

function mapProject(dto: ProjectDto): Project {
  const base = toProject(dto);
  return {
    id: base.id,
    name: base.name,
    code: base.code ?? undefined,
    externalLink: base.externalLink ?? undefined,
    workspaceId: base.workspaceId,
    status: base.status ?? undefined,
    createdAt: base.createdAt,
  };
}

export async function fetchProjects(workspaceId: string, isSuperAdmin?: boolean): Promise<Project[]> {
  try {
    if (isPublicDemoMode()) {
      const dtos = await getDemoProjects();
      return dtos.map(mapProject);
    }
    const dtos = await listProjects(isSuperAdmin ? undefined : workspaceId);
    return dtos.map(mapProject);
  } catch (error) {
    console.error("Erro ao buscar projetos:", error);
    return [];
  }
}

export async function createProject(data: Partial<Project>): Promise<Project> {
  const dto = await apiCreateProject({
    name: data.name || "",
    code: data.code,
    externalLink: data.externalLink,
    status: data.status,
  });
  return mapProject(dto);
}

export async function updateProject(projectId: string, data: Partial<Project>): Promise<void> {
  await apiUpdateProject(projectId, {
    name: data.name || "",
    code: data.code,
    externalLink: data.externalLink,
    status: data.status,
  });
}

export async function deleteProject(projectId: string): Promise<void> {
  await apiDeleteProject(projectId);
}

export async function getScriptsByWorkspace(workspaceId: string, isSuperAdmin?: boolean): Promise<ScriptDoc[]> {
  try {
    const dtos = isPublicDemoMode()
      ? await getDemoScripts()
      : await listScripts({ workspaceId: isSuperAdmin ? undefined : workspaceId });
    return dtos.map(toScriptDoc);
  } catch (error) {
    console.error("Erro ao buscar scripts:", error);
    return [];
  }
}

export async function getScriptsByProject(projectId: string): Promise<ScriptDoc[]> {
  try {
    const dtos = isPublicDemoMode()
      ? (await getDemoScripts()).filter((s) => s.projectId === projectId)
      : await listProjectScripts(projectId);
    return dtos.map(toScriptDoc);
  } catch (error) {
    console.error("Erro ao buscar roteiros do projeto:", error);
    return [];
  }
}
