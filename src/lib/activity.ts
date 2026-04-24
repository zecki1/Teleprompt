import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export interface ActivityData {
  userId: string;
  userName: string;
  userAvatar?: string | null;
  action: "Editou" | "Gravou" | "Criou" | "Revisou" | "Comentou";
  scriptId: string;
  scriptTitle: string;
  projectId?: string | null;
  projectName?: string | null;
  folder?: string | null;
  subfolder?: string | null;
  workspaceId: string;
}

/**
 * Registra uma atividade no log global para auditoria.
 */
export async function logActivity(data: ActivityData) {
  try {
    const activityRef = collection(db, "activities");
    await addDoc(activityRef, {
      ...data,
      timestamp: serverTimestamp(),
    });
    console.log(`[Activity] Logged: ${data.action} on "${data.scriptTitle}" by ${data.userName}`);
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}
