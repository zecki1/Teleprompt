"use client";

import { api } from "@/api/client";
import type { ActivityDto, PresenterDto, ProjectDto, ScriptDto, WorkspaceDto } from "@/api/types";

/**
 * Dataset de demonstração (degustação sem login).
 *
 * O endpoint GET /api/v1/demo/workspace é anônimo e retorna um workspace
 * 100% fictício (Estúdio Pixel) com projetos, roteiros, usuários e
 * apresentadores orgânicos. Nenhum dado real de cliente é exposto (LGPD).
 */

export interface DemoBundle {
  workspace: WorkspaceDto;
  users: DemoUserDto[];
  presenters: PresenterDto[];
  projects: ProjectDto[];
  scripts: ScriptDto[];
  activities: ActivityDto[];
}

export interface DemoUserDto {
  id: string;
  email: string | null;
  displayName: string | null;
  role: string;
  isSuperAdmin: boolean;
  isEditor: boolean;
  isRevisor: boolean;
  canRevert: boolean;
  canViewAdmin: boolean;
  canViewReports: boolean;
  canViewActivityHistory: boolean;
  requiresChecklist: boolean;
  workspaceId: string;
}

const DEMO_VIEW_KEY = "tp_demo_view";

/** true quando a visualização demo (sem login) está ativa na UI. */
export function isPublicDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const view = window.localStorage.getItem(DEMO_VIEW_KEY);
    if (view !== "admin" && view !== "tecnico") return false;
    return !window.localStorage.getItem("tp_token");
  } catch {
    return false;
  }
}

let cache: DemoBundle | null = null;

async function fetchBundle(force = false): Promise<DemoBundle> {
  if (cache && !force) return cache;
  const data = await api.get<DemoBundle>("/api/v1/demo/workspace", { skipAuth: true });
  cache = data;
  return data;
}

export function clearDemoCache(): void {
  cache = null;
}

export async function getDemoProjects(): Promise<ProjectDto[]> {
  const b = await fetchBundle();
  return b.projects;
}

export async function getDemoScripts(): Promise<ScriptDto[]> {
  const b = await fetchBundle();
  return b.scripts;
}

export async function getDemoUsers(): Promise<DemoUserDto[]> {
  const b = await fetchBundle();
  return b.users;
}

export async function getDemoPresenters(): Promise<PresenterDto[]> {
  const b = await fetchBundle();
  return b.presenters;
}

export async function getDemoWorkspace(): Promise<WorkspaceDto> {
  const b = await fetchBundle();
  return b.workspace;
}

export async function getDemoActivities(): Promise<ActivityDto[]> {
  const b = await fetchBundle();
  return b.activities;
}
