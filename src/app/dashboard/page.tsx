"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, deleteDoc, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Plus, Play, Trash2, Edit2, Check, Folder, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ScriptDoc {
  id: string;
  title: string;
  project?: string;
  createdAt: string;
  isPublic: boolean;
}

export default function DashboardPage() {
  const [scripts, setScripts] = useState<ScriptDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  
  // Estados para renomear projeto
  const [editingProjectName, setEditingProjectName] = useState<string | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState("");

  const router = useRouter();

  useEffect(() => {
    async function fetchScripts() {
      try {
        const q = query(collection(db, "scripts"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as ScriptDoc[];
        setScripts(fetched);
      } catch (err) {
        console.error("Erro ao carregar roteiros", err);
      } finally {
        setLoading(false);
      }
    }
    fetchScripts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este roteiro?")) return;
    try {
      await deleteDoc(doc(db, "scripts", id));
      setScripts(scripts.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Link copiado!");
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
      alert("Erro ao renomear.");
    }
  };

  const handleRenameProject = async (oldName: string) => {
    if (!newProjectTitle.trim() || oldName === newProjectTitle) {
      setEditingProjectName(null);
      return;
    }
    try {
      const batch = writeBatch(db);
      const scriptsToUpdate = scripts.filter(s => (s.project || "Geral") === oldName);
      
      scriptsToUpdate.forEach(s => {
        const ref = doc(db, "scripts", s.id);
        batch.update(ref, { project: newProjectTitle });
      });

      await batch.commit();
      setScripts(scripts.map(s => (s.project || "Geral") === oldName ? { ...s, project: newProjectTitle } : s));
      setEditingProjectName(null);
    } catch (e) {
      console.error(e);
      alert("Erro ao renomear projeto.");
    }
  };

  const groupedScripts = scripts.reduce((acc, script) => {
    const projectName = script.project || "Geral";
    if (!acc[projectName]) acc[projectName] = [];
    acc[projectName].push(script);
    return acc;
  }, {} as Record<string, ScriptDoc[]>);

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Roteiros</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus Roteiros do Teleprompter aqui.</p>
        </div>
        <Button onClick={() => router.push("/editor/new")} size="lg">
          <Plus className="w-5 h-5 mr-2" /> Novo Roteiro
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-muted-foreground">Carregando seus roteiros...</p>
        </div>
      ) : scripts.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
          <h3 className="text-xl font-medium mb-2">Nenhum roteiro encontrado</h3>
          <p className="text-muted-foreground mb-6">Crie seu primeiro roteiro colando o texto do Word.</p>
          <Button onClick={() => router.push("/editor/new")}>
            <Plus className="w-4 h-4 mr-2" /> Criar Agora
          </Button>
        </div>
      ) : (
        <div className="space-y-12">
          {Object.entries(groupedScripts).map(([projectName, projectScripts]) => (
            <div key={projectName} className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2 group/header">
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-zinc-400" />
                  {editingProjectName === projectName ? (
                    <div className="flex items-center gap-2">
                      <Input 
                        value={newProjectTitle} 
                        onChange={(e) => setNewProjectTitle(e.target.value)}
                        className="h-7 w-48 text-sm"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleRenameProject(projectName)}><Check className="w-4 h-4 text-green-500" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingProjectName(null)}><X className="w-4 h-4" /></Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold tracking-tight uppercase text-zinc-500 text-sm">{projectName}</h2>
                      <button 
                        onClick={() => { setEditingProjectName(projectName); setNewProjectTitle(projectName); }}
                        className="opacity-0 group-hover/header:opacity-100 p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-all"
                      >
                        <Edit2 className="w-3 h-3 text-zinc-400" />
                      </button>
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs text-zinc-500 hover:text-blue-500"
                  onClick={() => router.push(`/editor/new?project=${encodeURIComponent(projectName)}`)}
                >
                  <Plus className="w-3 h-3 mr-1" /> Adicionar ao Projeto
                </Button>
              </div>
              
              {/* CONTAINER DE SCROLL LATERAL */}
              <div className="relative">
                <div className="flex gap-6 overflow-x-auto pb-6 pt-2 no-scrollbar snap-x snap-mandatory">
                  {projectScripts.map(script => (
                    <div key={script.id} className="min-w-[85%] md:min-w-[45%] lg:min-w-[calc(33.333%-1rem)] snap-start">
                      <Card className="h-full hover:shadow-md transition-shadow group flex flex-col pt-4">
                        <CardHeader>
                          {editingId === script.id ? (
                            <div className="flex items-center gap-2">
                              <Input 
                                value={editTitle} 
                                onChange={(e) => setEditTitle(e.target.value)} 
                                autoFocus 
                                onKeyDown={(e) => e.key === 'Enter' && saveTitle(script.id)}
                              />
                              <Button size="icon" variant="ghost" onClick={() => saveTitle(script.id)}>
                                <Check className="w-4 h-4 text-green-500" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between group/title">
                              <CardTitle className="line-clamp-1" title={script.title}>{script.title}</CardTitle>
                              <Button 
                                size="icon" 
                                variant="ghost" 
                                className="h-6 w-6 opacity-0 group-hover/title:opacity-100 transition-opacity" 
                                onClick={() => { setEditingId(script.id); setEditTitle(script.title); }}
                              >
                                <Edit2 className="w-3 h-3 text-muted-foreground" />
                              </Button>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {script.createdAt ? format(new Date(script.createdAt), "dd 'de' MMMM, yyyy", { locale: ptBR }) : "Sem data"}
                          </p>
                        </CardHeader>
                        <CardContent className="flex-1">
                          <div className="flex gap-2 mb-2">
                            <Button variant="secondary" className="w-full" asChild>
                              <Link href={`/tp/${script.id}`}>
                                <Play className="w-4 h-4 mr-2" /> Iniciar TP
                              </Link>
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" className="w-full" asChild>
                              <Link href={`/editor/${script.id}`}>
                                <Edit2 className="w-4 h-4 mr-2" /> Editar Roteiro
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t p-4 flex justify-between">
                          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(`${window.location.origin}/tp/${script.id}`)}>
                            <Copy className="w-4 h-4 mr-2" /> Link Publico
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive text-opacity-80" onClick={() => handleDelete(script.id)}>
                            <Trash2 className="w-4 h-4" />
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
      )}
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}