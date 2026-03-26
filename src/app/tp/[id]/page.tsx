"use client";

import { useEffect, useState, useRef, use } from "react";
import { doc, onSnapshot, getDocs, collection, query, orderBy, limit, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Scene } from "@/lib/parser";
import { RemoteControlUI } from "@/components/tp/RemoteControlUI";

export default function TeleprompterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const isMirrorWindow = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('mirror') === 'true' : false;
  const [isMirrored, setIsMirrored] = useState(isMirrorWindow);
  const [showRemote, setShowRemote] = useState(false);
  
  // App State
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [duration, setDuration] = useState(1);
  const [localProgress, setLocalProgress] = useState(0);

  // Text Appearance Styles
  const [fontSize, setFontSize] = useState("text-6xl md:text-8xl");
  const [textAlign, setTextAlign] = useState("text-left");
  const [fontFamily, setFontFamily] = useState("font-sans");
  const [fontWeight, setFontWeight] = useState("font-medium");

  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(null);
  const lastManualScroll = useRef<number>(0);
  const lastProgressUpdate = useRef<number>(0);
  const bcRef = useRef<BroadcastChannel | null>(null);

  // CORREÇÃO DO LOOP: Ref para rastrear o último reset processado
  const lastProcessedReset = useRef<number>(0);

  // Load scenes
  useEffect(() => {
    async function loadScenes() {
      try {
        const q = query(collection(db, "scripts", id, "versions"), orderBy("createdAt", "desc"), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0].data();
          setVersionId(snapshot.docs[0].id);
          const loadedScenes: Scene[] = docData.scenes || [];
          setScenes(loadedScenes);
          
          const wordCount = loadedScenes.reduce((acc, s) => acc + (s.spokenText ? s.spokenText.split(' ').length : 0), 0);
          const estimatedSeconds = Math.max(10, Math.floor((wordCount / 130) * 60));
          setDuration(estimatedSeconds);
          updateDoc(doc(db, "scripts", id), { duration: estimatedSeconds }).catch(() => {});
        }
      } catch { 
        // Erro silencioso
      }
      setLoading(false);
    }
    loadScenes();
  }, [id]);

  // Firestore Sync Setup
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "scripts", id), (docObj) => {
      if (docObj.exists()) {
        const d = docObj.data();
        if (typeof d.isPlaying === "boolean") setIsPlaying(d.isPlaying);
        if (typeof d.speed === "number") setSpeed(d.speed);
        
        // CORREÇÃO: Só executa o reset se o resetRequest for um timestamp NOVO
        if (d.resetRequest && d.resetRequest !== lastProcessedReset.current) {
          if (containerRef.current) {
            containerRef.current.scrollTop = 0;
          }
          setLocalProgress(0);
          lastProcessedReset.current = d.resetRequest; // Marca este timestamp como processado
        }

        if (d.manualScroll && d.manualScroll !== lastManualScroll.current) {
          if (containerRef.current) containerRef.current.scrollTop += (d.manualScroll - lastManualScroll.current);
          lastManualScroll.current = d.manualScroll;
        }
      }
    });
    return () => unsub();
  }, [id]);

  // BroadcastChannel Setup for multi-window
  useEffect(() => {
    const bc = new BroadcastChannel(`tp-sync-${id}`);
    bcRef.current = bc;
    
    if (isMirrorWindow) {
      bc.onmessage = (ev) => {
        if (ev.data.type === 'syncScroll' && containerRef.current) containerRef.current.scrollTop = ev.data.scrollTop;
        if (ev.data.type === 'syncScenes') setScenes(ev.data.scenes);
        if (ev.data.type === 'syncStyles') {
           setFontSize(ev.data.styles.fontSize);
           setTextAlign(ev.data.styles.textAlign);
           setFontFamily(ev.data.styles.fontFamily);
           setFontWeight(ev.data.styles.fontWeight);
        }
      };
    }
    return () => bc.close();
  }, [id, isMirrorWindow]);

  // Scroll Engine Loop (Runs only on Master)
  useEffect(() => {
    const scrollFn = () => {
      if (containerRef.current) {
        if (!isMirrorWindow) {
            if (isPlaying) {
                containerRef.current.scrollTop += (speed * 0.5);
            }
            
            if (bcRef.current) {
                bcRef.current.postMessage({ type: 'syncScroll', scrollTop: containerRef.current.scrollTop });
            }

            const maxScroll = containerRef.current.scrollHeight - containerRef.current.clientHeight;
            const currentProgress = maxScroll > 0 ? containerRef.current.scrollTop / maxScroll : 0;
            setLocalProgress(currentProgress);

            const now = Date.now();
            // Sincroniza o progresso no Firebase a cada 1 segundo
            if (now - lastProgressUpdate.current > 1000) {
              updateDoc(doc(db, "scripts", id), { progress: currentProgress }).catch(() => {});
              lastProgressUpdate.current = now;
            }
        }
      }
      requestRef.current = requestAnimationFrame(scrollFn);
    };
    requestRef.current = requestAnimationFrame(scrollFn);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isPlaying, speed, id, isMirrorWindow]);

  // Broadcast Style changes from master to mirror
  useEffect(() => {
      if (!isMirrorWindow && bcRef.current) {
          bcRef.current.postMessage({ type: 'syncStyles', styles: { fontSize, textAlign, fontFamily, fontWeight } });
      }
  }, [fontSize, textAlign, fontFamily, fontWeight, isMirrorWindow]);

  // Global Hotkeys for Master
  useEffect(() => {
    if (isMirrorWindow) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.isContentEditable) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch(e.code) {
        case 'Space':
          e.preventDefault();
          updateDoc(doc(db, "scripts", id), { isPlaying: !isPlaying }).catch(()=>{});
          break;
        case 'ArrowUp':
          e.preventDefault();
          updateDoc(doc(db, "scripts", id), { speed: Math.min(speed + 1, 15) }).catch(()=>{});
          break;
        case 'ArrowDown':
          e.preventDefault();
          updateDoc(doc(db, "scripts", id), { speed: Math.max(speed - 1, 0) }).catch(()=>{});
          break;
        case 'PageUp':
          e.preventDefault();
          if (containerRef.current) containerRef.current.scrollTop -= 500;
          break;
        case 'PageDown':
          e.preventDefault();
          if (containerRef.current) containerRef.current.scrollTop += 500;
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, isPlaying, speed, isMirrorWindow]);

  const openMirrorWindow = () => {
    window.open(window.location.href + "?mirror=true", "TeleprompterMirror", "width=800,height=800,menubar=no,toolbar=no");
  };

  const handleInlineEdit = async (sceneId: string, newText: string) => {
      const newScenes = scenes.map(s => s.id === sceneId ? { ...s, spokenText: newText } : s);
      setScenes(newScenes);

      if (bcRef.current) bcRef.current.postMessage({ type: 'syncScenes', scenes: newScenes });
      if (versionId) {
          try {
             await updateDoc(doc(db, "scripts", id, "versions", versionId), { scenes: newScenes });
          } catch (e) { console.error("Could not overwrite scene to Firestore", e); }
      }
  };

  if (loading) return <div className="absolute inset-0 z-[50] bg-black text-white flex items-center justify-center font-sans">Carregando...</div>;

  const wrapperClass = isMirrorWindow 
      ? 'fixed inset-0 z-[100] bg-black flex flex-row overflow-hidden cursor-default'
      : 'absolute inset-0 bg-black flex flex-row overflow-hidden cursor-default top-[64px] h-[calc(100vh-64px)] z-40';

  return (
    <div className={wrapperClass}>
      
      {/* Teleprompter View Area */}
      <div 
        className="flex-1 h-full overflow-y-auto relative no-scrollbar"
        ref={containerRef}
        style={{ scrollBehavior: 'auto' }}
      >
        <div 
          className={`max-w-[70vw] mx-auto px-10 py-[60vh] transition-transform duration-300 relative border-l-2 border-transparent hover:border-zinc-800 ${fontFamily}`}
          style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
        >
          {scenes.map(s => (
            <div 
              key={s.id} 
              className={`mb-32 break-words outline-none whitespace-pre-wrap ${textAlign} ${fontWeight} ${fontSize} ${isPlaying ? 'leading-[1.4] text-yellow-50' : 'leading-[1.4] text-yellow-50/60 transition-opacity'}`}
              contentEditable={!isMirrorWindow}
              suppressContentEditableWarning={true}
              onBlur={(e) => {
                  const textVal = e.currentTarget.innerText;
                  if (textVal !== s.spokenText) handleInlineEdit(s.id, textVal);
              }}
              title={!isMirrorWindow ? "Clique para editar o texto ao vivo" : ""}
            >
              {s.spokenText || '\u00A0'}
            </div>
          ))}
        </div>

        {/* Linha de Guia Visual */}
        <div className="fixed top-1/2 left-0 w-full h-8 bg-gradient-to-r from-red-600/30 via-red-500/10 to-transparent -translate-y-1/2 pointer-events-none border-t border-b border-red-500/30 z-10 hidden md:block" />
      </div>

      {/* Painel Lateral de Controle */}
      {!isMirrorWindow && (
        <div className="w-[380px] shrink-0 h-full bg-zinc-950 border-l border-zinc-800 p-6 flex flex-col hidden lg:flex relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
          <div className="mb-6 flex flex-col gap-3">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-bold tracking-tight text-white mb-2">Editor Teleprompter</h2>
            </div>
            
            <div className="flex gap-2">
                <button onClick={() => setShowRemote(false)} className={`flex-1 py-3 px-2 rounded-lg font-bold text-xs uppercase tracking-wide transition border focus:outline-none ${!showRemote ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-transparent text-zinc-400 border-zinc-800 hover:bg-zinc-900'}`}>Formato</button>
                <button onClick={() => setShowRemote(true)} className={`flex-1 py-3 px-2 rounded-lg font-bold text-xs uppercase tracking-wide transition border focus:outline-none ${showRemote ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-transparent text-zinc-400 border-zinc-800 hover:bg-zinc-900'}`}>Remoto</button>
            </div>

            {!showRemote ? (
                <div className="flex flex-col gap-2 mt-4 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-2 mb-1">Janela Autônoma</p>
                    <button onClick={openMirrorWindow} className="px-4 py-3 bg-blue-600/20 text-blue-400 border border-blue-600/50 font-bold rounded-lg text-xs tracking-wider uppercase hover:bg-blue-600 hover:text-white transition shadow">
                      🚀 Abrir Janela Prompter
                    </button>
                    <button onClick={() => setIsMirrored(!isMirrored)} className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg text-xs uppercase font-bold tracking-wider hover:bg-zinc-700 transition">
                      Espelhar esta tela principal
                    </button>

                    <div className="mt-8 border border-zinc-800 rounded-xl bg-zinc-900 p-4 space-y-5">
                       <div>
                         <p className="text-[10px] uppercase font-bold text-zinc-500 mb-2">Tamanho Fonte</p>
                         <div className="flex gap-1.5">
                            <button onClick={() => setFontSize("text-5xl md:text-6xl")} className={`flex-1 py-2 rounded text-xs font-bold border ${fontSize.includes('5xl') ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}>A-</button>
                            <button onClick={() => setFontSize("text-6xl md:text-8xl")} className={`flex-1 py-2 rounded text-xs font-bold border ${fontSize.includes('6xl') ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}>A</button>
                            <button onClick={() => setFontSize("text-8xl md:text-[9rem]")} className={`flex-1 py-2 rounded text-xs font-bold border ${fontSize.includes('8xl') ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}>A+</button>
                         </div>
                       </div>
                       
                       <div>
                         <p className="text-[10px] uppercase font-bold text-zinc-500 mb-2">Alinhamento</p>
                         <div className="flex gap-1.5">
                            <button onClick={() => setTextAlign("text-left")} className={`flex-1 py-2 rounded text-xs font-bold border ${textAlign === 'text-left' ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}>Esq</button>
                            <button onClick={() => setTextAlign("text-center")} className={`flex-1 py-2 rounded text-xs font-bold border ${textAlign === 'text-center' ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}>Cen</button>
                            <button onClick={() => setTextAlign("text-right")} className={`flex-1 py-2 rounded text-xs font-bold border ${textAlign === 'text-right' ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}>Dir</button>
                            <button onClick={() => setTextAlign("text-justify")} className={`flex-1 py-2 rounded text-xs font-bold border ${textAlign === 'text-justify' ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}>Jus</button>
                         </div>
                       </div>

                       <div>
                         <p className="text-[10px] uppercase font-bold text-zinc-500 mb-2">Estilo (Família)</p>
                         <div className="flex gap-1.5">
                            <button onClick={() => setFontFamily("font-sans")} className={`flex-1 py-2 rounded text-xs font-bold border ${fontFamily === 'font-sans' ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}>Sans</button>
                            <button onClick={() => setFontFamily("font-serif")} className={`flex-1 py-2 rounded text-xs font-bold border ${fontFamily === 'font-serif' ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}>Serif</button>
                            <button onClick={() => setFontFamily("font-mono")} className={`flex-1 py-2 rounded text-xs font-bold border ${fontFamily === 'font-mono' ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}>Mono</button>
                         </div>
                       </div>

                       <div>
                         <p className="text-[10px] uppercase font-bold text-zinc-500 mb-2">Peso da Fonte</p>
                         <div className="flex gap-1.5">
                            <button onClick={() => setFontWeight("font-normal")} className={`flex-1 py-2 rounded text-xs font-normal border ${fontWeight === 'font-normal' ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}>Normal</button>
                            <button onClick={() => setFontWeight("font-medium")} className={`flex-1 py-2 rounded text-xs font-medium border ${fontWeight === 'font-medium' ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}>Médio</button>
                            <button onClick={() => setFontWeight("font-bold")} className={`flex-1 py-2 rounded text-xs font-bold border ${fontWeight === 'font-bold' ? 'bg-white text-black border-white' : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:bg-zinc-800'}`}>Negrito</button>
                         </div>
                       </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 mt-4 rounded-3xl overflow-hidden border border-zinc-800 shadow-xl min-h-[500px]">
                    <RemoteControlUI
                       isPlaying={isPlaying}
                       speed={speed}
                       duration={duration}
                       progress={localProgress}
                       update={(data) => updateDoc(doc(db, "scripts", id), data).catch(()=>{})}
                       manualScroll={(amt) => {
                           if (containerRef.current) containerRef.current.scrollTop += amt;
                       }}
                    />
                </div>
            )}
            
          </div>

          <div className="mt-auto border-t border-zinc-800 pt-4 pb-2">
            <p className="text-[10px] text-center text-zinc-600 font-mono uppercase tracking-[0.2em]">Pressione Espaço para iniciar</p>
          </div>
        </div>
      )}

      {/* Botão flutuante para mobile */}
      {!isMirrorWindow && (
        <button onClick={() => setIsMirrored(!isMirrored)} className="lg:hidden fixed bottom-6 right-6 p-4 bg-zinc-800/80 rounded-full backdrop-blur z-50 text-white shadow-xl shadow-black">
          Espelhar
        </button>
      )}

      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}