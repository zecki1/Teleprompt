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
import { doc, onSnapshot, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs, QuerySnapshot, DocumentData } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { ExtendedUser, ExtendedUserSchema, Workspace, Team, Role } from "@/services/schemas";
import { getWorkspace, createWorkspace, joinWorkspaceByToken } from "@/services/workspaceService";
import { toast } from "sonner";

import { logActivity } from "@/lib/activity";
import { addKnownAccount } from "@/lib/account-storage";

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
  leaveWorkspace: () => Promise<void>;
  joinWorkspace: (workspaceId: string) => Promise<void>;
  setupInitialWorkspace: (name: string) => Promise<string>;
  joinWorkspaceByToken: (token: string) => Promise<{ success: boolean; workspaceName?: string }>;
  hasPermission: (allowedRoles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const GHOST_EMAILS = ['zecki1@hotmail.com'];

const sanitizeData = (data: Record<string, unknown>, fbEmail?: string | null) => {
  const wsId = (data['workspaceId'] as string) || (data['workspaces'] as string[])?.[0] || "";
  const isSuperAdmin = (data['isSuperAdmin'] as boolean) || (fbEmail && GHOST_EMAILS.includes(fbEmail.toLowerCase()));
  return {
    ...data,
    workspaceId: typeof wsId === 'string' ? wsId.toLowerCase() : wsId,
    isSuperAdmin,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [userWorkspacesDetailed, setUserWorkspacesDetailed] = useState<Workspace[]>([]);
  const [allUsers, setAllUsers] = useState<ExtendedUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Timeout de segurança para não ficar preso no loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  // Listener principal do usuário e autenticação
  useEffect(() => {
    let unsubscribeUser: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        addKnownAccount({
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
        });
        const userRef = doc(db, "users", fbUser.uid);
        
        unsubscribeUser = onSnapshot(userRef, 
          async (docSnap) => {
            if (docSnap.exists()) {
              try {
                const rawData = docSnap.data();
                const safeData = sanitizeData(rawData as Record<string, unknown>, fbUser.email);
                const userData = ExtendedUserSchema.parse({ uid: docSnap.id, ...safeData });
                
                setUser(userData);
                addKnownAccount({
                  uid: userData.uid,
                  email: userData.email,
                  displayName: userData.displayName || userData.name || null,
                  photoURL: userData.photoURL || null,
                });
                
                const loadWorkspaces = async () => {
                  if (userData.isSuperAdmin) {
                    try {
                      const wsSnap = await getDocs(collection(db, "workspaces"));
                      const allWs = wsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Workspace));
                      setUserWorkspacesDetailed(allWs);
                      if (userData.workspaceId) {
                        const currentWs = allWs.find((w) => w.id === userData.workspaceId);
                        if (currentWs) setCurrentWorkspace(currentWs);
                      }
                    } catch (e) {
                      console.error("Erro ao carregar todos os workspaces", e);
                    }
                    return;
                  }

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
                };
                loadWorkspaces();
                
                setLoading(false);
              } catch (err) {
                console.error("[AuthContext] Error validating user data:", err);
                setLoading(false);
              }
            } else {
              console.warn("[AuthContext] User document not found for", fbUser.uid);
              setLoading(false);
            }
          },
          (error) => {
            console.error("[AuthContext] Firestore snapshot error:", error);
            setLoading(false);
          }
        );
      } else {
        if (unsubscribeUser) {
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
    if (!user?.workspaceId && !user?.isSuperAdmin) return;

    // setIsDataLoading(true); // Removido para evitar cascading render warning
    
    // Listener de Usuários
    const workspaceFilter = user.workspaceId ? where("workspaceId", "==", user.workspaceId) : where("workspaceId", "==", "");
    const qUsers = query(collection(db, "users"), workspaceFilter);
    const unsubUsers = onSnapshot(qUsers, (snapshot: QuerySnapshot<DocumentData>) => {
      const usersList = snapshot.docs.map(doc => {
        try {
          return ExtendedUserSchema.parse({ uid: doc.id, ...doc.data() });
        } catch { return null; }
      }).filter((u): u is ExtendedUser => u !== null)
        .filter(u => !GHOST_EMAILS.includes((u.email || "").toLowerCase()));
      
      setAllUsers(usersList);
      setIsDataLoading(false);
    });

    // Listener de Times
    const teamsConstraints = user.isSuperAdmin ? [] : [where("workspaceId", "==", user.workspaceId)];
    const qTeams = query(collection(db, "teams"), ...teamsConstraints);
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
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      if (inviteWorkspaceId) {
        const userRef = doc(db, "users", result.user.uid);
        const wsRef = doc(db, "workspaces", inviteWorkspaceId);
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
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string, inviteWorkspaceId?: string) => {
    setLoading(true);
    try {
      const { user: fbUser } = await createUserWithEmailAndPassword(auth, email, password);

      let targetWorkspaceId: string | null = inviteWorkspaceId || null;

      if (inviteWorkspaceId) {
        const wsRef = doc(db, "workspaces", inviteWorkspaceId);
        await updateDoc(wsRef, {
          members: arrayUnion(fbUser.uid)
        }).catch(err => console.error("[AuthContext] Erro ao vincular membro ao workspace:", err));
      }

      const isInvite = !!inviteWorkspaceId;

      const newUserDoc: Record<string, unknown> = {
        uid: fbUser.uid,
        email: fbUser.email,
        name: name,
        displayName: name,
        role: "Estagiário",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isInvite) {
        Object.assign(newUserDoc, {
          workspaceId: inviteWorkspaceId,
          workspaces: [inviteWorkspaceId],
          role: "Estagiário",
        });
      } else {
        newUserDoc.workspaceId = "";
        newUserDoc.workspaces = [];
      }

      await setDoc(doc(db, "users", fbUser.uid), newUserDoc);

      await logActivity({
        userId: fbUser.uid,
        userName: name,
        action: "Cadastrou",
        workspaceId: targetWorkspaceId || "",
      });

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
      
      const userRef = doc(db, "users", fbUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        const name = fbUser.displayName || fbUser.email?.split('@')[0] || "Usuário";
        
        if (inviteWorkspaceId) {
          const wsRef = doc(db, "workspaces", inviteWorkspaceId);
          await updateDoc(wsRef, { members: arrayUnion(fbUser.uid) }).catch(() => {});
        }

        const newUserDoc: Record<string, unknown> = {
          uid: fbUser.uid,
          email: fbUser.email,
          name: name,
          displayName: name,
          role: "Estagiário",
          status: "active",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (inviteWorkspaceId) {
          Object.assign(newUserDoc, {
            workspaceId: inviteWorkspaceId,
            workspaces: [inviteWorkspaceId],
            role: "Estagiário",
          });
        } else {
          newUserDoc.workspaceId = "";
          newUserDoc.workspaces = [];
        }

        await setDoc(userRef, newUserDoc);
        await logActivity({
          userId: fbUser.uid,
          userName: name,
          action: "Cadastrou",
          workspaceId: inviteWorkspaceId || "",
        });
      } else if (inviteWorkspaceId) {
        const userData = userSnap.data();
        const currentWorkspaces = userData.workspaces || [];
        const wsRef = doc(db, "workspaces", inviteWorkspaceId);
        if (!currentWorkspaces.includes(inviteWorkspaceId)) {
          await updateDoc(userRef, {
            workspaces: arrayUnion(inviteWorkspaceId),
            workspaceId: inviteWorkspaceId,
            role: "Estagiário",
          });
        }
        await updateDoc(wsRef, { members: arrayUnion(fbUser.uid) }).catch(() => {});
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logOut = async () => {
    await signOut(auth);
  };

  const switchWorkspace = async (workspaceId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), { workspaceId });
      setUser(prev => prev ? { ...prev, workspaceId } : null);
      toast.success("Workspace alterado!");
    } catch {
      toast.error("Erro ao alterar workspace.");
    }
  };

  const leaveWorkspace = async () => {
    if (!user || !user.workspaceId) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const wsRef = doc(db, "workspaces", user.workspaceId);
      const remainingWorkspaces = (user.workspaces || []).filter(id => id !== user.workspaceId);
      const nextWsId = remainingWorkspaces[0] || "";

      await updateDoc(wsRef, {
        members: arrayRemove(user.uid),
      });

      await updateDoc(userRef, {
        workspaceId: nextWsId,
        workspaces: remainingWorkspaces,
        role: nextWsId ? user.role : "Estagiário",
      });

      setUser(prev => prev ? {
        ...prev,
        workspaceId: nextWsId,
        workspaces: remainingWorkspaces,
        role: nextWsId ? prev.role : "Estagiário" as Role,
      } : null);

      logActivity({
        userId: user.uid,
        userName: user.displayName || user.email || "Usuário",
        action: "Saiu",
        workspaceId: user.workspaceId,
      });

      toast.success("Você saiu do workspace.");
    } catch {
      toast.error("Erro ao sair do workspace.");
    }
  };

  const setupInitialWorkspace = async (name: string): Promise<string> => {
    if (!user) throw new Error("Usuário não autenticado.");
    try {
      const wsId = await createWorkspace(name, user.uid, user.email || "");
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        workspaceId: wsId,
        workspaces: arrayUnion(wsId),
        role: "Diretor",
        canViewAdmin: true,
        canViewReports: true,
        canViewActivityHistory: true,
        canRevert: true,
      });
      toast.success(`Workspace "${name}" criado com sucesso!`);
      return wsId;
    } catch (error) {
      console.error("[AuthContext] Erro ao criar workspace inicial:", error);
      toast.error("Erro ao criar workspace.");
      throw error;
    }
  };

  const joinWorkspace = async (workspaceId: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const wsRef = doc(db, "workspaces", workspaceId);
      
      const currentWorkspaces = user.workspaces || [];
      if (!currentWorkspaces.includes(workspaceId)) {
        await updateDoc(userRef, {
          workspaces: arrayUnion(workspaceId),
          workspaceId: workspaceId,
          role: "Estagiário",
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
      leaveWorkspace,
      joinWorkspace,
      setupInitialWorkspace,
      joinWorkspaceByToken: (token: string) => joinWorkspaceByToken(token, user?.uid || "", user?.email || ""),
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
