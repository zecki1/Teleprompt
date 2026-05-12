import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "./firebase";

export interface RevertibleActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  action: string;
  scriptId?: string;
  scriptTitle?: string;
  projectId?: string | null;
  projectName?: string | null;
  timestamp: Date;
  reversible: boolean;
}

export async function getRevertibleActivities(): Promise<RevertibleActivity[]> {
  const actions = ["ExcluiuRoteiro", "ExcluiuPasta", "ExcluiuProjeto"];
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const q = query(
    collection(db, "activities"),
    where("action", "in", actions),
    orderBy("action"),
    orderBy("timestamp", "desc"),
    limit(100)
  );

  const snapshot = await getDocs(q);
  const results: RevertibleActivity[] = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const timestamp = data.timestamp?.toDate?.() || new Date();
    results.push({
      id: docSnap.id,
      userId: data.userId || "",
      userName: data.userName || "Desconhecido",
      userAvatar: data.userAvatar || null,
      action: data.action || "",
      scriptId: data.scriptId,
      scriptTitle: data.scriptTitle,
      projectId: data.projectId || null,
      projectName: data.projectName || null,
      timestamp,
      reversible: timestamp > thirtyDaysAgo,
    });
  });

  return results;
}
