"use client";

import { listMyWorkspaces, createWorkspace } from "@/api/workspace";
import { listProjects, createProject } from "@/api/projects";
import { listScripts, createScript } from "@/api/scripts";
import { debugInfo, debugError } from "@/lib/debug-log";

// Credenciais de exibição da conta demo (mantidas por compatibilidade).
// A autenticação agora é feita pelo back-end .NET (Identity), não pelo Firebase.
export const DEMO_EMAIL = "demo@teleprompt.app";
export const DEMO_PASSWORD = "Demo2026!";
export const DEMO_USER_NAME = "Equipe de Demonstração";
export const DEMO_WORKSPACE_NAME = "Workspace de Demonstração";
export const DEMO_PROJECT_NAME = "Tutorial de Demonstração";
export const DEMO_SCRIPT_TITLE = "Roteiro de Exemplo";

// Roteiro de exemplo com os marcadores suportados pelo parser:
// Cena, [Loc] (locução), [Let] (lettering), [Pron] (pronúncia), [Img] (imagem),
// [Url] (fonte), [Abe]/[Enc] (abertura/encerramento) e Tempo.
export const DEMO_RAW_CONTENT = `Cena 1
Tempo: 45 segundos
[abe]: Abertura do programa
[Loc]: Olá! Este é o roteiro de demonstração do Teleprompt. Edite o texto livremente e veja como as cenas são organizadas.
[Let1]: Bem-vindo
[Pron1]: Bem-vin-du
[Img1]: https://picsum.photos/seed/teleprompt/640/360
[Url1]: https://www.youtube.com/results?search_query=teleprompter

[Loc]: No teleprompter, pressione Reproduzir para testar a rolagem automática do texto.
[Let2]: Velocidade ajustável
[Pron2]: ve-lo-ci-da-de

[Loc]: Quando terminar, marque como gravado e confira o histórico de versões no editor.
[enc]: Encerramento`;

export interface DemoSetupResult {
  email: string;
  password: string;
  workspaceId: string;
  projectId: string;
  scriptId: string;
  created: boolean;
}

/**
 * Cria o ambiente de demonstração usando a sessão atual (o back-end .NET
 * é a única fonte de dados). Cria (ou reutiliza) workspace, projeto e roteiro
 * de exemplo no workspace do usuário logado.
 */
export async function setupDemo(): Promise<DemoSetupResult> {
  const startedAt = Date.now();
  let created = false;

  try {
    // 1) Workspace demo (único por usuário)
    let workspaceId = "";
    const myWorkspaces = await listMyWorkspaces();
    const existingWs = myWorkspaces.find((w) => w.name === DEMO_WORKSPACE_NAME);
    if (existingWs) {
      workspaceId = existingWs.id;
    } else {
      const ws = await createWorkspace({ name: DEMO_WORKSPACE_NAME, plan: "Free" });
      workspaceId = ws.id;
      created = true;
      debugInfo("demo.setup", "Workspace de demonstração criado", { workspaceId });
    }

    // 2) Projeto de exemplo
    let projectId = "";
    const projects = await listProjects(workspaceId);
    const existingProject = projects.find((p) => p.name === DEMO_PROJECT_NAME);
    if (existingProject) {
      projectId = existingProject.id;
    } else {
      const proj = await createProject({
        name: DEMO_PROJECT_NAME,
        code: "DEMO",
        status: "InProgress",
      });
      projectId = proj.id;
      created = true;
      debugInfo("demo.setup", "Projeto de demonstração criado", { projectId });
    }

    // 3) Roteiro de exemplo
    let scriptId = "";
    const scripts = await listScripts({ workspaceId });
    const existingScript = scripts.find((s) => s.title === DEMO_SCRIPT_TITLE);
    if (existingScript) {
      scriptId = existingScript.id;
    } else {
      const script = await createScript({
        projectId,
        title: DEMO_SCRIPT_TITLE,
        content: DEMO_RAW_CONTENT,
      });
      scriptId = script.id;
      created = true;
      debugInfo("demo.setup", "Roteiro de demonstração criado", { scriptId });
    }

    return { email: DEMO_EMAIL, password: DEMO_PASSWORD, workspaceId, projectId, scriptId, created };
  } catch (error) {
    debugError("demo.setup", "Falha ao preparar ambiente de demonstração", error, { durationMs: Date.now() - startedAt });
    throw error;
  }
}

/**
 * Estado atual do ambiente de demonstração (para o painel do admin).
 */
export async function getDemoStatus(): Promise<{ ready: boolean; workspaceId?: string; email: string; password: string }> {
  try {
    const myWorkspaces = await listMyWorkspaces();
    const ws = myWorkspaces.find((w) => w.name === DEMO_WORKSPACE_NAME);
    return { ready: Boolean(ws), workspaceId: ws?.id, email: DEMO_EMAIL, password: DEMO_PASSWORD };
  } catch {
    return { ready: false, email: DEMO_EMAIL, password: DEMO_PASSWORD };
  }
}
