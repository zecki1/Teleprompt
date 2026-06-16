import { collection, getDocs, doc, updateDoc, query, where, limit } from "firebase/firestore";
import { db } from "./firebase";
import { SENAI_WORKSPACE_ID } from "./constants";

export interface MigrationResult {
  total: number;
  updated: number;
  skipped: number;
  errors: { id: string; error: string }[];
}

export async function migrateScriptsWorkspaceId(): Promise<MigrationResult> {
  const result: MigrationResult = { total: 0, updated: 0, skipped: 0, errors: [] };

  const scriptsSnap = await getDocs(collection(db, "scripts"));

  for (const scriptDoc of scriptsSnap.docs) {
    result.total++;
    const data = scriptDoc.data();

    if (data.workspaceId) {
      result.skipped++;
      continue;
    }

    try {
      let targetWorkspaceId = SENAI_WORKSPACE_ID;

      const createdBy = data.createdBy;
      if (createdBy) {
        const userSnap = await getDocs(
          query(collection(db, "users"), where("uid", "==", createdBy), limit(1))
        );
        if (!userSnap.empty) {
          const userData = userSnap.docs[0].data();
          targetWorkspaceId = userData.workspaceId || userData.workspaces?.[0] || SENAI_WORKSPACE_ID;
        }
      }

      await updateDoc(doc(db, "scripts", scriptDoc.id), {
        workspaceId: targetWorkspaceId,
      });
      result.updated++;
    } catch (err) {
      result.errors.push({
        id: scriptDoc.id,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return result;
}