"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/PageTransitionLoader";
import { fetchZeckiProjects as getProjects, ZeckiProject as Project, createZeckiProject as createProject, deleteZeckiProject as deleteProject, updateZeckiProject } from "@/lib/zecki";
import { SENAI_WORKSPACE_ID } from "@/lib/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
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
  Plus, 
  PlusCircle,
  FolderOpen, 
  Hourglass, 
  Link2, 
  Calendar,
  Eye,
  Trash2,
  Check,
  Edit2,
  X,
  ArrowLeftRight,
  LayoutGrid,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, query, where, getDocs, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ScriptDoc } from "@/types/script";

export default function ProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", code: "" });
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<string | null>(null);
  const [scriptsByProject, setScriptsByProject] = useState<Record<string, ScriptDoc[]>>({});
  const [editingProjectCode, setEditingProjectCode] = useState<string | null>(null);
  const [editCodeValue, setEditCodeValue] = useState("");
  const [editingProjectName, setEditingProjectName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'scroll'>('scroll');

  useEffect(() => {
    const saved = localStorage.getItem("teleprompt_view_mode");
    if (saved === 'list' || saved === 'scroll') setViewMode(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("teleprompt_view_mode", viewMode);
  }, [viewMode]);

  const isProjectConcluded = (projectName: string): boolean => {
    const projectScripts = scriptsByProject[projectName] || [];
    if (projectScripts.length === 0) return true;
    return projectScripts.every(s => s.status === "gravado" || s.status === "rejeitado");
  };

  const projectsContent = useMemo(() => {
    if (projects.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="w-16 h-16 text-zinc-300 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum projeto encontrado</h3>
            <p className="text-zinc-500 mb-4">
              Crie seu primeiro projeto para começar a trabalhar com roteiros.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Projeto
            </Button>
          </CardContent>
        </Card>
      );
    }
    if (viewMode === 'scroll') {
      return (
        <div className="flex gap-6 overflow-x-auto p-2 custom-scrollbar snap-x snap-mandatory pb-6">
          {projects.map((project) => {
            const concluded = isProjectConcluded(project.name);
            return (
              <Card 
                key={project.id} 
                className={`min-w-[280px] max-w-[280px] flex-shrink-0 snap-start hover:shadow-lg transition-all cursor-pointer group border-zinc-200 dark:border-zinc-800 ${
                  concluded ? 'opacity-75 hover:opacity-100' : ''
                }`}
                onClick={() => router.push(`/dashboard?projectId=${project.id}`)}
              >
                <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">{project.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        {project.code || "Sem código"}
                      </CardDescription>
                    </div>
                    <Badge variant={concluded ? "secondary" : "default"}>
                      {concluded ? "Concluído" : "Ativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-zinc-500">
                      <Calendar className="w-4 h-4" />
                      {project.createdAt ? format(new Date(project.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                    </div>
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Ver Roteiros <Eye className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-[11px] text-zinc-400">
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Local</span>
                  </div>
                  {concluded && (
                    <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-[11px] text-zinc-500">
                      <Check className="w-3.5 h-3.5" />
                      <span>Todos os roteiros concluídos</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {projects.map((project) => {
          const concluded = isProjectConcluded(project.name);
          return (
            <div
              key={project.id}
              onClick={() => router.push(`/dashboard?projectId=${project.id}`)}
              className={`flex items-center gap-4 px-4 py-3 rounded-lg cursor-pointer transition-all border ${
                concluded ? 'opacity-75 hover:opacity-100' : ''
              } hover:bg-zinc-50 dark:hover:bg-zinc-900/50 hover:border-zinc-200 dark:hover:border-zinc-700 border-transparent`}
            >
              <Badge variant={concluded ? "secondary" : "outline"} className="text-[10px] uppercase font-mono px-2 py-0 h-6 w-16 shrink-0">
                {project.code || "PRJ"}
              </Badge>
              <span className="text-sm font-bold flex-1 truncate text-zinc-800 dark:text-zinc-200">
                {project.name}
              </span>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Calendar className="w-3.5 h-3.5" />
                {project.createdAt ? format(new Date(project.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
              </div>
              {concluded && (
                <Badge className="bg-zinc-500 text-white text-[9px] font-black uppercase tracking-widest px-2 h-5 border-none">
                  <Check className="w-3 h-3 mr-0.5" /> Concluído
                </Badge>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/30"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/editor/new?project=${encodeURIComponent(project.name)}&projectId=${project.id}`);
                }}
                title="Adicionar Novo Roteiro"
              >
                <PlusCircle className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                onClick={(e) => handleDeleteProject(e, project.id)}
                title="Excluir Projeto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          );
        })}
      </div>
    );
  }, [projects, viewMode, editingProjectName, editNameValue, editingProjectCode, editCodeValue, scriptsByProject, router]);

  const loadProjects = useCallback(async () => {
    try {
      const workspaceId = user?.workspaceId || SENAI_WORKSPACE_ID;
      const projectsData = await getProjects(workspaceId);
      setProjects(projectsData);

      const scriptsRef = collection(db, "scripts");
      const q = workspaceId === SENAI_WORKSPACE_ID
        ? query(scriptsRef)
        : query(scriptsRef, where("workspaceId", "==", workspaceId));
      const snapshot = await getDocs(q);
      const allScripts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ScriptDoc[];

      const grouped: Record<string, ScriptDoc[]> = {};
      allScripts.forEach(s => {
        const pName = s.projectName || s.project || "Geral";
        if (!grouped[pName]) grouped[pName] = [];
        grouped[pName].push(s);
      });
      setScriptsByProject(grouped);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.workspaceId]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadProjects();
  }, [user, router, loadProjects]);

  const handleCreateProject = async () => {
    if (!newProject.name.trim() || !newProject.code.trim()) return;
    
    setCreating(true);
    try {
      const workspaceId = user?.workspaceId || SENAI_WORKSPACE_ID;
      
      const created = await createProject({
        name: newProject.name,
        code: newProject.code,
        workspaceId,
        status: "active",
      });

      setProjects([created, ...projects]);
      setIsCreateOpen(false);
      setNewProject({ name: "", code: "" });
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
    } finally {
      setCreating(false);
    }
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
      if (user) {
        const { logActivity } = await import("@/lib/activity");
        await logActivity({
          userId: user.uid,
          userName: user.displayName || user.name || user.email || "Usuário",
          action: "ExcluiuProjeto",
          projectId,
          projectName,
          snapshot: projects.find(p => p.id === projectId) as unknown as Record<string, unknown> | undefined,
          workspaceId: user.workspaceId || SENAI_WORKSPACE_ID,
        });
      }
      toast.success("Projeto excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir projeto:", error);
      toast.error("Erro ao excluir projeto.");
    }
  };

  const generateCode = (name: string) => {
    const prefix = name
      .toUpperCase()
      .replace(/[^A-Z]/g, "")
      .slice(0, 3);
    const num = String(projects.length + 1).padStart(3, "0");
    return `${prefix}-${num}`;
  };

  const handleEditCode = (projectId: string, currentCode: string) => {
    setEditingProjectCode(projectId);
    setEditCodeValue(currentCode);
  };

  const handleSaveCode = async (projectId: string) => {
    if (!editCodeValue.trim()) {
      setEditingProjectCode(null);
      return;
    }
    try {
      await updateZeckiProject(projectId, { code: editCodeValue.trim() });
      setProjects(projects.map(p => p.id === projectId ? { ...p, code: editCodeValue.trim() } : p));
      if (user) {
        const { logActivity } = await import("@/lib/activity");
        const project = projects.find(p => p.id === projectId);
        await logActivity({
          userId: user.uid,
          userName: user.displayName || user.name || user.email || "Usuário",
          action: "EditouProjeto",
          projectId,
          projectName: project?.name || "",
          metadata: `Código alterado para "${editCodeValue.trim()}"`,
          snapshot: { previousName: project?.name || "", previousCode: project?.code || "" } as Record<string, unknown>,
          workspaceId: user.workspaceId || SENAI_WORKSPACE_ID,
        });
      }
      toast.success("Código do projeto atualizado!");
    } catch {
      toast.error("Erro ao atualizar código.");
    }
    setEditingProjectCode(null);
  };

  const handleEditName = (projectId: string, currentName: string) => {
    setEditingProjectName(projectId);
    setEditNameValue(currentName);
  };

  const handleSaveName = async (projectId: string, oldName: string) => {
    if (!editNameValue.trim() || editNameValue.trim() === oldName) {
      setEditingProjectName(null);
      return;
    }
    const newName = editNameValue.trim();
    try {
      await updateZeckiProject(projectId, { name: newName });
      setProjects(projects.map(p => p.id === projectId ? { ...p, name: newName } : p));

      const scriptsRef = collection(db, "scripts");
      const q = query(scriptsRef, where("projectName", "==", oldName));
      const snapshot = await getDocs(q);
      const fbBatch = writeBatch(db);
      snapshot.docs.forEach(d => fbBatch.update(doc(db, "scripts", d.id), { projectName: newName }));
      await fbBatch.commit();

      if (user) {
        const { logActivity } = await import("@/lib/activity");
        const project = projects.find(p => p.id === projectId);
        await logActivity({
          userId: user.uid,
          userName: user.displayName || user.name || user.email || "Usuário",
          action: "EditouProjeto",
          projectId,
          projectName: newName,
          metadata: `Renomeado de "${oldName}"`,
          snapshot: { previousName: oldName, previousCode: project?.code || "" } as Record<string, unknown>,
          workspaceId: user.workspaceId || SENAI_WORKSPACE_ID,
        });
      }

      toast.success("Projeto renomeado com sucesso!");
    } catch {
      toast.error("Erro ao renomear projeto.");
    }
    setEditingProjectName(null);
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <FolderOpen className="w-8 h-8" />
            Projetos
          </h1>
          <p className="text-zinc-500 mt-1">
            Gerencie seus projetos de roteiros
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
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
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Projeto</DialogTitle>
              <DialogDescription>
                O projeto será criado automaticamente no Teleprompt e no Zecki Dashboard.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Projeto</Label>
                <Input
                  id="name"
                  placeholder="Ex: Curso de Excel Avançado"
                  value={newProject.name}
                  onChange={(e) => {
                    setNewProject(prev => ({
                      ...prev,
                      name: e.target.value,
                      code: prev.code || generateCode(e.target.value)
                    }));
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  placeholder="Ex: CEA-001"
                  value={newProject.code}
                  onChange={(e) => setNewProject(prev => ({ ...prev, code: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateProject} disabled={creating || !newProject.name.trim()}>
                {creating && <Hourglass className="w-4 h-4 mr-2 animate-spin" style={{ animationDuration: "2s" }} />}
                Criar Projeto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      </div>

      {projectsContent}

      <AlertDialog open={deleteConfirmProject !== null} onOpenChange={(open) => !open && setDeleteConfirmProject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Projeto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este projeto? Os roteiros vinculados a ele continuarão existindo, mas sem projeto definido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProject} className="bg-red-600 hover:bg-red-700">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
