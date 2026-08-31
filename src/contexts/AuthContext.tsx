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
import { isDemoWorkspaceName } from "@/services/demo";
import { isPublicDemoMode, getDemoUsers, getDemoWorkspace, clearDemoCache } from "@/services/demo-data";

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
  demoView: DemoView;
  setDemoView: (view: DemoView) => void;
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

/**
 * Visualização de demonstração: simula (apenas na UI) os papéis
 * "Admin" e "Técnico" para quem quer ver como ficam as duas telas,
 * sem alterar as permissões reais do usuário no backend.
 */
export type DemoView = "admin" | "tecnico" | null;

const DEMO_VIEW_KEY = "tp_demo_view";

// Cookie lido pelo middleware (Next) para liberar rotas protegidas no demo público.
const DEMO_COOKIE = "tp_demo";

function writeDemoCookie(view: DemoView) {
  try {
    if (view) document.cookie = `${DEMO_COOKIE}=${view}; path=/; max-age=86400; SameSite=Lax`;
    else document.cookie = `${DEMO_COOKIE}=; path=/; max-age=0`;
  } catch {
    // ignore
  }
}

/** Sobrescritas de permissões para cada visualização demo. */
const DEMO_OVERRIDES: Record<Exclude<DemoView, null>, Partial<ExtendedUser>> = {
  admin: {
    role: "SuperAdmin" as Role,
    isSuperAdmin: true,
    canCollaborate: true,
    isEditor: true,
    isRevisor: true,
    canRevert: true,
    canViewAdmin: true,
    canViewReports: true,
    canViewActivityHistory: true,
    canViewDebugLogs: true,
    canAssign: true,
    requiresChecklist: false,
  },
  tecnico: {
    role: "Técnico" as Role,
    isSuperAdmin: false,
    canCollaborate: true,
    isEditor: true,
    isRevisor: false,
    canRevert: false,
    canViewAdmin: false,
    canViewReports: false,
    canViewActivityHistory: false,
    canViewDebugLogs: false,
    canAssign: false,
    requiresChecklist: true,
  },
};

/** Usuário sintético para o preview demo sem conta (não toca o backend). */
function demoUser(view: Exclude<DemoView, null>): ExtendedUser {
  const isAdmin = view === "admin";
  return {
    uid: `demo-${view}`,
    email: "demo@teleprompt.app",
    displayName: isAdmin ? "Demo — Admin" : "Demo — Técnico",
    name: isAdmin ? "Demo — Admin" : "Demo — Técnico",
    role: (isAdmin ? "SuperAdmin" : "Técnico") as Role,
    isSuperAdmin: false,
    canCollaborate: false,
    isEditor: false,
    isRevisor: false,
    canRevert: false,
    canViewAdmin: false,
    canViewReports: false,
    canViewActivityHistory: false,
    canViewDebugLogs: false,
    canAssign: false,
    status: "active",
    requiresChecklist: true,
    avatarUrl: "",
    photoURL: null,
    workspaces: [],
  };
}

/** Aplica a visão demo (não muta nada no backend). */
function computeEffectiveUser(user: ExtendedUser | null, view: DemoView): ExtendedUser | null {
  if (view === "admin" || view === "tecnico") {
    const base = user ?? demoUser(view);
    return { ...base, ...DEMO_OVERRIDES[view] };
  }
  return user;
}

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
  const [realUser, setRealUser] = useState<ExtendedUser | null>(null);
  const [demoView, setDemoViewState] = useState<DemoView>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = window.localStorage.getItem(DEMO_VIEW_KEY);
      return stored === "admin" || stored === "tecnico" ? stored : null;
    } catch {
      return null;
    }
  });
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
            setRealUser(null);
            setLoading(false);
            return;
          }
          try {
            const dto = await apiMe();
            if (cancelled) return;
            const u = dtoToExtendedUser(dto);
            setRealUser(u);
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
        setRealUser(u);
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

  // Carrega workspaces do usuário quando ele muda (usa o usuário REAL,
  // não a visualização demo: dados sempre seguem as permissões reais).
  useEffect(() => {
    if (!realUser?.uid) {
      setUserWorkspacesDetailed([]);
      setCurrentWorkspace(null);
      return;
    }

    const workspaceId = realUser.workspaceId;
    const isSuperAdmin = realUser.isSuperAdmin;

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
  }, [realUser?.uid, realUser?.workspaceId, realUser?.isSuperAdmin]);

  // Registra se o último workspace usado era de demonstração (para o login
  // ocultar os botões "Ver como Admin/Técnico" quando o workspace não é demo).
  useEffect(() => {
    try {
      const isDemo = isDemoWorkspaceName(currentWorkspace?.name);
      window.localStorage.setItem("tp_last_workspace_is_demo", isDemo ? "1" : "0");
    } catch {
      // ignore
    }
  }, [currentWorkspace?.id, currentWorkspace?.name]);

  // Demo pública (sem login): popula workspaces/usuários com o dataset fictício
  // para as telas de administração e cabeçalho exibirem dados da demonstração.
  useEffect(() => {
    let cancelled = false;
    const hydrateDemo = async () => {
      if (!isPublicDemoMode()) {
        setCurrentWorkspace(null);
        setUserWorkspacesDetailed([]);
        setAllUsers([]);
        return;
      }
      try {
        const [ws, users] = await Promise.all([getDemoWorkspace(), getDemoUsers()]);
        if (cancelled) return;
        const wsDto = workspaceToDto(ws);
        setCurrentWorkspace(wsDto);
        setUserWorkspacesDetailed([wsDto]);
        setAllUsers(
          users.map((u) => ({
            uid: u.id,
            email: u.email ?? "demo@estudiopixel.demo",
            displayName: u.displayName ?? undefined,
            name: u.displayName ?? undefined,
            role: toRole(u.role),
            isSuperAdmin: u.isSuperAdmin,
            canCollaborate: u.isEditor,
            isEditor: u.isEditor,
            isRevisor: u.isRevisor,
            canRevert: u.canRevert,
            canViewAdmin: u.canViewAdmin,
            canViewReports: u.canViewReports,
            canViewActivityHistory: u.canViewActivityHistory,
            canViewDebugLogs: u.isSuperAdmin,
            canAssign: u.isSuperAdmin,
            requiresChecklist: u.requiresChecklist,
            status: "active",
            workspaceId: u.workspaceId,
            workspaces: [u.workspaceId],
            avatarUrl: "",
            photoURL: null,
          })),
        );
      } catch {
        if (!cancelled) {
          setCurrentWorkspace(null);
          setAllUsers([]);
        }
      }
    };
    void hydrateDemo();
    return () => {
      cancelled = true;
    };
  }, [demoView, realUser?.uid]);

  // Workspaces que não são demo não têm recursos de demonstração: se o usuário
  // real está num workspace comum, a visão demo é desativada automaticamente.
  useEffect(() => {
    if (!realUser?.uid || !currentWorkspace) return;
    if (!isDemoWorkspaceName(currentWorkspace.name)) {
      setDemoViewState(null);
      try {
        window.localStorage.removeItem(DEMO_VIEW_KEY);
      } catch {
        // ignore
      }
      writeDemoCookie(null);
    }
  }, [realUser?.uid, currentWorkspace]);

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
    setRealUser(u);
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
    setRealUser(null);
    setDemoViewState(null);
    try {
      window.localStorage.removeItem(DEMO_VIEW_KEY);
    } catch {
      // ignore
    }
    writeDemoCookie(null);
    setCurrentWorkspace(null);
    setUserWorkspacesDetailed([]);
    setAllUsers([]);
    setTeams([]);
    setDebugUserContext(null);
  };

  const switchWorkspace = async (workspaceId: string) => {
    if (!realUser) return;
    setRealUser((prev) => (prev ? { ...prev, workspaceId } : prev));
    const ws = userWorkspacesDetailed.find((w) => w.id === workspaceId);
    if (ws) setCurrentWorkspace(ws);
    toast.success("Workspace alterado!");
  };

  const leaveWorkspace = async () => {
    if (!realUser || !realUser.workspaceId) return;
    const remaining = userWorkspacesDetailed.filter((w) => w.id !== realUser.workspaceId);
    const nextWsId = remaining[0]?.id ?? "";
    setRealUser((prev) =>
      prev ? { ...prev, workspaceId: nextWsId, workspaces: remaining.map((w) => w.id) } : prev,
    );
    setCurrentWorkspace(remaining[0] ?? null);
    setUserWorkspacesDetailed(remaining);
    toast.success("Você saiu do workspace.");
  };

  const joinWorkspace = async (workspaceId: string) => {
    if (!realUser) return;
    try {
      const result = await apiJoinWorkspace(workspaceId);
      if (result.success) {
        const dto = await apiMe();
        setRealUser(dtoToExtendedUser(dto));
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
    if (!realUser) throw new Error("Usuário não autenticado.");
    try {
      const ws = await apiCreateWorkspace({ name });
      setRealUser((prev) =>
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
        setRealUser(dtoToExtendedUser(dto));
      } catch {
        // mantém estado atual
      }
    }
    return result;
  };

  // Usuário efetivo: se uma visualização demo estiver ativa, sobrepõe (só na UI)
  // o papel/permissões; o usuário real permanece intacto para login/dados.
  const user = computeEffectiveUser(realUser, demoView);

  const setDemoView = (view: DemoView) => {
    setDemoViewState(view);
    try {
      if (view) {
        window.localStorage.setItem(DEMO_VIEW_KEY, view);
        clearStoredToken();
        setRealUser(null);
      } else {
        window.localStorage.removeItem(DEMO_VIEW_KEY);
      }
    } catch {
      // ignore
    }
    if (!view) clearDemoCache();
    writeDemoCookie(view);
  };

  // Mantém o cookie tp_demo em sincronia (inclusive reload com demo salva).
  useEffect(() => {
    writeDemoCookie(demoView);
  }, [demoView]);

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
        demoView,
        setDemoView,
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
