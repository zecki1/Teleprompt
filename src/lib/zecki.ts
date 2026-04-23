import { 
  collection, query, where, getDocs, doc, setDoc, addDoc 
} from "firebase/firestore";
import { dbZecki } from "./firebase";
export interface ZeckiProject {
  id: string;
  name: string;
  code?: string;
  client?: string;
  status?: string;
  workspaceId: string;
  deletedAt?: string | null;
  createdAt?: string;
  zeckiProjectId?: string;
}

/**
 * Busca todos os projetos ativos do workspace do usuário no Zecki
 * Segue a lógica do dashboard para paridade de dados.
 */
export async function fetchZeckiProjects(workspaceId: string): Promise<ZeckiProject[]> {
  if (!workspaceId) return [];
  
  try {
    const projectsRef = collection(dbZecki, "projects");
    console.log(`[ZeckiService] Buscando projetos no Firebase Project: ${dbZecki.app.options.projectId}`);
    // Para maior resiliência, buscamos tanto pelo ID do workspace quanto pelo slug (caso seja SENAI)
    const SENAI_ID = "38028901-c72f-4ca1-b887-1d6683923403";
    const workspaceIds = [workspaceId];
    if (workspaceId === SENAI_ID || workspaceId === "senai") {
      workspaceIds.push(SENAI_ID, "senai");
    }

    const q = query(
      projectsRef, 
      where("workspaceId", "in", Array.from(new Set(workspaceIds)))
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`[ZeckiService] Projetos encontrados para workspace ${workspaceId}: ${querySnapshot.size} no projeto ${dbZecki.app.options.projectId}`);
    
    const projects: ZeckiProject[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Filtragem manual para maior resiliência
      if (data.deletedAt === null || data.deletedAt === undefined || data.isDeleted === false || !data.isDeleted) {
        projects.push({
          id: doc.id,
          name: data.name || "Sem Nome",
          code: data.code || "",
          client: data.client || "",
          status: data.status || "active",
          workspaceId: data.workspaceId,
          deletedAt: data.deletedAt,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
          zeckiProjectId: data.zeckiProjectId || doc.id
        });
      }
    });

    if (projects.length === 0) {
      console.warn(`[ZeckiService] Nenhum projeto encontrado para o workspace ${workspaceId}. Verifique se os projetos no Firestore possuem este workspaceId.`);
    }
    
    // Sort by name locally (same as dashboard)
    projects.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    
    return projects;
  } catch (error) {
    console.error("Erro ao buscar projetos do Zecki:", error);
    return [];
  }
}

/**
 * Cria uma tarefa de "Gravação" no Kanban do Zecki
 */
export async function createRecordingTask(
  projectId: string, 
  scriptTitle: string, 
  scriptId: string, 
  createdBy: string, 
  workspaceId: string,
  category: "video" | "podcast" = "video",
  scriptLink?: string,
  editorId?: string,
  reviewerId?: string
) {
  try {
    const taskId = crypto.randomUUID();
    const taskPath = `projects/${projectId}/modules/audiovisual/tasks/${taskId}`;
    const taskRef = doc(dbZecki, taskPath);

    const categoryLabel = category === "podcast" ? "Podcast" : "Vídeo";
    const taskType = category === "podcast" ? "gravacaoPodcast" : "gravacaoVideo";
    
    const newTask = {
      id: taskId,
      title: `Gravação de ${categoryLabel}: ${scriptTitle}`,
      description: `Tarefa gerada automaticamente pelo Teleprompt.\nRoteiro: ${scriptId}${scriptLink ? `\nLink do Roteiro: ${scriptLink}` : ""}`,
      projectId: projectId,
      bucket: "Backlog",
      status: "backlog",
      priority: "Média",
      type: taskType,
      section: "audiovisual",
      source: "teleprompt",
      scriptId: scriptId,
      createdBy: createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workspaceId: workspaceId || "senai",
      responsibleIds: [],
      reviewerIds: reviewerId ? [reviewerId] : [],
      members: [],
      tags: ["Teleprompt", categoryLabel],
      progress: 0,
      urgency: "Baixa",
      complexity: "Baixa",
    };
    
    await setDoc(taskRef, newTask);
    return taskId;
  } catch (error) {
    console.error("Erro ao criar tarefa no Zecki:", error);
    throw error;
  }
}

/**
 * Cria uma tarefa de "Edição" no Kanban do Zecki
 */
export async function createEditingTask(
  projectId: string, 
  scriptTitle: string, 
  scriptId: string, 
  createdBy: string, 
  workspaceId: string,
  category: "video" | "podcast" = "video",
  scriptLink?: string,
  editorId?: string,
  reviewerId?: string
) {
  try {
    const taskId = crypto.randomUUID();
    const taskPath = `projects/${projectId}/modules/audiovisual/tasks/${taskId}`;
    const taskRef = doc(dbZecki, taskPath);

    const categoryLabel = category === "podcast" ? "Podcast" : "Vídeo";
    const taskType = category === "podcast" ? "edicaoPodcast" : "edicaoVideo";
    
    const newTask = {
      id: taskId,
      title: `Edição de ${categoryLabel}: ${scriptTitle}`,
      description: `Tarefa gerada automaticamente pelo Teleprompt após gravação.\nRoteiro: ${scriptId}${scriptLink ? `\nLink do Roteiro: ${scriptLink}` : ""}`,
      projectId: projectId,
      bucket: "Backlog",
      status: "backlog",
      priority: "Média",
      type: taskType,
      section: "audiovisual",
      source: "teleprompt",
      scriptId: scriptId,
      createdBy: createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workspaceId: workspaceId || "senai",
      responsibleIds: editorId ? [editorId] : [],
      reviewerIds: reviewerId ? [reviewerId] : [],
      members: [],
      tags: ["Teleprompt", "Edição", categoryLabel],
      progress: 0,
      urgency: "Baixa",
      complexity: "Baixa",
    };
    
    await setDoc(taskRef, newTask);
    return taskId;
  } catch (error) {
    console.error("Erro ao criar tarefa de edição no Zecki:", error);
    throw error;
  }
}

/**
 * Cria um novo projeto no Zecki (Firestore dashboard)
 */
export async function createZeckiProject(projectData: Partial<ZeckiProject>) {
  try {
    const projectsRef = collection(dbZecki, "projects");
    const payload = {
      ...projectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false,
      deletedAt: null,
    };
    
    const docRef = await addDoc(projectsRef, payload);
    return { id: docRef.id, ...payload } as ZeckiProject;
  } catch (error) {
    console.error("Erro ao criar projeto no Zecki:", error);
    throw error;
  }
}

/**
 * Exclui (logicamente) um projeto no Zecki
 */
export async function deleteZeckiProject(projectId: string) {
  try {
    const projectRef = doc(dbZecki, "projects", projectId);
    await setDoc(projectRef, {
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Erro ao excluir projeto no Zecki:", error);
    throw error;
  }
}

/**
 * Atribui o videomaker à tarefa de gravação quando o roteiro é marcado como gravado
 */
export async function updateTaskVideomaker(projectId: string, taskId: string, videomakerId: string) {
  try {
    const taskRef = doc(dbZecki, `projects/${projectId}/modules/audiovisual/tasks/${taskId}`);
    await setDoc(taskRef, {
      responsibleIds: [videomakerId],
      videomakerId: videomakerId,
      updatedAt: new Date().toISOString(),
      status: "done",
      bucket: "Concluído"
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar videomaker na tarefa:", error);
    throw error;
  }
}
