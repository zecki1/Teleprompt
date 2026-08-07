import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ExtendedUser, ExtendedUserSchema, Role } from "@/services/schemas";



const restrictedEmails = [
  'milinhacmldias@gmail.com',
  'ederson.gui@gmail.com',
  'zecki1@hotmail.com'
].map(e => e.toLowerCase());

type FirestoreDocLike = { id: string; data(): { [key: string]: unknown } };

export const mapUserDoc = (doc: FirestoreDocLike): ExtendedUser | null => {
  const data = doc.data();
  if (data.email && restrictedEmails.includes(String(data.email).toLowerCase())) {
    return null;
  }

  try {
    return ExtendedUserSchema.parse({ uid: doc.id, ...data });
  } catch {
    return {
      uid: doc.id,
      email: data.email || "",
      displayName: data.displayName || data.name || "Usuário",
      name: data.name || "",
      role: (data.role as Role) || "Docente",
      status: data.status || "active",
      workspaceId: data.workspaceId || "",
      workspaces: data.workspaces || [],
      canCollaborate: data.canCollaborate || false,
      isEditor: data.isEditor || false,
      isRevisor: data.isRevisor || false,
      canRevert: data.canRevert || false,
      canViewAdmin: data.canViewAdmin || false,
      canViewReports: data.canViewReports || false,
      canViewActivityHistory: data.canViewActivityHistory || false,
      canAssign: data.canAssign || false,
      requiresChecklist: data.requiresChecklist ?? true,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as ExtendedUser;
  }
};

export const getUsers = async (workspaceId?: string, isSuperAdmin?: boolean): Promise<ExtendedUser[]> => {
  const constraints = isSuperAdmin ? [] : [where("workspaceId", "==", workspaceId || "")];
  if (!isSuperAdmin && !workspaceId) return [];
  
  const q = query(
    collection(db, "users"), 
    ...constraints
  );
  
  const snapshot = await getDocs(q);
  
  const users = snapshot.docs
    .map(doc => mapUserDoc(doc))
    .filter((u): u is ExtendedUser => u !== null);

  return users.sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
};

export const getUserById = async (uid: string): Promise<ExtendedUser | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return mapUserDoc(docSnap);
};

export const updateUserRole = async (uid: string, role: string): Promise<void> => {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, {
    role,
    updatedAt: serverTimestamp(),
  });
};

export const updateUserWorkspace = async (uid: string, workspaceId: string): Promise<void> => {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, {
    workspaceId,
    updatedAt: serverTimestamp(),
  });
};

export const updateUserPermissions = async (uid: string, permissions: { canCollaborate?: boolean; isEditor?: boolean; isRevisor?: boolean; canRevert?: boolean; canAssign?: boolean; canViewAdmin?: boolean; canViewReports?: boolean; canViewActivityHistory?: boolean; requiresChecklist?: boolean }): Promise<void> => {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, {
    ...permissions,
    updatedAt: serverTimestamp(),
  });
};

export const deleteUser = async (uid: string): Promise<void> => {
  await deleteDoc(doc(db, "users", uid));
};