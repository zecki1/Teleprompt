import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export interface BackupData {
  exportedAt: string;
  collections: Record<string, unknown[]>;
}

const COLLECTIONS = ["users", "workspaces", "teams", "scripts", "projects", "activities"];

export async function exportFirestoreBackup(): Promise<BackupData> {
  const backup: BackupData = {
    exportedAt: new Date().toISOString(),
    collections: {},
  };

  for (const colName of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, colName));
      backup.collections[colName] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (err) {
      backup.collections[colName] = [];
      console.error(`Erro ao exportar coleção "${colName}":`, err);
    }
  }

  return backup;
}

export function downloadBackup(data: BackupData) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `teleprompt-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
