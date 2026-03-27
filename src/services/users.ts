import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TelepromptUser, UserRole } from "@/contexts/AuthContext";

export const getUsers = async (): Promise<TelepromptUser[]> => {
  const q = query(collection(db, "users"), orderBy("displayName", "asc"));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      uid: doc.id,
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      role: data.role || "editor",
      workspaceIds: data.workspaceIds || ["senai"],
      createdAt: data.createdAt?.toDate() || new Date(),
    } as TelepromptUser;
  });
};

export const getUserById = async (uid: string): Promise<TelepromptUser | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    uid: uid,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL,
    role: data.role || "editor",
    workspaceIds: data.workspaceIds || ["senai"],
    createdAt: data.createdAt?.toDate() || new Date(),
  } as TelepromptUser;
};

export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, {
    role,
    updatedAt: serverTimestamp(),
  });
};

export const updateUserWorkspaces = async (uid: string, workspaceIds: string[]): Promise<void> => {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, {
    workspaceIds,
    updatedAt: serverTimestamp(),
  });
};

export const deleteUser = async (uid: string): Promise<void> => {
  await deleteDoc(doc(db, "users", uid));
};
