import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  getDoc,
  addDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Scene } from "@/lib/parser";

export interface VersionData {
  id: string;
  content?: string;
  scenes?: Scene[];
  createdAt: { toDate: () => Date } | string;
  createdBy?: string;
  createdByName?: string;
  description?: string;
  restoredFrom?: string;
}

export async function getVersions(
  scriptId: string,
  max: number = 50
): Promise<VersionData[]> {
  const vQ = query(
    collection(db, "scripts", scriptId, "versions"),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  const snapshot = await getDocs(vQ);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as VersionData[];
}

export async function getVersionById(
  scriptId: string,
  versionId: string
): Promise<VersionData | null> {
  const ref = doc(db, "scripts", scriptId, "versions", versionId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as VersionData;
}

export async function restoreVersion(
  scriptId: string,
  versionId: string,
  restoredBy: string,
  restoredByName: string
): Promise<boolean> {
  try {
    const versionData = await getVersionById(scriptId, versionId);
    if (!versionData) return false;

    const scenes = versionData.scenes || [];
    const rawContent = versionData.content || "";

    const docRef = doc(db, "scripts", scriptId);
    const currentSnap = await getDoc(docRef);
    if (!currentSnap.exists()) return false;

    await setDoc(
      docRef,
      {
        updatedAt: serverTimestamp(),
        restoredFrom: versionId,
        restoredAt: new Date().toISOString(),
      },
      { merge: true }
    );

    await addDoc(collection(db, "scripts", scriptId, "versions"), {
      content: rawContent,
      scenes: scenes,
      createdAt: new Date().toISOString(),
      createdBy: restoredBy,
      createdByName: restoredByName,
      description: `Restaurado da versão ${versionId.slice(0, 8)}...`,
      restoredFrom: versionId,
    });

    return true;
  } catch (error) {
    console.error("[Versions] Erro ao restaurar versão:", error);
    return false;
  }
}
