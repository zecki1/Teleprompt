import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Presenter {
  id: string;
  name: string;
  workspaceId: string;
  createdBy: string;
  createdAt?: any;
}

export const addPresenter = async (name: string, workspaceId: string, userId: string): Promise<string> => {
  const docRef = await addDoc(collection(db, "presenters"), {
    name,
    workspaceId,
    createdBy: userId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

export const getPresenters = async (workspaceId: string): Promise<Presenter[]> => {
  const q = query(
    collection(db, "presenters"),
    where("workspaceId", "==", workspaceId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Presenter[];
};

export const deletePresenter = async (presenterId: string): Promise<void> => {
  await deleteDoc(doc(db, "presenters", presenterId));
};
