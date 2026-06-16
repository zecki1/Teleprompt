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



export const getUsers = async (workspaceId?: string, isSuperAdmin?: boolean): Promise<ExtendedUser[]> => {
  const restrictedEmails = [
    'milinhacmldias@gmail.com',
    'ederson.gui@gmail.com',
    'zecki1@hotmail.com'
  ].map(e => e.toLowerCase());

  const constraints = isSuperAdmin ? [] : [where("workspaceId", "==", workspaceId || "")];
  if (!isSuperAdmin && !workspaceId) return [];
  
  const q = query(
    collection(db, "users"), 
    ...constraints
  );
  
  const snapshot = await getDocs(q);
  
  const users = snapshot.docs.map(doc => {
    const data = doc.data();
    if (data.email && restrictedEmails.includes(data.email.toLowerCase())) {
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
        isEditor: data.isEditor || false,
        isRevisor: data.isRevisor || false,
        canRevert: data.canRevert || false,
        canViewAdmin: data.canViewAdmin || false,
        canViewReports: data.canViewReports || false,
        canViewActivityHistory: data.canViewActivityHistory || false,
        requiresChecklist: data.requiresChecklist ?? true,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      } as ExtendedUser;
    }
  });

  return users
    .filter((u): u is ExtendedUser => u !== null)
    .sort((a, b) => (a.displayName || "").localeCompare(b.displayName || ""));
};

export const getUserById = async (uid: string): Promise<ExtendedUser | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  try {
    return ExtendedUserSchema.parse({ uid: uid, ...data });
  } catch {
    return {
      uid: uid,
      email: data.email || "",
      displayName: data.displayName || data.name || "Usuário",
      name: data.name || "",
      role: (data.role as Role) || "Docente",
      status: data.status || "active",
      workspaceId: data.workspaceId || "",
      workspaces: data.workspaces || [],
      isEditor: data.isEditor || false,
      isRevisor: data.isRevisor || false,
      canRevert: data.canRevert || false,
      canViewAdmin: data.canViewAdmin || false,
      canViewReports: data.canViewReports || false,
      canViewActivityHistory: data.canViewActivityHistory || false,
      requiresChecklist: data.requiresChecklist ?? true,
    } as ExtendedUser;
  }
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

export const updateUserPermissions = async (uid: string, permissions: { isEditor?: boolean; isRevisor?: boolean; canRevert?: boolean; canViewAdmin?: boolean; canViewReports?: boolean; canViewActivityHistory?: boolean; requiresChecklist?: boolean }): Promise<void> => {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, {
    ...permissions,
    updatedAt: serverTimestamp(),
  });
};

export const deleteUser = async (uid: string): Promise<void> => {
  await deleteDoc(doc(db, "users", uid));
};