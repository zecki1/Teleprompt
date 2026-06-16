import { collection, doc, setDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import type { BackupData } from "./firestore-backup";

interface RestoreResult {
  success: boolean;
  collections: Record<string, number>;
  error?: string;
}

export async function restoreFromBackup(data: BackupData): Promise<RestoreResult> {
  const result: RestoreResult = { success: true, collections: {} };

  const COLLECTIONS = Object.keys(data.collections);

  for (const colName of COLLECTIONS) {
    const documents = data.collections[colName];
    if (!documents || documents.length === 0) {
      result.collections[colName] = 0;
      continue;
    }

    let restoredCount = 0;
    const batch = writeBatch(db);

    for (const docData of documents) {
      const { id, ...rest } = docData as { id: string; [key: string]: unknown };

      const docRef = id ? doc(db, colName, id) : doc(collection(db, colName));
      batch.set(docRef, rest, { merge: false });
      restoredCount++;

      if (restoredCount % 500 === 0) {
        await batch.commit();
      }
    }

    if (restoredCount % 500 !== 0) {
      await batch.commit();
    }

    result.collections[colName] = restoredCount;
  }

  return result;
}
