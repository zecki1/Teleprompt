import { collection, getDocs, doc, writeBatch, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { DateTime } from "luxon";

const OLD_WORKSPACE_ID = "38028901-c72f-4ca1-b887-1d6683923403";

export interface MigrationResult {
  workspaceId: string;
  users: number;
  scripts: number;
  projects: number;
  activities: number;
  teams: number;
  errors: string[];
}

async function migrateCollection(
  collectionName: string,
  newWorkspaceId: string,
  oldWorkspaceId: string,
  errors: string[],
): Promise<number> {
  const snap = await getDocs(
    query(collection(db, collectionName), where("workspaceId", "==", oldWorkspaceId))
  );

  let count = 0;
  for (let i = 0; i < snap.docs.length; i += 499) {
    const batch = writeBatch(db);
    const chunk = snap.docs.slice(i, i + 499);

    for (const docSnap of chunk) {
      batch.update(docSnap.ref, { workspaceId: newWorkspaceId });
      count++;
    }

    try {
      await batch.commit();
    } catch (err) {
      errors.push(`Erro no lote ${i / 499} de ${collectionName}: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
  }

  return count;
}

export async function migrateToNewWorkspace(workspaceName: string): Promise<MigrationResult> {
  const errors: string[] = [];
  const newWorkspaceId = crypto.randomUUID();

  // 1. Criar o novo workspace
  const now = DateTime.now().toISO();
  try {
    await writeBatch(db).set(doc(db, "workspaces", newWorkspaceId), {
      name: workspaceName,
      ownerId: "",
      ownerEmail: "",
      members: [],
      createdAt: now,
      updatedAt: now,
      plan: "free",
      roleLabels: { Diretor: "Diretor", Docente: "Docente" },
    }).commit();
  } catch (err) {
    errors.push(`Erro ao criar workspace: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    return { workspaceId: "", users: 0, scripts: 0, projects: 0, activities: 0, teams: 0, errors };
  }

  // 2. Migrar usuários (além do workspaceId, atualizar array workspaces)
  try {
    const usersSnap = await getDocs(
      query(collection(db, "users"), where("workspaceId", "==", OLD_WORKSPACE_ID))
    );
    const batch = writeBatch(db);
    for (const docSnap of usersSnap.docs) {
      const data = docSnap.data();
      const workspaces = (data.workspaces || []).map((w: string) =>
        w === OLD_WORKSPACE_ID ? newWorkspaceId : w
      );
      if (!workspaces.includes(newWorkspaceId)) workspaces.push(newWorkspaceId);
      batch.update(docSnap.ref, { workspaceId: newWorkspaceId, workspaces });
    }
    await batch.commit();
  } catch (err) {
    errors.push(`Erro ao migrar usuários: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
  }

  // 3. Migrar scripts
  const scripts = await migrateCollection("scripts", newWorkspaceId, OLD_WORKSPACE_ID, errors);

  // 4. Migrar projetos
  const projects = await migrateCollection("projects", newWorkspaceId, OLD_WORKSPACE_ID, errors);

  // 5. Migrar atividades
  const activities = await migrateCollection("activities", newWorkspaceId, OLD_WORKSPACE_ID, errors);

  // 6. Migrar times
  const teams = await migrateCollection("teams", newWorkspaceId, OLD_WORKSPACE_ID, errors);

  // 7. Atualizar lista de members do novo workspace com todos os usuários migrados
  try {
    const allUsersSnap = await getDocs(
      query(collection(db, "users"), where("workspaceId", "==", newWorkspaceId))
    );
    const memberIds = allUsersSnap.docs.map(d => d.id);
    const memberBatch = writeBatch(db);
    const wsRef = doc(db, "workspaces", newWorkspaceId);
    memberBatch.update(wsRef, { members: memberIds, ownerId: memberIds[0] || "" });
    await memberBatch.commit();
  } catch (err) {
    errors.push(`Erro ao atualizar membros: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
  }

  return {
    workspaceId: newWorkspaceId,
    users: 0,
    scripts,
    projects,
    activities,
    teams,
    errors,
  };
}
