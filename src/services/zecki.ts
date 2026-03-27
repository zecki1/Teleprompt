const ZECKI_API_URL = process.env.NEXT_PUBLIC_ZECKI_API_URL || "https://zecki1.com.br";

export interface ZeckiProjectResponse {
  success: boolean;
  projectId?: string;
  taskId?: string;
  message?: string;
  error?: string;
}

export interface ZeckiScriptLinkResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function createZeckiProject(
  name: string,
  code: string,
  workspaceId: string,
  createdBy: { uid: string; email: string }
): Promise<ZeckiProjectResponse> {
  try {
    const response = await fetch(`${ZECKI_API_URL}/api/teleprompt/project`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        code,
        workspaceId,
        createdBy,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao criar projeto no Zecki:", error);
    return {
      success: false,
      error: "Falha ao criar projeto no Zecki",
    };
  }
}

export async function addScriptLinkToZecki(
  projectName: string,
  projectCode: string,
  scriptTitle: string,
  scriptUrl: string,
  scriptId: string,
  validatedBy: string
): Promise<ZeckiScriptLinkResponse> {
  try {
    const response = await fetch(`${ZECKI_API_URL}/api/teleprompt/script-link`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectName,
        projectCode,
        scriptTitle,
        scriptUrl,
        scriptId,
        validatedBy,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erro ao adicionar link ao Zecki:", error);
    return {
      success: false,
      error: "Falha ao adicionar link ao Zecki",
    };
  }
}
