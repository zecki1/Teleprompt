"use client";

import { 
  collection, doc, getDoc, getDocs, setDoc,
  query, where, arrayUnion, writeBatch 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Workspace, WorkspaceSchema, Role } from "@/services/schemas";
import { logActivity } from "@/lib/activity";
import { DateTime } from "luxon";
import { toast } from "sonner";

/**
 * Busca os dados de um workspace específico.
 */
export const getWorkspace = async (workspaceId: string): Promise<Workspace | null> => {
  try {
    const docRef = doc(db, "workspaces", workspaceId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return WorkspaceSchema.parse({ ...docSnap.data(), id: docSnap.id }) as Workspace;
    }
    return null;
  } catch (error) {
    console.error("Erro ao buscar workspace:", error);
    return null;
  }
};

/**
 * Permite que um usuário entre em um workspace usando um token de convite.
 */
/**
 * Cria um novo workspace e adiciona o usuário como admin.
 */
export const createWorkspace = async (
  name: string,
  ownerUid: string,
  ownerEmail: string,
): Promise<string> => {
  const workspaceId = crypto.randomUUID();
  const now = DateTime.now().toISO();

  const workspaceData = {
    name,
    ownerId: ownerUid,
    ownerEmail,
    members: [ownerUid],
    createdAt: now,
    updatedAt: now,
    plan: "free",
    roleLabels: {
      Diretor: "Diretor",
      Docente: "Docente",
    },
  };

  await setDoc(doc(db, "workspaces", workspaceId), workspaceData);
  return workspaceId;
};

export const joinWorkspaceByToken = async (
  token: string,
  userUid: string,
  userEmail: string,
  defaultRole: Role = 'Estagiário'
): Promise<{ success: boolean; workspaceName?: string }> => {
  try {
    // Try by inviteToken first
    const q = query(
      collection(db, "workspaces"),
      where("inviteToken", "==", token)
    );
    let snap = await getDocs(q);

    // If not found, try by workspace document ID
    if (snap.empty) {
      const docRef = doc(db, "workspaces", token);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // Create a fake snapshot structure
        snap = {
          empty: false,
          docs: [{
            id: docSnap.id,
            data: () => docSnap.data(),
          } as unknown as typeof snap.docs[0]],
          size: 1,
        } as typeof snap;
      }
    }

    if (snap.empty) {
      toast.error("Link de convite inválido ou expirado.");
      return { success: false };
    }

    const wsDoc = snap.docs[0];
    const wsData = wsDoc.data() as Workspace;

    if (wsData.members?.includes(userUid)) {
      toast.info("Você já é membro deste workspace.");
      return { success: true, workspaceName: wsData.name };
    }

    const batch = writeBatch(db);
    const wsRef = doc(db, "workspaces", wsDoc.id);
    const userRef = doc(db, "users", userUid);

    batch.update(wsRef, { 
      members: arrayUnion(userUid), 
      updatedAt: DateTime.now().toISO() 
    });
    
    batch.update(userRef, {
      workspaceId: wsDoc.id,
      workspaces: arrayUnion(wsDoc.id),
      role: defaultRole,
      canViewAdmin: false,
      canViewReports: false,
      canViewActivityHistory: false,
      canRevert: false,
    });

    await batch.commit();

    logActivity({
      userId: userUid,
      userName: userEmail?.split("@")[0] || "Usuário",
      action: "Entrou",
      workspaceId: wsDoc.id,
      projectName: wsData.name,
    });

    toast.success(`Bem-vindo ao ${wsData.name}!`);
    return { success: true, workspaceName: wsData.name };
  } catch (error) {
    console.error("Erro ao entrar no workspace:", error);
    toast.error("Erro ao processar convite.");
    return { success: false };
  }
};