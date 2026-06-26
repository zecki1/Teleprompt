"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/PageTransitionLoader";
import { fetchProjects, Project, ProjectLink, createProject, deleteProject, updateProject } from "@/services/projects";

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
  Calendar,
  Trash2,
  Check,
  Edit2,
  ArrowLeftRight,
  List,
  Link2,
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
  const [newProject, setNewProject] = useState({ name: "", code: "", externalLink: "" });
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<string | null>(null);
  const [scriptsByProject, setScriptsByProject] = useState<Record<string, ScriptDoc[]>>({});
  const [editingProjectCode, setEditingProjectCode] = useState<string | null>(null);
  const [editCodeValue, setEditCodeValue] = useState("");
  const [editingProjectName, setEditingProjectName] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState("");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectCode, setEditProjectCode] = useState("");
  const [editProjectLink, setEditProjectLink] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [linksProject, setLinksProject] = useState<Project | null>(null);
  const [projectLinks, setProjectLinks] = useState<ProjectLink[]>([]);
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);
  const [editingLinkLabel, setEditingLinkLabel] = useState("");
  const [editingLinkUrl, setEditingLinkUrl] = useState("");
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
    return projectScripts.every(s => s.status === "gravado" || s.status === "rejeitado" || s.status === "nao_gravado");
  };

  const projectStats = useMemo(() => {
    const stats: Record<string, { total: number; podcast: number; video: number; recorded: number; naoGravado: number }> = {};
    for (const [name, scripts] of Object.entries(scriptsByProject)) {
      stats[name] = {
        total: scripts.length,
        podcast: scripts.filter(s => s.category === "podcast").length,
        video: scripts.filter(s => s.category === "video").length,
        recorded: scripts.filter(s => s.status === "gravado" || s.status === "rejeitado").length,
        naoGravado: scripts.filter(s => s.status === "nao_gravado").length,
      };
    }
    return stats;
  }, [scriptsByProject]);

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
        <div data-tour="projects-list" className="flex gap-6 overflow-x-auto p-2 custom-scrollbar snap-x snap-mandatory pb-6">
          {projects.map((project) => {
            const concluded = isProjectConcluded(project.name);
            return (
              <Card 
                key={project.id} 
                className={`min-w-[280px] max-w-[280px] flex-shrink-0 snap-start hover:shadow-lg transition-all cursor-pointer group border-zinc-200 dark:border-zinc-800 ${
                  concluded ? 'opacity-75 hover:opacity-100' : ''
                }`}
              >
                <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-900/50 pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg group-hover:text-blue-600 transition-colors break-words">{project.name}</CardTitle>
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingProject(project); setEditProjectName(project.name); setEditProjectCode(project.code || ""); setEditProjectLink(project.externalLink || ""); }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded transition-all shrink-0"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                        </button>
                      </div>
                      <CardDescription className="text-xs mt-1 truncate">
                        {project.code || "Sem código"}
                      </CardDescription>
                    </div>
                    <Badge variant={concluded ? "secondary" : "default"} className="shrink-0 ml-2">
                      {concluded ? "Concluído" : "Ativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-5">
                  <div 
                    onClick={() => router.push(`/dashboard?projectId=${project.id}`)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm text-zinc-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {project.createdAt ? format(new Date(project.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                      </div>
                      {project.externalLink && (
                        <a
                          href={project.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-sky-500 hover:text-sky-600 hover:underline transition-colors"
                          title={project.externalLink}
                        >
                          <Link2 className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <div className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Ver Pastas <FolderOpen className="w-3 h-3" />
                    </div>
                    </div>

                    {/* Stats */}
                    {(() => {
                      const stats = projectStats[project.name];
                      if (!stats || stats.total === 0) return (
                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-[11px] text-zinc-400">
                          <span>Nenhum roteiro</span>
                        </div>
                      );
                      const concludedCount = stats.recorded + stats.naoGravado;
                      const pct = Math.round((concludedCount / stats.total) * 100);
                      return (
                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-500 font-medium">{stats.total} roteiro{stats.total !== 1 ? 's' : ''}</span>
                            <span className="text-zinc-400 font-mono">{pct}%</span>
                          </div>
                          <div className="flex gap-3 text-[10px] flex-wrap">
                            <span className="text-blue-500 font-bold">{stats.video}V</span>
                            <span className="text-emerald-500 font-bold">{stats.podcast}P</span>
                            <span className="text-amber-500 font-bold">{stats.recorded}G</span>
                            {stats.naoGravado > 0 && (
                              <span className="text-red-500 font-bold">{stats.naoGravado}NG</span>
                            )}
                          </div>
                          <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })()}

                    {concluded && (
                      <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center gap-2 text-[11px] text-zinc-500">
                        <Check className="w-3.5 h-3.5" />
                        <span>Todos os roteiros concluídos</span>
                      </div>
                    )}
                  </div>
                </CardContent>
                <div className="px-5 pb-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="flex-1 h-8 text-[10px] font-bold rounded"
                    onClick={() => router.push(`/dashboard?projectId=${project.id}`)}
                  >
                    <FolderOpen className="w-3 h-3 mr-1" /> Pastas
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-[10px] font-bold rounded"
                    onClick={() => handleOpenLinks(project)}
                  >
                    <Link2 className="w-3 h-3 mr-1" /> Links
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 rounded"
                    onClick={(e) => handleDeleteProject(e as unknown as React.MouseEvent, project.id)}
                    title="Excluir Projeto"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
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
              <span className="flex-1 truncate">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  {project.name}
                </span>
                {project.externalLink && (
                  <a
                    href={project.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="ml-1.5 text-sky-500 hover:text-sky-600 transition-colors inline-flex align-middle"
                    title={project.externalLink}
                  >
                    <Link2 className="w-3 h-3" />
                  </a>
                )}
              </span>

              {/* Stats */}
              {(() => {
                const stats = projectStats[project.name];
                if (!stats || stats.total === 0) return null;
                const concludedCount = stats.recorded + stats.naoGravado;
                const pct = Math.round((concludedCount / stats.total) * 100);
                return (
                  <div className="hidden md:flex items-center gap-2 text-[10px]">
                    <span className="text-zinc-500 font-mono">{stats.total}</span>
                    <span className="text-blue-500">{stats.video}V</span>
                    <span className="text-emerald-500">{stats.podcast}P</span>
                    <span className="text-amber-500">{stats.recorded}G</span>
                    {stats.naoGravado > 0 && (
                      <span className="text-red-500">{stats.naoGravado}NG</span>
                    )}
                    <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-zinc-400 font-mono w-8 text-right">{pct}%</span>
                  </div>
                );
              })()}

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
                className="h-7 w-7 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingProject(project);
                  setEditProjectName(project.name);
                  setEditProjectCode(project.code || "");
                  setEditProjectLink(project.externalLink || "");
                }}
                title="Editar Projeto"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
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
  }, [projects, viewMode, editingProjectName, editNameValue, editingProjectCode, editCodeValue, projectStats, scriptsByProject, router]);

  const loadProjects = useCallback(async () => {
    try {
      const workspaceId = user?.workspaceId || "";
      if (!workspaceId && !user?.isSuperAdmin) return;
      const projectsData = await fetchProjects(workspaceId, !!user?.isSuperAdmin);
      setProjects(projectsData);

      const scriptsRef = collection(db, "scripts");
      const q = user?.isSuperAdmin
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
  }, [user?.workspaceId, user?.isSuperAdmin]);

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
      const workspaceId = user?.workspaceId;
      if (!workspaceId) return;
      
      const created = await createProject({
        name: newProject.name,
        code: newProject.code,
        externalLink: newProject.externalLink || undefined,
        workspaceId,
        status: "active",
      });

      setProjects([created, ...projects]);
      setIsCreateOpen(false);
      setNewProject({ name: "", code: "", externalLink: "" });
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
          workspaceId: user.workspaceId || "",
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
      await updateProject(projectId, { code: editCodeValue.trim() });
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
          workspaceId: user.workspaceId || "",
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
      await updateProject(projectId, { name: newName });
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
          workspaceId: user.workspaceId || "",
        });
      }

      toast.success("Projeto renomeado com sucesso!");
    } catch {
      toast.error("Erro ao renomear projeto.");
    }
    setEditingProjectName(null);
  };

  const handleSaveEdit = async () => {
    if (!editingProject || !editProjectName.trim()) return;
    setSavingEdit(true);
    try {
      const oldName = editingProject.name;
      const newName = editProjectName.trim();
      const newCode = editProjectCode.trim();
      const newLink = editProjectLink.trim();

      await updateProject(editingProject.id, { name: newName, code: newCode || undefined, externalLink: newLink || undefined });

      if (newName !== oldName) {
        const scriptsRef = collection(db, "scripts");
        const q = query(scriptsRef, where("projectName", "==", oldName));
        const snapshot = await getDocs(q);
        const fbBatch = writeBatch(db);
        snapshot.docs.forEach(d => fbBatch.update(doc(db, "scripts", d.id), { projectName: newName }));
        await fbBatch.commit();
      }

      setProjects(projects.map(p => p.id === editingProject.id ? { ...p, name: newName, code: newCode || undefined, externalLink: newLink || undefined } : p));
      setEditingProject(null);
      toast.success("Projeto atualizado com sucesso!");
    } catch {
      toast.error("Erro ao atualizar projeto.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleOpenLinks = (project: Project) => {
    setLinksProject(project);
    setProjectLinks(project.links ? [...project.links] : []);
    setEditingLinkIndex(null);
    setEditingLinkLabel("");
    setEditingLinkUrl("");
  };

  const handleAddLink = () => {
    if (!editingLinkLabel.trim() || !editingLinkUrl.trim()) return;
    const newLink = { label: editingLinkLabel.trim(), url: editingLinkUrl.trim() };
    if (editingLinkIndex !== null) {
      const updated = [...projectLinks];
      updated[editingLinkIndex] = newLink;
      setProjectLinks(updated);
    } else {
      setProjectLinks([...projectLinks, newLink]);
    }
    setEditingLinkIndex(null);
    setEditingLinkLabel("");
    setEditingLinkUrl("");
  };

  const handleEditLink = (index: number) => {
    setEditingLinkIndex(index);
    setEditingLinkLabel(projectLinks[index].label);
    setEditingLinkUrl(projectLinks[index].url);
  };

  const handleDeleteLink = (index: number) => {
    setProjectLinks(projectLinks.filter((_, i) => i !== index));
    if (editingLinkIndex === index) {
      setEditingLinkIndex(null);
      setEditingLinkLabel("");
      setEditingLinkUrl("");
    }
  };

  const handleSaveLinks = async () => {
    if (!linksProject) return;
    try {
      await updateProject(linksProject.id, { links: projectLinks });
      setProjects(projects.map(p => p.id === linksProject.id ? { ...p, links: projectLinks } : p));
      setLinksProject(null);
      toast.success("Links salvos com sucesso!");
    } catch {
      toast.error("Erro ao salvar links.");
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 data-tour="projects-title" className="text-3xl font-black flex items-center gap-3">
            <FolderOpen className="w-8 h-8" />
            Projetos
          </h1>
          <p className="text-zinc-500 mt-1">
            Gerencie seus projetos de roteiros
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div data-tour="projects-view-toggle" className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
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
            <Button data-tour="projects-create">
              <Plus className="w-4 h-4 mr-2" />
              Novo Projeto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Projeto</DialogTitle>
              <DialogDescription>
                O projeto será criado automaticamente no Teleprompt.
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
              <div className="space-y-2">
                <Label htmlFor="externalLink">Link de Referência</Label>
                <Input
                  id="externalLink"
                  placeholder="Ex: https://sharepoint.com/site/pasta"
                  value={newProject.externalLink}
                  onChange={(e) => setNewProject(prev => ({ ...prev, externalLink: e.target.value }))}
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

      {/* Links Modal */}
      <Dialog open={linksProject !== null} onOpenChange={(o) => { if (!o) { setLinksProject(null); setEditingLinkIndex(null); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-sky-500" />
              Links - {linksProject?.name || ""}
            </DialogTitle>
            <DialogDescription>
              Gerencie os links de referência do projeto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Lista de links */}
            {projectLinks.length === 0 ? (
              <p className="text-sm text-zinc-400 italic text-center py-6">Nenhum link cadastrado.</p>
            ) : (
              <div className="space-y-3">
                {projectLinks.map((link, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">{link.label}</p>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-sky-500 hover:text-sky-600 hover:underline truncate block mt-0.5"
                      >
                        {link.url}
                      </a>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditLink(i)} title="Editar">
                        <Edit2 className="w-3 h-3 text-zinc-400" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleDeleteLink(i)} title="Excluir">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Edit form */}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4 space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {editingLinkIndex !== null ? "Editar Link" : "Novo Link"}
              </h4>
              <div className="space-y-2">
                <Input
                  placeholder="Nome do link (ex: Planejamento)"
                  value={editingLinkLabel}
                  onChange={e => setEditingLinkLabel(e.target.value)}
                  className="h-10 text-sm rounded"
                />
                <Input
                  placeholder="URL (ex: https://sharepoint.com/...)"
                  value={editingLinkUrl}
                  onChange={e => setEditingLinkUrl(e.target.value)}
                  className="h-10 text-sm rounded font-mono"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddLink(); } }}
                />
              </div>
              <div className="flex gap-2">
                {editingLinkIndex !== null && (
                  <Button variant="ghost" size="sm" className="h-9 text-[10px] font-black uppercase tracking-widest" onClick={() => { setEditingLinkIndex(null); setEditingLinkLabel(""); setEditingLinkUrl(""); }}>
                    Cancelar
                  </Button>
                )}
                <Button
                  size="sm"
                  className="h-9 text-[10px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleAddLink}
                  disabled={!editingLinkLabel.trim() || !editingLinkUrl.trim()}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {editingLinkIndex !== null ? "Salvar" : "Adicionar"}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <Button variant="ghost" onClick={() => { setLinksProject(null); setEditingLinkIndex(null); }} className="flex-1 h-11 rounded font-bold text-sm">
              Cancelar
            </Button>
            <Button onClick={handleSaveLinks} className="flex-[2] h-11 rounded bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest text-[10px]">
              <Check className="w-4 h-4 mr-2" /> Salvar Links
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editingProject !== null} onOpenChange={(o) => !o && setEditingProject(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Projeto</DialogTitle>
            <DialogDescription>
              Altere o nome e/ou código do projeto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Projeto</Label>
              <Input
                id="edit-name"
                placeholder="Ex: Curso de Excel Avançado"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-code">Código</Label>
              <Input
                id="edit-code"
                placeholder="Ex: CEA-001"
                value={editProjectCode}
                onChange={(e) => setEditProjectCode(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-link">Link de Referência</Label>
              <Input
                id="edit-link"
                placeholder="Ex: https://sharepoint.com/site/pasta"
                value={editProjectLink}
                onChange={(e) => setEditProjectLink(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProject(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit || !editProjectName.trim()}>
              {savingEdit && <Hourglass className="w-4 h-4 mr-2 animate-spin" style={{ animationDuration: "2s" }} />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
