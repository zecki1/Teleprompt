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
import { dbZecki } from "@/lib/firebase";
import { ExtendedUser, ExtendedUserSchema, Role } from "@/services/schemas";

import { SENAI_WORKSPACE_ID, SENAI_SLUG } from "@/lib/constants";

export const getUsers = async (workspaceId?: string): Promise<ExtendedUser[]> => {
  const restrictedEmails = [
    'zecki1@hotmail.com',
    'milinhacmldias@gmail.com',
    'ederson.gui@gmail.com',
    'zecki1@ezequiel.com.br'
  ].map(e => e.toLowerCase());

  // Workspace padrão para o Admin
  const targetWorkspace = workspaceId || SENAI_WORKSPACE_ID;
  
  // Buscamos usuários que tenham o ID oficial ou o slug legado
  const q = query(
    collection(dbZecki, "users"), 
    where("workspaceId", "in", [targetWorkspace, SENAI_SLUG])
  );
  
  const snapshot = await getDocs(q);
  
  const users = snapshot.docs.map(doc => {
    const data = doc.data();
    // Filtro extra no cliente para os emails restritos (segurança em camadas)
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
        workspaceId: data.workspaceId || SENAI_WORKSPACE_ID,
        workspaces: data.workspaces || [SENAI_WORKSPACE_ID],
        isEditor: data.isEditor || false,
        isRevisor: data.isRevisor || false,
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
  const docRef = doc(dbZecki, "users", uid);
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
      workspaceId: data.workspaceId || SENAI_WORKSPACE_ID,
      workspaces: data.workspaces || [SENAI_WORKSPACE_ID],
      isEditor: data.isEditor || false,
      isRevisor: data.isRevisor || false,
    } as ExtendedUser;
  }
};

export const updateUserRole = async (uid: string, role: string): Promise<void> => {
  const docRef = doc(dbZecki, "users", uid);
  await updateDoc(docRef, {
    role,
    updatedAt: serverTimestamp(),
  });
};

export const updateUserWorkspace = async (uid: string, workspaceId: string): Promise<void> => {
  const docRef = doc(dbZecki, "users", uid);
  await updateDoc(docRef, {
    workspaceId,
    updatedAt: serverTimestamp(),
  });
};

export const updateUserPermissions = async (uid: string, permissions: { isEditor?: boolean; isRevisor?: boolean }): Promise<void> => {
  const docRef = doc(dbZecki, "users", uid);
  await updateDoc(docRef, {
    ...permissions,
    updatedAt: serverTimestamp(),
  });
};

export const deleteUser = async (uid: string): Promise<void> => {
  await deleteDoc(doc(dbZecki, "users", uid));
};
