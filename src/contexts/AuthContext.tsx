"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User as FirebaseUser, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { doc, onSnapshot, getDoc, setDoc, updateDoc, arrayUnion, collection, query, where, QuerySnapshot, DocumentData } from "firebase/firestore";
import { auth, dbZecki, googleProvider } from "@/lib/firebase";
import { ExtendedUser, ExtendedUserSchema, Workspace, Team, Role } from "@/services/schemas";
import { getWorkspace } from "@/services/workspaceService";
import { toast } from "sonner";

import { SENAI_WORKSPACE_ID } from "@/lib/constants";

interface AuthContextType {
  user: ExtendedUser | null;
  firebaseUser: FirebaseUser | null;
  currentWorkspace: Workspace | null;
  userWorkspacesDetailed: Workspace[];
  allUsers: ExtendedUser[];
  teams: Team[];
  loading: boolean;
  isDataLoading: boolean;
  signIn: (email: string, password: string, inviteWorkspaceId?: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, inviteWorkspaceId?: string) => Promise<void>;
  signInWithGoogle: (inviteWorkspaceId?: string) => Promise<void>;
  logOut: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  joinWorkspace: (workspaceId: string) => Promise<void>;
  hasPermission: (allowedRoles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const sanitizeData = (data: Record<string, unknown>) => {
  const wsId = (data['workspaceId'] as string) || (data['workspaces'] as string[])?.[0] || SENAI_WORKSPACE_ID;
  return {
    ...data,
    workspaceId: typeof wsId === 'string' ? wsId.toLowerCase() : wsId
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log("[AuthContext] AuthProvider mounting...");
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [userWorkspacesDetailed, setUserWorkspacesDetailed] = useState<Workspace[]>([]);
  const [allUsers, setAllUsers] = useState<ExtendedUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Listener principal do usuário e autenticação
  useEffect(() => {
    let unsubscribeUser: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const userRef = doc(dbZecki, "users", fbUser.uid);
        
        unsubscribeUser = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            try {
              const rawData = docSnap.data();
              console.log("[AuthContext] Firestore user data:", rawData);
              const safeData = sanitizeData(rawData as Record<string, unknown>);
              const userData = ExtendedUserSchema.parse({ uid: docSnap.id, ...safeData });
              
              console.log("[AuthContext] Parsed user data:", userData);
              setUser(userData);
              
              if (userData.workspaces && userData.workspaces.length > 0) {
                try {
                  const wsPromises = userData.workspaces.map(id => getWorkspace(id));
                  const wsResults = await Promise.all(wsPromises);
                  const validWs = wsResults.filter((ws): ws is Workspace => ws !== null);
                  setUserWorkspacesDetailed(validWs);
                  
                  if (userData.workspaceId) {
                    const currentWs = validWs.find((w) => w.id === userData.workspaceId);
                    if (currentWs) {
                      setCurrentWorkspace(currentWs);
                    } else {
                      const fallbackWs = await getWorkspace(userData.workspaceId);
                      setCurrentWorkspace(fallbackWs);
                      if (fallbackWs) setUserWorkspacesDetailed(prev => [...prev, fallbackWs]);
                    }
                  }
                } catch (wsErr) {
                  console.error("Erro ao carregar detalhes dos workspaces", wsErr);
                  if (userData.workspaceId) {
                    const ws = await getWorkspace(userData.workspaceId);
                    setCurrentWorkspace(ws);
                    if (ws) setUserWorkspacesDetailed([ws]);
                  }
                }
              } else if (userData.workspaceId) {
                const ws = await getWorkspace(userData.workspaceId);
                setCurrentWorkspace(ws);
                if (ws) setUserWorkspacesDetailed([ws]);
              }
              
              setLoading(false);
            } catch (err) {
              console.error("[AuthContext] Error validating user data:", err);
              setLoading(false);
            }
          } else {
            setLoading(false);
          }
        });
      } else {
        console.log("[AuthContext] No firebase user, cleaning up...");
        if (unsubscribeUser) {
          console.log("[AuthContext] Unsubscribing from user document");
          unsubscribeUser();
        }
        setFirebaseUser(null);
        setUser(null);
        setCurrentWorkspace(null);
        setUserWorkspacesDetailed([]);
        setAllUsers([]);
        setTeams([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
    };
  }, []);

  // Listeners de dados do Workspace (Usuários e Times)
  useEffect(() => {
    if (!user?.workspaceId) return;

    // setIsDataLoading(true); // Removido para evitar cascading render warning
    
    // Listener de Usuários
    const qUsers = query(collection(dbZecki, "users"), where("workspaceId", "==", user.workspaceId));
    const unsubUsers = onSnapshot(qUsers, (snapshot: QuerySnapshot<DocumentData>) => {
      const usersList = snapshot.docs.map(doc => {
        try {
          return ExtendedUserSchema.parse({ uid: doc.id, ...doc.data() });
        } catch { return null; }
      }).filter((u): u is ExtendedUser => u !== null);
      
      setAllUsers(usersList);
      setIsDataLoading(false);
    });

    // Listener de Times
    const qTeams = query(collection(dbZecki, "teams"), where("workspaceId", "==", user.workspaceId));
    const unsubTeams = onSnapshot(qTeams, (snapshot: QuerySnapshot<DocumentData>) => {
      const teamsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      setTeams(teamsList);
    });

    return () => {
      unsubUsers();
      unsubTeams();
    };
  }, [user?.workspaceId]);

  const signIn = async (email: string, password: string, inviteWorkspaceId?: string) => {
    console.log("[AuthContext] Attempting signIn with:", email);
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("[AuthContext] signIn success:", result.user.uid);
      
      if (inviteWorkspaceId) {
        const userRef = doc(dbZecki, "users", result.user.uid);
        const wsRef = doc(dbZecki, "workspaces", inviteWorkspaceId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const currentWorkspaces = userData.workspaces || [];
          if (!currentWorkspaces.includes(inviteWorkspaceId)) {
            // Adiciona o workspace ao usuário
            await updateDoc(userRef, {
              workspaces: arrayUnion(inviteWorkspaceId),
              workspaceId: inviteWorkspaceId
            });
            // Adiciona o usuário como membro do workspace (necessário para as Firestore Rules)
            await updateDoc(wsRef, {
              members: arrayUnion(result.user.uid)
            });
          } else {
            // Já é membro, mas garante que está na lista de members do workspace
            await updateDoc(wsRef, {
              members: arrayUnion(result.user.uid)
            });
          }
        }
      }
    } catch (error) {
      console.error("[AuthContext] signIn error:", error);
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, inviteWorkspaceId?: string) => {
    setLoading(true);
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      const defaultWorkspace = inviteWorkspaceId || "senai";
      const workspaces = [defaultWorkspace];
      
      const newUserDoc = {
        uid: fbUser.uid,
        email: fbUser.email,
        name: name,
        displayName: name,
        role: "Docente",
        status: "active",
        workspaceId: defaultWorkspace,
        workspaces: workspaces,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(dbZecki, "users", fbUser.uid), newUserDoc);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithGoogle = async (inviteWorkspaceId?: string) => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      const userRef = doc(dbZecki, "users", fbUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const name = fbUser.displayName || fbUser.email?.split('@')[0] || "Usuário";
        const defaultWorkspace = inviteWorkspaceId || "senai";
        await setDoc(userRef, {
          uid: fbUser.uid,
          email: fbUser.email,
          name: name,
          displayName: name,
          role: "Docente",
          status: "active",
          workspaceId: defaultWorkspace,
          workspaces: [defaultWorkspace],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        // Adiciona o usuário como membro do workspace no Zecki
        if (inviteWorkspaceId) {
          const wsRef = doc(dbZecki, "workspaces", inviteWorkspaceId);
          await updateDoc(wsRef, { members: arrayUnion(fbUser.uid) }).catch(() => {});
        }
      } else if (inviteWorkspaceId) {
        // Se já existe mas veio por link de convite, adicionamos o workspace
        const userData = userSnap.data();
        const currentWorkspaces = userData.workspaces || [];
        const wsRef = doc(dbZecki, "workspaces", inviteWorkspaceId);
        if (!currentWorkspaces.includes(inviteWorkspaceId)) {
          await updateDoc(userRef, {
            workspaces: arrayUnion(inviteWorkspaceId),
            workspaceId: inviteWorkspaceId
          });
        }
        // Sempre garantir que o usuário está na lista members do workspace
        await updateDoc(wsRef, { members: arrayUnion(fbUser.uid) }).catch(() => {});
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logOut = async () => {
    console.log("[AuthContext] logOut sequence initiated");
    await signOut(auth);
  };

  const switchWorkspace = async (workspaceId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(dbZecki, "users", user.uid), { workspaceId });
      toast.success("Workspace alterado!");
    } catch {
      toast.error("Erro ao alterar workspace.");
    }
  };

  const joinWorkspace = async (workspaceId: string) => {
    if (!user) return;
    try {
      const userRef = doc(dbZecki, "users", user.uid);
      const wsRef = doc(dbZecki, "workspaces", workspaceId);
      
      const currentWorkspaces = user.workspaces || [];
      if (!currentWorkspaces.includes(workspaceId)) {
        await updateDoc(userRef, {
          workspaces: arrayUnion(workspaceId),
          workspaceId: workspaceId
        });
        await updateDoc(wsRef, {
          members: arrayUnion(user.uid)
        });
        toast.success("Bem-vindo ao novo workspace!");
      }
    } catch (error) {
      console.error("[AuthContext] Erro ao entrar no workspace:", error);
      toast.error("Erro ao entrar no workspace.");
    }
  };

  const hasPermission = (allowedRoles: Role[]): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      firebaseUser,
      currentWorkspace,
      userWorkspacesDetailed,
      allUsers,
      teams,
      loading, 
      isDataLoading,
      signIn, 
      signUp,
      signInWithGoogle, 
      logOut,
      switchWorkspace,
      joinWorkspace,
      hasPermission 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
