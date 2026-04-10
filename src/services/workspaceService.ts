"use client";

import { 
  collection, doc, getDoc, getDocs, 
  query, where, arrayUnion, writeBatch 
} from "firebase/firestore";
import { dbZecki } from "@/lib/firebase";
import { Workspace, WorkspaceSchema, Role } from "@/services/schemas";
import { DateTime } from "luxon";
import { toast } from "sonner";

/**
 * Busca os dados de um workspace específico.
 */
export const getWorkspace = async (workspaceId: string): Promise<Workspace | null> => {
  try {
    const docRef = doc(dbZecki, "workspaces", workspaceId);
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
export const joinWorkspaceByToken = async (
  token: string,
  userUid: string,
  userEmail: string,
  defaultRole: Role = 'Docente'
): Promise<{ success: boolean; workspaceName?: string }> => {
  try {
    const q = query(
      collection(dbZecki, "workspaces"),
      where("inviteToken", "==", token)
    );
    const snap = await getDocs(q);

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

    const batch = writeBatch(dbZecki);
    const wsRef = doc(dbZecki, "workspaces", wsDoc.id);
    const userRef = doc(dbZecki, "users", userUid);

    batch.update(wsRef, { 
      members: arrayUnion(userUid), 
      updatedAt: DateTime.now().toISO() 
    });
    
    batch.update(userRef, {
      workspaceId: wsDoc.id,
      workspaces: arrayUnion(wsDoc.id),
      role: defaultRole
    });

    await batch.commit();

    toast.success(`Bem-vindo ao ${wsData.name}!`);
    return { success: true, workspaceName: wsData.name };
  } catch (error) {
    console.error("Erro ao entrar no workspace:", error);
    toast.error("Erro ao processar convite.");
    return { success: false };
  }
};
