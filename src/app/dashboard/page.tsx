"use client";

import React, { useEffect, useState, useCallback } from "react";
import { collection, query, getDocs, deleteDoc, doc, updateDoc, writeBatch, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { SENAI_WORKSPACE_ID } from "@/lib/constants";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Link2 as LinkIcon, Plus, Play, Trash2, Edit2, Check, Folder, FolderInput, X, FileText, Send, Clock, CheckCircle2, ChevronRight, ChevronDown, Briefcase, Loader2, Users, UserPlus, Video, PlusCircle, PlusSquare, ClipboardCheck, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Suspense } from "react";
import { fetchZeckiProjects, ZeckiProject, createRecordingTask, createEditingTask, createZeckiProject, deleteZeckiProject } from "@/lib/zecki";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type ScriptStatus = "rascunho" | "em_revisao" | "revisao_realizada" | "aguardando_gravacao" | "gravado" | "rejeitado";
type ScriptCategory = "video" | "podcast";

interface ScriptDoc {
  id: string;
  title: string;
  project?: string;
  projectName?: string;
  projectId?: string;
  folder?: string;
  subfolder?: string;
  createdAt: string;
  status: ScriptStatus;
  category?: "video" | "podcast";
  editorId?: string;
  editorName?: string;
  reviewerId?: string;
  reviewerName?: string;
  commentCount?: number;
  commentAuthors?: string[];
}

const statusConfig: Record<ScriptStatus, { label: string; color: string; icon: React.ElementType }> = {
  rascunho: { label: "Rascunho", color: "bg-orange-500", icon: FileText },
  em_revisao: { label: "Em Revisão", color: "bg-yellow-500", icon: Clock },
  revisao_realizada: { label: "Revisado", color: "bg-emerald-500", icon: CheckCircle2 },
  aguardando_gravacao: { label: "Revisado", color: "bg-green-500", icon: CheckCircle2 },
  gravado: { label: "Gravado", color: "bg-blue-600", icon: Send },
  rejeitado: { label: "Rejeitado", color: "bg-red-500", icon: X },
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-black animate-pulse text-blue-500">CARREGANDO...</div>}>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const { user, allUsers } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [scripts, setScripts] = useState<ScriptDoc[]>([]);
  const [projects, setProjects] = useState<ZeckiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningScript, setAssigningScript] = useState<ScriptDoc | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [statusFilter, setStatusFilter] = useState<ScriptStatus | "all">("all");
  const [reviewingScript, setReviewingScript] = useState<ScriptDoc | null>(null);
  const [completingReview, setCompletingReview] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: "", code: "" });
  const [filterCommenter, setFilterCommenter] = useState<string>("all");
  
  const handleCopyInvite = () => {
    if (!user?.workspaceId) {
      toast.error("Você não está vinculado a um workspace.");
      return;
    }
    const inviteUrl = `${window.location.origin}/login?workspaceId=${user.workspaceId}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Link de convite copiado para a área de transferência!");
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

  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderData, setNewFolderData] = useState({ projectName: "", folder: "", subfolder: "" });

  const handleCreateFolderClick = (projectName: string) => {
    setNewFolderData({ projectName, folder: "", subfolder: "" });
    setIsCreateFolderOpen(true);
  };

  const projectIdFilter = searchParams.get("projectId");
  const selectedProject = projects.find(p => p.id === projectIdFilter);

  const loadProjects = useCallback(async () => {
    try {
      const workspaceId = user?.workspaceId || SENAI_WORKSPACE_ID;
      const projectsData = await fetchZeckiProjects(workspaceId);
      setProjects(projectsData);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
    } finally {
      setLoadingProjects(false);
    }
  }, [user?.workspaceId]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    async function fetchData() {
      if (!user) {
        setLoading(false);
        setLoadingProjects(false);
        return;
      }
      
      const activeWorkspaceId = user.workspaceId || SENAI_WORKSPACE_ID;

      try {
        await loadProjects();

        const scriptsRef = collection(db, "scripts");
        const q = activeWorkspaceId === SENAI_WORKSPACE_ID 
          ? query(scriptsRef) 
          : query(scriptsRef, where("workspaceId", "==", activeWorkspaceId)); 

        const snapshot = await getDocs(q);
        
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
      } catch (err) {
        console.error("ERRO CRÍTICO AO CARREGAR DADOS:", err);
        toast.error("Erro ao carregar dados do dashboard.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
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
    if (!confirm("Tem certeza que deseja excluir este projeto?")) return;
    try {
      await deleteZeckiProject(projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      if (projectIdFilter === projectId) router.push("/dashboard");
      toast.success("Projeto excluído com sucesso!");
    } catch {
      toast.error("Erro ao excluir projeto.");
    }
  };

  const handleAssign = async (scriptId: string, userId: string, userName: string, field: 'editor' | 'reviewer') => {
    try {
      const scriptRef = doc(db, "scripts", scriptId);
      const updateData = field === 'editor' 
        ? { editorId: userId, editorName: userName }
        : { reviewerId: userId, reviewerName: userName };
      
      await updateDoc(scriptRef, {
        ...updateData,
        updatedAt: new Date().toISOString()
      });
      
      setScripts(scripts.map(s => s.id === scriptId ? { ...s, ...updateData } : s));
      toast.success(`${field === 'editor' ? 'Editor' : 'Revisor'} atribuído com sucesso!`);
    } catch (error) {
      console.error("Erro ao atribuir:", error);
      toast.error("Erro ao realizar atribuição.");
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
      
      if (reviewingScript.projectId) {
        const recordingTaskId = await createRecordingTask(
          reviewingScript.projectId,
          reviewingScript.title,
          reviewingScript.id,
          user?.uid || "",
          user?.workspaceId || SENAI_WORKSPACE_ID,
          selectedCategory,
          `${window.location.origin}/tp/${reviewingScript.id}`,
          reviewingScript.editorId,
          reviewingScript.reviewerId
        );
        
        const editingTaskId = await createEditingTask(
          reviewingScript.projectId,
          reviewingScript.title,
          reviewingScript.id,
          user?.uid || "",
          user?.workspaceId || SENAI_WORKSPACE_ID,
          selectedCategory,
          `${window.location.origin}/tp/${reviewingScript.id}`,
          reviewingScript.editorId,
          reviewingScript.reviewerId
        );

        await updateDoc(scriptRef, {
          recordingTaskId,
          editingTaskId
        });
        
        toast.success(`Tarefas de Gravação e Edição de ${selectedCategory === "video" ? "Vídeo" : "Podcast"} criadas!`);
      }
      
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
    if (user?.role === "Estagiário") {
      toast.error("Acesso negado: Estagiários não possuem permissão para excluir roteiros.");
      return;
    }

    if (!confirm("Tem certeza que deseja excluir este roteiro?")) return;
    try {
      await deleteDoc(doc(db, "scripts", id));
      setScripts(scripts.filter(s => s.id !== id));
      toast.success("Roteiro excluído com sucesso.");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir roteiro.");
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
      setScripts(scripts.map(s => (s.projectName || s.project || "Geral") === oldName ? { ...s, projectName: newProjectTitle } : s));
      setEditingProjectName(null);
      toast.success("Projeto renomeado com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao renomear projeto.");
    }
  };

  const [editingFolderName, setEditingFolderName] = useState<{project: string, folder: string} | null>(null);
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [movingScript, setMovingScript] = useState<ScriptDoc | null>(null);
  const [moveFolderName, setMoveFolderName] = useState("");
  const [moveProjectName, setMoveProjectName] = useState("");

  const handleMoveScript = async () => {
    if (!movingScript) return;
    try {
      const ref = doc(db, "scripts", movingScript.id);
      await updateDoc(ref, { 
        folder: moveFolderName || "Sem Pasta",
        projectName: moveProjectName || movingScript.projectName || "Geral"
      });
      
      setScripts(scripts.map(s => s.id === movingScript.id ? { 
        ...s, 
        folder: moveFolderName || "Sem Pasta",
        projectName: moveProjectName || movingScript.projectName || "Geral"
      } : s));
      
      setMovingScript(null);
      toast.success("Roteiro movido com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao mover roteiro.");
    }
  };

  const handleCreateNewProject = async () => {
    if (!newProjectData.name.trim()) return;
    setIsCreatingProject(true);
    try {
      const workspaceId = user?.workspaceId || SENAI_WORKSPACE_ID;
      
      const payload: Partial<ZeckiProject> = {
        name: newProjectData.name,
        code: newProjectData.code || newProjectData.name.toUpperCase().slice(0, 3),
        workspaceId: workspaceId,
        status: 'active'
      };

      const createdProj = await createZeckiProject(payload);
      
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

  const handleRenameFolder = async (projectName: string, oldFolderName: string) => {
    if (!newFolderTitle.trim() || oldFolderName === newFolderTitle) {
      setEditingFolderName(null);
      return;
    }
    try {
      const batch = writeBatch(db);
      const scriptsToUpdate = scripts.filter(s => 
        (s.projectName || s.project || "Geral") === projectName && 
        (s.folder || "Sem Pasta") === oldFolderName
      );
      
      scriptsToUpdate.forEach(s => {
        const ref = doc(db, "scripts", s.id);
        batch.update(ref, { folder: newFolderTitle });
      });

      await batch.commit();
      setScripts(scripts.map(s => 
        ((s.projectName || s.project || "Geral") === projectName && (s.folder || "Sem Pasta") === oldFolderName)
          ? { ...s, folder: newFolderTitle } 
          : s
      ));
      setEditingFolderName(null);
      toast.success("Pasta renomeada com sucesso!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao renomear pasta.");
    }
  };

  const allCommenters = Array.from(new Set(scripts.flatMap(s => s.commentAuthors || [])));

  const groupedScripts = filteredScripts.reduce((acc, script) => {
    const projectName = script.projectName || script.project || "Geral";
    const folderName = script.folder || "Sem Pasta";
    const subfolderName = script.subfolder || "";
    
    if (!acc[projectName]) acc[projectName] = {};
    if (!acc[projectName][folderName]) acc[projectName][folderName] = {};
    if (!acc[projectName][folderName][subfolderName]) acc[projectName][folderName][subfolderName] = [];
    
    acc[projectName][folderName][subfolderName].push(script);
    return acc;
  }, {} as Record<string, Record<string, Record<string, ScriptDoc[]>>>);

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
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
        <div className="flex gap-3">
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
              onClick={() => router.push("/dashboard")} 
              className="rounded border-blue-500 text-blue-500 hover:bg-blue-50"
            >
              Ver Todos
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={() => setIsCreateProjectOpen(true)}
            className="rounded border-zinc-200 dark:border-zinc-800 flex gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <PlusCircle className="w-4 h-4 text-emerald-500" />
            Novo Projeto
          </Button>
          <Button 
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

      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Projetos Ativos
          </h2>
          <Button variant="ghost" size="sm" onClick={() => router.push("/projects")} className="text-xs text-blue-500 hover:text-blue-600">
            Ver Todos <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto p-5 custom-scrollbar pb-8">
          {loadingProjects ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="min-w-[200px] h-24 bg-zinc-100 dark:bg-zinc-900 animate-pulse rounded-xl border border-zinc-200 dark:border-zinc-800" />
            ))
          ) : projects.length === 0 ? (
            <div className="w-full py-6 px-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
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
                      router.push("/dashboard");
                    } else {
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
                        className="h-6 w-6 rounded-full hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
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
      </div>

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
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

      {allCommenters.length > 0 && (
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Comentários de:</span>
            <Select value={filterCommenter} onValueChange={setFilterCommenter}>
              <SelectTrigger className="w-[200px] h-7 border-none bg-transparent shadow-none text-[10px] font-bold focus:ring-0">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                <SelectItem value="all" className="text-[10px] font-black uppercase">Todos</SelectItem>
                {allCommenters.map(author => (
                  <SelectItem key={author} value={author} className="text-[10px] font-black uppercase">{author}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
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
        <div className="space-y-16">
          {Object.entries(groupedScripts)
            .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' }))
            .map(([projectName, folders]) => (
            <div key={projectName} id={`project-section-${projectName}`} className="space-y-8">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 group/header cursor-pointer select-none" onClick={() => toggleProjectCollapse(projectName)}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                    {collapsedProjects.has(projectName) ? <ChevronRight className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </div>
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Folder className="w-5 h-5 text-blue-500" />
                  </div>
                  {editingProjectName === projectName ? (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Input 
                        value={newProjectTitle} 
                        onChange={(e) => setNewProjectTitle(e.target.value)}
                        className="h-8 w-64"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={() => handleRenameProject(projectName)}><Check className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingProjectName(null)}><X className="w-4 h-4" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100 uppercase tracking-widest">{projectName}</h2>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingProjectName(projectName); setNewProjectTitle(projectName); }}
                        className="opacity-0 group-hover/header:opacity-100 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-all"
                      >
                        <Edit2 className="w-3 h-3 text-zinc-400" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Badge variant="secondary" className="font-black text-[9px] tracking-widest">
                    {Object.values(folders).reduce((acc, subfolders) => acc + Object.values(subfolders).flat().length, 0)} ROTEIROS
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-blue-500"
                    onClick={() => handleCreateFolderClick(projectName)}
                  >
                    <PlusSquare className="w-3.5 h-3.5 mr-1.5" /> NOVA PASTA
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-blue-500"
                    onClick={() => {
                      const project = projects.find(p => p.name === projectName);
                      const pid = project?.id || Object.values(folders).flat()[0]?.projectId || "";
                      router.push(`/editor/new?project=${encodeURIComponent(projectName)}&projectId=${pid}`);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" /> NOVO ROTEIRO
                  </Button>
                </div>
              </div>
              
              {!collapsedProjects.has(projectName) && (
                <div className="space-y-12 animate-in fade-in slide-in-from-top-2 duration-300">
                {Object.entries(folders)
                  .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' }))
                  .map(([folderName, subfolders]) => (
                  <div key={folderName} className="space-y-8">
                    {Object.entries(subfolders)
                      .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' }))
                      .map(([subfolderName, projectScripts]) => (
                      <div key={subfolderName} className="space-y-4">
                        <div className="flex items-center justify-between px-1 group/folder-header">
                          <div className="flex items-center gap-2">
                            <div className={`w-1 h-4 ${subfolderName ? 'bg-blue-400' : 'bg-zinc-300 dark:bg-zinc-700'} rounded`} />
                            {editingFolderName?.project === projectName && editingFolderName?.folder === folderName ? (
                              <div className="flex items-center gap-2">
                                <Input 
                                  value={newFolderTitle} 
                                  onChange={(e) => setNewFolderTitle(e.target.value)}
                                  className="h-6 w-48 text-[10px]"
                                  autoFocus
                                />
                                <Button size="icon" variant="ghost" className="h-6 w-6 text-green-500" onClick={() => handleRenameFolder(projectName, folderName)}><Check className="w-3 h-3" /></Button>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingFolderName(null)}><X className="w-3 h-3" /></Button>
                              </div>
                            ) : (
                              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                                {folderName} {subfolderName && <><ChevronRight className="w-3 h-3 text-zinc-600" /> <span className="text-blue-500/80">{subfolderName}</span></>}
                                <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-black border-zinc-200 dark:border-zinc-800 text-zinc-400">
                                  {projectScripts.length}
                                </Badge>
                                <button 
                                  onClick={() => { setEditingFolderName({project: projectName, folder: folderName}); setNewFolderTitle(folderName); }}
                                  className="opacity-0 group-hover/folder-header:opacity-100 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-all"
                                >
                                  <Edit2 className="w-2.5 h-2.5 text-zinc-400" />
                                </button>
                              </h3>
                            )}
                          </div>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-blue-500 opacity-0 group-hover/folder-header:opacity-100 transition-opacity"
                            onClick={() => {
                              const project = projects.find(p => p.name === projectName);
                              const pid = project?.id || projectScripts[0]?.projectId || "";
                              const url = `/editor/new?project=${encodeURIComponent(projectName)}&projectId=${pid}&folder=${encodeURIComponent(folderName)}&subfolder=${encodeURIComponent(subfolderName)}`;
                              router.push(url);
                            }}
                          >
                            <Plus className="w-3 h-3 mr-1" /> Criar aqui
                          </Button>
                        </div>

                        <div className="relative">
                          <div className="flex gap-6 overflow-x-auto p-5 custom-scrollbar snap-x snap-mandatory pb-8">
                            {projectScripts.map(script => (
                              <div key={script.id} className="min-w-[300px] md:min-w-[350px] snap-start relative pl-2">
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
                            <Card className={`h-full border-zinc-200 dark:border-zinc-800 hover:shadow-xl transition-all group flex flex-col 
                              ${script.status === "rascunho" ? "ring-2 ring-orange-500/30 border-orange-500/50" : ""}
                              ${(script.status === "aguardando_gravacao" || script.status === "revisao_realizada") ? "ring-2 ring-emerald-500/30 border-emerald-500/50" : ""}
                              ${script.status === "em_revisao" ? "ring-2 ring-yellow-500/30 border-yellow-500/50" : ""}
                              ${script.status === "gravado" ? "ring-2 ring-blue-600/30 border-blue-600/50" : ""}
                            `}>
                              <CardHeader className="p-5 pb-2">
                                {editingId === script.id ? (
                                  <div className="flex items-center gap-2">
                                    <Input 
                                      value={editTitle} 
                                      onChange={(e) => setEditTitle(e.target.value)} 
                                      autoFocus 
                                      onKeyDown={(e) => e.key === 'Enter' && saveTitle(script.id)}
                                      className="h-8"
                                    />
                                    <Button size="icon" variant="ghost" onClick={() => saveTitle(script.id)}>
                                      <Check className="w-4 h-4 text-green-500" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-start justify-between group/title">
                                    <CardTitle className="text-base leading-tight font-black break-all whitespace-normal" title={script.title}>{script.title}</CardTitle>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-7 w-7 opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0" 
                                      onClick={() => { setEditingId(script.id); setEditTitle(script.title); }}
                                    >
                                      <Edit2 className="w-3 h-3 text-muted-foreground" />
                                    </Button>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  {script.status === "rascunho" && (
                                    <Badge className="bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest px-2 h-5 animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.3)]">
                                      Aguardando Revisão
                                    </Badge>
                                  )}
                                  {(script.status === "revisao_realizada" || script.status === "aguardando_gravacao") && (
                                    <Badge className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2 h-5 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                                      Aguardando Gravação
                                    </Badge>
                                  )}
                                  {script.status === "gravado" && (
                                    <Badge className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-2 h-5 animate-pulse shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                                      Aguardando Edição
                                    </Badge>
                                  )}
                                  {script.status === "em_revisao" && (
                                    <Badge className="bg-yellow-500 text-white text-[9px] font-black uppercase tracking-widest px-2 h-5">
                                      Em Revisão
                                    </Badge>
                                  )}
                                </div>
                              </CardHeader>
                              
                              <CardContent className="p-5 pt-2 flex-grow space-y-4">
                                <div className="space-y-1.5 border-y border-zinc-100 dark:border-zinc-800/50 py-3 my-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-black uppercase text-zinc-400 tracking-tighter">Responsável</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                                        {script.editorName || "Não atribuído"}
                                      </span>
                                      {script.editorId && <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center text-[8px] font-bold text-blue-600">ED</div>}
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[8px] font-black uppercase text-zinc-400 tracking-tighter">Revisor</span>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300">
                                        {script.reviewerName || "Não atribuído"}
                                      </span>
                                      {script.reviewerId && <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[8px] font-bold text-emerald-600">RV</div>}
                                    </div>
                                  </div>
                                </div>
                                
                                <p className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-bold uppercase tracking-widest">
                                  <Clock className="w-3 h-3" />
                                  {script.createdAt ? format(new Date(script.createdAt), "dd 'de' MMMM", { locale: ptBR }) : "Sem data"}
                                </p>

                                {script.commentCount ? (
                                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/50 mt-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <div className="bg-blue-500/10 text-blue-500 p-1 rounded">
                                          <MessageSquare className="w-3 h-3" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest">
                                          {script.commentCount} {script.commentCount === 1 ? "Comentário" : "Comentários"}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {Array.from(new Set(script.commentAuthors || [])).map((author, i) => (
                                        <Badge key={i} variant="secondary" className="text-[8px] h-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold border-none">
                                          {author}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                                
                                <div className="grid grid-cols-2 gap-2 mt-4">
                                  <Button variant="outline" size="sm" className="h-9 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 border-2" asChild>
                                    <Link href={`/tp/${script.id}`}>
                                      <Play className="w-3 h-3 mr-1.5 text-blue-500" /> Play
                                    </Link>
                                  </Button>
                                  
                                  {script.status === "em_revisao" ? (
                                    <div className="flex flex-col gap-1 w-full">
                                      <Button variant="secondary" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest bg-yellow-500 hover:bg-yellow-600 text-white w-full" asChild>
                                        <Link href={`/editor/${script.id}`}>
                                          <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" /> Revisar
                                        </Link>
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 text-[10px] font-black uppercase tracking-widest border-emerald-500 text-emerald-600 hover:bg-emerald-50 w-full"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setReviewingScript(script);
                                          setSelectedCategory(script.category || "video");
                                        }}
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Concluir
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button variant="outline" size="sm" className="h-9 text-[10px] font-black uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 border-2" asChild>
                                      <Link href={`/editor/${script.id}`}>
                                        <Edit2 className="w-3 h-3 mr-1.5 text-zinc-400" /> Editar
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </CardContent>

                              <CardFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/50 p-3 h-12 flex justify-between">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 text-[9px] font-black text-zinc-400 uppercase tracking-widest"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${window.location.origin}/tp/${script.id}`);
                                    toast.success("Link copiado!");
                                  }}
                                >
                                  <LinkIcon className="w-3 h-3 mr-1.5" /> Link
                                </Button>
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 text-[9px] font-black text-zinc-400 uppercase tracking-widest"
                                  onClick={() => {
                                    setMovingScript(script);
                                    setMoveFolderName(script.folder || "Sem Pasta");
                                    setMoveProjectName(script.projectName || script.project || "Geral");
                                  }}
                                >
                                  <FolderInput className="w-3 h-3 mr-1.5" /> Mover
                                </Button>

                                {(user?.email === "zecki1@hotmail.com" || user?.email === "ezequiel.rmoncao@sp.senai.br" || user?.role === "SuperAdmin") && (
                                   <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 text-[9px] font-black text-blue-500 uppercase tracking-widest"
                                      onClick={() => setAssigningScript(script)}
                                   >
                                     <UserPlus className="w-3 h-3 mr-1.5" /> Equipe
                                   </Button>
                                )}
                                
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 text-red-500/50 hover:text-red-500 hover:bg-red-500/10"
                                  onClick={() => deleteScript(script.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </CardFooter>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
)}

      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-none rounded p-8 shadow-[0_0_100px_rgba(0,0,0,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center mb-2 uppercase tracking-widest">Nova Pasta/Subpasta</DialogTitle>
            <DialogDescription className="text-center text-zinc-500 text-sm font-medium mb-6">
              As pastas são criadas automaticamente ao criar um roteiro nelas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Projeto</Label>
              <Input value={newFolderData.projectName} disabled className="h-12 rounded border-zinc-200 dark:border-zinc-800 font-bold bg-zinc-50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="folder-name" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nome da Pasta</Label>
              <Input
                id="folder-name"
                placeholder="Ex: Módulo 1"
                value={newFolderData.folder}
                onChange={(e) => setNewFolderData({ ...newFolderData, folder: e.target.value })}
                className="h-12 rounded border-zinc-200 dark:border-zinc-800 font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subfolder-name" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Subpasta (Opcional)</Label>
              <Input
                id="subfolder-name"
                placeholder="Ex: Aula 1"
                value={newFolderData.subfolder}
                onChange={(e) => setNewFolderData({ ...newFolderData, subfolder: e.target.value })}
                className="h-12 rounded border-zinc-200 dark:border-zinc-800 font-bold"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-3">
            <Button variant="ghost" onClick={() => setIsCreateFolderOpen(false)} className="flex-1 h-12 rounded font-bold">Cancelar</Button>
            <Button 
              onClick={() => {
                const project = projects.find(p => p.name === newFolderData.projectName);
                const pid = project?.id || "";
                const url = `/editor/new?project=${encodeURIComponent(newFolderData.projectName)}&projectId=${pid}&folder=${encodeURIComponent(newFolderData.folder || "Raiz")}&subfolder=${encodeURIComponent(newFolderData.subfolder)}`;
                router.push(url);
                setIsCreateFolderOpen(false);
              }} 
              disabled={!newFolderData.folder.trim()}
              className="flex-[2] h-12 rounded bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg"
            >
              CRIAR NESTA PASTA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assigningScript} onOpenChange={(open) => !open && setAssigningScript(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-none rounded-[40px] p-8 shadow-[0_0_100px_rgba(0,0,0,0.2)] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center mb-2">Atribuir Colaboradores</DialogTitle>
            <p className="text-center text-zinc-500 text-sm font-medium mb-6">Selecione quem será responsável pela edição e revisão deste roteiro.</p>
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

            <Button onClick={() => setAssigningScript(null)} className="w-full h-14 rounded bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px] mt-4">Concluir Atribuição</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!reviewingScript} onOpenChange={(open) => !open && setReviewingScript(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-none rounded-[40px] p-8 shadow-[0_0_100px_rgba(0,0,0,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center mb-2">Concluir Revisão</DialogTitle>
            <p className="text-center text-zinc-500 text-sm font-medium mb-6">Confirme a categoria do roteiro para gerar a tarefa de gravação no Zecki.</p>
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
                {completingReview ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ClipboardCheck className="w-4 h-4 mr-2" />}
                FINALIZAR REVISÃO
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG MOVER ROTEIRO */}
      <Dialog open={!!movingScript} onOpenChange={(open) => !open && setMovingScript(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-none rounded p-8 shadow-[0_0_100px_rgba(0,0,0,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-center mb-2 uppercase tracking-widest">Mover Roteiro</DialogTitle>
            <DialogDescription className="text-center text-zinc-500 text-xs font-medium mb-6">
              Mova &ldquo;{movingScript?.title}&rdquo; para outro projeto ou pasta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Projeto</Label>
              <Select value={moveProjectName} onValueChange={setMoveProjectName}>
                <SelectTrigger className="h-10 rounded border-zinc-200 dark:border-zinc-800 font-bold">
                  <SelectValue placeholder="Selecionar Projeto" />
                </SelectTrigger>
                <SelectContent className="rounded border-none shadow-xl">
                  <SelectItem value="Geral" className="font-bold">Geral</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.name} className="font-bold">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Pasta</Label>
              <Input 
                value={moveFolderName} 
                onChange={(e) => setMoveFolderName(e.target.value)}
                placeholder="Ex: Módulo 1, Social Media..."
                className="h-10 rounded border-zinc-200 dark:border-zinc-800 font-bold"
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {Array.from(new Set(scripts.filter(s => (s.projectName || s.project || "Geral") === moveProjectName).map(s => s.folder).filter(Boolean))).map(f => (
                  <button 
                    key={f} 
                    onClick={() => setMoveFolderName(f!)}
                    className="text-[9px] font-black px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-500 hover:text-white transition-colors uppercase tracking-widest"
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-3">
            <Button variant="ghost" onClick={() => setMovingScript(null)} className="flex-1 h-12 rounded font-bold">Cancelar</Button>
            <Button 
              onClick={handleMoveScript} 
              className="flex-[2] h-12 rounded bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px]"
            >
              MOVER AGORA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* DIALOG CRIAR PROJETO */}
      <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-none rounded p-8 shadow-[0_0_100px_rgba(0,0,0,0.2)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center mb-2 uppercase tracking-widest">Novo Projeto</DialogTitle>
            <DialogDescription className="text-center text-zinc-500 text-sm font-medium mb-6">
              O projeto será criado no Teleprompt e sincronizado com o Zecki Dashboard.
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
              {isCreatingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : "CRIAR PROJETO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
    </div>
  );
}