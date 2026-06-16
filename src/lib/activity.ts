import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc, Timestamp, deleteDoc, query, where, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./firebase";

export type ActivityAction =
  | "Editou" | "Gravou" | "Criou" | "Revisou" | "Comentou"
  | "ExcluiuRoteiro" | "ExcluiuPasta" | "ExcluiuProjeto"
  | "ExportouBackup" | "Reverteu" | "EditouProjeto"
  | "Cadastrou" | "Entrou" | "Saiu";

export interface ActivityData {
  userId: string;
  userName: string;
  userAvatar?: string | null;
  action: ActivityAction;
  scriptId?: string;
  scriptTitle?: string;
  projectId?: string | null;
  projectName?: string | null;
  folder?: string | null;
  subfolder?: string | null;
  lesson?: string | null;
  path?: string[] | null;
  workspaceId: string;
  snapshot?: Record<string, unknown> | null;
  snapshotIds?: string[] | null;
  metadata?: string | null;
  timestamp?: unknown;
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

export async function logActivity(data: ActivityData) {
  try {
    const activityRef = collection(db, "activities");
    await addDoc(activityRef, {
      ...stripUndefined(data as unknown as Record<string, unknown>),
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

export async function revertActivity(activityId: string): Promise<boolean> {
  try {
    const actRef = doc(db, "activities", activityId);
    const actSnap = await getDoc(actRef);
    if (!actSnap.exists()) return false;

    const act = actSnap.data() as ActivityData;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const timestamp = (act.timestamp as Timestamp)?.toDate?.() || new Date();
    if (timestamp < thirtyDaysAgo) return false;

    if (act.action === "ExcluiuRoteiro" && act.snapshot && act.scriptId) {
      await setDoc(doc(db, "scripts", act.scriptId), act.snapshot);
      if (act.snapshotIds) {
        for (const subId of act.snapshotIds) {
          await setDoc(doc(db, "scripts", act.scriptId, "versions", subId), { restored: true });
        }
      }
      return true;
    }

    if (act.action === "ExcluiuPasta" && act.snapshot) {
      for (const scriptId of act.snapshotIds || []) {
        const snapKey = `snapshot_${scriptId}`;
        const scriptData = act.snapshot[snapKey] as Record<string, unknown> | undefined;
        if (scriptData) {
          await setDoc(doc(db, "scripts", scriptId), scriptData);
        }
      }
      return true;
    }

    if (act.action === "ExcluiuProjeto" && act.projectId) {
      if (act.snapshot) {
        await setDoc(doc(db, "projects", act.projectId), {
          ...act.snapshot,
          isDeleted: false,
          deletedAt: null,
          restoredAt: new Date().toISOString(),
        }, { merge: true });
      } else {
        await setDoc(doc(db, "projects", act.projectId), {
          isDeleted: false,
          deletedAt: null,
          restoredAt: new Date().toISOString(),
        }, { merge: true });
      }
      return true;
    }

    if (act.action === "EditouProjeto" && act.projectId && act.snapshot) {
      const previousName = act.snapshot.previousName as string | undefined;
      const previousCode = act.snapshot.previousCode as string | undefined;

      const restoreData: Record<string, unknown> = {};
      if (previousName) restoreData.name = previousName;
      if (previousCode !== undefined) restoreData.code = previousCode;

      if (Object.keys(restoreData).length > 0) {
        await setDoc(doc(db, "projects", act.projectId), restoreData, { merge: true });
      }

      if (previousName && act.projectName) {
        const scriptsRef = collection(db, "scripts");
        const q = query(scriptsRef, where("projectName", "==", act.projectName));
        const snapshot = await getDocs(q);
        const batch = writeBatch(db);
        snapshot.docs.forEach(d => batch.update(doc(db, "scripts", d.id), { projectName: previousName }));
        await batch.commit();
      }
      return true;
    }

    if (act.action === "Editou" && act.snapshot && act.scriptId) {
      await setDoc(doc(db, "scripts", act.scriptId), act.snapshot);
      return true;
    }

    if (act.action === "Criou" && act.scriptId) {
      await deleteDoc(doc(db, "scripts", act.scriptId));
      return true;
    }

    if (act.action === "Gravou" && act.snapshot && act.scriptId) {
      await setDoc(doc(db, "scripts", act.scriptId), act.snapshot);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error reverting activity:", error);
    return false;
  }
}
