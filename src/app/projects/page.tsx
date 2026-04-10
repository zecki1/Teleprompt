"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchZeckiProjects as getProjects, ZeckiProject as Project, createZeckiProject as createProject } from "@/lib/zecki";
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
  Plus, 
  FolderOpen, 
  Loader2, 
  ExternalLink, 
  Link2, 
  CheckCircle2,
  Calendar
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProjectsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", code: "" });

  const loadProjects = useCallback(async () => {
    try {
      const workspaceId = user?.workspaceId || "senai";
      const projectsData = await getProjects(workspaceId);
      setProjects(projectsData);
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
      const workspaceId = user?.workspaceId || "senai";
      
      const created = await createProject({
        name: newProject.name,
        code: newProject.code,
        workspaceId,
        status: "active",
      });

      setProjects([created, ...projects]);
      setIsCreateOpen(false);
      setNewProject({ name: "", code: "" });
      
      // Aqui futuramente chamaria API para criar no Zecki
      console.log("Projeto criado:", created);
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
    } finally {
      setCreating(false);
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

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

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
                {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar Projeto
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length === 0 ? (
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
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/scripts?project=${project.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">
                      {project.code}
                    </CardDescription>
                  </div>
                  <Badge variant={project.status === "active" ? "default" : "secondary"}>
                    {project.status === "active" ? "Ativo" : project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {project.createdAt ? format(new Date(project.createdAt), "dd/MM/yyyy", { locale: ptBR }) : "N/A"}
                  </div>
                </div>
                
                {project.zeckiProjectId ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sincronizado com Zecki</span>
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </div>
                ) : (
                  <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                    <Link2 className="w-4 h-4" />
                    <span>Pendente sincronização</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
