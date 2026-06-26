"use client";

import React, { useEffect, useState, useCallback } from "react";
import { collection, query, deleteDoc, doc, updateDoc, writeBatch, where, addDoc, serverTimestamp, onSnapshot, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

import { LoadingScreen } from "@/components/PageTransitionLoader";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Link2 as LinkIcon, Plus, Play, Trash2, Edit2, FolderInput, X, FileText, Send, Clock, CheckCircle2, ChevronRight, ChevronDown, Briefcase, Hourglass, Users, UserPlus, ClipboardCheck, MessageSquare, FolderPlus, PlusCircle, Video, Download, Check, List, LayoutGrid, ArrowLeftRight, Minimize2, Mic, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Suspense } from "react";
import { fetchProjects, Project, createProject, deleteProject, updateProject } from "@/services/projects";
import { toDate } from "@/lib/firebase-utils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScriptDoc, ScriptStatus, FolderNode } from "@/types/script";
import { buildTree } from "@/lib/pathUtils";
import { FolderTree } from "@/components/tp/FolderTree";
import { MoveScriptModal } from "@/components/tp/MoveScriptModal";
import { MoveFolderModal } from "@/components/tp/MoveFolderModal";
import { CommentsPanel } from "@/components/tp/CommentsPanel";
import { WelcomeModal } from "@/components/auth/WelcomeModal";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Scene, parseScript } from "@/lib/parser";
import { exportAllToWord } from "@/lib/export-all-word";
import { exportAllToPPT } from "@/lib/export-all-ppt";
import { Presenter, addPresenter, getPresenters, deletePresenter } from "@/services/presenters";

type ScriptCategory = "video" | "podcast";

const statusConfig: Record<ScriptStatus, { label: string; color: string; icon: React.ElementType }> = {
  rascunho: { label: "Rascunho", color: "bg-orange-500", icon: FileText },
  em_revisao: { label: "Em Revisão", color: "bg-yellow-500", icon: Clock },
  revisao_realizada: { label: "Revisado", color: "bg-emerald-500", icon: CheckCircle2 },
  aguardando_gravacao: { label: "Aguardando Gravação", color: "bg-green-500", icon: CheckCircle2 },
  gravado: { label: "Gravado", color: "bg-blue-600", icon: Send },
  rejeitado: { label: "Rejeitado", color: "bg-red-500", icon: X },
  nao_gravado: { label: "Não Gravado", color: "bg-red-600", icon: X },
};
export type { ScriptStatus };

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { user, allUsers } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [scripts, setScripts] = useState<ScriptDoc[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningScript, setAssigningScript] = useState<ScriptDoc | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [quickEditScript, setQuickEditScript] = useState<ScriptDoc | null>(null);
  const [quickEditTitle, setQuickEditTitle] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScriptStatus | "all">("all");
  const [reviewingScript, setReviewingScript] = useState<ScriptDoc | null>(null);
  const [completingReview, setCompletingReview] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: "", code: "" });
  const [filterCommenter, setFilterCommenter] = useState<string>("all");
  const [openCommentsScriptId, setOpenCommentsScriptId] = useState<string | null>(null);
  const [deleteConfirmScript, setDeleteConfirmScript] = useState<string | null>(null);
  const [deleteConfirmFolder, setDeleteConfirmFolder] = useState<ScriptDoc[] | null>(null);
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<string | null>(null);
  const [exportingProject, setExportingProject] = useState<string | null>(null);
  const [showConcluded, setShowConcluded] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'scroll'>('scroll');
  const [treeCollapseVersions, setTreeCollapseVersions] = useState<Record<string, number>>({});
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [presenterSearch, setPresenterSearch] = useState("");
  const [changingStatusScript, setChangingStatusScript] = useState<ScriptDoc | null>(null);
  const [changingStatusValue, setChangingStatusValue] = useState<ScriptStatus>("rascunho");
  const [changingStatusPersonId, setChangingStatusPersonId] = useState("");
  const [changingStatusPersonName, setChangingStatusPersonName] = useState("");

  useEffect(() => {
    if (user?.workspaceId) {
      getPresenters(user.workspaceId).then(setPresenters);
    }
  }, [user?.workspaceId]);

  function getAllFolderPaths(nodes: Record<string, FolderNode>): string[] {
    const paths: string[] = [];
    function recurse(ns: Record<string, FolderNode>) {
      for (const n of Object.values(ns)) {
        paths.push(n.fullPath.join("/"));
        recurse(n.children);
      }
    }
    recurse(nodes);
    return paths;
  }

  const handleCopyInvite = () => {
    if (!user?.workspaceId) {
      toast.error("Você não está vinculado a um workspace.");
      return;
    }
    navigator.clipboard.writeText(user.workspaceId);
    toast.success("Chave do workspace copiada!");
  };
  const [selectedCategory, setSelectedCategory] = useState<ScriptCategory>("video");
  
  const [editingProjectName, setEditingProjectName] = useState<string | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());

  const toggleProjectCollapse = (projectName: string) => {
    const next = new Set(collapsedProjects);
    if (next.has(projectName)) next.delete(projectName);
    else next.add(projectName);
    setCollapsedProjects(next);
  };

  const toggleAllFolders = (projectName: string, tree: Record<string, FolderNode>) => {
    const pid = projects.find(p => p.name === projectName)?.id || "";
    const STORAGE_KEY = `tp_collapsed_folders_${pid}`;
    const allPaths = getAllFolderPaths(tree);
    const saved = new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    const allCollapsed = allPaths.every(p => saved.has(p));
    if (allCollapsed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allPaths));
    }
    setTreeCollapseVersions(prev => ({ ...prev, [projectName]: (prev[projectName] ?? 0) + 1 }));
  };

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isMoveFolderOpen, setIsMoveFolderOpen] = useState(false);
  const [movingFolder, setMovingFolder] = useState<{ path: string[], projectId: string, projectName: string } | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderData, setNewFolderData] = useState({ 
    projectName: "", 
    folder: "", 
    subfolder: "", 
    lesson: "", 
    path: [] as string[] 
  });

  const handleDownloadProjectBackup = async (projectName: string, projectScripts: ScriptDoc[]) => {
    const backupData = {
      project: projectName,
      exportedAt: new Date().toISOString(),
      scripts: projectScripts
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_${projectName.replace(/[^a-z0-9]/gi, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (user) {
      const { logActivity } = await import("@/lib/activity");
      await logActivity({
        userId: user.uid,
        userName: user.displayName || user.name || user.email || "Usuário",
        userAvatar: user.photoURL || null,
        action: "ExportouBackup",
        metadata: "JSON",
        projectName,
        workspaceId: user.workspaceId || "",
      });
    }
    toast.success(`Backup do projeto "${projectName}" baixado!`);
  };

  const fetchScriptScenes = async (script: ScriptDoc): Promise<Scene[]> => {
    try {
      const vQ = query(
        collection(db, "scripts", script.id, "versions"),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      const vSnap = await getDocs(vQ);
      if (!vSnap.empty) {
        const vData = vSnap.docs[0].data();
        const rawContent = vData.content || "";
        let loadedScenes = vData.scenes || [];
        if (loadedScenes.length === 0 && rawContent) {
          loadedScenes = parseScript(rawContent);
        }
        return loadedScenes.map((s: Scene) => ({ ...s }));
      }
    } catch (e) {
      console.error(`Erro ao buscar cenas do roteiro "${script.title}":`, e);
    }
    return [];
  };

  const handleExportProjectWord = async (projectName: string, projectScripts: ScriptDoc[]) => {
    setExportingProject(projectName);
    try {
      const scriptsWithScenes = await Promise.all(
        projectScripts.map(async (script) => ({
          title: script.title,
          path: script.path,
          folder: script.folder,
          subfolder: script.subfolder,
          lesson: script.lesson,
          editorName: script.editorName,
          reviewerName: script.reviewerName,
          videomakerName: script.videomakerName,
          scenes: await fetchScriptScenes(script),
        }))
      );
      await exportAllToWord(projectName, scriptsWithScenes);
      if (user) {
        const { logActivity } = await import("@/lib/activity");
        await logActivity({
          userId: user.uid,
          userName: user.displayName || user.name || user.email || "Usuário",
          userAvatar: user.photoURL || null,
          action: "ExportouBackup",
          metadata: "Word",
          projectName,
          workspaceId: user.workspaceId || "",
        });
      }
      toast.success(`Word exportado com sucesso para o projeto "${projectName}"!`);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao exportar para Word.");
    } finally {
      setExportingProject(null);
    }
  };

  const handleExportProjectPPT = async (projectName: string, projectScripts: ScriptDoc[]) => {
    setExportingProject(projectName);
    try {
      const scriptsWithScenes = await Promise.all(
        projectScripts.map(async (script) => ({
          title: script.title,
          path: script.path,
          folder: script.folder,
          subfolder: script.subfolder,
          lesson: script.lesson,
          editorName: script.editorName,
          reviewerName: script.reviewerName,
          videomakerName: script.videomakerName,
          scenes: await fetchScriptScenes(script),
        }))
      );
      await exportAllToPPT(projectName, scriptsWithScenes);
      if (user) {
        const { logActivity } = await import("@/lib/activity");
        await logActivity({
          userId: user.uid,
          userName: user.displayName || user.name || user.email || "Usuário",
          userAvatar: user.photoURL || null,
          action: "ExportouBackup",
          metadata: "PPT",
          projectName,
          workspaceId: user.workspaceId || "",
        });
      }
      toast.success(`PPT exportado com sucesso para o projeto "${projectName}"!`);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao exportar para PPT.");
    } finally {
      setExportingProject(null);
    }
  };

  const handleCreateFolderClick = (projectName: string) => {
    setNewFolderData({ projectName, folder: "", subfolder: "", lesson: "", path: [] });
    setNewFolderName("");
    setIsCreateFolderOpen(true);
  };

  const projectIdFilter = searchParams.get("projectId");
  const selectedProject = projects.find(p => p.id === projectIdFilter);

  useEffect(() => {
    const saved = localStorage.getItem("teleprompt_dashboard_filters");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.statusFilter) setStatusFilter(p.statusFilter);
        if (p.filterCommenter) setFilterCommenter(p.filterCommenter);
        if (typeof p.showConcluded === "boolean") setShowConcluded(p.showConcluded);
      } catch {}
    }

    const savedCollapsed = localStorage.getItem("teleprompt_collapsed_projects");
    if (savedCollapsed) {
      try {
        const arr = JSON.parse(savedCollapsed);
        if (Array.isArray(arr)) setCollapsedProjects(new Set(arr));
      } catch {}
    }

    const savedViewMode = localStorage.getItem("teleprompt_view_mode");
    if (savedViewMode === 'list' || savedViewMode === 'scroll') setViewMode(savedViewMode);

    const statusParam = searchParams.get("status");
    const commenterParam = searchParams.get("commenter");
    const concludedParam = searchParams.get("concluded");
    if (statusParam) setStatusFilter(statusParam as ScriptStatus | "all");
    if (commenterParam) setFilterCommenter(commenterParam);
    if (concludedParam === "1") setShowConcluded(true);
    else if (concludedParam === "0") setShowConcluded(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("teleprompt_dashboard_filters", JSON.stringify({
      statusFilter,
      filterCommenter,
      showConcluded,
    }));
  }, [statusFilter, filterCommenter, showConcluded]);

  useEffect(() => {
    localStorage.setItem("teleprompt_collapsed_projects", JSON.stringify(Array.from(collapsedProjects)));
  }, [collapsedProjects]);

  useEffect(() => {
    localStorage.setItem("teleprompt_view_mode", viewMode);
  }, [viewMode]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (projectIdFilter) params.set("projectId", projectIdFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (filterCommenter !== "all") params.set("commenter", filterCommenter);
    params.set("concluded", showConcluded ? "1" : "0");
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [statusFilter, filterCommenter, showConcluded, projectIdFilter]);

  useEffect(() => {
    if (loadingProjects) return;
    const savedProjectId = localStorage.getItem("teleprompt_last_project_id");
    if (!projectIdFilter && savedProjectId) {
      const projectExists = projects.some(p => p.id === savedProjectId);
      if (projectExists) {
        router.replace(`/dashboard?projectId=${savedProjectId}`);
      } else {
        localStorage.removeItem("teleprompt_last_project_id");
      }
    }
  }, [loadingProjects, projectIdFilter, projects, router]);

  const loadProjects = useCallback(async () => {
    try {
      const workspaceId = user?.workspaceId || "";
      const projectsData = await fetchProjects(workspaceId, !!user?.isSuperAdmin);
      setProjects(projectsData);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
    } finally {
      setLoadingProjects(false);
    }
  }, [user?.workspaceId, user?.isSuperAdmin]);

    useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const activeWorkspaceId = user.workspaceId || "";
    
    if (!activeWorkspaceId && !user.isSuperAdmin) {
      setScripts([]);
      setLoading(false);
      return;
    }

    loadProjects();

    const scriptsRef = collection(db, "scripts");
    const q = user.isSuperAdmin
      ? query(scriptsRef)
      : query(scriptsRef, where("workspaceId", "==", activeWorkspaceId));

    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          status: data.status || "rascunho",
          createdAt: toDate(data.createdAt).toISOString()
        };
      }) as ScriptDoc[];

      fetched.sort((a, b) => {
        const priority: Record<string, number> = {
          'aguardando_gravacao': 0,
          'rascunho': 1,
          'em_revisao': 1,
          'revisao_realizada': 1,
          'gravado': 2,
          'rejeitado': 3
        };
        
        const pA = priority[a.status] ?? 1;
        const pB = priority[b.status] ?? 1;
        
        if (pA !== pB) return pA - pB;
        return a.title.localeCompare(b.title);
      });

      setScripts(fetched);
      setLoading(false);
    }, (err) => {
      console.error("ERRO CRÍTICO AO CARREGAR DADOS:", err);
      toast.error("Erro ao carregar dados do dashboard.");
      setLoading(false);
    });

    return () => unsub();
  }, [user?.workspaceId, router, user, loadProjects]);

  const filteredScripts = scripts.filter(s => {
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    const matchesProject = !projectIdFilter || s.projectId === projectIdFilter;
    const matchesCommenter = filterCommenter === "all" || (s.commentAuthors && s.commentAuthors.includes(filterCommenter));
    return matchesStatus && matchesProject && matchesCommenter;
  });

  const statusCounts = {
    all: scripts.length,
    rascunho: scripts.filter(s => s.status === "rascunho").length,
    em_revisao: scripts.filter(s => s.status === "em_revisao").length,
    revisao_realizada: scripts.filter(s => s.status === "revisao_realizada").length,
    aguardando_gravacao: scripts.filter(s => s.status === "aguardando_gravacao").length,
    gravado: scripts.filter(s => s.status === "gravado").length,
    rejeitado: scripts.filter(s => s.status === "rejeitado").length,    
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setDeleteConfirmProject(projectId);
  };

  const confirmDeleteProject = async () => {
    if (!deleteConfirmProject) return;
    const projectId = deleteConfirmProject;
    const projectName = projects.find(p => p.id === projectId)?.name || "";
    setDeleteConfirmProject(null);
    try {
      await deleteProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      if (projectIdFilter === projectId) {
        localStorage.removeItem("teleprompt_last_project_id");
        router.push("/dashboard");
      }
      if (user) {
        const { logActivity } = await import("@/lib/activity");
        await logActivity({
          userId: user.uid,
          userName: user.displayName || user.name || user.email || "Usuário",
          action: "ExcluiuProjeto",
          projectId,
          projectName,
          snapshot: projects.find(p => p.id === projectId) as unknown as Record<string, unknown> | undefined,
          workspaceId: user.workspaceId || "",
        });
      }
      toast.success("Projeto excluído com sucesso!");
    } catch {
      toast.error("Erro ao excluir projeto.");
    }
  };

  const handleAssign = async (scriptId: string, userId: string, userName: string, field: 'editor' | 'reviewer' | 'videomaker') => {
    try {
      const scriptRef = doc(db, "scripts", scriptId);
      const updateData = field === 'editor' 
        ? { editorId: userId, editorName: userName }
        : field === 'reviewer'
        ? { reviewerId: userId, reviewerName: userName }
        : { videomakerId: userId, videomakerName: userName };
      
      await updateDoc(scriptRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      
      setScripts(scripts.map(s => s.id === scriptId ? { ...s, ...updateData } : s));
      const label = field === 'editor' ? 'Editor' : field === 'reviewer' ? 'Revisor' : 'Videomaker';
      toast.success(`${label} atribuído com sucesso!`);
    } catch (error) {
      console.error("Erro ao atribuir:", error);
      toast.error("Erro ao realizar atribuição.");
    }
  };

  const handleTogglePresenter = async (scriptId: string, presenterId: string) => {
    const script = scripts.find(s => s.id === scriptId);
    if (!script) return;
    const current = script.presenterIds || [];
    const isAssigned = current.includes(presenterId);
    const newIds = isAssigned ? current.filter(id => id !== presenterId) : [...current, presenterId];
    try {
      await updateDoc(doc(db, "scripts", scriptId), {
        presenterIds: newIds,
        updatedAt: new Date().toISOString(),
      });
      setScripts(scripts.map(s => s.id === scriptId ? { ...s, presenterIds: newIds } : s));
      toast.success(isAssigned ? "Apresentador removido" : "Apresentador atribuído");
    } catch (error) {
      console.error("Erro ao atribuir apresentador:", error);
      toast.error("Erro ao atribuir apresentador.");
    }
  };

  const handleQuickStatusChange = async () => {
    if (!changingStatusScript) return;
    const script = changingStatusScript;
    const newStatus = changingStatusValue;
    if (newStatus === script.status && !changingStatusPersonId) {
      setChangingStatusScript(null);
      return;
    }
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      };
      if (changingStatusPersonId && changingStatusPersonName) {
        if (newStatus === "rascunho") {
          updateData.editorId = changingStatusPersonId;
          updateData.editorName = changingStatusPersonName;
        } else if (newStatus === "em_revisao" || newStatus === "revisao_realizada") {
          updateData.reviewerId = changingStatusPersonId;
          updateData.reviewerName = changingStatusPersonName;
        } else if (newStatus === "gravado" || newStatus === "aguardando_gravacao") {
          updateData.videomakerId = changingStatusPersonId;
          updateData.videomakerName = changingStatusPersonName;
        }
      }
      await updateDoc(doc(db, "scripts", script.id), updateData);
      setScripts(scripts.map(s => s.id === script.id ? { ...s, ...updateData } : s));
      toast.success(`Status alterado para "${statusConfig[newStatus]?.label || newStatus}"`);
      setChangingStatusScript(null);
    } catch {
      toast.error("Erro ao alterar status.");
    }
  };

  const handleConcludeReview = async () => {
    if (!reviewingScript) return;
    
    setCompletingReview(true);
    try {
      const scriptRef = doc(db, "scripts", reviewingScript.id);
      const updateData = {
        status: ("revisao_realizada" as ScriptStatus),
        category: selectedCategory,
        updatedAt: new Date().toISOString(),
        reviewerId: reviewingScript.reviewerId || user?.uid,
        reviewerName: reviewingScript.reviewerName || user?.displayName || user?.email
      };
      
      await updateDoc(scriptRef, updateData);
      
      setScripts(scripts.map(s => s.id === reviewingScript.id ? { ...s, ...updateData } : s));
      toast.success("Revisão concluída com sucesso!");
      setReviewingScript(null);
    } catch (error) {
      console.error("Erro ao concluir revisão:", error);
      toast.error("Erro ao concluir revisão.");
    } finally {
      setCompletingReview(false);
    }
  };

  const deleteScript = async (id: string) => {
    setDeleteConfirmScript(id);
  };

  const confirmDeleteScript = async () => {
    if (!deleteConfirmScript) return;
    const id = deleteConfirmScript;
    const scriptData = scripts.find(s => s.id === id);
    setDeleteConfirmScript(null);
    try {
      await deleteDoc(doc(db, "scripts", id));
      setScripts(scripts.filter(s => s.id !== id));
      if (user) {
        const { logActivity } = await import("@/lib/activity");
        await logActivity({
          userId: user.uid,
          userName: user.displayName || user.name || user.email || "Usuário",
          userAvatar: user.photoURL || null,
          action: "ExcluiuRoteiro",
          scriptId: id,
          scriptTitle: scriptData?.title || "",
          projectId: scriptData?.projectId || null,
          projectName: scriptData?.projectName || scriptData?.project || null,
          path: scriptData?.path || null,
          workspaceId: user.workspaceId || "",
          snapshot: scriptData as unknown as Record<string, unknown>,
        });
      }
      toast.success("Roteiro excluído com sucesso.");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir roteiro.");
    }
  };

  const deleteFolder = async (folderScripts: ScriptDoc[]) => {
    setDeleteConfirmFolder(folderScripts);
  };

  const confirmDeleteFolder = async () => {
    if (!deleteConfirmFolder) return;
    const folderScripts = deleteConfirmFolder;
    const folderName = folderScripts[0]?.path?.slice(-1)[0] || "Pasta";
    setDeleteConfirmFolder(null);
    try {
      const batch = writeBatch(db);
      folderScripts.forEach(s => {
        batch.delete(doc(db, "scripts", s.id));
      });
      await batch.commit();
      
      setScripts(scripts.filter(s => !folderScripts.some(fs => fs.id === s.id)));
      if (user) {
        const { logActivity } = await import("@/lib/activity");
        const folderSnapshot: Record<string, unknown> = {};
        folderScripts.forEach(s => { folderSnapshot[`snapshot_${s.id}`] = s as unknown as Record<string, unknown>; });
        await logActivity({
          userId: user.uid,
          userName: user.displayName || user.name || user.email || "Usuário",
          userAvatar: user.photoURL || null,
          action: "ExcluiuPasta",
          projectName: folderScripts[0]?.projectName || folderScripts[0]?.project || null,
          path: folderScripts[0]?.path || null,
          folder: folderName,
          workspaceId: user.workspaceId || "",
          snapshotIds: folderScripts.map(s => s.id),
          snapshot: folderSnapshot,
        });
      }
      toast.success("Pasta excluída com sucesso.");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir pasta.");
    }
  };

  const saveTitle = async (id: string) => {
    if (!editTitle.trim()) {
      setEditingId(null);
      return;
    }
    try {
      await updateDoc(doc(db, "scripts", id), { title: editTitle });
      setScripts(scripts.map(s => s.id === id ? { ...s, title: editTitle } : s));
      setEditingId(null);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao renomear.");
    }
  };

  const quickSaveTitle = async () => {
    const script = quickEditScript;
    if (!script || !quickEditTitle.trim()) return;
    try {
      await updateDoc(doc(db, "scripts", script.id), { title: quickEditTitle });
      setScripts(scripts.map(s => s.id === script.id ? { ...s, title: quickEditTitle } : s));
      setQuickEditScript(null);
      toast.success("Nome atualizado!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao renomear.");
    }
  };

  const handleRenameProject = async (oldName: string) => {
    if (!newProjectTitle.trim() || oldName === newProjectTitle) {
      setEditingProjectName(null);
      return;
    }
    try {
      const batch = writeBatch(db);
      const scriptsToUpdate = scripts.filter(s => (s.projectName || s.project || "Geral") === oldName);
      
      scriptsToUpdate.forEach(s => {
        const ref = doc(db, "scripts", s.id);
        batch.update(ref, { projectName: newProjectTitle });
      });

      await batch.commit();

      const project = projects.find(p => p.name === oldName);
      if (project) {
        await updateProject(project.id, { name: newProjectTitle });
      }

      setScripts(scripts.map(s => (s.projectName || s.project || "Geral") === oldName ? { ...s, projectName: newProjectTitle } : s));
      setProjects(projects.map(p => p.name === oldName ? { ...p, name: newProjectTitle } : p));
      setEditingProjectName(null);
      if (user) {
        const { logActivity } = await import("@/lib/activity");
        await logActivity({
          userId: user.uid,
          userName: user.displayName || user.name || user.email || "Usuário",
          userAvatar: user.photoURL || null,
          action: "EditouProjeto",
          projectId: project?.id || null,
          projectName: newProjectTitle,
          metadata: `Renomeado de "${oldName}"`,
          snapshot: { previousName: oldName, previousCode: project?.code || "" } as Record<string, unknown>,
          workspaceId: user.workspaceId || "",
        });
      }
      toast.success("Projeto renomeado com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao renomear projeto.");
    }
  };

  const [movingScript, setMovingScript] = useState<ScriptDoc | null>(null);

  const handleCreateNewProject = async () => {
    if (!newProjectData.name.trim()) return;
    setIsCreatingProject(true);
    try {
      const workspaceId = user?.workspaceId || "";
      
      const payload: Partial<Project> = {
        name: newProjectData.name,
        code: newProjectData.code || newProjectData.name.toUpperCase().slice(0, 3),
        workspaceId: workspaceId,
        status: 'active'
      };

      const createdProj = await createProject(payload);
      
      setProjects([createdProj, ...projects]);
      setIsCreateProjectOpen(false);
      setNewProjectData({ name: "", code: "" });
      toast.success("Projeto criado com sucesso!");
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      toast.error("Erro ao criar projeto.");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const allCommenters = Array.from(new Set(scripts.flatMap(s => s.commentAuthors || [])));

  // Group filtered scripts by project name
  const scriptsByProject = filteredScripts.reduce((acc, script) => {
    const projectName = script.projectName || script.project || "Geral";
    if (!acc[projectName]) acc[projectName] = [];
    acc[projectName].push(script);
    return acc;
  }, {} as Record<string, ScriptDoc[]>);

  const terminalStatuses = new Set(["gravado", "rejeitado"]);
  const concludedProjects = new Set<string>();
  Object.entries(scriptsByProject).forEach(([name, projectScripts]) => {
    const allTerminal = projectScripts.every(s => terminalStatuses.has(s.status));
    if (allTerminal) concludedProjects.add(name);
  });

  const visibleProjects = showConcluded
    ? scriptsByProject
    : Object.fromEntries(
        Object.entries(scriptsByProject).filter(([name]) => !concludedProjects.has(name))
      );

  return (
    <>
      <WelcomeModal />
      <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        
        <div className="flex gap-3">
          {user?.canViewActivityHistory && (
            <Button 
              variant="outline" 
              asChild
              className="rounded border-zinc-200 dark:border-zinc-800 flex gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
            >
              <Link href="/activities">
                <Clock className="w-4 h-4 text-blue-500" />
                Atividades
              </Link>
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={handleCopyInvite}
            className="rounded border-zinc-200 dark:border-zinc-800 flex gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <LinkIcon className="w-4 h-4 text-blue-500" />
            Convidar Equipe
          </Button>
          {selectedProject && (
            <Button 
              variant="outline" 
              onClick={() => {
                localStorage.removeItem("teleprompt_last_project_id");
                router.push("/dashboard");
              }} 
              className="rounded border-blue-500 text-blue-500 hover:bg-blue-50"
            >
              Ver Todos
            </Button>
          )}
          <Button 
            variant="outline"
            data-tour="dashboard-new-project"
            onClick={() => setIsCreateProjectOpen(true)}
            className="rounded border-zinc-200 dark:border-zinc-800 flex gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <PlusCircle className="w-4 h-4 text-emerald-500" />
            Novo Projeto
          </Button>
          <Button 
            data-tour="dashboard-new-script"
            onClick={() => {
              const url = selectedProject 
                ? `/editor/new?project=${encodeURIComponent(selectedProject.name)}&projectId=${selectedProject.id}`
                : "/editor/new";
              router.push(url);
            }} 
            size="lg" 
            className={`rounded shadow-lg hover:shadow-xl transition-all ${selectedProject ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
          >
            <Plus className="w-5 h-5 mr-2" /> 
            {selectedProject ? `Novo Roteiro em ${selectedProject.name}` : "Novo Roteiro"}
          </Button>
        </div>
      </div>
  <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
             {selectedProject ? `Projeto: ${selectedProject.name}` : "Meus Roteiros"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {selectedProject 
              ? `Gerenciando roteiros do projeto ${selectedProject.name}.` 
              : "Gerencie seus Roteiros do Teleprompter aqui."}
          </p>
        </div>
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Projetos Ativos
          </h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('scroll')}
                className={`h-7 w-7 rounded-none ${viewMode === 'scroll' ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-500' : 'text-zinc-400'}`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`h-7 w-7 rounded-none ${viewMode === 'list' ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-500' : 'text-zinc-400'}`}
              >
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push("/projects")} className="text-xs text-blue-500 hover:text-blue-600">
              Ver Todos <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
        
        {viewMode === 'scroll' ? (
        <div data-tour="dashboard-projects" className="flex gap-4 overflow-x-auto p-5 custom-scrollbar pb-8">
          {loadingProjects ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="min-w-[200px] h-24 bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded border border-zinc-200 dark:border-zinc-800" />
            ))
          ) : projects.length === 0 ? (
            <div className="w-full py-6 px-8 bg-zinc-50 dark:bg-zinc-900/50 rounded border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
               <p className="text-sm text-zinc-500">Nenhum projeto vinculado a este workspace.</p>
            </div>
          ) : (
            projects.map(project => {
              const isActive = projectIdFilter === project.id;
              return (
                <Card 
                  key={project.id} 
                  className={`min-w-[220px] max-w-[220px] flex-shrink-0 cursor-pointer transition-all border-2 group ${
                    isActive 
                      ? 'border-blue-500 ring-4 ring-blue-500/10 scale-105 shadow-lg bg-blue-50/30' 
                      : 'hover:border-blue-300 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                  }`}
                  onClick={() => {
                    if (isActive) {
                      localStorage.removeItem("teleprompt_last_project_id");
                      router.push("/dashboard");
                    } else {
                      localStorage.setItem("teleprompt_last_project_id", project.id);
                      router.push(`/dashboard?projectId=${project.id}`);
                    }
                  }}
                >
                  <CardHeader className="p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge variant={isActive ? "default" : "outline"} className="text-[10px] uppercase font-mono px-1.5 py-0 h-5">
                        {project.code || "PRJ"}
                      </Badge>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-6 w-6 rounded hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteProject(e, project.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <CardTitle className={`text-sm line-clamp-1 ${isActive ? 'text-blue-700 dark:text-blue-400 font-bold' : ''}`}>
                      {project.name}
                    </CardTitle>
                  </CardHeader>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <div className="p-2">
          {loadingProjects ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-12 bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded border border-zinc-200 dark:border-zinc-800 mb-2" />
            ))
          ) : projects.length === 0 ? (
            <div className="w-full py-6 px-8 bg-zinc-50 dark:bg-zinc-900/50 rounded border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
              <p className="text-sm text-zinc-500">Nenhum projeto vinculado a este workspace.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {projects.map(project => {
                const isActive = projectIdFilter === project.id;
                return (
                  <div
                    key={project.id}
                    onClick={() => {
                      if (isActive) {
                        localStorage.removeItem("teleprompt_last_project_id");
                        router.push("/dashboard");
                      } else {
                        localStorage.setItem("teleprompt_last_project_id", project.id);
                        router.push(`/dashboard?projectId=${project.id}`);
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded cursor-pointer transition-all border ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/50 border-transparent'
                    }`}
                  >
                    <Badge variant={isActive ? "default" : "outline"} className="text-[10px] uppercase font-mono px-1.5 py-0 h-5 w-14 shrink-0">
                      {project.code || "PRJ"}
                    </Badge>
                    <span className={`text-sm font-bold flex-1 truncate ${isActive ? 'text-blue-700 dark:text-blue-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                      {project.name}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteProject(e, project.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>

      <div data-tour="dashboard-status-filter" className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("all")}
          className="gap-2 rounded px-4"
        >
          Todos ({statusCounts.all})
        </Button>
        {(Object.keys(statusConfig) as ScriptStatus[]).map((status) => {
          const config = statusConfig[status];
          const Icon = config.icon;
          return (
            <Button
              key={status}
              variant={statusFilter === status ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(status)}
              className="gap-2 rounded px-4"
            >
              <Icon className="w-4 h-4" />
              {config.label}
            </Button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const allNames = Object.keys(scriptsByProject);
            const allCollapsed = allNames.every(n => collapsedProjects.has(n));
            if (allCollapsed) {
              setCollapsedProjects(new Set());
            } else {
              setCollapsedProjects(new Set(allNames));
            }
          }}
          className="h-7 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 gap-1.5"
        >
          {Object.keys(scriptsByProject).every(n => collapsedProjects.has(n)) ? (
            <><ChevronDown className="w-3.5 h-3.5" /> Expandir Todos</>
          ) : (
            <><ChevronRight className="w-3.5 h-3.5" /> Minimizar Todos</>
          )}
        </Button>
        <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('scroll')}
            className={`h-7 w-7 rounded-none ${viewMode === 'scroll' ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-500' : 'text-zinc-400'}`}
            title="Scroll horizontal"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('list')}
            className={`h-7 w-7 rounded-none ${viewMode === 'list' ? 'bg-zinc-100 dark:bg-zinc-800 text-blue-500' : 'text-zinc-400'}`}
            title="Lista"
          >
            <List className="w-3.5 h-3.5" />
          </Button>
        </div>
        {allCommenters.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Comentários de:</span>
            <Select value={filterCommenter} onValueChange={setFilterCommenter}>
              <SelectTrigger className="w-[200px] h-7 border-none bg-transparent shadow-none text-[10px] font-bold focus:ring-0">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="rounded border-zinc-200 dark:border-zinc-800">
                <SelectItem value="all" className="text-[10px] font-black uppercase">Todos</SelectItem>
                {allCommenters.map(author => (
                  <SelectItem key={author} value={author} className="text-[10px] font-black uppercase">{author}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Concluídos:</span>
          <Select value={showConcluded ? "show" : "hide"} onValueChange={(v) => setShowConcluded(v === "show")}>
            <SelectTrigger className="w-[140px] h-7 border-none bg-transparent shadow-none text-[10px] font-bold focus:ring-0">
              <SelectValue placeholder={showConcluded ? "Mostrar" : `Ocultar (${concludedProjects.size})`} />
            </SelectTrigger>
            <SelectContent className="rounded border-zinc-200 dark:border-zinc-800">
              <SelectItem value="hide" className="text-[10px] font-black uppercase">Ocultar ({concludedProjects.size})</SelectItem>
              <SelectItem value="show" className="text-[10px] font-black uppercase">Mostrar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <LoadingScreen fullScreen={false} />
      ) : scripts.length === 0 ? (
        <div className="text-center py-16 px-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
          <div className="bg-zinc-100 dark:bg-zinc-800 w-16 h-16 rounded flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Você não tem nenhum roteiro</h3>
          <p className="text-zinc-500 max-w-xs mx-auto mb-8">
            Clique em um projeto e crie agora seu primeiro roteiro para começar a gravar!
          </p>
        </div>
      ) : (
        <div data-tour="dashboard-script-list" className="space-y-16">
          {Object.entries(visibleProjects)
            .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: "base" }))
            .map(([projectName, projectScripts]) => {
              const tree = buildTree(projectScripts);
              const project = projects.find(p => p.name === projectName);
              const pid = project?.id || projectScripts[0]?.projectId || "";

              return (
                <div key={projectName} id={`project-section-${projectName}`} className="space-y-8">
                  {/* Project header */}
                  <div
                    className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 group/header cursor-pointer select-none"
                    onClick={() => toggleProjectCollapse(projectName)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        {collapsedProjects.has(projectName) ? (
                          <ChevronRight className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                      <div className="p-2 bg-blue-500/10 rounded">
                        <Briefcase className="w-5 h-5 text-blue-500" />
                      </div>
                      {editingProjectName === projectName ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <Input
                            value={newProjectTitle}
                            onChange={e => setNewProjectTitle(e.target.value)}
                            className="h-8 w-64"
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => handleRenameProject(projectName)}>
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingProjectName(null)}>
                            <X className="w-4 h-4" />
                          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">
                            {projectName}
                          </h2>
                          {concludedProjects.has(projectName) && (
                            <Badge className="bg-zinc-500 text-white text-[9px] font-black uppercase tracking-widest px-2 h-5">
                              CONCLUÍDO
                            </Badge>
                          )}
                          <button
                            onClick={e => { e.stopPropagation(); setEditingProjectName(projectName); setNewProjectTitle(projectName); }}
                            className="opacity-0 group-hover/header:opacity-100 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-all"
                          >
                            <Edit2 className="w-3 h-3 text-zinc-400" />
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <Badge variant="secondary" className="font-black text-[9px] tracking-widest">
                        {projectScripts.length} ROTEIROS
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-amber-500"
                        onClick={() => toggleAllFolders(projectName, tree)}
                      >
                        <Minimize2 className="w-3.5 h-3.5 mr-1.5" />
                        {(() => {
                          const allPaths = getAllFolderPaths(tree);
                          const storageKey = `tp_collapsed_folders_${pid}`;
                          try {
                            const saved: string[] = JSON.parse(localStorage.getItem(storageKey) || "[]");
                            return allPaths.length > 0 && allPaths.every(p => saved.includes(p)) ? "EXPANDIR" : "MINIMIZAR";
                          } catch { return "MINIMIZAR"; }
                        })()}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-blue-500"
                        onClick={() => handleCreateFolderClick(projectName)}
                      >
                        <FolderPlus className="w-3.5 h-3.5 mr-1.5" /> NOVA PASTA
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-emerald-500"
                            disabled={exportingProject === projectName}
                          >
                            {exportingProject === projectName ? (
                              <Hourglass className="w-3.5 h-3.5 mr-1.5 animate-spin" style={{ animationDuration: "2s" }} />
                            ) : (
                              <Download className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            {exportingProject === projectName ? "EXPORTANDO..." : "BACKUP"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded border-zinc-200 dark:border-zinc-800 min-w-[200px]">
                          <DropdownMenuItem
                            className="text-[11px] font-bold gap-3 py-2.5 cursor-pointer"
                            onClick={() => handleDownloadProjectBackup(projectName, projectScripts)}
                          >
                            <Download className="w-4 h-4 text-emerald-500" />
                            Backup JSON
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-[11px] font-bold gap-3 py-2.5 cursor-pointer"
                            onClick={() => handleExportProjectWord(projectName, projectScripts)}
                            disabled={exportingProject === projectName}
                          >
                            <FileText className="w-4 h-4 text-blue-500" />
                            Exportar Word (.docx)
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-[11px] font-bold gap-3 py-2.5 cursor-pointer"
                            onClick={() => handleExportProjectPPT(projectName, projectScripts)}
                            disabled={exportingProject === projectName}
                          >
                            <Video className="w-4 h-4 text-orange-500" />
                            Exportar PPT (.pptx)
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-blue-500"
                        onClick={() => router.push(`/editor/new?project=${encodeURIComponent(projectName)}&projectId=${pid}`)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5" /> NOVO ROTEIRO
                      </Button>
                    </div>
                  </div>

                  {/* Folder tree + cards */}
                  {!collapsedProjects.has(projectName) && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <FolderTree
                        key={treeCollapseVersions[projectName] ?? 0}
                        nodes={tree}
                        projectName={projectName}
                        projectId={pid}
                        allScripts={projectScripts}
                        onScriptsChanged={() => {
                          // Refresh scripts from Firestore
                          setScripts(prev => [...prev]);
                        }}
                        onCreateScript={(path) => {
                          const params = new URLSearchParams({
                            project: projectName,
                            projectId: pid,
                          });
                          path.forEach((seg, i) => {
                            if (i === 0) params.set("folder", seg);
                            else if (i === 1) params.set("subfolder", seg);
                            else if (i === 2) params.set("lesson", seg);
                            else params.set(`level${i}`, seg);
                          });
                          // Also store full path
                          params.set("path", JSON.stringify(path));
                          router.push(`/editor/new?${params.toString()}`);
                        }}
                        onCreateSubfolder={(parentPath) => {
                          setNewFolderData({
                            projectName,
                            folder: parentPath[0] ?? "",
                            subfolder: parentPath[1] ?? "",
                            lesson: parentPath[2] ?? "",
                            path: parentPath,
                          });
                          setNewFolderName("");
                          setIsCreateFolderOpen(true);
                        }}
                        onMoveFolder={(folderPath) => { setMovingFolder({ path: folderPath, projectId: pid, projectName: projectName }); setIsMoveFolderOpen(true); }}
                        onDeleteFolder={deleteFolder}
                        onBackupFolder={(folderPath, folderScripts, format) => {
                          const scripts = folderScripts.filter(s => !s.isPlaceholder);
                          const folderLabel = `${projectName} > ${folderPath.join(" > ")}`;
                          if (format === 'json') {
                            handleDownloadProjectBackup(folderLabel, scripts);
                          } else if (format === 'word') {
                            handleExportProjectWord(folderLabel, scripts);
                          } else if (format === 'ppt') {
                            handleExportProjectPPT(folderLabel, scripts);
                          }
                        }}
                        viewMode={viewMode}
                        renderScripts={(scripts) => {
                          if (viewMode === 'list') {
                            return (
                              <div className="w-full space-y-1">
                                {scripts.filter(s => !s.isPlaceholder).map(script => (
                                  <div key={script.id} className="flex items-center gap-3 px-4 py-2.5 rounded border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-all cursor-pointer group"
                                    onClick={() => router.push(`/editor/${script.id}`)}
                                  >
                                    <Badge className={
                                      script.status === "rascunho" ? "bg-orange-500 text-white text-[9px] font-black uppercase px-2 h-5 shrink-0" :
                                      script.status === "em_revisao" ? "bg-yellow-500 text-white text-[9px] font-black uppercase px-2 h-5 shrink-0" :
                                      (script.status === "aguardando_gravacao" || script.status === "revisao_realizada") ? "bg-emerald-500 text-white text-[9px] font-black uppercase px-2 h-5 shrink-0" :
                                      script.status === "gravado" ? "bg-blue-600 text-white text-[9px] font-black uppercase px-2 h-5 shrink-0" :
                                     script.status === "nao_gravado" ? "bg-red-600 text-white text-[9px] font-black uppercase px-2 h-5 shrink-0" :
                                      "bg-zinc-500 text-white text-[9px] font-black uppercase px-2 h-5 shrink-0"
                                    }>
                                      {statusConfig[script.status]?.label || script.status}
                                    </Badge>
                                    <span className="flex items-center gap-1.5 text-zinc-400 shrink-0">
                                      {script.category === "podcast" ? <span title="Podcast"><Mic className="w-3.5 h-3.5" /></span> : <span title="Vídeo"><Video className="w-3.5 h-3.5" /></span>}
                                    </span>
                                    <span className="text-sm font-bold flex-1 truncate text-zinc-800 dark:text-zinc-200">
                                      {script.title}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 hidden sm:inline">{script.editorName || "—"}</span>
                                    <span className="text-[10px] text-zinc-400 hidden md:inline">
                                      {script.createdAt ? format(new Date(script.createdAt), "dd/MM", { locale: ptBR }) : ""}
                                    </span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setQuickEditScript(script); setQuickEditTitle(script.title); }} title="Editar">
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={(e) => { e.stopPropagation(); deleteScript(script.id); }} title="Excluir">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return (
                            <>
                              {scripts.filter(s => !s.isPlaceholder).map(script => (
                                <div key={script.id} className={`relative ${viewMode === 'scroll' ? 'min-w-[400px] md:min-w-[450px] snap-start pl-2' : ''}`}>
                                {script.status === "rascunho" && (
                                  <div className="absolute -top-1 -right-1 z-20 bg-orange-500 text-white px-3 py-1 rounded flex items-center gap-1 shadow-lg text-[10px] font-bold uppercase tracking-wider">
                                    <FileText className="w-3 h-3" /> Rascunho
                                  </div>
                                )}
                                {(script.status === "aguardando_gravacao" || script.status === "revisao_realizada") && (
                                  <div className="absolute -top-1 -right-1 z-20 bg-emerald-500 text-white px-3 py-1 rounded flex items-center gap-1 shadow-lg text-[10px] font-bold uppercase tracking-wider">
                                    <CheckCircle2 className="w-3 h-3" /> Revisado
                                  </div>
                                )}
                                {script.status === "em_revisao" && (
                                  <div className="absolute -top-1 -right-1 z-20 bg-yellow-500 text-white px-3 py-1 rounded flex items-center gap-1 shadow-lg text-[10px] font-bold uppercase tracking-wider">
                                    <Clock className="w-3 h-3" /> Em Revisão
                                  </div>
                                )}
                                {script.status === "gravado" && (
                                  <div className="absolute -top-1 -right-1 z-20 bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1 shadow-lg text-[10px] font-bold uppercase tracking-wider">
                                    <Send className="w-3 h-3" /> Gravado
                                  </div>
                                )}
                                {script.status === "nao_gravado" && (
                                  <div className="absolute -top-1 -right-1 z-20 bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1 shadow-lg text-[10px] font-bold uppercase tracking-wider">
                                    <X className="w-3 h-3" /> Não Gravado
                                  </div>
                                )}
                                {script.status === "rejeitado" && (
                                  <div className="absolute -top-1 -right-1 z-20 bg-red-500 text-white px-3 py-1 rounded flex items-center gap-1 shadow-lg text-[10px] font-bold uppercase tracking-wider">
                                    <X className="w-3 h-3" /> Rejeitado
                                  </div>
                                )}
                                {(script.commentCount || 0) > 0 && (
                                  <div className="absolute -top-1 -left-1 z-20 bg-blue-500 text-white px-3 py-1 rounded flex items-center gap-1 shadow-lg text-[10px] font-bold uppercase tracking-wider">
                                    <MessageSquare className="w-3 h-3" /> {script.commentCount}
                                  </div>
                                )}
                                <Card className={`h-full border-zinc-200 dark:border-zinc-800 hover:shadow-xl transition-all group flex flex-col 
                                  ${script.status === "rascunho" ? "ring-2 ring-orange-500/30 border-orange-500/50" : ""}
                                  ${(script.status === "aguardando_gravacao" || script.status === "revisao_realizada") ? "ring-2 ring-emerald-500/30 border-emerald-500/50" : ""}
                                  ${script.status === "em_revisao" ? "ring-2 ring-yellow-500/30 border-yellow-500/50" : ""}
                                  ${script.status === "gravado" ? "ring-2 ring-blue-600/30 border-blue-600/50" : ""}
                                  ${script.status === "nao_gravado" ? "ring-2 ring-red-600/30 border-red-600/50" : ""}
                                `}>
                                  <CardHeader className="p-5 pb-2">
                                    {editingId === script.id ? (
                                      <div className="flex items-center gap-2">
                                        <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus onKeyDown={e => e.key === "Enter" && saveTitle(script.id)} className="h-8" />
                                        <Button size="icon" variant="ghost" onClick={() => saveTitle(script.id)}><Check className="w-4 h-4 text-green-500" /></Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-start justify-between group/title">
                                        <CardTitle className="text-base leading-tight font-black break-all whitespace-normal" title={script.title}>
                                          <span className="inline-flex items-center gap-2">
                                            {script.category === "podcast" ? <span title="Podcast"><Mic className="w-4 h-4 text-zinc-400 shrink-0" /></span> : <span title="Vídeo"><Video className="w-4 h-4 text-zinc-400 shrink-0" /></span>}
                                            {script.title}
                                          </span>
                                        </CardTitle>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0" onClick={() => { setEditingId(script.id); setEditTitle(script.title); }}>
                                          <Edit2 className="w-3 h-3 text-muted-foreground" />
                                        </Button>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      {script.status === "rascunho" && <Badge className="bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2 h-5 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.3)]">Aguardando Revisão</Badge>}
                                      {(script.status === "revisao_realizada" || script.status === "aguardando_gravacao") && <Badge className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2 h-5 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.3)]">Aguardando Gravação</Badge>}
                                      {script.status === "gravado" && <Badge className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2 h-5 animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.3)]">Aguardando Edição</Badge>}
                                      {script.status === "em_revisao" && <Badge className="bg-yellow-500 text-white text-[9px] font-black uppercase tracking-widest px-2 h-5">Em Revisão</Badge>}
                                      {script.status === "nao_gravado" && <Badge className="bg-red-600 text-white text-[9px] font-black uppercase tracking-widest px-2 h-5">Não Gravado</Badge>}
                                      {script.status === "rejeitado" && <Badge className="bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-2 h-5">Rejeitado</Badge>}
                                    </div>
                                  </CardHeader>

                                  <CardContent className="p-5 pt-2 flex-grow space-y-4">
                                    <div className="space-y-1.5 border-y border-zinc-100 dark:border-zinc-800/50 py-3 my-2">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-black uppercase text-zinc-400 tracking-tighter">Responsável</span>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{script.editorName || "Não atribuído"}</span>
                                          {script.editorId && <div className="w-4 h-4 rounded bg-blue-500/20 flex items-center justify-center text-[8px] font-bold text-blue-600">ED</div>}
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-black uppercase text-zinc-400 tracking-tighter">Revisor</span>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{script.reviewerName || "Não atribuído"}</span>
                                          {script.reviewerId && <div className="w-4 h-4 rounded bg-emerald-500/20 flex items-center justify-center text-[8px] font-bold text-emerald-600">RV</div>}
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-black uppercase text-zinc-400 tracking-tighter">Gravado por</span>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">{script.videomakerName || "Não atribuído"}</span>
                                          {script.videomakerId && <div className="w-4 h-4 rounded bg-purple-500/20 flex items-center justify-center text-[8px] font-bold text-purple-600">VM</div>}
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <span className="text-[8px] font-black uppercase text-zinc-400 tracking-tighter">Apresentador</span>
                                        <button
                                          onClick={() => setAssigningScript(script)}
                                          className="flex items-center gap-1.5 hover:text-amber-500 transition-colors"
                                        >
                                          <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                                            {script.presenterIds && script.presenterIds.length > 0
                                              ? script.presenterIds.map(id => presenters.find(p => p.id === id)?.name).filter(Boolean).join(", ")
                                              : "Não atribuído"}
                                          </span>
                                        </button>
                                      </div>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-bold uppercase tracking-widest">
                                      <Clock className="w-3 h-3" />
                                      {script.createdAt ? format(new Date(script.createdAt), "dd 'de' MMMM", { locale: ptBR }) : "Sem data"}
                                    </p>
                                    {script.commentCount ? (
                                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/50 mt-2">
                                        <div className="flex items-center gap-2">
                                          <div className="bg-blue-500/10 text-blue-500 p-1 rounded"><MessageSquare className="w-3 h-3" /></div>
                                          <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">{script.commentCount} {script.commentCount === 1 ? "Comentário" : "Comentários"}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {Array.from(new Set(script.commentAuthors || [])).map((author, i) => (
                                            <Badge key={i} variant="secondary" className="text-[8px] h-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold border-none">{author}</Badge>
                                          ))}
                                        </div>
                                      </div>
                                    ) : null}
                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                      <Button variant="outline" size="sm" className="h-9 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 border-2" asChild>
                                        <Link href={`/tp/${script.id}`}><Play className="w-3 h-3 mr-1.5 text-blue-500" /> Play</Link>
                                      </Button>
                                      {script.status === "em_revisao" ? (
                                        <div className="flex flex-col gap-1 w-full">
                                          <Button variant="secondary" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest bg-yellow-500 hover:bg-yellow-600 text-white w-full" asChild>
                                            <Link href={`/editor/${script.id}`}><ClipboardCheck className="w-3.5 h-3.5 mr-1.5" /> Revisar</Link>
                                          </Button>
                                          <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest border-emerald-500 text-emerald-600 hover:bg-emerald-50 w-full"
                                            onClick={e => { e.preventDefault(); e.stopPropagation(); setReviewingScript(script); setSelectedCategory(script.category || "video"); }}>
                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Concluir
                                          </Button>
                                        </div>
                                      ) : (
                                        <Button variant="outline" size="sm" className="h-9 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 border-2" asChild>
                                          <Link href={`/editor/${script.id}`}><Edit2 className="w-3 h-3 mr-1.5 text-zinc-400" /> Editar</Link>
                                        </Button>
                                      )}
                                    </div>
                                  </CardContent>

                                  <CardFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/50 p-2 flex flex-wrap gap-0.5">
                                    {(user?.role === "SuperAdmin" || user?.isSuperAdmin || user?.canAssign) && (
                                      <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black text-zinc-400 uppercase tracking-widest"
                                        onClick={(e) => { e.stopPropagation(); setChangingStatusScript(script); setChangingStatusValue(script.status); setChangingStatusPersonId(""); setChangingStatusPersonName(""); }}>
                                        <Settings className="w-3 h-3 mr-1" /> Status
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black text-zinc-400 uppercase tracking-widest"
                                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/tp/${script.id}`); toast.success("Link copiado!"); }}>
                                      <LinkIcon className="w-3 h-3 mr-1" /> Link
                                    </Button>
                                    {script.isPlaceholder && (
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-7 text-[9px] font-black text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 uppercase tracking-widest px-1"
                                        onClick={() => deleteScript(script.id)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black text-zinc-400 uppercase tracking-widest"
                                      onClick={() => setOpenCommentsScriptId(script.id)}>
                                      <MessageSquare className="w-3 h-3 mr-1" /> Comentar
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black text-zinc-400 uppercase tracking-widest"
                                      onClick={() => setMovingScript(script)}>
                                      <FolderInput className="w-3 h-3 mr-1" /> Mover
                                    </Button>
                                    {(user?.role === "SuperAdmin" || user?.isSuperAdmin || user?.canAssign) && (
                                      <Button variant="ghost" size="sm" data-tour="dashboard-team-btn" className="h-7 text-[9px] font-black text-blue-500 uppercase tracking-widest" onClick={() => setAssigningScript(script)}>
                                        <UserPlus className="w-3 h-3 mr-1" /> Equipe
                                      </Button>
                                    )}
                                    <Button variant="ghost" size="sm" className="h-7 w-7 text-red-500/50 hover:text-red-500 hover:bg-red-500/10" onClick={() => deleteScript(script.id)}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </CardFooter>
                                </Card>
                              </div>
                            ))}
                          </>
                        );
                      }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* Move Script Modal */}
      <MoveScriptModal
        open={!!movingScript}
        script={movingScript}
        allScripts={scripts}
        projects={projects}
        currentProjectId={movingScript?.projectId || projects.find(p => p.name === (movingScript?.projectName || movingScript?.project))?.id || ""}
        currentProjectName={movingScript?.projectName || movingScript?.project || "Geral"}
        onClose={() => setMovingScript(null)}
        onMoved={() => {
          setMovingScript(null);
          window.location.reload();
        }}
      />

      {/* Move Folder Modal */}
      <MoveFolderModal
        open={!!movingFolder}
        folderPath={movingFolder?.path || null}
        allScripts={scripts}
        projects={projects}
        currentProjectId={movingFolder?.projectId || ""}
        currentProjectName={movingFolder?.projectName || "Geral"}
        onClose={() => setMovingFolder(null)}
        onMoved={() => {
          setMovingFolder(null);
          window.location.reload();
        }}
      />



      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-none rounded p-8 shadow-[0_0_100px_rgba(0,0,0,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center mb-2 uppercase tracking-widest">Nova Pasta/Subpasta</DialogTitle>
            <DialogDescription className="text-center text-zinc-500 text-sm font-medium mb-6">
              Defina o caminho para o novo roteiro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Projeto</Label>
              <div className="h-10 px-4 flex items-center bg-zinc-50 dark:bg-zinc-900 rounded border border-zinc-100 dark:border-zinc-800 font-bold text-zinc-600 dark:text-zinc-400">
                {newFolderData.projectName}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Caminho Atual</Label>
              <div className="flex flex-wrap items-center gap-1.5 p-3 bg-zinc-50 dark:bg-zinc-900 rounded border border-dashed border-zinc-200 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400">Raiz</span>
                {newFolderData.path.map((p, i) => (
                  <React.Fragment key={i}>
                    <ChevronRight className="w-3 h-3 text-zinc-300" />
                    <span className="text-[10px] font-black text-blue-500 uppercase">{p}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-level-name" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nome da Nova Subpasta</Label>
              <Input
                id="new-level-name"
                placeholder="Ex: Módulo 1, Aula 5..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="h-12 rounded border-zinc-200 dark:border-zinc-800 font-bold"
              />
              <p className="text-[10px] text-zinc-400 italic px-1">
                Você será levado ao editor para criar o primeiro roteiro nesta pasta.
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-3">
            <Button variant="ghost" onClick={() => setIsCreateFolderOpen(false)} className="flex-1 h-12 rounded font-bold">Cancelar</Button>
            <Button 
              onClick={async () => {
                const project = projects.find(p => p.name === newFolderData.projectName);
                const pid = project?.id || "";
                
                const finalPath = [...newFolderData.path];
                if (newFolderName) finalPath.push(newFolderName);
                if (finalPath.length === 0) finalPath.push("Raiz");

                try {
                  const docRef = await addDoc(collection(db, "scripts"), {
                    title: "Roteiro Inicial",
                    project: newFolderData.projectName,
                    projectName: newFolderData.projectName,
                    projectId: pid,
                    path: finalPath,
                    status: "rascunho",
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    workspaceId: user?.workspaceId || user?.workspaceId || "",
                    createdBy: user?.uid,
                    createdByName: user?.displayName || user?.email || "Unknown",
                    isPlaceholder: true,
                  });
                  
                  await addDoc(collection(db, "scripts", docRef.id, "versions"), {
                    content: "",
                    scenes: [],
                    createdBy: user?.uid,
                    createdByName: user?.displayName || user?.email || "Usuário",
                    createdAt: serverTimestamp(),
                  });
                  
                  toast.success("Pasta criada com sucesso!");
                  setIsCreateFolderOpen(false);
                  setNewFolderName("");
                  window.location.reload();
                } catch (e) {
                  console.error(e);
                  toast.error("Erro ao criar pasta.");
                }
              }} 
              className="flex-[2] h-12 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg"
            >
              CRIAR PASTA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assigningScript} onOpenChange={(open) => !open && setAssigningScript(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-none rounded-[40px] p-8 shadow-[0_0_100px_rgba(0,0,0,0.2)] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center mb-2">Atribuir Colaboradores</DialogTitle>
            <p className="text-center text-zinc-500 text-sm font-medium mb-6">Selecione quem será responsável pela edição, revisão e gravação deste roteiro.</p>
          </DialogHeader>
          
          <div className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Editor Responsável
              </h4>
              <div className="grid gap-2">
                {allUsers.filter(u => u.isEditor).length > 0 ? (
                  allUsers.filter(u => u.isEditor).map(u => (
                    <Button 
                      key={u.uid} 
                      variant={assigningScript?.editorId === u.uid ? "secondary" : "outline"}
                      className={`justify-between h-12 rounded font-bold transition-all ${assigningScript?.editorId === u.uid ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : ''}`}
                      onClick={() => handleAssign(assigningScript!.id, u.uid, u.displayName || u.name || "Usuário", 'editor')}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={u.photoURL || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {(u.displayName || u.name || "U").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{u.displayName || u.name}</span>
                      </div>
                      {assigningScript?.editorId === u.uid && <Check className="w-4 h-4 text-primary" />}
                    </Button>
                  ))
                ) : (
                  <p className="text-xs text-zinc-400 italic">Nenhum editor definido no painel admin.</p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-500 flex items-center gap-2">
                <Users className="w-4 h-4" /> Revisor Designado
              </h4>
              <div className="grid gap-2">
                {allUsers.filter(u => u.isRevisor).length > 0 ? (
                  allUsers.filter(u => u.isRevisor).map(u => (
                    <Button 
                      key={u.uid} 
                      variant={assigningScript?.reviewerId === u.uid ? "secondary" : "outline"}
                      className={`justify-between h-12 rounded font-bold transition-all ${assigningScript?.reviewerId === u.uid ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-500/5' : ''}`}
                      onClick={() => handleAssign(assigningScript!.id, u.uid, u.displayName || u.name || "Usuário", 'reviewer')}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 text-purple-500">
                          <AvatarImage src={u.photoURL || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {(u.displayName || u.name || "U").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{u.displayName || u.name}</span>
                      </div>
                      {assigningScript?.reviewerId === u.uid && <Check className="w-4 h-4 text-purple-500" />}
                    </Button>
                  ))
                ) : (
                  <p className="text-xs text-zinc-400 italic">Nenhum revisor definido no painel admin.</p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                <Video className="w-4 h-4" /> Videomaker Responsável
              </h4>
              <div className="grid gap-2">
                {allUsers.length > 0 ? (
                  allUsers.map(u => (
                    <Button 
                      key={u.uid} 
                      variant={assigningScript?.videomakerId === u.uid ? "secondary" : "outline"}
                      className={`justify-between h-12 rounded font-bold transition-all ${assigningScript?.videomakerId === u.uid ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5' : ''}`}
                      onClick={() => handleAssign(assigningScript!.id, u.uid, u.displayName || u.name || "Usuário", 'videomaker')}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={u.photoURL || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {(u.displayName || u.name || "U").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{u.displayName || u.name}</span>
                      </div>
                      {assigningScript?.videomakerId === u.uid && <Check className="w-4 h-4 text-blue-500" />}
                    </Button>
                  ))
                ) : (
                  <p className="text-xs text-zinc-400 italic">Nenhum usuário disponível.</p>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                <Users className="w-4 h-4" /> Apresentador(es)
              </h4>
              <Input
                value={presenterSearch}
                onChange={e => setPresenterSearch(e.target.value)}
                placeholder="Pesquisar apresentador..."
                className="h-10 text-sm rounded bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
              />
              <div className="grid gap-2 max-h-40 overflow-y-auto">
                {(() => {
                  const filtered = presenterSearch.trim()
                    ? presenters.filter(p => p.name.toLowerCase().includes(presenterSearch.toLowerCase()))
                    : presenters;
                  if (filtered.length > 0) {
                    return filtered.map(p => {
                      const assigned = assigningScript?.presenterIds?.includes(p.id) || false;
                      return (
                        <Button 
                          key={p.id} 
                          variant={assigned ? "secondary" : "outline"}
                          className={`justify-between h-10 rounded font-bold transition-all ${assigned ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5' : ''}`}
                          onClick={() => handleTogglePresenter(assigningScript!.id, p.id)}
                        >
                          <span>{p.name}</span>
                          {assigned && <Check className="w-4 h-4 text-amber-500" />}
                        </Button>
                      );
                    });
                  }
                  if (presenterSearch.trim()) {
                    return (
                      <Button
                        variant="outline"
                        className="h-10 rounded font-bold text-emerald-600 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
                        onClick={async () => {
                          const name = presenterSearch.trim();
                          if (!name || !user?.workspaceId) return;
                          try {
                            const id = await addPresenter(name, user.workspaceId, user.uid);
                            setPresenters([...presenters, { id, name, workspaceId: user.workspaceId, createdBy: user.uid }]);
                            setPresenterSearch("");
                            if (assigningScript) {
                              handleTogglePresenter(assigningScript.id, id);
                            }
                            toast.success(`Apresentador "${name}" cadastrado!`);
                          } catch {
                            toast.error("Erro ao cadastrar apresentador.");
                          }
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                        Cadastrar "{presenterSearch.trim()}"
                      </Button>
                    );
                  }
                  return <p className="text-xs text-zinc-400 italic text-center py-4">Nenhum apresentador cadastrado.</p>;
                })()}
              </div>
            </div>

            <Button onClick={() => setAssigningScript(null)} className="w-full h-14 rounded bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px] mt-4">Concluir Atribuição</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!reviewingScript} onOpenChange={(open) => !open && setReviewingScript(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-none rounded-[40px] p-8 shadow-[0_0_100px_rgba(0,0,0,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center mb-2">Concluir Revisão</DialogTitle>
            <p className="text-center text-zinc-500 text-sm font-medium mb-6">Confirme a categoria do roteiro para gerar a tarefa de gravação.</p>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant={selectedCategory === "video" ? "default" : "outline"}
                className={`h-24 rounded flex flex-col gap-2 transition-all ${selectedCategory === "video" ? 'bg-blue-600 text-white shadow-lg scale-105' : ''}`}
                onClick={() => setSelectedCategory("video")}
              >
                <Video className={selectedCategory === "video" ? "text-white" : "text-blue-500"} />
                <span className="font-bold">Vídeo</span>
              </Button>
              <Button 
                variant={selectedCategory === "podcast" ? "default" : "outline"}
                className={`h-24 rounded flex flex-col gap-2 transition-all ${selectedCategory === "podcast" ? 'bg-purple-600 text-white shadow-lg scale-105' : ''}`}
                onClick={() => setSelectedCategory("podcast")}
              >
                <PlusCircle className={selectedCategory === "podcast" ? "text-white" : "text-purple-500"} />
                <span className="font-bold">Podcast</span>
              </Button>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded border border-zinc-100 dark:border-zinc-800">
               <p className="text-[11px] text-zinc-500 leading-relaxed italic">
                 Ao concluir, o roteiro será marcado como <strong>Revisado</strong> e uma tarefa de gravação será criada automaticamente vinculada ao projeto <strong>{reviewingScript?.projectName || reviewingScript?.project}</strong>.
               </p>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setReviewingScript(null)} className="flex-1 h-12 rounded font-bold">Cancelar</Button>
              <Button 
                onClick={handleConcludeReview} 
                className="flex-[2] h-12 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px]"
                disabled={completingReview}
              >
                {completingReview ? <Hourglass className="w-4 h-4 animate-spin mr-2" style={{ animationDuration: "2s" }} /> : <ClipboardCheck className="w-4 h-4 mr-2" />}
                FINALIZAR REVISÃO
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <MoveScriptModal
        open={!!movingScript}
        script={movingScript}
        allScripts={scripts}
        projects={projects}
        currentProjectId={movingScript?.projectId || projects.find(p => p.name === (movingScript?.projectName || movingScript?.project))?.id || ""}
        currentProjectName={movingScript?.projectName || movingScript?.project || "Geral"}
        onClose={() => setMovingScript(null)}
        onMoved={() => { setScripts([...scripts]); }}
      />

      <MoveFolderModal
        open={isMoveFolderOpen}
        folderPath={movingFolder?.path || null}
        allScripts={scripts}
        projects={projects}
        currentProjectId={movingFolder?.projectId || ""}
        currentProjectName={movingFolder?.projectName || "Geral"}
        onClose={() => setIsMoveFolderOpen(false)}
        onMoved={() => { setScripts([...scripts]); }}
      />      {/* DIALOG CRIAR PROJETO */}
      <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-none rounded p-8 shadow-[0_0_100px_rgba(0,0,0,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center mb-2 uppercase tracking-widest">Novo Projeto</DialogTitle>
            <DialogDescription className="text-center text-zinc-500 text-sm font-medium mb-6">
              O projeto será criado no Teleprompt.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proj-name" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nome do Projeto</Label>
              <Input
                id="proj-name"
                placeholder="Ex: Curso de Excel"
                value={newProjectData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const code = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3) + "-" + Math.floor(100 + Math.random() * 900);
                  setNewProjectData({ name, code: newProjectData.code || code });
                }}
                className="h-12 rounded border-zinc-200 dark:border-zinc-800 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proj-code" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Código (ID)</Label>
              <Input
                id="proj-code"
                placeholder="Ex: EXC-001"
                value={newProjectData.code}
                onChange={(e) => setNewProjectData({ ...newProjectData, code: e.target.value })}
                className="h-12 rounded border-zinc-200 dark:border-zinc-800 font-mono font-bold"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-3">
            <Button variant="ghost" onClick={() => setIsCreateProjectOpen(false)} className="flex-1 h-12 rounded font-bold">Cancelar</Button>
            <Button 
              onClick={handleCreateNewProject} 
              disabled={isCreatingProject || !newProjectData.name.trim()}
              className="flex-[2] h-12 rounded bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg"
            >
              {isCreatingProject ? <Hourglass className="w-4 h-4 animate-spin" style={{ animationDuration: "2s" }} /> : "CRIAR PROJETO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Script Confirmation */}
      <AlertDialog open={deleteConfirmScript !== null} onOpenChange={(open) => !open && setDeleteConfirmScript(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Roteiro</AlertDialogTitle>
            <AlertDialogDescription>
              {scripts.find(s => s.id === deleteConfirmScript)?.isPlaceholder
                ? "Tem certeza que deseja excluir esta pasta vazia?"
                : "Tem certeza que deseja excluir este roteiro?"
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteScript} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Project Confirmation */}
      <AlertDialog open={deleteConfirmProject !== null} onOpenChange={(open) => !open && setDeleteConfirmProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este projeto? O projeto será desativado, mas os roteiros permanecerão no dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProject} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Folder Confirmation */}
      <AlertDialog open={deleteConfirmFolder !== null} onOpenChange={(open) => !open && setDeleteConfirmFolder(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Pasta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta pasta e todos os seus {deleteConfirmFolder?.length ?? 0} itens? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteFolder} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick Edit Dialog */}
      <Dialog open={!!quickEditScript} onOpenChange={(open) => { if (!open) setQuickEditScript(null); }}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-widest">Editar Roteiro</DialogTitle>
            <DialogDescription className="text-zinc-500 text-sm">
              Altere o nome do roteiro rapidamente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 mb-2 block">Nome</Label>
            <Input
              value={quickEditTitle}
              onChange={e => setQuickEditTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") quickSaveTitle(); }}
              autoFocus
              className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold text-base"
            />
          </div>
          <DialogFooter className="flex gap-3">
            <Button variant="ghost" onClick={() => setQuickEditScript(null)} className="flex-1 h-11 rounded-xl font-bold text-sm">Cancelar</Button>
            <Button onClick={quickSaveTitle} disabled={!quickEditTitle.trim()} className="flex-[2] h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px]">
              <Check className="w-4 h-4 mr-2" /> Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Status Change Dialog */}
      <Dialog open={!!changingStatusScript} onOpenChange={(open) => { if (!open) setChangingStatusScript(null); }}>
        <DialogContent className="sm:max-w-sm bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-widest">Alterar Status</DialogTitle>
            <DialogDescription className="text-zinc-500 text-sm">
              {changingStatusScript?.title || ""}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {(["rascunho", "em_revisao", "revisao_realizada", "aguardando_gravacao", "gravado", "rejeitado", "nao_gravado"] as ScriptStatus[]).map(status => {
              const cfg = statusConfig[status];
              const isActive = changingStatusValue === status;
              const isCurrent = changingStatusScript?.status === status;
              return (
                <button
                  key={status}
                  onClick={() => setChangingStatusValue(status)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all border-2 ${
                    isActive
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : "border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  } ${status === "nao_gravado" && !isActive ? "border-red-200 dark:border-red-900" : ""}`}
                >
                  <div className={`w-3 h-3 rounded-full shrink-0 ${cfg.color}`} />
                  <div className="flex-1">
                    <span className={`text-sm font-bold ${isCurrent ? "text-blue-600" : "text-zinc-800 dark:text-zinc-200"}`}>
                      {cfg.label}
                    </span>
                    {isCurrent && (
                      <span className="ml-2 text-[9px] font-black uppercase text-zinc-400">(atual)</span>
                    )}
                    {status === "nao_gravado" && (
                      <div className="text-[10px] text-red-500 font-medium mt-0.5 flex items-center gap-1">
                        <X className="w-3 h-3" /> Solicitado para não gravar
                      </div>
                    )}
                  </div>
                  {isActive && <Check className="w-4 h-4 text-blue-500 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Person selector */}
          {changingStatusScript && (() => {
            const status = changingStatusValue;
            const statusLabel = statusConfig[status]?.label || status;
            if (allUsers.length === 0) return null;
            return (
              <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-zinc-500">
                  <UserPlus className="w-3.5 h-3.5" /> {statusLabel} por:
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {allUsers.map(u => {
                    const isSelected = changingStatusPersonId === u.uid;
                    return (
                      <button
                        key={u.uid}
                        onClick={() => {
                          setChangingStatusPersonId(isSelected ? "" : u.uid);
                          setChangingStatusPersonName(isSelected ? "" : (u.displayName || u.name || "Usuário"));
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/20 ring-1 ring-blue-500"
                            : "hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                        }`}
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={u.photoURL || undefined} />
                          <AvatarFallback className="text-[9px]">
                            {(u.displayName || u.name || "U").slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-bold flex-1 truncate text-zinc-800 dark:text-zinc-200">
                          {u.displayName || u.name}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          <DialogFooter className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={() => setChangingStatusScript(null)} className="flex-1 h-11 rounded-xl font-bold text-sm">
              Cancelar
            </Button>
            <Button
              onClick={handleQuickStatusChange}
              disabled={changingStatusValue === changingStatusScript?.status && !changingStatusPersonId}
              className="flex-[2] h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px]"
            >
              <Settings className="w-4 h-4 mr-2" /> Alterar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comments Panel Overlay */}
      {openCommentsScriptId && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="h-full shadow-2xl">
            <CommentsPanel 
              scriptId={openCommentsScriptId} 
              onClose={() => setOpenCommentsScriptId(null)} 
            />
          </div>
        </div>
      )}
    </div>
    </>
  );
}