"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ExtendedUser, Workspace, Role, UserStatus } from "@/services/schemas";
import { toast } from "sonner";

import { clearStoredToken, getStoredToken, setStoredToken, useFirebase } from "@/api/client";
import { login as apiLogin, register as apiRegister, me as apiMe, logout as apiLogout } from "@/api/auth";
import { listMyWorkspaces, createWorkspace as apiCreateWorkspace, joinWorkspaceByToken as apiJoinWorkspace } from "@/api/workspace";
import { listTeams } from "@/api/teams";
import { listUsers } from "@/api/users";
import type { UserDto } from "@/api/types";

import { addKnownAccount } from "@/lib/account-storage";
import { setDebugUserContext } from "@/lib/debug-log";

interface AuthContextType {
  user: ExtendedUser | null;
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

// Tipos locais para os dados que chegam da API (Teams vêm como entidade pura).
type Team = {
  id: string;
  name: string;
  acronym?: string;
  members: string[];
  workspaceId?: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const toRole = (role: string): Role => {
  const known: Role[] = [
    "SuperAdmin", "Diretor", "Coordenador", "Orientador", "Docente",
    "Especialista", "Assistente", "Analista", "Tutor", "Monitor",
    "Técnico", "Estagiário", "editor", "validador", "publico",
  ];
  const match = known.find((r) => r.toLowerCase() === role.toLowerCase());
  return match ?? "Estagiário";
};

const toStatus = (status: string): UserStatus =>
  status.toLowerCase() === "active" ? "active" : status.toLowerCase() === "inactive" ? "inactive" : "pending";

function dtoToExtendedUser(dto: UserDto): ExtendedUser {
  return {
    uid: dto.id,
    email: dto.email,
    displayName: dto.displayName,
    name: dto.displayName,
    role: toRole(dto.role),
    isSuperAdmin: dto.isSuperAdmin,
    canCollaborate: dto.canCollaborate,
    isEditor: dto.isEditor,
    isRevisor: dto.isRevisor,
    canRevert: dto.canRevert,
    canViewAdmin: dto.canViewAdmin,
    canViewReports: dto.canViewReports,
    canViewActivityHistory: dto.canViewActivityHistory,
    canViewDebugLogs: dto.canViewDebugLogs,
    canAssign: dto.canAssign,
    requiresChecklist: dto.requiresChecklist,
    status: toStatus(dto.status),
    workspaceId: dto.workspaceId,
    workspaces: dto.workspaceId ? [dto.workspaceId] : [],
    avatarUrl: "",
    photoURL: null,
  };
}

const workspaceToDto = (w: { id: string; name: string; ownerId: string; plan: string; createdAt: string }): Workspace => ({
  id: w.id,
  name: w.name,
  ownerId: w.ownerId,
  plan: (w.plan.toLowerCase() as Workspace["plan"]) || "free",
  createdAt: w.createdAt,
  updatedAt: w.createdAt,
  members: [],
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [userWorkspacesDetailed, setUserWorkspacesDetailed] = useState<Workspace[]>([]);
  const [allUsers, setAllUsers] = useState<ExtendedUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Hydrata a sessão a partir do token armazenado / Firebase Auth state.
  useEffect(() => {
    let cancelled = false;

    if (useFirebase) {
      let unsub: (() => void) | undefined;
      (async () => {
        const { getFirebaseAuth } = await import("@/lib/firebase");
        const { onAuthStateChanged } = await import("firebase/auth");
        const auth = getFirebaseAuth();
        unsub = onAuthStateChanged(auth, async (fbUser) => {
          if (cancelled) return;
          if (!fbUser) {
            clearStoredToken();
            setUser(null);
            setLoading(false);
            return;
          }
          try {
            const dto = await apiMe();
            if (cancelled) return;
            const u = dtoToExtendedUser(dto);
            setUser(u);
            setDebugUserContext(buildDebugContext(u));
            addKnownAccount({
              uid: u.uid,
              email: u.email,
              displayName: u.displayName || u.name || null,
              photoURL: u.photoURL || null,
            });
          } catch {
            clearStoredToken();
          } finally {
            if (!cancelled) setLoading(false);
          }
        });
      })();
      return () => {
        cancelled = true;
        unsub?.();
      };
    }

    const hydrate = async () => {
      if (!getStoredToken()) {
        setLoading(false);
        return;
      }
      try {
        const dto = await apiMe();
        if (cancelled) return;
        const u = dtoToExtendedUser(dto);
        setUser(u);
        setDebugUserContext(buildDebugContext(u));
        addKnownAccount({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || u.name || null,
          photoURL: u.photoURL || null,
        });
      } catch {
        clearStoredToken();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  // Carrega workspaces do usuário quando ele muda.
  useEffect(() => {
    if (!user?.uid) {
      setUserWorkspacesDetailed([]);
      setCurrentWorkspace(null);
      return;
    }

    const workspaceId = user.workspaceId;
    const isSuperAdmin = user.isSuperAdmin;

    let cancelled = false;
    const loadWorkspaces = async () => {
      try {
        const wsList = await listMyWorkspaces();
        if (cancelled) return;
        const mapped = wsList.map(workspaceToDto);
        setUserWorkspacesDetailed(mapped);
        const current = workspaceId
          ? mapped.find((w) => w.id === workspaceId) ?? null
          : mapped[0] ?? null;
        setCurrentWorkspace(current);
      } catch (e) {
        console.error("Erro ao carregar workspaces", e);
      }
    };
    void loadWorkspaces();

    // Usuários (para exibição de nomes/permissões) e times do workspace.
    const loadMembers = async () => {
      setIsDataLoading(true);
      try {
        const users = await listUsers();
        if (cancelled) return;
        const filtered = isSuperAdmin
          ? users
          : users.filter((u) => u.workspaceId === workspaceId);
        setAllUsers(filtered.map(dtoToExtendedUser));
      } catch {
        setAllUsers([]);
      } finally {
        if (!cancelled) setIsDataLoading(false);
      }

      try {
        const teamsData = await listTeams(workspaceId || undefined);
        if (cancelled) return;
        setTeams(teamsData.map((t) => ({
          id: t.id,
          name: t.name,
          acronym: t.acronym ?? undefined,
          members: [],
          workspaceId: t.workspaceId,
        })));
      } catch {
        setTeams([]);
      }
    };
    void loadMembers();

    return () => {
      cancelled = true;
    };
  }, [user?.uid, user?.workspaceId, user?.isSuperAdmin]);

  const buildDebugContext = (u: ExtendedUser) => ({
    uid: u.uid,
    email: u.email || undefined,
    name: u.displayName || u.name || undefined,
    role: u.role,
    workspaceId: u.workspaceId || undefined,
    isSuperAdmin: u.isSuperAdmin,
    permissions: [
      ...(u.canCollaborate ? ["collaborate"] : []),
      ...(u.isEditor ? ["editor"] : []),
      ...(u.isRevisor ? ["revisor"] : []),
      ...(u.canRevert ? ["revert"] : []),
      ...(u.canAssign ? ["assign"] : []),
      ...(u.canViewAdmin ? ["admin"] : []),
      ...(u.canViewReports ? ["reports"] : []),
      ...(u.canViewActivityHistory ? ["history"] : []),
      ...(u.canViewDebugLogs ? ["debuglogs"] : []),
      ...(u.isSuperAdmin ? ["superadmin"] : []),
    ],
  });

  const applySession = (dto: UserDto, token: string) => {
    setStoredToken(token);
    const u = dtoToExtendedUser(dto);
    setUser(u);
    setDebugUserContext(buildDebugContext(u));
    addKnownAccount({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName || u.name || null,
      photoURL: u.photoURL || null,
    });
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await apiLogin({ email, password });
      applySession(res.user, res.token);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const res = await apiRegister({ email, password, displayName: name });
      applySession(res.user, res.token);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    // Google OAuth ainda não habilitado no backend .NET (JWT sem Google).
    throw new Error("Login com Google será habilitado em breve.");
  };

  const logOut = async () => {
    try {
      await apiLogout();
    } catch {
      // stateless: segue mesmo se a API falhar.
    }
    clearStoredToken();
    setUser(null);
    setCurrentWorkspace(null);
    setUserWorkspacesDetailed([]);
    setAllUsers([]);
    setTeams([]);
    setDebugUserContext(null);
  };

  const switchWorkspace = async (workspaceId: string) => {
    if (!user) return;
    setUser((prev) => (prev ? { ...prev, workspaceId } : prev));
    const ws = userWorkspacesDetailed.find((w) => w.id === workspaceId);
    if (ws) setCurrentWorkspace(ws);
    toast.success("Workspace alterado!");
  };

  const leaveWorkspace = async () => {
    if (!user || !user.workspaceId) return;
    const remaining = userWorkspacesDetailed.filter((w) => w.id !== user.workspaceId);
    const nextWsId = remaining[0]?.id ?? "";
    setUser((prev) =>
      prev ? { ...prev, workspaceId: nextWsId, workspaces: remaining.map((w) => w.id) } : prev,
    );
    setCurrentWorkspace(remaining[0] ?? null);
    setUserWorkspacesDetailed(remaining);
    toast.success("Você saiu do workspace.");
  };

  const joinWorkspace = async (workspaceId: string) => {
    if (!user) return;
    try {
      const result = await apiJoinWorkspace(workspaceId);
      if (result.success) {
        const dto = await apiMe();
        setUser(dtoToExtendedUser(dto));
        toast.success("Bem-vindo ao novo workspace!");
      } else {
        toast.error("Não foi possível entrar no workspace.");
      }
    } catch (error) {
      console.error("[AuthContext] Erro ao entrar no workspace:", error);
      toast.error("Erro ao entrar no workspace.");
    }
  };

  const setupInitialWorkspace = async (name: string): Promise<string> => {
    if (!user) throw new Error("Usuário não autenticado.");
    try {
      const ws = await apiCreateWorkspace({ name });
      setUser((prev) =>
        prev
          ? {
              ...prev,
              workspaceId: ws.id,
              workspaces: [...(prev.workspaces || []), ws.id],
              role: "Diretor" as Role,
              canCollaborate: true,
              canViewAdmin: true,
              canViewReports: true,
              canViewActivityHistory: true,
              canRevert: true,
            }
          : prev,
      );
      toast.success(`Workspace "${name}" criado com sucesso!`);
      return ws.id;
    } catch (error) {
      console.error("[AuthContext] Erro ao criar workspace inicial:", error);
      toast.error("Erro ao criar workspace.");
      throw error;
    }
  };

  const joinWorkspaceByToken = async (token: string) => {
    const { joinWorkspaceByToken: join } = await import("@/api/workspace");
    const result = await join(token);
    if (result.success) {
      // Atualiza a sessão para refletir o novo workspace.
      try {
        const dto = await apiMe();
        setUser(dtoToExtendedUser(dto));
      } catch {
        // mantém estado atual
      }
    }
    return result;
  };

  const hasPermission = (allowedRoles: Role[]): boolean => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;
    return allowedRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
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
        joinWorkspaceByToken,
        hasPermission,
      }}
    >
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
