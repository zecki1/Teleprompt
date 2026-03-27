"use client";

import React, { useEffect, useState, use, Suspense } from "react";
import { Scene, parseScript } from "@/lib/parser";
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
  Play,
  Save,
  Settings2,
  ImageIcon,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Scissors,
  ExternalLink,
  Loader2,
  Copy,
  CheckCircle2,
  FileText,
  Video,
  MonitorPlay,
  Type,
  Send,
  Clock,
  XCircle,
  Lock,
  Unlock,
  Eye,
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
} from "firebase/firestore";
import { db } from "@/lib/firebase";
// import { addScriptLinkToZecki } from "@/services/zecki";
import Link from "next/link";

type ScriptStatus = "rascunho" | "em_revisao" | "revisao_realizada" | "aguardando_gravacao" | "gravado" | "rejeitado";

const statusConfig: Record<ScriptStatus, { label: string; color: string; icon: React.ElementType }> = {
  rascunho: { label: "Rascunho", color: "bg-zinc-500", icon: FileText },
  em_revisao: { label: "Em Revisão", color: "bg-yellow-500", icon: Clock },
  revisao_realizada: { label: "Revisão Realizada", color: "bg-orange-500", icon: CheckCircle2 },
  aguardando_gravacao: { label: "Aguardando Gravação", color: "bg-green-500", icon: CheckCircle2 },
  gravado: { label: "Gravado", color: "bg-blue-500", icon: Send },
  rejeitado: { label: "Rejeitado", color: "bg-red-500", icon: XCircle },
};

function formatEditorLettering(spokenText: string | null | undefined): React.ReactNode {
  if (!spokenText) return null;
  
  // Regex para [let1], [img1], etc.
  const regex = /(\[(?:let|img)\d+\]|\[\d+\])/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(spokenText)) !== null) {
    parts.push(spokenText.slice(lastIndex, match.index));
    
    // [let1] em vermelho, [img1] em roxo
    const isImg = match[0].startsWith('[img');
    const colorClass = isImg ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400';
    
    parts.push(
      <span key={`marker-${match.index}`} className={`${colorClass} font-black`}>
        {match[0]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }
  
  parts.push(spokenText.slice(lastIndex));
  
  return parts.length > 0 ? parts : spokenText;
}

function EditorContent({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isNew = !id || id === "new";

  const [text, setText] = useState("");
  const [title, setTitle] = useState("Novo Roteiro");
  const [project, setProject] = useState("Geral");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(!isNew);
  const [scriptStatus, setScriptStatus] = useState<ScriptStatus>("rascunho");
  const [isPublic, setIsPublic] = useState(false);
  const [lockedForEditing, setLockedForEditing] = useState(false);

  const { user, hasPermission } = useAuth();
  const canEdit = hasPermission(["editor", "validador"]) && (!lockedForEditing || scriptStatus === "rascunho");
  const canValidate = hasPermission(["validador"]);
  const canSend = hasPermission(["validador"]) && scriptStatus === "aguardando_gravacao";

  // Controle de Visualização (Inversão de telas)
  const [viewMode, setViewMode] = useState<"redator" | "video">("redator");
  const [videoPage, setVideoPage] = useState(0);
  const scenesPerPage = 2;
  const totalPages = Math.ceil(scenes.length / scenesPerPage);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: "",
    visible: false,
  });

  const showToast = (message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3000);
  };

  // 1. Carregar dados do Firestore
  useEffect(() => {
    if (isNew) {
      const p = searchParams.get("project");
      if (p) setProject(p);
      setLoading(false);
      return;
    }

    async function loadScript() {
      try {
        const scriptRef = doc(db, "scripts", id);
        const scriptSnap = await getDoc(scriptRef);

        if (scriptSnap.exists()) {
          const data = scriptSnap.data();
          setTitle(data.title || "");
          setProject(data.project || "Geral");
          setProjectId(data.projectId || null);
          setScriptStatus(data.status || "rascunho");
          setIsPublic(data.isPublic || false);
          setLockedForEditing(data.lockedForEditing || false);

          const vQ = query(
            collection(db, "scripts", id, "versions"),
            orderBy("createdAt", "desc"),
            limit(1)
          );
          const vSnap = await getDocs(vQ);

          if (!vSnap.empty) {
            const vData = vSnap.docs[0].data();
            setText(vData.content || "");
            setScenes(vData.scenes || []);
          }
        }
      } catch (e) {
        console.error("Erro ao carregar roteiro:", e);
      } finally {
        setLoading(false);
      }
    }
    loadScript();
  }, [id, isNew, searchParams]);

  // Funções de Validação
  const updateStatus = async (newStatus: ScriptStatus) => {
    if (isNew) {
      showToast("Salve o roteiro primeiro antes de mudar o status.");
      return;
    }
    
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      if (newStatus === "em_revisao" || newStatus === "revisao_realizada" || newStatus === "aguardando_gravacao") {
        updateData.lockedForEditing = false;
        setLockedForEditing(false);
      } else if (newStatus === "rascunho") {
        updateData.validatedBy = null;
        updateData.validatedAt = null;
        updateData.lockedForEditing = false;
        setLockedForEditing(false);
      } else if (newStatus === "gravado") {
        updateData.sentAt = new Date().toISOString();
      }

      await updateDoc(doc(db, "scripts", id), updateData);
      setScriptStatus(newStatus);
      showToast(`Roteiro movido para ${statusConfig[newStatus].label}`);
    } catch (e) {
      console.error("Erro ao atualizar status:", e);
      showToast("Erro ao atualizar status.");
    }
  };

  const togglePublic = async () => {
    if (isNew) return;
    try {
      const newIsPublic = !isPublic;
      await updateDoc(doc(db, "scripts", id), {
        isPublic: newIsPublic,
        updatedAt: serverTimestamp(),
      });
      setIsPublic(newIsPublic);
      showToast(newIsPublic ? "Link público ativado" : "Link público desativado");
    } catch (e) {
      console.error("Erro ao alternar visibilidade:", e);
    }
  };

  const unlockForEditing = async () => {
    if (isNew || !canValidate) return;
    try {
      await updateDoc(doc(db, "scripts", id), {
        lockedForEditing: false,
        updatedAt: serverTimestamp(),
      });
      setLockedForEditing(false);
      showToast("Roteiro desbloqueado para edição");
    } catch (e) {
      console.error("Erro ao desbloquear:", e);
    }
  };

  /* const sendToZecki = async () => {
    if (!canValidate || scriptStatus !== "validado") return;
    
    setIsSaving(true);
    try {
      const scriptUrl = `${window.location.origin}/s/${id}`;
      
      const result = await addScriptLinkToZecki(
        project,
        project,
        title,
        scriptUrl,
        id,
        user?.displayName || user?.email || "Unknown"
      );

      if (result.success) {
        await updateDoc(doc(db, "scripts", id), {
          status: "enviado",
          sentAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        });
        setScriptStatus("enviado");
        showToast("Roteiro enviado para gravação no Zecki!");
      } else {
        showToast("Erro ao enviar para Zecki: " + (result.error || "Erro desconhecido"));
      }
    } catch (e) {
      console.error("Erro ao enviar para Zecki:", e);
      showToast("Erro ao enviar para Zecki");
    } finally {
      setIsSaving(false);
    }
  }; */

  // 2. Lógica de Salvamento
  const handleSaveClick = () => {
    if (scenes.length === 0) return alert("Processe o roteiro antes de salvar.");
    setShowSaveModal(true);
  };

  const handleSave = async (saveStatus: ScriptStatus) => {
    setShowSaveModal(false);
    setIsSaving(true);
    try {
      // Limpa campos undefined/null das cenas para evitar erro do Firestore
      const cleanScenes = scenes.map(scene => ({
        id: scene.id,
        sceneNumber: scene.sceneNumber,
        ...Object.fromEntries(
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          Object.entries(scene).filter(([_, value]) => value !== undefined && value !== null && value !== "")
        )
      }));

      let currentScriptId = id;
      if (isNew) {
        const docRef = await addDoc(collection(db, "scripts"), {
          title,
          project,
          projectId,
          status: saveStatus,
          createdBy: user?.uid,
          createdByName: user?.displayName || user?.email || "Unknown",
          createdAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
          isPublic: false,
          lockedForEditing: false,
        });
        currentScriptId = docRef.id;
        setScriptStatus(saveStatus);
      } else {
        await updateDoc(doc(db, "scripts", currentScriptId), {
          title,
          project,
          projectId,
          status: saveStatus,
          updatedAt: serverTimestamp(),
        });
        setScriptStatus(saveStatus);
      }

      await addDoc(
        collection(db, "scripts", currentScriptId as string, "versions"),
        {
          content: text,
          scenes: cleanScenes,
          createdAt: new Date().toISOString(),
        }
      );

      showToast("Roteiro salvo com sucesso!");
      if (isNew) router.push("/dashboard");
    } catch (e) {
      console.error(e);
      alert("Falha ao salvar roteiro.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateScene = (index: number, data: Partial<Scene>) => {
    const ns = [...scenes];
    ns[index] = { ...ns[index], ...data };
    setScenes(ns);
  };

  const splitScene = (index: number) => {
    const s = scenes[index];
    const mid = Math.floor((s.spokenText?.length || 0) / 2);
    const sceneA = { ...s, spokenText: s.spokenText?.substring(0, mid) };
    const sceneB: Scene = {
      id: crypto.randomUUID(),
      sceneNumber: `${s.sceneNumber}.1`,
      spokenText: s.spokenText?.substring(mid) || "",
      time: "",
      imageUrl: "",
      sourceUrl: "",
      lettering: "",
    };
    const updated = [...scenes];
    updated.splice(index + 1, 0, sceneB);
    updated[index] = sceneA;
    setScenes(updated);
  };

  const copyLettering = (rawText: string) => {
    // Remove marcações como [1], [2], etc e limpa espaços
    const cleanText = rawText.replace(/\[\d+\]/g, "").trim();
    navigator.clipboard.writeText(cleanText);
    showToast("Lettering copiado com sucesso!");
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center dark:bg-zinc-950">
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      </div>
    );

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-all text-zinc-900 dark:text-zinc-100 font-sans">
      {/* TOAST DE FEEDBACK */}
      {toast.visible && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-zinc-900 dark:bg-white text-white dark:text-black px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-10">
          <CheckCircle2 size={18} className="text-emerald-500" />
          <span className="text-xs font-black uppercase tracking-widest">
            {toast.message}
          </span>
        </div>
      )}

      {/* PAINEL: TEXTO BRUTO (REDATOR / SIDEBAR NA EDIÇÃO) */}
      <div
        className={`flex flex-col p-6 space-y-4 overflow-y-auto border-zinc-200 dark:border-zinc-800 transition-all duration-500 ${
          viewMode === "redator"
            ? "flex-1 border-r"
            : "w-[380px] border-r bg-zinc-100/50 dark:bg-zinc-900/30 order-first"
        }`}
      >
        <div className="flex items-center gap-4 mb-2 shrink-0">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/dashboard">
              <ChevronLeft />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-7 font-bold bg-transparent border-none focus-visible:ring-0 p-0 text-lg shadow-none"
              />
              <Badge className={`${statusConfig[scriptStatus]?.color} hover:${statusConfig[scriptStatus]?.color} text-white text-[10px] px-2 py-0.5`}>
                {statusConfig[scriptStatus]?.label}
              </Badge>
              {isPublic && (
                <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-green-500 text-green-600">
                  <Eye className="w-3 h-3 mr-1" /> Público
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Input
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="h-5 bg-transparent border-none focus-visible:ring-0 p-0 text-[10px] text-blue-500 font-black uppercase tracking-widest shadow-none w-auto"
              />
              {lockedForEditing && scriptStatus !== "rascunho" && (
                <span className="text-[10px] text-orange-500 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Bloqueado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Barra de Status no Topo */}
        <div className="flex items-center justify-between gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-zinc-500">Status:</span>
            {canValidate && !isNew ? (
              <div className="flex items-center gap-1">
                {scriptStatus === "rascunho" && (
                  <Button size="sm" onClick={() => updateStatus("em_revisao")} className="h-6 text-[10px] bg-yellow-500 hover:bg-yellow-600">
                    <Clock className="w-3 h-3 mr-1" /> Enviar para Revisão
                  </Button>
                )}
                {scriptStatus === "em_revisao" && (
                  <>
                    <Button size="sm" onClick={() => updateStatus("revisao_realizada")} className="h-6 text-[10px] bg-orange-500 hover:bg-orange-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Revisão Realizada
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus("rejeitado")} className="h-6 text-[10px] border-red-500 text-red-500 hover:bg-red-50">
                      <XCircle className="w-3 h-3 mr-1" /> Rejeitar
                    </Button>
                  </>
                )}
                {scriptStatus === "revisao_realizada" && (
                  <>
                    <Button size="sm" onClick={() => updateStatus("aguardando_gravacao")} className="h-6 text-[10px] bg-green-500 hover:bg-green-600">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Aguardando Gravação
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus("rascunho")} className="h-6 text-[10px]">
                      <FileText className="w-3 h-3 mr-1" /> Voltar
                    </Button>
                  </>
                )}
                {scriptStatus === "aguardando_gravacao" && (
                  <>
                    <Button size="sm" onClick={() => updateStatus("gravado")} className="h-6 text-[10px] bg-blue-500 hover:bg-blue-600">
                      <Send className="w-3 h-3 mr-1" /> Marcar como Gravado
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus("revisao_realizada")} className="h-6 text-[10px]">
                      <FileText className="w-3 h-3 mr-1" /> Voltar
                    </Button>
                  </>
                )}
                {scriptStatus === "gravado" && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus("rascunho")} className="h-6 text-[10px]">
                    <FileText className="w-3 h-3 mr-1" /> Voltar para Rascunho
                  </Button>
                )}
                {scriptStatus === "rejeitado" && (
                  <Button size="sm" onClick={() => updateStatus("rascunho")} className="h-6 text-[10px]">
                    <FileText className="w-3 h-3 mr-1" /> Voltar para Rascunho
                  </Button>
                )}
              </div>
            ) : (
              <Badge className={`${statusConfig[scriptStatus]?.color} hover:${statusConfig[scriptStatus]?.color} text-white text-[10px] px-2 py-0.5`}>
                {statusConfig[scriptStatus]?.label}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isPublic ? "default" : "outline"}
              size="sm"
              onClick={togglePublic}
              className="h-6 text-[10px]"
            >
              <Eye className="w-3 h-3 mr-1" />
              {isPublic ? "Público" : "Privado"}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-200 dark:border-zinc-800 shrink-0 shadow-sm">
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg gap-1">
            <button
              onClick={() => setViewMode("redator")}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black flex items-center gap-2 transition-all ${
                viewMode === "redator"
                  ? "bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400"
                  : "text-zinc-500"
              }`}
            >
              <FileText size={14} /> REDATOR
            </button>
            <button
              onClick={() => setViewMode("video")}
              className={`px-4 py-1.5 rounded-md text-[10px] font-black flex items-center gap-2 transition-all ${
                viewMode === "video"
                  ? "bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400"
                  : "text-zinc-500"
              }`}
            >
              <Video size={14} /> EDIÇÃO
            </button>
          </div>
          <Button
            size="sm"
            onClick={() => setScenes(parseScript(text))}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] px-4 rounded-lg"
          >
            <Settings2 className="w-3.5 h-3.5 mr-2" /> PROCESSAR
          </Button>
        </div>

        <Textarea
          placeholder={`Cena 1\nlet: [1] Nome [2] Cargo\nLocução: Seu texto aqui...`}
          className="flex-1 min-h-[300px] font-mono text-sm p-4 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 leading-relaxed resize-none focus-visible:ring-blue-500 shadow-inner rounded-2xl"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>

      {/* PAINEL: BLOCOS (PRINCIPAL NA EDIÇÃO / SIDEBAR NO REDATOR) */}
      <div
        className={`flex flex-col bg-white dark:bg-zinc-900 overflow-hidden shadow-2xl transition-all duration-500 ${
          viewMode === "video"
            ? "flex-1"
            : "w-[500px] border-l border-zinc-200 dark:border-zinc-800"
        }`}
      >
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-800/50 backdrop-blur shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-black text-xs uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-500" /> Cenas ({scenes.length})
            </h2>
            {!isNew && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[9px] font-black border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                asChild
              >
                <Link href={`/tp/${id}`} target="_blank">
                  <MonitorPlay className="w-3 h-3 mr-1.5 text-blue-500" /> PLAY
                  TP
                </Link>
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {viewMode === "video" && totalPages > 1 && (
              <div className="flex items-center gap-1 mr-2">
                <button
                  onClick={() => setVideoPage(Math.max(0, videoPage - 1))}
                  disabled={videoPage === 0}
                  className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[10px] font-bold text-zinc-500 px-2">
                  {videoPage + 1}/{totalPages}
                </span>
                <button
                  onClick={() => setVideoPage(Math.min(totalPages - 1, videoPage + 1))}
                  disabled={videoPage >= totalPages - 1}
                  className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
            <Button
              onClick={handleSaveClick}
              disabled={isSaving || scenes.length === 0}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] tracking-widest px-4 rounded-lg"
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
              ) : (
                <Save className="w-3.5 h-3.5 mr-2" />
              )}
              SALVAR NO BANCO
            </Button>
          </div>
        </div>

        <div className="flex-1 h-full w-full [&>div]:!block overflow-x-hidden">
          <div
            className={`p-4 space-y-4 pb-32 flex flex-col w-full min-w-0 ${
              viewMode === "video"
                ? "grid grid-cols-1 xl:grid-cols-2 gap-6 space-y-0"
                : ""
            }`}
          >
            {(viewMode === "video" 
              ? scenes.slice(videoPage * scenesPerPage, (videoPage + 1) * scenesPerPage)
              : scenes
            ).map((scene, index) => (
              <Card
                key={scene.id}
                className="group bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 shadow-sm hover:border-blue-500/50 transition-all w-full min-w-0 overflow-hidden rounded-2xl"
              >
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-2 border-b border-zinc-100 dark:border-zinc-700 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="bg-zinc-800 dark:bg-blue-600 text-white text-[9px] px-2 py-0.5 rounded-full font-black shrink-0 uppercase tracking-tighter">
                      CENA {scene.sceneNumber}
                    </span>
                    <Input
                      value={scene.time || ""}
                      onChange={(e) => updateScene(index, { time: e.target.value })}
                      placeholder="Tempo"
                      className="h-6 w-20 text-[10px] bg-transparent border-dashed border-zinc-300 dark:border-zinc-600 p-1 rounded w-full"
                    />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-blue-500"
                      onClick={() => splitScene(index)}
                    >
                      <Scissors className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-zinc-400 hover:text-red-500"
                      onClick={() =>
                        setScenes(scenes.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-3 space-y-4 overflow-hidden">
                  {/* TELEPROMPTER */}
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-black text-blue-500/70 tracking-widest">
                      Teleprompter
                    </Label>
                    {viewMode === "video" && scene.lettering ? (
                      <div className="min-h-[60px] p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded border border-zinc-200 dark:border-zinc-700/50 text-sm font-medium leading-relaxed shadow-inner overflow-hidden">
                        {formatEditorLettering(scene.spokenText) || <span className="text-zinc-400 italic">Sem texto...</span>}
                      </div>
                    ) : null}
                    <Textarea
                      value={scene.spokenText || ""}
                      onChange={(e) =>
                        updateScene(index, { spokenText: e.target.value })
                      }
                      disabled={!canEdit}
                      className={`text-sm font-medium leading-relaxed min-h-[100px] border-none bg-zinc-50/50 dark:bg-zinc-900/50 p-3 resize-none w-full rounded shadow-inner dark:text-zinc-200 ${viewMode === "video" && scene.lettering ? "!min-h-[60px]" : ""} ${!canEdit ? "opacity-60" : ""}`}
                    />
                  </div>

                  {/* LETTERING */}
                  {scene.lettering && (
                    <div className="space-y-1.5">
                      <Label className="text-[8px] uppercase font-black text-amber-600 dark:text-amber-500 tracking-tighter flex items-center gap-1">
                        <Type size={10} /> Lettering (Clique p/ copiar)
                      </Label>
                      <div className="flex flex-col gap-1">
                        {scene.lettering
                          .split("\n")
                          .filter((l) => l.trim())
                          .map((line, i) => (
                            <button
                              key={i}
                              onClick={() => copyLettering(line)}
                              title="Clique para copiar apenas o texto limpo"
                              className="text-left bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 text-[10px] px-3 py-2 rounded border border-amber-200 dark:border-amber-900/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all flex items-center justify-between group/let shadow-sm"
                            >
                              <span className="truncate flex-1 font-bold">
                                <span className="opacity-40 mr-2 font-mono">{i + 1}.</span>
                                {line}
                              </span>
                              <Copy
                                size={12}
                                className="ml-2 opacity-30 group-hover/let:opacity-100"
                              />
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* IMG + URL */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <Input
                          value={scene.imageUrl || ""}
                          onChange={(e) =>
                            updateScene(index, { imageUrl: e.target.value })
                          }
                          placeholder="img:"
                          className="h-6 text-[10px] border-none bg-transparent focus-visible:ring-0 p-0 min-w-0 flex-1 dark:text-zinc-300"
                        />
                        {scene.imageUrl && (
                          <button
                            onClick={() => window.open(scene.imageUrl!, "_blank")}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-blue-500"
                          >
                            <ExternalLink size={14} />
                          </button>
                        )}
                      </div>
                      {(scene.images || []).map((img, imgIdx) => (
                        <div key={imgIdx} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                          <ImageIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0 opacity-50" />
                          <Input
                            value={img}
                            onChange={(e) => {
                              const newImages = [...(scene.images || [])];
                              newImages[imgIdx] = e.target.value;
                              updateScene(index, { images: newImages });
                            }}
                            placeholder={`img ${imgIdx + 2}:`}
                            className="h-6 text-[10px] border-none bg-transparent focus-visible:ring-0 p-0 min-w-0 flex-1 dark:text-zinc-300"
                          />
                          <button
                            onClick={() => {
                              const newImages = (scene.images || []).filter((_, i) => i !== imgIdx);
                              updateScene(index, { images: newImages });
                            }}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <Input
                          value={scene.sourceUrl || ""}
                          onChange={(e) =>
                            updateScene(index, { sourceUrl: e.target.value })
                          }
                          placeholder="url:"
                          className="h-6 text-[10px] border-none bg-transparent focus-visible:ring-0 p-0 min-w-0 flex-1 dark:text-zinc-300"
                        />
                        {scene.sourceUrl && (
                          <button
                            onClick={() => window.open(scene.sourceUrl!, "_blank")}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-emerald-500"
                          >
                            <ExternalLink size={14} />
                          </button>
                        )}
                      </div>
                      {(scene.sources || []).length > 0 && (scene.sources || []).map((src, srcIdx) => (
                        <div key={srcIdx} className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                          <ExternalLink className="w-3.5 h-3.5 text-zinc-400 shrink-0 opacity-50" />
                          <Input
                            value={src}
                            onChange={(e) => {
                              const newSources = [...(scene.sources || [])];
                              newSources[srcIdx] = e.target.value;
                              updateScene(index, { sources: newSources });
                            }}
                            placeholder={`url ${srcIdx + 2}:`}
                            className="h-6 text-[10px] border-none bg-transparent focus-visible:ring-0 p-0 min-w-0 flex-1 dark:text-zinc-300"
                          />
                          <button
                            onClick={() => {
                              const newSources = (scene.sources || []).filter((_, i) => i !== srcIdx);
                              updateScene(index, { sources: newSources });
                            }}
                            className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const newImages = [...(scene.images || []), ""];
                      const newSources = [...(scene.sources || []), ""];
                      updateScene(index, { images: newImages, sources: newSources });
                    }}
                    className="flex items-center gap-2 text-[9px] font-bold text-purple-500 hover:text-purple-600 transition px-2 py-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                  >
                    <Plus size={12} /> ADICIONAR IMG + URL
                  </button>

                  {/* OBSERVAÇÃO */}
                  <div className="space-y-1">
                    <Label className="text-[9px] uppercase font-black text-purple-500/70 tracking-widest">
                      Observação
                    </Label>
                    <Textarea
                      value={scene.observation || ""}
                      onChange={(e) =>
                        updateScene(index, { observation: e.target.value })
                      }
                      placeholder="Notas e observações..."
                      className="text-xs font-medium leading-relaxed min-h-[60px] border-none bg-purple-50/50 dark:bg-purple-900/20 p-3 resize-none w-full rounded shadow-inner dark:text-purple-200 placeholder:text-purple-300/50"
                    />
                  </div>

                  {/* PRÉVIA DA IMAGEM */}
                  {(scene.imageUrl || (scene.images && scene.images.length > 0)) && (
                    <div className="grid grid-cols-2 gap-2 shrink-0 mt-2">
                      {scene.imageUrl && (
                        <div className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-black shadow-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={scene.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-contain"
                            onError={(e) =>
                              (e.currentTarget.src =
                                "https://placehold.co/400x225?text=Link+Invalido")
                            }
                          />
                        </div>
                      )}
                      {(scene.images || []).filter((img) => img && img.trim() !== "").map((img, idx) => (
                        <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-black shadow-lg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img}
                            alt={`Preview ${idx + 2}`}
                            className="w-full h-full object-contain"
                            onError={(e) =>
                              (e.currentTarget.src =
                                "https://placehold.co/400x225?text=Link+Invalido")
                            }
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outline"
              className={`w-full border-dashed border-2 py-12 text-zinc-400 dark:border-zinc-700 hover:text-blue-500 hover:border-blue-500 transition-all bg-transparent shrink-0 rounded-2xl ${
                viewMode === "video" ? "col-span-full" : ""
              }`}
              onClick={() =>
                setScenes([
                  ...scenes,
                  {
                    id: crypto.randomUUID(),
                    sceneNumber: String(scenes.length + 1),
                    spokenText: "",
                  },
                ])
              }
            >
              <Plus className="w-5 h-5 mr-2" /> NOVO BLOCO MANUAL
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Salvar */}
      <Dialog open={showSaveModal} onOpenChange={setShowSaveModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar Roteiro</DialogTitle>
            <DialogDescription>
              Escolha em qual status deseja salvar o roteiro.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            {scriptStatus === "rascunho" ? (
              <>
                <Button
                  onClick={() => handleSave("rascunho")}
                  disabled={isSaving}
                  className="w-full h-12 bg-zinc-600 hover:bg-zinc-700 text-white justify-start"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  <span className="font-bold">Salvar como Rascunho</span>
                </Button>
                <Button
                  onClick={() => handleSave("em_revisao")}
                  disabled={isSaving}
                  className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-white justify-start"
                >
                  <Clock className="w-5 h-5 mr-2" />
                  <span className="font-bold">Enviar para Revisão</span>
                </Button>
              </>
            ) : scriptStatus === "em_revisao" ? (
              <>
                <Button
                  onClick={() => handleSave("em_revisao")}
                  disabled={isSaving}
                  className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-white justify-start"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  <span className="font-bold">Salvar como Em Revisão</span>
                </Button>
                <Button
                  onClick={() => handleSave("aguardando_gravacao")}
                  disabled={isSaving}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 text-white justify-start"
                >
                  <Video className="w-5 h-5 mr-2" />
                  <span className="font-bold">Enviar para Gravação</span>
                </Button>
              </>
            ) : (
              <Button
                onClick={() => handleSave(scriptStatus)}
                disabled={isSaving}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white justify-start"
              >
                <Save className="w-5 h-5 mr-2" />
                <span className="font-bold">Salvar</span>
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSaveModal(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Wrapper Principal
export default function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense
      fallback={
        <div className="h-screen flex items-center justify-center dark:bg-zinc-950 text-blue-500 font-bold tracking-widest animate-pulse uppercase">
          <Loader2 className="animate-spin mr-2" /> Carregando Interface...
        </div>
      }
    >
      <EditorContent id={id} />
    </Suspense>
  );
}