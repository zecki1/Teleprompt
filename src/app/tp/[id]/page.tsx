"use client";

import { useEffect, useState, useRef, use, Suspense } from "react";
import { doc, onSnapshot, getDocs, collection, query, orderBy, limit, updateDoc, serverTimestamp, arrayUnion, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { logActivity } from "@/lib/activity";
import { Scene } from "@/lib/parser";
import { RemoteControlUI } from "@/components/tp/RemoteControlUI";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Monitor, 
  ChevronLeft, 
  ChevronDown,
  ChevronUp,
  Type, 
  AlignJustify,
  Settings2,
  Palette,
  Clock,
  Expand,
  Zap,
  Save,
  CheckCircle2,
  X,
  Play,
  Pause,
  MessageSquare,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateTaskVideomaker } from "@/lib/zecki";
import Link from "next/link";
import { CommentsPanel } from "@/components/tp/CommentsPanel";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

function TeleprompterContent({ id }: { id: string }) {
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const isMirrorWindow = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('mirror') === 'true' : false;
  const [isMirrored] = useState(isMirrorWindow);
  const [showRemote, setShowRemote] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const { user } = useAuth();
  
  // App State
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [duration, setDuration] = useState(0);
  const [localProgress, setLocalProgress] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'saved' | null>(null);
  const [scriptTitle, setScriptTitle] = useState("");
  const [recordingTaskId, setRecordingTaskId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string | null>(null);
  const [folder, setFolder] = useState<string | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [nextScript, setNextScript] = useState<any | null>(null);
  const [showNextModal, setShowNextModal] = useState(false);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [editorName, setEditorName] = useState<string | null>(null);
  const router = useRouter();

  // Refs para Motor de Scroll (Evita lag de estado)
  const isPlayingRef = useRef(false);
  const speedRef = useRef(3);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRefs = useRef<(HTMLDivElement | null)[]>([]);
  const requestRef = useRef<number | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const lastFirebaseUpdate = useRef<number>(0);
  const lastProcessedReset = useRef<number>(0);

  // Appearance States
  const [fontSize, setFontSize] = useState("text-7xl");
  const [textAlign, setTextAlign] = useState("text-left");
  const [fontFamily, setFontFamily] = useState("font-sans");
  const [fontWeight, setFontWeight] = useState("font-medium");
  const [lineHeight, setLineHeight] = useState("leading-relaxed");
  const [maxWidth, setMaxWidth] = useState("max-w-4xl");
  const [bgColor, setBgColor] = useState("#000000");
  const [textColor, setTextColor] = useState("#ffffff");

  // CSS para ocultar marcadores no TP
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .tp-hidden-marker {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  // --- 1. LÓGICA DE FULLSCREEN E SUPORTE ---

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
      }
    } catch (e) { console.error(e); }
  };

  const calculateDuration = (scenesList: Scene[]) => {
    const wordCount = scenesList.reduce((acc, s) => acc + (s.spokenText ? s.spokenText.split(/\s+/).length : 0), 0);
    return Math.max(10, Math.floor((wordCount / 130) * 60));
  };

  const handleSceneBlur = (sceneId: string, newText: string) => {
    const updatedScenes = scenes.map(scene => {
      if (scene.id === sceneId) {
        // Limpa labels e preserva o lettering original intacto
        const cleanNewText = newText
          .replace(/^\[?Locução\]?|^\[?Legenda\]?|^(Tempo|Cena|Descrição|GC|Texto em tela|Link|url|img|let)\s*[:\-]?\s*/gim, '')
          .trim();
        
        // Preserva o lettering original - não tentamos extrair mais
        return { ...scene, spokenText: cleanNewText };
      }
      return scene;
    });
    
    setScenes(updatedScenes);
    const rawContent = reconstructRawText(updatedScenes);
    updateDoc(doc(db, "scripts", id, "versions", versionId!), { scenes: updatedScenes, content: rawContent });
    updateDoc(doc(db, "scripts", id), { duration: calculateDuration(updatedScenes) });
  };

  // Texto para TP com marcadores ocultos mas preservados
  const getTPDisplay = (text: string | null) => {
    if (!text) return "";
    // Converte [let1], [img1], [abe], [enc] para spans com estilo
    return text
      .replace(/\[let(\d+)\]/g, '<span class="bg-red-600 text-white px-2 py-0.5 rounded-lg mx-1 font-black text-[0.4em] align-middle shadow-[0_0_15px_rgba(220,38,38,0.5)]">LET $1</span>')
      .replace(/\[img(\d+)\]/g, '<span class="bg-blue-600 text-white px-2 py-0.5 rounded-lg mx-1 font-black text-[0.4em] align-middle shadow-[0_0_15px_rgba(37,99,235,0.5)]">IMG $1</span>')
      .replace(/\[abe\]/g, '<span class="bg-emerald-600 text-white px-2 py-0.5 rounded-lg mx-1 font-black text-[0.4em] align-middle shadow-[0_0_15px_rgba(16,185,129,0.5)]">ABERTURA</span>')
      .replace(/\[enc\]/g, '<span class="bg-rose-600 text-white px-2 py-0.5 rounded-lg mx-1 font-black text-[0.4em] align-middle shadow-[0_0_15px_rgba(225,29,72,0.5)]">ENCERRAMENTO</span>')
      .replace(/\[(\d+)\]/g, '<span class="bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-lg mx-1 font-black text-[0.4em] align-middle">$1</span>');
  };

  const reconstructRawText = (scenesList: Scene[]): string => {
    return scenesList.map((s) => {
      let sceneText = `Cena ${s.sceneNumber}\n`;
      
      // Imagens
      const allImages = [s.imageUrl, ...(s.images || [])].filter(Boolean);
      allImages.forEach((img) => {
        sceneText += `[img${allImages.indexOf(img) + 1}]: ${img}\n`;
      });

      // URLs
      const allUrls = [s.sourceUrl, ...(s.sources || [])].filter(Boolean);
      allUrls.forEach((url) => {
        sceneText += `[url${allUrls.indexOf(url) + 1}]: ${url}\n`;
      });

      // Lettering - cada um em uma linha
      if (s.lettering) {
        const letLines = s.lettering.split('\n').filter(l => l.trim());
        letLines.forEach((letText, i) => {
          sceneText += `[let${i + 1}]: ${letText.trim()}\n`;
        });
      }

      // Abertura e Encerramento
      if (s.opening) sceneText += `[abe]: ${s.opening}\n`;
      if (s.closing) sceneText += `[enc]: ${s.closing}\n`;
      
      // Locução - mantém exatamente como está, só remove o prefixo se existir
      let spokenText = s.spokenText || '';
      // Remove prefixo [Locução]: ou Locução: mas mantém o resto intacto
      spokenText = spokenText.replace(/^\[?Locução\]?:\s*/i, '');
      
      if (spokenText.trim()) sceneText += `[Locução]: ${spokenText}`;
      return sceneText;
    }).join('\n\n');
  };

  const updateGlobalStyle = async (data: Record<string, string | number | boolean>) => {
    if (isMirrorWindow) return;
    try {
      await updateDoc(doc(db, "scripts", id), data);
    } catch (e) { console.error(e); }
  };

  // --- 2. CARREGAMENTO E SYNC FIRESTORE ---

  useEffect(() => {
    async function loadScenes() {
      try {
        const q = query(collection(db, "scripts", id, "versions"), orderBy("createdAt", "desc"), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          setVersionId(snapshot.docs[0].id);
          const loadedScenes = docData.scenes || [];
          setScenes(loadedScenes);
          setDuration(calculateDuration(loadedScenes));
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    loadScenes();
  }, [id]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "scripts", id), (docObj) => {
      if (docObj.exists()) {
        const d = docObj.data();
        if (typeof d.isPlaying === "boolean") {
          setIsPlaying(d.isPlaying);
          isPlayingRef.current = d.isPlaying;
        }
        if (typeof d.speed === "number") {
          setSpeed(d.speed);
          speedRef.current = d.speed;
        }
        // Sincronizar estilos salvos
        if (d.fontSize) setFontSize(d.fontSize);
        if (d.textAlign) setTextAlign(d.textAlign);
        if (d.bgColor) setBgColor(d.bgColor);
        if (d.textColor) setTextColor(d.textColor);
        if (d.maxWidth) setMaxWidth(d.maxWidth);
        if (d.fontFamily) setFontFamily(d.fontFamily);
        if (d.fontWeight) setFontWeight(d.fontWeight);
        if (d.lineHeight) setLineHeight(d.lineHeight);
        if (d.title) setScriptTitle(d.title);
        if (d.recordingTaskId) setRecordingTaskId(d.recordingTaskId);
        if (d.projectId) setProjectId(d.projectId);
        if (d.projectName) setProjectName(d.projectName);
        if (d.folder) setFolder(d.folder);
        if (d.workspaceId) setWorkspaceId(d.workspaceId);
        if (d.editorId) setEditorId(d.editorId);
        if (d.editorName) setEditorName(d.editorName);

        if (d.resetRequest && d.resetRequest !== lastProcessedReset.current) {
          if (containerRef.current) containerRef.current.scrollTop = 0;
          lastProcessedReset.current = d.resetRequest;
        }
      }
    });
    return () => unsub();
  }, [id]);

  // --- 3. ATALHOS DE TECLADO (POWERPOINT / CONTROLE) ---

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Permite Ctrl+Z (undo) mesmo durante edição
      if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
        return; // Deixa o navegador lidar com o undo nativamente
      }
      
      if (e.target instanceof HTMLElement && (
        e.target.isContentEditable || 
        e.target.tagName === 'INPUT' || 
        e.target.tagName === 'TEXTAREA' ||
        (isCommentsVisible && !containerRef.current?.contains(e.target))
      )) return;
      const currentScroll = containerRef.current?.scrollTop || 0;

      switch(e.code) {
        case 'Space':
          e.preventDefault();
          updateDoc(doc(db, "scripts", id), { isPlaying: !isPlayingRef.current });
          break;
        case 'ArrowRight':
          e.preventDefault();
          updateDoc(doc(db, "scripts", id), { speed: Math.min(speedRef.current + 1, 20) });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          updateDoc(doc(db, "scripts", id), { speed: Math.max(speedRef.current - 1, 0) });
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          const prev = [...sceneRefs.current].reverse().find(ref => ref && ref.offsetTop < currentScroll - 150);
          containerRef.current?.scrollTo({ top: prev?.offsetTop || 0, behavior: 'smooth' });
          break;
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          const next = sceneRefs.current.find(ref => ref && ref.offsetTop > currentScroll + 150);
          if (next) containerRef.current?.scrollTo({ top: next.offsetTop, behavior: 'smooth' });
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, isCommentsVisible]);

  // --- 4. MOTOR DE SCROLL E BROADCAST ---

  useEffect(() => {
    const scrollFn = () => {
      if (containerRef.current && !isMirrorWindow) {
        if (isPlayingRef.current) {
          containerRef.current.scrollTop += (speedRef.current * 0.4);
        }
        
        const maxScroll = containerRef.current.scrollHeight - containerRef.current.clientHeight;
        const currentProgress = maxScroll > 0 ? containerRef.current.scrollTop / maxScroll : 0;
        setLocalProgress(currentProgress);

        if (bcRef.current) {
          bcRef.current.postMessage({ 
            type: 'syncScroll', 
            scrollTop: containerRef.current.scrollTop,
            progress: currentProgress 
          });
        }

        const now = Date.now();
        if (now - lastFirebaseUpdate.current > 1000) {
          updateDoc(doc(db, "scripts", id), { progress: currentProgress }).catch(() => {});
          lastFirebaseUpdate.current = now;
        }
      }
      requestRef.current = requestAnimationFrame(scrollFn);
    };
    requestRef.current = requestAnimationFrame(scrollFn);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [id, isMirrorWindow]);

  useEffect(() => {
    const bc = new BroadcastChannel(`tp-sync-${id}`);
    bcRef.current = bc;
    if (isMirrorWindow) {
      bc.onmessage = (ev) => {
        if (ev.data.type === 'syncScroll' && containerRef.current) {
          containerRef.current.scrollTop = ev.data.scrollTop;
          setLocalProgress(ev.data.progress);
        }
        if (ev.data.type === 'syncScenes') setScenes(ev.data.scenes);
        if (ev.data.type === 'syncStyles') {
           setFontSize(ev.data.styles.fontSize);
           setTextAlign(ev.data.styles.textAlign);
           setBgColor(ev.data.styles.bgColor);
           setTextColor(ev.data.styles.textColor);
           setMaxWidth(ev.data.styles.maxWidth);
           setFontFamily(ev.data.styles.fontFamily);
           setFontWeight(ev.data.styles.fontWeight);
           setLineHeight(ev.data.styles.lineHeight);
        }
      };
    }
    return () => bc.close();
  }, [id, isMirrorWindow]);

  useEffect(() => {
    if (!isMirrorWindow && bcRef.current) {
      bcRef.current.postMessage({ 
        type: 'syncStyles', 
        styles: { fontSize, textAlign, fontFamily, fontWeight, lineHeight, maxWidth, bgColor, textColor } 
      });
    }
  }, [fontSize, textAlign, fontFamily, fontWeight, lineHeight, maxWidth, bgColor, textColor, isMirrorWindow]);
  if (loading) return <div className="fixed inset-0 bg-black flex items-center justify-center text-white font-bold animate-pulse">SINCRONIZANDO...</div>;

  const handleSetRecorded = async () => {
    try {
      const rawContent = reconstructRawText(scenes);
      await updateDoc(doc(db, "scripts", id, "versions", versionId!), { scenes, content: rawContent });
      await updateDoc(doc(db, "scripts", id), { 
        status: 'gravado',
        updatedAt: serverTimestamp(),
        duration: calculateDuration(scenes),
        videomakerId: user?.uid,
        videomakerName: user?.displayName || user?.name || "Videomaker"
      });

      console.log("[TP] Iniciando handleSetRecorded para ID:", id);
      
      // Atribui videomaker à tarefa no Zecki se houver uma tarefa vinculada
      if (projectId && recordingTaskId && user?.uid) {
        try {
          await updateTaskVideomaker(projectId, recordingTaskId, user.uid);
          console.log("Videomaker atribuído à tarefa do Zecki com sucesso.");
        } catch (zeckiError) {
          console.error("Erro ao atribuir videomaker no Zecki:", zeckiError);
        }
      }

      // Adiciona o usuário como colaborador e atribui responsabilidade se necessário
      if (user?.uid) {
        const scriptRef = doc(db, "scripts", id);
        const updateData: any = {
          collaborators: arrayUnion({
            uid: user.uid,
            name: user.displayName || user.name || user.email || "Usuário",
            role: "Videomaker",
            timestamp: new Date().toISOString()
          })
        };

        // Se não houver responsável definido, define o usuário atual
        if (!editorId) {
          updateData.editorId = user.uid;
          updateData.editorName = user.displayName || user.name || user.email || "Videomaker";
        }

        await updateDoc(scriptRef, updateData);

        // Registra a atividade no log global
        await logActivity({
          userId: user.uid,
          userName: user.displayName || user.name || user.email || "Usuário",
          userAvatar: user.photoURL || null,
          action: "Gravou",
          scriptId: id,
          scriptTitle: scriptTitle,
          projectId: projectId || null,
          projectName: projectName || null,
          folder: folder || null,
          workspaceId: workspaceId || "senai"
        });
      }

      setSaveStatus('saved');
      console.log("[TP] Status salvo como gravado. Buscando próximo roteiro...");
      
      // Busca o próximo roteiro para sugerir
      await findNextScript();
      
      setTimeout(() => setSaveStatus(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const findNextScript = async () => {
    try {
      const activeWorkspaceId = workspaceId || "senai";
      const scriptsRef = collection(db, "scripts");
      
      // Busca todos os roteiros do workspace para garantir a ordem correta
      const q = query(
        scriptsRef, 
        where("workspaceId", "==", activeWorkspaceId)
      );
      
      const snapshot = await getDocs(q);
      const allScripts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      
      console.log(`[NextScript] Total de roteiros encontrados no workspace ${activeWorkspaceId}:`, allScripts.length);
      
      if (allScripts.length === 0) {
        console.log("[NextScript] Nenhum roteiro encontrado no workspace.");
        return;
      }

      // Ordenação: Projeto -> Pasta -> Título (mesma lógica do Dashboard)
      allScripts.sort((a, b) => {
        const projA = a.projectName || a.project || "Geral";
        const projB = b.projectName || b.project || "Geral";
        if (projA !== projB) return projA.localeCompare(projB, undefined, { numeric: true, sensitivity: 'base' });

        const folderA = a.folder || "Sem Pasta";
        const folderB = b.folder || "Sem Pasta";
        if (folderA !== folderB) return folderA.localeCompare(folderB, undefined, { numeric: true, sensitivity: 'base' });

        const titleA = a.title || "";
        const titleB = b.title || "";
        return titleA.localeCompare(titleB, undefined, { numeric: true, sensitivity: 'base' });
      });

      // Encontra o índice do roteiro atual
      const currentIndex = allScripts.findIndex(s => s.id === id);
      
      if (currentIndex !== -1) {
        // Procura o próximo roteiro que esteja revisado/aguardando gravação
        const next = allScripts.slice(currentIndex + 1).find(s => 
          s.status === "revisao_realizada" || s.status === "aguardando_gravacao"
        );

        if (next) {
          console.log("[NextScript] Sucesso! Sugerindo:", next.title, "ID:", next.id);
          setNextScript(next);
          setShowNextModal(true);
        } else {
          console.log("[NextScript] Nenhum roteiro 'revisado' encontrado após o atual na lista ordenada.");
        }
      } else {
        console.log("[NextScript] Roteiro atual não encontrado na lista de scripts do workspace.");
      }
    } catch (err) {
      console.error("Erro ao buscar próximo roteiro:", err);
    }
  };

  return (
    <div className={isMirrorWindow ? "fixed inset-0 z-[100] flex overflow-hidden" : "absolute inset-0 flex overflow-hidden top-[64px] h-[calc(100vh-64px)] z-40"} style={{ backgroundColor: bgColor }}>
      {isCommentsVisible && !isMirrorWindow && (
        <CommentsPanel 
          scriptId={id} 
          onClose={() => setIsCommentsVisible(false)} 
          hasFooter={!isSidebarVisible}
        />
      )}
      <div className="flex-1 flex flex-col relative overflow-hidden h-full">
      
      {/* BOTÃO PARA MOSTRAR SIDEBAR (MOBILE OU OCULTO) */}
      {!isMirrorWindow && !isSidebarVisible && (
        <button 
          onClick={() => setIsSidebarVisible(true)}
          className="fixed right-4 bottom-4 z-[60] w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-zinc-800 transition-all lg:hidden"
        >
          <Settings2 size={20} />
        </button>
      )}

      {/* OVERLAY PARA FULLSCREEN (Mirror Only) */}
      {isMirrorWindow && !isFullscreen && (
        <div onClick={toggleFullscreen} className="fixed inset-0 z-[110] bg-black/95 flex flex-col items-center justify-center cursor-pointer group transition-all">
          <Expand size={64} className="text-blue-500 mb-6 group-hover:scale-110 transition-transform" />
          <p className="text-white font-black text-xl uppercase tracking-tighter text-center">
            Ativar Tela de Retorno<br/>
            <span className="text-zinc-500 text-sm font-normal normal-case italic">Clique para entrar em modo Fullscreen</span>
          </p>
        </div>
      )}

      {/* ÁREA DO TEXTO */}
      <div className="flex-1 h-full overflow-y-auto relative no-scrollbar" ref={containerRef}>
        <div className="fixed top-1/2 left-0 w-full h-32 bg-white/5 pointer-events-none -translate-y-1/2 z-10 border-y border-white/10 shadow-2xl" />
        <div 
          className={`mx-auto px-12 py-[60vh] transition-all duration-300 relative ${fontFamily} ${maxWidth}`}
          style={{ transform: isMirrored ? "scaleX(-1)" : "none", color: textColor }}
        >
          {scenes.map((s, idx) => (
            <div 
              key={s.id} 
              ref={el => { sceneRefs.current[idx] = el; }} 
              className={`mb-32 break-words outline-none whitespace-pre-wrap transition-opacity duration-700 ${textAlign} ${fontWeight} ${fontSize} ${lineHeight} ${isPlaying ? 'opacity-100' : 'opacity-30'}`} 
              contentEditable={!isMirrorWindow} 
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                const rawText = e.currentTarget.innerText;
                handleSceneBlur(s.id, rawText);
              }}
              dangerouslySetInnerHTML={{ 
                __html: getTPDisplay(
                  (s.opening ? `[abe] ${s.opening}\n` : '') + 
                  (s.spokenText || '') + 
                  (s.closing ? `\n[enc] ${s.closing}` : '')
                ) 
              }}
            />
          ))}
        </div>
      </div>
      
      {/* SIDEBAR TOGGLE BUTTON (LG SCREEN) */}
      {!isMirrorWindow && (
        <div 
          onClick={() => setIsSidebarVisible(!isSidebarVisible)}
          className={`absolute right-4 top-4 z-[50] flex items-center gap-2 px-3 py-2 bg-zinc-900/80 backdrop-blur border border-zinc-800 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all hidden lg:flex cursor-pointer ${!isSidebarVisible ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}
        >
          {isSidebarVisible ? <X size={16} /> : <Settings2 size={16} />}
          <span className="text-[10px] font-bold uppercase tracking-widest">{isSidebarVisible ? "Ocultar" : "Controles"}</span>
          <div className="h-4 w-px bg-zinc-800 mx-1" />
          <button 
            onClick={(e) => { e.stopPropagation(); setIsCommentsVisible(!isCommentsVisible); }}
            className={`p-1 transition-colors ${isCommentsVisible ? 'text-blue-500' : 'text-zinc-500 hover:text-white'}`}
          >
            <MessageSquare size={16} />
          </button>
        </div>
      )}
      </div>

      {!isMirrorWindow && isSidebarVisible && (
        <div className="w-[400px] shrink-0 h-full bg-zinc-950 border-l border-zinc-800 flex flex-col z-20 shadow-2xl overflow-hidden animate-in slide-in-from-left-4 duration-300">
          <div className="p-4 border-b border-zinc-900 flex items-center justify-between">
            <Link href={`/editor/${id}`} className="p-2 text-zinc-500 hover:text-white transition"><ChevronLeft size={20}/></Link>
            <span className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase font-mono">Master Control</span>
            <button onClick={() => setIsSidebarVisible(false)} className="p-2 text-zinc-700 hover:text-white transition"><X size={18} /></button>
          </div>

          <div className="flex p-1.5 bg-zinc-900 m-4 rounded-xl gap-1 border border-zinc-800">
            <button onClick={() => setShowRemote(false)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${!showRemote ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Estilo</button>
            <button onClick={() => setShowRemote(true)} className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${showRemote ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>Remoto</button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 no-scrollbar text-zinc-100">
            {!showRemote ? (
              <div className="space-y-8 py-4 animate-in fade-in slide-in-from-left-4 duration-300">
                <button onClick={() => window.open(window.location.href + "?mirror=true", "TPMirror", "width=1200,height=900,menubar=no")} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-900/20">
                  <Monitor size={18} /> Abrir Tela de Retorno
                </button>

                <div className="space-y-6 pt-4 border-t border-zinc-900">
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2 tracking-widest"><Palette size={14}/> Cores do Tema</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <p className="text-[9px] text-zinc-600 uppercase font-bold">Fundo</p>
                           <div className="flex gap-2">
                              {['#000000', '#0a192f', '#064e3b'].map(c => (
                                <button key={c} onClick={() => updateGlobalStyle({bgColor: c})} className={`w-8 h-8 rounded-full border-2 transition-all ${bgColor === c ? 'border-blue-500 scale-110' : 'border-zinc-800 hover:border-zinc-600'}`} style={{ backgroundColor: c }} />
                              ))}
                           </div>
                        </div>
                        <div className="space-y-2">
                           <p className="text-[9px] text-zinc-600 uppercase font-bold">Texto</p>
                           <div className="flex gap-2">
                              {['#ffffff', '#ffff00', '#22d3ee'].map(c => (
                                <button key={c} onClick={() => updateGlobalStyle({textColor: c})} className={`w-8 h-8 rounded-full border-2 transition-all ${textColor === c ? 'border-blue-500 scale-110' : 'border-zinc-800 hover:border-zinc-600'}`} style={{ backgroundColor: c }} />
                              ))}
                           </div>
                        </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2 tracking-widest"><Type size={14}/> Tamanho Fonte</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['text-3xl', 'text-5xl', 'text-7xl', 'text-9xl', 'text-[5rem]', 'text-[7rem]', 'text-[9rem]', 'text-[12rem]'].map(t => (
                        <button key={t} onClick={() => updateGlobalStyle({fontSize: t})} className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${fontSize === t ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{t.replace('text-', '').replace('[', '').replace('rem]', 'r').replace('rem', 'r')}</button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2 tracking-widest"><Zap size={14}/> Estilos</p>
                    <div className="grid grid-cols-2 gap-2">
                       <button onClick={() => updateGlobalStyle({fontFamily: "font-sans"})} className={`py-2 rounded-lg text-[10px] font-bold border ${fontFamily === 'font-sans' ? 'bg-zinc-200 text-black' : 'text-zinc-500 border-zinc-800'}`}>SANS SERIF</button>
                       <button onClick={() => updateGlobalStyle({fontFamily: "font-serif"})} className={`py-2 rounded-lg text-[10px] font-bold border font-serif ${fontFamily === 'font-serif' ? 'bg-zinc-200 text-black' : 'text-zinc-500 border-zinc-800'}`}>SERIF</button>
                       <button onClick={() => updateGlobalStyle({fontWeight: "font-normal"})} className={`py-2 rounded-lg text-[10px] font-normal border ${fontWeight === 'font-normal' ? 'bg-zinc-200 text-black' : 'text-zinc-500 border-zinc-800'}`}>NORMAL</button>
                       <button onClick={() => updateGlobalStyle({fontWeight: "font-black"})} className={`py-2 rounded-lg text-[10px] font-black border ${fontWeight === 'font-black' ? 'bg-zinc-200 text-black' : 'text-zinc-500 border-zinc-800'}`}>BLACK</button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2 tracking-widest">↕ Espaçamento</p>
                    <div className="grid grid-cols-4 gap-1.5">
                       {['leading-tight', 'leading-normal', 'leading-relaxed', 'leading-loose'].map(lh => (
                         <button key={lh} onClick={() => { setLineHeight(lh); updateGlobalStyle({lineHeight: lh}); }} className={`py-2 rounded-lg text-[9px] font-bold border transition-all ${lineHeight === lh ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-500'}`}>{lh.replace('leading-', '')}</button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2 tracking-widest"><AlignJustify size={14}/> Largura do Bloco</p>
                    <div className="grid grid-cols-2 gap-2">
                       {['max-w-2xl', 'max-w-4xl', 'max-w-6xl', 'max-w-none'].map(w => (
                         <button key={w} onClick={() => updateGlobalStyle({maxWidth: w})} className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${maxWidth === w ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:bg-zinc-800'}`}>{w === 'max-w-none' ? 'FULL' : w.split('-')[2]}</button>
                       ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-zinc-900">
                    <p className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2 tracking-widest">
                      {isPlaying || localProgress > 0.05 ? <Zap size={14}/> : <Save size={14}/>} 
                      {isPlaying || localProgress > 0.05 ? "Finalizar Gravação" : "Salvar Roteiro"}
                    </p>
                    <button 
                      onClick={async () => {
                        if (isPlaying || localProgress > 0.05) {
                          await handleSetRecorded();
                        } else {
                          const rawContent = reconstructRawText(scenes);
                          await updateDoc(doc(db, "scripts", id, "versions", versionId!), { scenes, content: rawContent });
                          await updateDoc(doc(db, "scripts", id), { duration: calculateDuration(scenes) });
                          setSaveStatus('saved');
                          setTimeout(() => setSaveStatus(null), 2000);
                        }
                      }}
                      className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                        isPlaying || localProgress > 0.05 
                        ? "bg-blue-600 hover:bg-blue-500 shadow-blue-900/20" 
                        : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20"
                      } text-white`}
                    >
                      {saveStatus === 'saved' ? (
                        <>
                          <CheckCircle2 size={16} /> {isPlaying || localProgress > 0.05 ? "GRAVADO!" : "SALVO!"}
                        </>
                      ) : (
                        <>
                          {isPlaying || localProgress > 0.05 ? <Zap size={16} /> : <Save size={16} />} 
                          {isPlaying || localProgress > 0.05 ? "GRAVADO" : "SALVAR AGORA"}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 animate-in slide-in-from-left-4 duration-300">
                  <RemoteControlUI
                     isPlaying={isPlaying}
                     speed={speed}
                     duration={duration}
                     progress={localProgress}
                     update={(data) => updateDoc(doc(db, "scripts", id), data)}
                     manualScroll={(amt) => { if (containerRef.current) containerRef.current.scrollBy({ top: amt, behavior: 'smooth' }); }}
                     isCommentsVisible={isCommentsVisible}
                     setIsCommentsVisible={setIsCommentsVisible}
                  />
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-zinc-900 bg-zinc-950 flex items-center justify-center gap-4 shrink-0">
             <Clock size={12} className="text-zinc-600" />
             <span className="text-[9px] font-black uppercase text-zinc-600 tracking-[0.3em]">
                {isPlaying ? 'EXECUTANDO' : 'PAUSADO'} | VEL {speed}X
             </span>
          </div>
        </div>
      )}
      {!isMirrorWindow && !isSidebarVisible && (
        <div className="fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 z-50 flex items-center justify-between px-6 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-6 flex-1">
             {/* 1. VELOCIDADE */}
             <div className="flex flex-col">
               <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">Velocidade</span>
               <div className="flex items-center gap-2">
                 <button onClick={() => updateGlobalStyle({speed: Math.max(speed - 1, 0)})} className="text-zinc-600 hover:text-white transition-colors"><ChevronDown size={14}/></button>
                 <div className="flex items-baseline gap-1">
                   <span className="text-xl font-black text-white">{speed}</span>
                   <span className="text-[10px] font-bold text-zinc-600 uppercase">x</span>
                 </div>
                 <button onClick={() => updateGlobalStyle({speed: Math.min(speed + 1, 20)})} className="text-zinc-600 hover:text-white transition-colors"><ChevronUp size={14}/></button>
               </div>
             </div>

             <div className="h-8 w-px bg-zinc-800" />

             {/* 2. PLAY / PAUSE */}
             <div className="flex items-center gap-3">
                <button 
                  onClick={() => updateGlobalStyle({ isPlaying: !isPlaying })}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-emerald-500/20 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]'}`}
                >
                  {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                </button>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest">{isPlaying ? 'Executando' : 'Pausado'}</span>
                  <span className="text-[10px] font-bold text-white uppercase font-mono">{Math.floor(localProgress * 100)}%</span>
                </div>
             </div>

             <div className="h-8 w-px bg-zinc-800" />

             {/* 3. TÍTULO DO ROTEIRO */}
             <div className="flex flex-col flex-1 min-w-0">
               <span className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mb-0.5">Roteiro Atual</span>
               <span className="text-sm font-bold text-white truncate pr-4">{scriptTitle}</span>
             </div>
          </div>

          {/* 4. MARCAR COMO GRAVADO */}
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setIsCommentsVisible(!isCommentsVisible)}
               className={`p-2 transition-colors ${isCommentsVisible ? 'text-blue-500 bg-blue-500/10 text-white rounded-lg' : 'text-zinc-500 hover:text-white'}`}
               title="Comentários"
             >
               <MessageSquare size={20} />
             </button>
             <button 
               onClick={handleSetRecorded}
               className="h-10 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-black text-[10px] tracking-widest transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
             >
               {saveStatus === 'saved' ? <CheckCircle2 size={16} /> : <Zap size={16} />}
               {saveStatus === 'saved' ? 'GRAVADO!' : 'MARCAR COMO GRAVADO'}
             </button>
             <button 
               onClick={() => setIsSidebarVisible(true)}
               className="p-2 text-zinc-500 hover:text-white transition-colors"
             >
               <Settings2 size={20} />
             </button>
          </div>
        </div>
      )}

      {/* MODAL DE PRÓXIMO ROTEIRO */}
      <Dialog open={showNextModal} onOpenChange={setShowNextModal}>
        <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 rounded-[32px] p-0 overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.2)]">
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 p-8 border-b border-zinc-800">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-600/20">
              <Zap size={32} className="text-white" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase">Gravação Concluída!</DialogTitle>
              <DialogDescription className="text-zinc-400 font-medium">
                O roteiro <span className="text-white font-bold">"{scriptTitle}"</span> foi marcado como gravado com sucesso.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Sugestão de Próximo</p>
              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl group hover:border-blue-500/50 transition-all cursor-pointer" onClick={() => router.push(`/tp/${nextScript?.id}`)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors line-clamp-2">{nextScript?.title}</h4>
                    <div className="flex items-center gap-2">
                       <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-zinc-800 text-zinc-400 border-none px-2 h-5">
                         {nextScript?.projectName || "Geral"}
                       </Badge>
                       <span className="text-zinc-600 text-xs">/</span>
                       <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{nextScript?.folder || "Sem Pasta"}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white transition-all"
              >
                <X size={16} className="mr-2" /> Sair
              </Button>
              <Button 
                onClick={() => router.push(`/tp/${nextScript?.id}`)}
                className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20 transition-all gap-2"
              >
                Continuar <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TeleprompterPageWrapper({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <Suspense fallback={<div className="fixed inset-0 bg-black flex items-center justify-center text-blue-500 font-black tracking-widest uppercase">Puxando Roteiro...</div>}>
      <TeleprompterContent id={id} />
    </Suspense>
  );
}