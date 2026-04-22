"use client";

import React, { useEffect, useState, use, Suspense, useRef, useMemo } from "react";
import Image from "next/image";
import { Scene, parseScript } from "@/lib/parser";
import { sanitizeData } from "@/lib/firebase-utils";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Save,
  ImageIcon,
  Trash2,
  Plus,
  ChevronLeft,
  Scissors,
  Copy,
  FileText,
  Video,
  Type,
  Clock,
  MessageSquare,
  Import,
  PlusSquare,
  Pin,
  Eye,
  EyeOff,
  ClipboardCheck,
  FileDown,
  Loader2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchZeckiProjects, createRecordingTask, ZeckiProject } from "@/lib/zecki";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast as sonnerToast } from "sonner";
import { exportToWord } from "@/lib/export-word";

type ScriptStatus = "rascunho" | "em_revisao" | "revisao_realizada" | "aguardando_gravacao" | "gravado" | "rejeitado";


// Componente para renderizar o texto com destaque para as tags (Apenas no modo Visualização)
function HighlightedSpokenText({ 
  text, 
  onChange, 
  textareaRef, 
  disabled,
  isEditing
}: { 
  text: string; 
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  textareaRef: (el: HTMLTextAreaElement | null) => void;
  disabled?: boolean;
  isEditing: boolean;
}) {
  const highlights = useMemo(() => {
    if (!text || isEditing) return null;
    const regex = /(\[(?:let|img)\d+\]|\[\d+\])/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      const isImg = match[0].startsWith('[img');
      const bgClass = isImg ? 'bg-purple-500 text-white shadow-[0_0_10px_purple] px-1.5' : 'bg-red-600 text-white shadow-[0_0_10px_red] px-1.5';
      parts.push(
        <span key={`highlight-${match.index}`} className={`${bgClass} font-black rounded mx-0.5 inline-block text-[10px] leading-none py-0.5`}>
          {match[0]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  }, [text, isEditing]);

  return (
    <div className="relative w-full group/textarea">
      {!isEditing && (
        <div className="absolute inset-0 pointer-events-none p-4 font-medium text-[14px] leading-relaxed whitespace-pre-wrap break-words z-20 bg-zinc-50 dark:bg-zinc-950 rounded border border-zinc-200 dark:border-zinc-800 overflow-y-auto">
          {highlights}
        </div>
      )}
      <Textarea
        ref={textareaRef}
        value={text}
        onChange={onChange}
        disabled={disabled || !isEditing}
        placeholder="Escreva o que será dito..."
        className={`text-[14px] font-medium leading-relaxed min-h-[120px] p-4 resize-none w-full rounded focus-visible:ring-blue-500 bg-zinc-50/50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 ${!isEditing ? 'opacity-0' : 'opacity-100 placeholder:opacity-40'}`}
      />
    </div>
  );
}

function EditorContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNew = !id || id === "new";

  const [title, setTitle] = useState("Novo Roteiro");
  const [project, setProject] = useState("Geral");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [folder, setFolder] = useState("Raiz");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [scriptStatus, setScriptStatus] = useState<ScriptStatus>("rascunho");
  const [category, setCategory] = useState<"video" | "podcast">("video");
  const [isPublic, setIsPublic] = useState(false);
  const [lockedForEditing, setLockedForEditing] = useState(false);
  const [zeckiProjects, setZeckiProjects] = useState<ZeckiProject[]>([]);
  const [existingFolders, setExistingFolders] = useState<string[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [reviewerId, setReviewerId] = useState<string | null>(null);
  const [reviewerName, setReviewerName] = useState<string | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [editorName, setEditorName] = useState<string | null>(null);

  const { user, hasPermission } = useAuth();
  const isWhitelisted = user?.email === "zecki1@hotmail.com" || user?.email === "ezequiel.rmoncao@sp.senai.br";
  const isSuper = user?.isSuperAdmin || isWhitelisted;
  const canEdit = isSuper || (hasPermission(["Docente", "Especialista", "Coordenador", "Diretor", "Orientador", "Assistente", "Analista", "editor", "validador"]) && (!lockedForEditing || scriptStatus === "rascunho"));

  const [isEditingMode, setIsEditingMode] = useState(true);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [newProjectData, setNewProjectData] = useState({ name: "", code: "" });
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3000);
  };

  useEffect(() => {
    if (user?.workspaceId) {
      setWorkspaceId(user.workspaceId);
    }
  }, [user]);

  useEffect(() => {
    if (isNew) {
      const p = searchParams.get("project");
      const pid = searchParams.get("projectId");
      const f = searchParams.get("folder");
      console.log(`[Editor] Modo Novo Roteiro - Projeto: ${p}, ProjectID: ${pid}, Pasta: ${f}`);
      if (p) {
        setProject(p);
        if (pid) setProjectId(pid);
        if (f) setFolder(f);
      }
      setLoading(false);
      return;
    }

    async function loadScript() {
      try {
        const scriptRef = doc(db, "scripts", id);
        const scriptSnap = await getDoc(scriptRef);

        if (scriptSnap.exists()) {
          const data = scriptSnap.data();
          console.log("[Editor] Roteiro carregado:", data.title, "(ID:", id, ")");
          setTitle(data.title || "");
          const pName = data.projectName || data.project || "Geral";
          setProject(pName);
          setProjectId(data.projectId || null);
          setFolder(data.folder || "Raiz");
          setScriptStatus(data.status || "rascunho");
          setCategory(data.category || "video");
          setIsPublic(data.isPublic || false);
          setLockedForEditing(data.lockedForEditing || false);
          setWorkspaceId(data.workspaceId || user?.workspaceId || "senai");
          setReviewerId(data.reviewerId || null);
          setReviewerName(data.reviewerName || null);
          setEditorId(data.editorId || null);
          setEditorName(data.editorName || null);

          const vQ = query(
            collection(db, "scripts", id, "versions"),
            orderBy("createdAt", "desc"),
            limit(1)
          );
          const vSnap = await getDocs(vQ);

          if (!vSnap.empty) {
            console.log("[Editor] Versão carregada:", vSnap.docs[0].id);
            const vData = vSnap.docs[0].data();
            const rawContent = vData.content || "";
            let loadedScenes = vData.scenes || [];
            if (loadedScenes.length === 0 && rawContent) {
              loadedScenes = parseScript(rawContent);
            }
            const finalScenes = loadedScenes.map((s: Scene) => ({ ...s, observation: s.observation || "" }));
            setScenes(finalScenes);
          }
        } else {
          console.warn("[Editor] Roteiro não encontrado no Firestore:", id);
        }
      } catch (e) {
        console.error("[Editor] Erro ao carregar roteiro:", e);
      } finally {
        setLoading(false);
      }
    }
    loadScript();
  }, [id, isNew, searchParams, user]);

  useEffect(() => {
    if (user?.workspaceId) {
      fetchZeckiProjects(user.workspaceId).then(setZeckiProjects);
    }
  }, [user]);
  
  // Buscar pastas existentes no projeto selecionado
  useEffect(() => {
    const loadFolders = async () => {
      if (!project) return;
      try {
        const q = query(
          collection(db, "scripts"),
          where("workspaceId", "==", workspaceId || user?.workspaceId || "senai"),
          where("projectName", "==", project)
        );
        const snap = await getDocs(q);
        const folders = new Set<string>();
        snap.docs.forEach(doc => {
          if (doc.data().folder) folders.add(doc.data().folder);
        });
        setExistingFolders(Array.from(folders).sort());
      } catch (err) {
        console.error("Erro ao carregar pastas:", err);
      }
    };
    loadFolders();
  }, [project, workspaceId, user?.workspaceId]);

  // Recuperação de ProjectID caso o roteiro tenha apenas o nome do projeto
  useEffect(() => {
    if (!projectId && project !== "Geral" && zeckiProjects.length > 0) {
       const found = zeckiProjects.find(p => p.name === project);
       if (found) {
         console.log(`[Editor] Recuperando ID do projeto pelo nome: ${project} -> ${found.id}`);
         setProjectId(found.id);
       }
    }
  }, [project, projectId, zeckiProjects]);

  const generateRawTextFromBlocks = (currentScenes: Scene[]) => {
    let newText = "";
    currentScenes.forEach((scene) => {
      newText += `Cena ${scene.sceneNumber}\n`;
      if (scene.time) newText += `Tempo: ${scene.time}\n`;
      if (scene.imageUrl) newText += `[img1]: ${scene.imageUrl}\n`;
      if (scene.images) {
        scene.images.forEach((img, idx) => {
          if (img) newText += `[img${idx + 2}]: ${img}\n`;
        });
      }
      if (scene.lettering != null) {
        const letters = scene.lettering.split('\n');
        letters.forEach((l, idx) => {
          if (l.trim()) newText += `[let${idx + 1}]: ${l.trim()}\n`;
        });
      }
      if (scene.sourceUrl) newText += `[url1]: ${scene.sourceUrl}\n`;
      if (scene.observation) newText += `OBS: ${scene.observation}\n`;
      if (scene.spokenText) newText += `Locução: ${scene.spokenText}\n`;
      newText += "\n";
    });
    return newText.trim();
  };

  const handleSaveClick = () => {
    if (scenes.length === 0) return sonnerToast.warning("Adicione conteúdo antes de salvar.");
    setShowSaveModal(true);
  };

  const handleSave = async (saveStatus: ScriptStatus) => {
    setShowSaveModal(false);
    setIsSaving(true);

    // Timeout global de segurança: garante que isSaving sempre volta a false
    const safetyTimer = setTimeout(() => {
      setIsSaving(false);
      sonnerToast.error("O salvamento demorou demais. Verifique sua conexão e tente novamente.");
    }, 30000);

    try {
      console.log(`[Editor] Iniciando salvamento (${saveStatus})...`);
      const finalWorkspaceId = workspaceId || user?.workspaceId || "senai";
      let currentScriptId = id;
      const rawContent = generateRawTextFromBlocks(scenes);
      
      console.log("[Editor] Sanitizando dados...");
      const saveData = sanitizeData({
        title,
        project,
        projectName: project, // Sincronia com Dashboard
        projectId,
        folder: folder || "Raiz",
        category,
        workspaceId: finalWorkspaceId,
        status: saveStatus,
        updatedAt: serverTimestamp(),
        isPublic: isPublic,
        reviewerId,
        reviewerName,
        editorId,
        editorName,
      });
      console.log("[Editor] Dados sanitizados prontas:", saveData);

      if (isNew) {
        console.log("[Editor] Criando NOVO roteiro no Teleprompt DB...");
        const docRef = await addDoc(collection(db, "scripts"), {
          ...saveData,
          createdBy: user?.uid,
          createdByName: user?.displayName || user?.email || "Unknown",
          createdAt: new Date().toISOString(),
          lockedForEditing: false,
        });
        currentScriptId = docRef.id;
        console.log("[Editor] Roteiro criado com ID:", currentScriptId);
      } else {
        console.log("[Editor] Atualizando roteiro existente ID:", currentScriptId);
        await updateDoc(doc(db, "scripts", currentScriptId), saveData);
      }

      console.log("[Editor] Criando nova versão...");
      const versionPayload = sanitizeData({
        content: rawContent,
        scenes: scenes,
        createdAt: new Date().toISOString(),
      });
      console.log("[Editor] Payload da versão:", versionPayload);

      await addDoc(
        collection(db, "scripts", currentScriptId as string, "versions"), 
        versionPayload
      );
      console.log("[Editor] Versão salva com sucesso.");

      // --- FINALIZAÇÃO SÍNCRONA (NÃO BLOQUEIA UI) ---
      console.log("[Editor] Salvamento finalizado com sucesso.");
      showToast("Roteiro salvo!");
      setIsEditingMode(false);
      setIsSaving(false);
      setShowSaveModal(false);
      clearTimeout(safetyTimer);

      setShowSuccessModal(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);

      // --- AUTOMAÇÃO DE TAREFAS KANBAN (PROCESSO EM BACKGROUND) ---
      const runAutomations = async () => {
        if (!projectId) return;

        // Wrapper que limita cada tarefa a no máximo 10 segundos
        const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
          Promise.race([
            promise,
            new Promise<T>((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout após ${ms}ms`)), ms)
            ),
          ]);

        const tasks: Promise<void>[] = [];

        // 1. Criar tarefa de Gravação quando a revisão é concluída
        if (saveStatus === "revisao_realizada" || saveStatus === "aguardando_gravacao") {
          console.log("[Editor Background] Enfileirando tarefa de Gravação...");
          tasks.push(
            withTimeout(
              createRecordingTask(
                projectId, 
                title, 
                currentScriptId as string, 
                user?.uid || "", 
                finalWorkspaceId,
                category,
                `${window.location.origin}/editor/${currentScriptId}`
              ),
              15000 // Aumentado um pouco o timeout para background
            ).then(() => {
              sonnerToast.success(`Tarefa de Gravação criada!`, { 
                description: `Projeto: ${project}`,
                duration: 5000 
              });
            }).catch(err => console.warn("[Editor Background] Tarefa gravação ignorada:", err))
          );
        }

        // 2. Criar tarefa de Edição quando o roteiro é marcado como Gravado
        if (saveStatus === "gravado") {
          console.log("[Editor Background] Enfileirando tarefa de Edição...");
          const editingTask = async () => {
            const { createEditingTask } = await import("@/lib/zecki");
            await withTimeout(
              createEditingTask(
                projectId, 
                title, 
                currentScriptId as string, 
                user?.uid || "", 
                finalWorkspaceId,
                category,
                `${window.location.origin}/editor/${currentScriptId}`
              ),
              15000
            );
            sonnerToast.success(`Tarefa de Edição criada!`, { 
              description: `Projeto: ${project}`,
              duration: 5000 
            });
          };
          tasks.push(editingTask().catch(err => console.warn("[Editor Background] Tarefa edição ignorada:", err)));
        }

        if (tasks.length > 0) {
          console.log(`[Editor Background] Processando ${tasks.length} automações em paralelo...`);
          await Promise.allSettled(tasks);
        }
      };

      runAutomations();
    } catch (e) {
      console.error("[Editor] ERRO CRÍTICO AO SALVAR:", e);
      sonnerToast.error("Falha ao salvar roteiro. Verifique o console.");
    } finally {
      clearTimeout(safetyTimer);
      setIsSaving(false);
    }
  };


  const updateScene = (index: number, data: Partial<Scene>) => {
    const ns = [...scenes];
    ns[index] = { ...ns[index], ...data };
    setScenes(ns);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copiado!`);
  };

  const addBlockToScene = (index: number, type: 'spokenText' | 'imageUrl' | 'lettering' | 'observation') => {
    const ns = [...scenes];
    const scene = ns[index];
    if (type === 'spokenText') scene.spokenText = "";
    if (type === 'imageUrl') {
       if (!scene.imageUrl) scene.imageUrl = "";
       else scene.images = [...(scene.images || []), ""];
    }
    if (type === 'lettering') {
       if (scene.lettering == null) scene.lettering = "";
       else scene.lettering += "\n";
    }
    if (type === 'observation') scene.observation = "";
    setScenes(ns);
  };

  const removeBlockFromScene = (index: number, type: 'spokenText' | 'imageUrl' | 'lettering' | 'observation', subIndex?: number) => {
    const ns = [...scenes];
    const scene = ns[index];
    if (type === 'spokenText') scene.spokenText = null;
    if (type === 'imageUrl') {
      if (subIndex === undefined) {
        if (scene.images && scene.images.length > 0) { scene.imageUrl = scene.images[0]; scene.images = scene.images.slice(1); }
        else { scene.imageUrl = null; }
      } else { scene.images = scene.images?.filter((_, i) => i !== subIndex); }
    }
    if (type === 'lettering') {
      const letters = scene.lettering?.split('\n') || [];
      if (subIndex !== undefined) {
        const filtered = letters.filter((_, i) => i !== subIndex);
        scene.lettering = filtered.length > 0 ? filtered.join('\n') : null;
      } else { scene.lettering = null; }
    }
    if (type === 'observation') scene.observation = null;
    setScenes(ns);
  };

  const insertTagAtCursor = (sceneIndex: number, tag: string) => {
    const sceneId = scenes[sceneIndex].id;
    const textarea = textareaRefs.current[sceneId];
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = scenes[sceneIndex].spokenText || "";
    const newText = currentText.substring(0, start) + `[${tag}]` + currentText.substring(end);
    updateScene(sceneIndex, { spokenText: newText });
    setTimeout(() => { textarea.focus(); const newPos = start + tag.length + 2; textarea.setSelectionRange(newPos, newPos); }, 0);
  };

  const addEmptyScene = (index?: number) => {
    const newScene: Scene = { id: crypto.randomUUID(), sceneNumber: String(scenes.length + 1), spokenText: "", observation: "" };
    if (index !== undefined) { const ns = [...scenes]; ns.splice(index + 1, 0, newScene); setScenes(ns); }
    else { setScenes([...scenes, newScene]); }
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    const importedScenes = parseScript(importText).map(s => ({ ...s, observation: s.observation || "" }));
    setScenes([...scenes, ...importedScenes]);
    setShowImportModal(false);
    setImportText("");
    showToast("Roteiro importado!");
  };

  const splitScene = (index: number) => {
    const scene = scenes[index];
    const textarea = textareaRefs.current[scene.id];
    if (!textarea) return;
    const cursor = textarea.selectionStart;
    const fullText = scene.spokenText || "";
    const ns = [...scenes];
    ns[index] = { ...scene, spokenText: fullText.substring(0, cursor) };
    ns.splice(index + 1, 0, { id: crypto.randomUUID(), sceneNumber: String(index + 2), spokenText: fullText.substring(cursor), lettering: null, imageUrl: null, observation: "" });
    setScenes(ns);
    showToast("Cena dividida!");
  };

  const handleDownloadWord = async () => {
    try {
      await exportToWord({ title, projectName: project }, scenes);
      showToast("Backup Word gerado!");
    } catch (error) {
      console.error("Erro ao gerar documento Word:", error);
      sonnerToast.error("Falha ao gerar arquivo Word.");
    }
  };

  const handleCreateNewProject = async () => {
    if (!newProjectData.name.trim() || !newProjectData.code.trim()) {
      return sonnerToast.error("Preencha o nome e o código do projeto.");
    }
    
    setIsCreatingProject(true);
    try {
      const { createZeckiProject } = await import("@/lib/zecki");
      const created = await createZeckiProject({
        name: newProjectData.name,
        code: newProjectData.code,
        workspaceId: workspaceId || user?.workspaceId || "senai",
        status: "active",
      });
      
      setZeckiProjects([created, ...zeckiProjects]);
      setProjectId(created.id);
      setProject(created.name);
      setIsCreateProjectOpen(false);
      setNewProjectData({ name: "", code: "" });
      sonnerToast.success("Projeto criado com sucesso!");
    } catch (err) {
      console.error("Erro ao criar projeto:", err);
      sonnerToast.error("Erro ao criar projeto.");
    } finally {
      setIsCreatingProject(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-zinc-950 font-black text-blue-500 animate-pulse">CARREGANDO...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans pb-32 transition-colors duration-500">
      {/* HEADER FIXO */}
      <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-[10] shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
                <Link href="/dashboard"><ChevronLeft size={16} /></Link></Button>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="h-7 font-black bg-transparent border-none focus-visible:ring-0 p-0 text-lg md:text-xl truncate " 
                placeholder="Título do Roteiro"
              />
            </div>
            
            <div className="flex items-center gap-4 mt-0.5 ml-11">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter shrink-0">Projeto:</span>
                <Select 
                  value={projectId || "geral"} 
                  onValueChange={(val) => {
                    if (val === "geral") {
                      setProjectId(null);
                      setProject("Geral");
                    } else if (val === "new") {
                      setIsCreateProjectOpen(true);
                    } else {
                      const selected = zeckiProjects.find(p => p.id === val);
                      if (selected) {
                        setProjectId(selected.id);
                        setProject(selected.name);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="h-5 py-0 px-2 w-fit border-none shadow-none text-[10px] font-black text-blue-600 dark:text-blue-500 bg-blue-50/50 dark:bg-blue-900/20 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors gap-1.5 focus:ring-0">
                    <SelectValue placeholder="Selecionar Projeto" />
                  </SelectTrigger>
                  <SelectContent className="rounded border-none shadow-2xl bg-white dark:bg-zinc-900 p-2">
                    <SelectItem value="geral" className="text-[11px] font-bold rounded focus:bg-zinc-100 dark:focus:bg-zinc-800">Geral</SelectItem>
                    <SelectItem value="new" className="text-[11px] font-bold rounded text-blue-500 focus:text-blue-600 focus:bg-blue-50 dark:focus:bg-blue-900/20 border-t border-zinc-100 dark:border-zinc-800 mt-1 pt-2">
                      + Criar Novo Projeto
                    </SelectItem>
                    {zeckiProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="text-[11px] font-bold rounded focus:bg-zinc-100 dark:focus:bg-zinc-800">
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-1.5 border-l border-zinc-200 dark:border-zinc-800 pl-4">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter shrink-0">Pasta:</span>
                <div className="relative group/folder">
                  <Input 
                    value={folder} 
                    onChange={(e) => setFolder(e.target.value)}
                    className="h-5 py-0 px-2 w-32 border-none shadow-none text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors focus-visible:ring-0"
                    placeholder="Nome da Pasta..."
                  />
                  {existingFolders.length > 0 && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded shadow-xl opacity-0 invisible group-focus-within/folder:opacity-100 group-focus-within/folder:visible transition-all z-50 p-1">
                      <p className="text-[8px] font-black text-zinc-400 px-2 py-1 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 mb-1">Pastas Existentes</p>
                      {existingFolders.map(f => (
                        <button 
                          key={f}
                          onClick={() => setFolder(f)}
                          className="w-full text-left px-2 py-1.5 text-[10px] font-bold rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 border-l border-zinc-200 dark:border-zinc-800 pl-4">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-tighter shrink-0">Tipo:</span>
                <Select value={category} onValueChange={(val: "video" | "podcast") => setCategory(val)}>
                  <SelectTrigger className="h-5 py-0 px-2 w-fit border-none shadow-none text-[10px] font-black text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20 rounded hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors gap-1.5 focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded border-none shadow-2xl bg-white dark:bg-zinc-900 p-2">
                    <SelectItem value="video" className="text-[11px] font-bold rounded focus:bg-zinc-100 dark:focus:bg-zinc-800 flex items-center gap-2">
                      Vídeo
                    </SelectItem>
                    <SelectItem value="podcast" className="text-[11px] font-bold rounded focus:bg-zinc-100 dark:focus:bg-zinc-800 flex items-center gap-2">
                      Podcast
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadWord} className="h-9 text-[10px] font-black uppercase tracking-widest gap-2 rounded border-2 hidden md:flex">
                <FileDown size={16} /> Backup Word
              </Button>
             <Button variant={isEditingMode ? "outline" : "secondary"} size="sm" onClick={() => setIsEditingMode(!isEditingMode)} className="h-9 text-[10px] font-black uppercase tracking-widest gap-2 rounded border-2">
                {isEditingMode ? <Eye size={16} /> : <EyeOff size={16} />} {isEditingMode ? "Ver Final" : "Editar"}
              </Button>
              <Button 
                onClick={handleSaveClick} 
                className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] tracking-widest px-6 rounded shadow-lg"
                disabled={isSaving}
              >
                {isSaving ? "SALVANDO..." : <><Save size={16} className="mr-2" /> SALVAR</>}
              </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl py-10 px-4 space-y-12">
        {scenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900/50">
            <PlusSquare size={48} className="text-zinc-300 mb-4" />
            <h3 className="font-black text-zinc-500 uppercase tracking-widest mb-6">Seu roteiro está vazio</h3>
            <div className="flex gap-4">
              <Button onClick={() => addEmptyScene()} className="bg-blue-600 text-[10px] font-black uppercase tracking-widest px-8 h-12 rounded shadow-xl">Nova Cena</Button>
              <Button variant="outline" onClick={() => setShowImportModal(true)} className="text-[10px] font-black uppercase tracking-widest px-8 h-12 rounded shadow-xl">Importar Texto</Button>
            </div>
          </div>
        ) : (
          scenes.map((scene, index) => (
            <div key={scene.id} className="relative group/scene">
              <Card className={`transition-all duration-500 border-zinc-200 dark:border-zinc-800 shadow-2xl rounded overflow-hidden ${isEditingMode ? 'bg-white dark:bg-zinc-900' : 'bg-white/50 dark:bg-zinc-900/50 shadow-none scale-[0.98]'}`}>
                <div className="bg-zinc-50/50 dark:bg-zinc-800/20 px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center group-focus-within/scene:bg-blue-50/20">
                  <div className="flex items-center gap-4">
                    <span className="bg-zinc-900 dark:bg-blue-600 text-white text-[11px] px-4 py-1.5 rounded font-black tracking-tighter shadow-md">CENA {scene.sceneNumber}</span>
                    {isEditingMode ? (
                      <Input placeholder="Tempo" value={scene.time || ""} onChange={(e) => updateScene(index, { time: e.target.value })} className="h-7 w-20 text-[10px] bg-transparent border-dashed border-zinc-300 py-0" />
                    ) : (
                      <Badge variant="secondary" className="text-[10px] font-bold">{scene.time || "--:--"}</Badge>
                    )}

                    {/* NOVOS BOTÕES DE ADIÇÃO RÁPIDA (ACIMA) */}
                    {isEditingMode && (
                      <div className="flex items-center gap-1 border-l pl-4 ml-2 border-zinc-200 dark:border-zinc-800">
                        <Button variant="ghost" size="sm" onClick={() => addBlockToScene(index, 'spokenText')} className="h-8 text-[9px] font-black uppercase tracking-tighter gap-1.5 hover:text-blue-500 transition-colors">
                           <MessageSquare size={14} className="text-blue-500" /> Loc
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => addBlockToScene(index, 'lettering')} className="h-8 text-[9px] font-black uppercase tracking-tighter gap-1.5 hover:text-amber-500 transition-colors">
                           <Type size={14} className="text-amber-500" /> Let
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => addBlockToScene(index, 'imageUrl')} className="h-8 text-[9px] font-black uppercase tracking-tighter gap-1.5 hover:text-purple-500 transition-colors">
                           <ImageIcon size={14} className="text-purple-500" /> Img
                        </Button>
                      </div>
                    )}
                  </div>
                  {isEditingMode && (
                    <div className="flex items-center gap-1 opacity-0 group-hover/scene:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded" onClick={() => splitScene(index)}><Scissors size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded text-red-500" onClick={() => setScenes(scenes.filter((_, i) => i !== index))}><Trash2 size={14} /></Button>
                    </div>
                  )}
                </div>

                <CardContent className="p-6 md:p-8 space-y-8">
                  {/* LOCUÇÃO */}
                  {(scene.spokenText != null) && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                         <Label className="text-[10px] uppercase font-black text-blue-500 tracking-widest flex items-center gap-2"><MessageSquare size={16} /> Locução</Label>
                         <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-5 w-5 opacity-40 hover:opacity-100" onClick={() => copyToClipboard(scene.spokenText || "", "Locução")}><Copy size={12} /></Button>
                            {isEditingMode && <Button variant="ghost" size="icon" className="h-5 w-5 opacity-40 hover:opacity-100 text-red-500" onClick={() => removeBlockFromScene(index, 'spokenText')}><Trash2 size={12} /></Button>}
                         </div>
                      </div>
                      <HighlightedSpokenText text={scene.spokenText || ""} onChange={(e) => updateScene(index, { spokenText: e.target.value })} textareaRef={(el) => { if (el) textareaRefs.current[scene.id] = el; }} disabled={!canEdit} isEditing={isEditingMode} />
                    </div>
                  )}

                  {/* LETTERINGS */}
                  {(scene.lettering != null) && (
                    <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                      <Label className="text-[10px] uppercase font-black text-amber-600 tracking-widest flex items-center gap-2"><Type size={16} /> Letterings</Label>
                      <div className="grid gap-3">
                        {scene.lettering.split('\n').map((letLine, lIdx) => (
                          <div key={lIdx} className="bg-amber-50/30 dark:bg-amber-950/5 p-4 rounded border border-amber-100 dark:border-amber-900/20 group/let flex items-center gap-4 transition-all hover:shadow-md">
                            <span className="text-[9px] font-black text-amber-600 bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 rounded shrink-0">let{lIdx+1}</span>
                            <div className="flex-1">
                              {isEditingMode ? (
                                <Input value={letLine} onChange={(e) => { const letters = scene.lettering?.split('\n') || []; letters[lIdx] = e.target.value; updateScene(index, { lettering: letters.join('\n') }); }} className="text-[12px] font-bold border-none bg-transparent p-0 focus-visible:ring-0 shadow-none h-auto" placeholder="Texto do lettering..." />
                              ) : (
                                <p className="text-[13px] font-bold text-amber-800 dark:text-amber-400">{letLine}</p>
                              )}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover/let:opacity-100 transition-opacity">
                               <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-600" onClick={() => copyToClipboard(letLine, `Let ${lIdx+1}`)}><Copy size={12} /></Button>
                               {isEditingMode && (
                                 <><Button variant="ghost" size="icon" className="h-6 w-6 text-amber-600" onClick={() => insertTagAtCursor(index, `let${lIdx+1}`)}><Pin size={12} /></Button><Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeBlockFromScene(index, 'lettering', lIdx)}><Trash2 size={12} /></Button></>
                               )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* IMAGENS */}
                  {(scene.imageUrl != null) && (
                    <div className="space-y-4 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                       <Label className="text-[10px] uppercase font-black text-purple-500 tracking-widest flex items-center gap-2"><ImageIcon size={16} /> Imagens</Label>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-zinc-100/30 dark:bg-zinc-950/20 p-4 rounded border border-zinc-200 dark:border-zinc-800 group/img space-y-3">
                             <div className="flex justify-between items-center">
                               <span className="text-[9px] font-black text-purple-500 bg-purple-50/50 px-2 py-0.5 rounded">img1</span>
                               {isEditingMode && <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/img:opacity-100 text-red-500" onClick={() => removeBlockFromScene(index, 'imageUrl')}><Trash2 size={12} /></Button>}
                             </div>
                             {isEditingMode && <Input value={scene.imageUrl || ""} onChange={(e) => updateScene(index, { imageUrl: e.target.value })} className="h-8 text-[11px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" placeholder="URL da imagem..." />}
                             <div className="flex items-center gap-3">
                                {isEditingMode && <Button onClick={() => insertTagAtCursor(index, `img1`)} variant="outline" size="sm" className="h-7 text-[10px] font-black flex-1 border-2">MARCAR</Button>}
                                {scene.imageUrl && (
                                  <div className="h-16 w-16 relative rounded border overflow-hidden bg-black shrink-0 shadow-lg">
                                    <Image 
                                      src={scene.imageUrl} 
                                      fill 
                                      className="object-contain" 
                                      alt="Cena" 
                                      unoptimized={scene.imageUrl.startsWith('http')}
                                    />
                                  </div>
                                )}
                             </div>
                          </div>
                          {scene.images?.map((extraImg, eiIdx) => (
                            <div key={eiIdx} className="bg-zinc-100/30 dark:bg-zinc-950/20 p-4 rounded border border-zinc-200 dark:border-zinc-800 group/img space-y-3">
                               <div className="flex justify-between items-center"><span className="text-[9px] font-black text-purple-500 bg-purple-50/50 px-2 py-0.5 rounded">img{eiIdx+2}</span>{isEditingMode && <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover/img:opacity-100 text-red-500" onClick={() => removeBlockFromScene(index, 'imageUrl', eiIdx)}><Trash2 size={12} /></Button>}</div>
                               {isEditingMode && <Input value={extraImg} onChange={(e) => { const extra = [...(scene.images || [])]; extra[eiIdx] = e.target.value; updateScene(index, { images: extra }); }} className="h-8 text-[11px] bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" placeholder="URL da imagem..." />}
                               <div className="flex items-center gap-3">
                                 {isEditingMode && <Button onClick={() => insertTagAtCursor(index, `img${eiIdx+2}`)} variant="outline" size="sm" className="h-7 text-[10px] font-black flex-1 border-2">MARCAR</Button>}
                                 {extraImg && (
                                   <div className="h-16 w-16 relative rounded border overflow-hidden bg-black shrink-0 shadow-lg">
                                     <Image 
                                       src={extraImg} 
                                       fill 
                                       className="object-contain" 
                                       alt="Cena Extra" 
                                       unoptimized={extraImg.startsWith('http')}
                                     />
                                   </div>
                                 )}
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {/* NOTAS (Sempre presente) */}
                  <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                    <Label className="text-[10px] uppercase font-black text-zinc-500 tracking-widest flex items-center gap-2">Notas do Editor</Label>
                    {isEditingMode ? (
                      <Textarea value={scene.observation || ""} onChange={(e) => updateScene(index, { observation: e.target.value })} placeholder="Adicione observações..." className="text-[12px] bg-zinc-50/50 dark:bg-zinc-950/30 border-none italic min-h-[60px] resize-none focus-visible:ring-0" />
                    ) : (
                      <p className="text-[12px] italic text-zinc-600 dark:text-zinc-400 p-3 bg-zinc-100/50 dark:bg-zinc-800/30 rounded">{scene.observation || "Nenhuma observação."}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Adicionar Cena entre cenas */}
              {isEditingMode && (
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover/scene:opacity-100 transition-all">
                  <Button onClick={() => addEmptyScene(index)} className="h-10 w-10 rounded bg-blue-600 hover:bg-blue-700 text-white shadow-xl p-0 hover:scale-110"><Plus size={20} /></Button>
                </div>
              )}
            </div>
          ))
        )}

        {isEditingMode && (
          <Button variant="outline" className="w-full border-dashed border-2 py-12 text-zinc-400 dark:border-zinc-800 hover:text-blue-500 hover:border-blue-500 transition-all rounded gap-4 text-[13px] font-black bg-white/30" onClick={() => addEmptyScene()}>
            <PlusSquare size={32} /> ADICIONAR NOVA CENA AO FINAL
          </Button>
        )}
      </div>

      {/* FOOTER FIXO */}
      {isEditingMode && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3">
          <Button onClick={() => setShowImportModal(true)} variant="outline" className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-2xl rounded h-12 px-6 border-2 font-black text-[10px] tracking-widest uppercase"><Import size={18} className="mr-2" /> Importar Roteiro</Button>
          <Button onClick={handleSaveClick} className="bg-zinc-900 border-2 dark:bg-zinc-100 text-white dark:text-black shadow-2xl rounded h-12 px-8 font-black text-[10px] tracking-widest uppercase hover:scale-105 transition-all"><Save size={18} className="mr-2" /> Salvar Tudo</Button>
        </div>
      )}

      {toast.visible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black px-8 py-3 rounded shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <ClipboardCheck size={18} className="text-emerald-500" />
          <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
        </div>
      )}

      {/* MODALS */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-none rounded p-8 shadow-[0_0_100px_rgba(0,0,0,0.2)] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-2xl font-black text-center mb-6">Salvar Roteiro</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <Button onClick={() => handleSave("rascunho")} className="h-16 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 font-black text-xs uppercase tracking-widest gap-3">
              <FileText size={20} /> Salvar como Rascunho
            </Button>
            
            <Button onClick={() => handleSave("em_revisao")} className="h-16 rounded bg-yellow-500 text-white hover:bg-yellow-600 font-black text-xs uppercase tracking-widest gap-3">
              <Clock size={20} /> Enviar para Revisão
            </Button>

            <Button onClick={() => handleSave("revisao_realizada")} className="h-16 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-black text-xs uppercase tracking-widest gap-3">
              <ClipboardCheck size={20} /> Concluir Revisão
            </Button>

            <Button onClick={() => handleSave("gravado")} className="h-16 rounded bg-blue-600 text-white hover:bg-blue-700 font-black text-xs uppercase tracking-widest gap-3">
              <Video size={20} /> Marcar como Gravado
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
        <DialogContent className="sm:max-w-3xl bg-white dark:bg-zinc-950 border-none rounded p-8 shadow-[0_0_100px_rgba(0,0,0,0.2)] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Importar Roteiro Bruto</DialogTitle>
            <DialogDescription className="text-zinc-500 font-medium pt-2">Cole seu texto aqui para converter em blocos.</DialogDescription>
          </DialogHeader>
          <div className="py-6  overflow-y-auto">
            <Textarea value={importText} onChange={(e) => setImportText(e.target.value)} className="min-h-[400px] font-mono text-xs bg-zinc-50 dark:bg-zinc-900 rounded p-6 border-zinc-200 dark:border-zinc-800" placeholder="Cena 1&#10;..." />
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={handleImport} className="bg-blue-600 hover:bg-blue-700 text-white font-black rounded px-12 h-14 text-xs uppercase tracking-widest shadow-xl">PROCESSAR E IMPORTAR</Button>
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

export default function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <Suspense fallback={<div className="h-screen flex items-center justify-center text-blue-500 font-bold animate-pulse">CARREGANDO...</div>}><EditorContent id={id} /></Suspense>;
}