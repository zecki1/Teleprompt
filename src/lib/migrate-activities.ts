import { collection, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";
import { SENAI_WORKSPACE_ID } from "./constants";

export interface BackfillResult {
  total: number;
  updated: number;
  skipped: number;
  errors: { id: string; error: string }[];
}

export async function backfillActivitiesWorkspaceId(): Promise<BackfillResult> {
  const result: BackfillResult = { total: 0, updated: 0, skipped: 0, errors: [] };

  const activitiesSnap = await getDocs(collection(db, "activities"));

  for (const activityDoc of activitiesSnap.docs) {
    result.total++;
    const data = activityDoc.data();

    if (data.workspaceId) {
      result.skipped++;
      continue;
    }

    try {
      let targetWorkspaceId = SENAI_WORKSPACE_ID;

      if (data.userId) {
        const userSnap = await getDoc(doc(db, "users", data.userId));
        if (userSnap.exists()) {
          const userData = userSnap.data();
          targetWorkspaceId = userData.workspaceId || userData.workspaces?.[0] || SENAI_WORKSPACE_ID;
        }
      }

      await updateDoc(doc(db, "activities", activityDoc.id), {
        workspaceId: targetWorkspaceId,
      });
      result.updated++;
    } catch (err) {
      result.errors.push({
        id: activityDoc.id,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return result;
}
