"use client";

import React from "react";
import { 
  Play, 
  Pause, 
  ChevronLeft,
  ChevronRight,
  RotateCcw, 
  ChevronUp, 
  ChevronDown,
  MessageSquare,
  ArrowBigDown,
  AlignCenterVertical,
  ListOrdered,
  List
} from "lucide-react";
import { TP_SCROLL_MODES, TPScrollMode } from "@/lib/tp-controls";

interface RemoteControlUIProps {
  isPlaying: boolean;
  speed: number;
  duration: number;
  progress: number;
  update: (data: Record<string, unknown>) => void;
  manualScroll: (amount: number) => void;
  goPrev: () => void;
  goNext: () => void;
  scrollMode: TPScrollMode;
  onScrollModeChange: (mode: TPScrollMode) => void;
  isCommentsVisible: boolean;
  setIsCommentsVisible: (visible: boolean) => void;
}

const SCROLL_MODE_ICONS: Record<TPScrollMode, typeof List> = {
  paragraph: List,
  scene: ArrowBigDown,
  middle: AlignCenterVertical,
  all: ListOrdered,
};

export function RemoteControlUI({
  isPlaying,
  speed,
  duration,
  progress,
  update,
  manualScroll,
  goPrev,
  goNext,
  scrollMode,
  onScrollModeChange,
  isCommentsVisible,
  setIsCommentsVisible
}: RemoteControlUIProps) {
  
  // Garantir que os números sejam válidos para evitar quebras de layout
  const safeDuration = duration || 0;
  const safeProgress = progress || 0;

  // Cálculos de tempo baseados no progresso real do scroll
  const elapsedSeconds = Math.floor(safeDuration * safeProgress);
  
  // Formatação de MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-auto w-full bg-zinc-950 text-white p-6 rounded-3xl border border-zinc-800 shadow-2xl overflow-y-auto no-scrollbar">
      
      {/* HEADER DE STATUS */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex flex-col">
          <h1 className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase">Status do Script</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full animate-pulse ${isPlaying ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500'}`} />
            <span className="text-xs font-bold font-mono uppercase tracking-tighter">
              {isPlaying ? 'Executando' : 'Pausado'}
            </span>
          </div>
        </div>
        
        <div className="text-right flex flex-col items-end">
          <div className="flex items-center justify-end gap-3 mb-2">
            <button 
              onClick={() => setIsCommentsVisible(!isCommentsVisible)}
              className={`p-2 rounded-xl transition-all border ${isCommentsVisible ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-white'}`}
              title="Abrir Comentários"
            >
              <MessageSquare size={18} />
            </button>
            <div className="flex items-center gap-1.5 text-zinc-400 font-mono text-sm bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800">
              <span className="text-emerald-400 font-black">{formatTime(elapsedSeconds)}</span>
              <span className="text-zinc-800">/</span>
              <span className="text-zinc-500">{formatTime(safeDuration)}</span>
            </div>
          </div>
          <p className="text-[9px] uppercase font-bold text-zinc-600 tracking-tighter">Tempo Estimado</p>
        </div>
      </div>

      {/* BARRA DE PROGRESSO DINÂMICA */}
      <div className="group relative w-full bg-zinc-900 h-3 rounded-full mb-8 overflow-hidden border border-zinc-800 shadow-inner">
        <div 
          className="bg-yellow-400 h-full transition-all duration-300 ease-out shadow-[0_0_20px_rgba(250,204,21,0.4)]" 
          style={{ width: `${Math.min(100, safeProgress * 100)}%` }} 
        />
        {/* Glow effect no topo da barra */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20" />
      </div>

      {/* CONTROLES PRINCIPAIS */}
      <div className="flex-1 flex flex-col items-center justify-between py-2 w-full gap-6">
        
        {/* NAVEGAÇÃO ENTRE CENAS (modo de scroll configurável) */}
        <div className="flex justify-between w-full px-4 items-center">
            <button 
              onClick={goPrev} 
              className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 active:scale-90 transition-all border border-zinc-800 shadow-lg group"
              title="Anterior"
            >
              <ChevronUp className="w-8 h-8 text-zinc-500 group-hover:text-white transition-colors" />
            </button>
            
            <div className="flex flex-col items-center gap-2">
              <span className="text-[9px] uppercase text-zinc-500 font-black tracking-widest">Navegação</span>
              {/* Seletor do tipo de scroll */}
              <div className="flex rounded-xl bg-zinc-900 border border-zinc-800 p-1 gap-0.5">
                {TP_SCROLL_MODES.map((mode) => {
                  const Icon = SCROLL_MODE_ICONS[mode.value];
                  return (
                    <button
                      key={mode.value}
                      onClick={() => onScrollModeChange(mode.value)}
                      title={mode.hint}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                        scrollMode === mode.value
                          ? "bg-blue-600 text-white shadow-lg"
                          : "text-zinc-500 hover:text-white"
                      }`}
                    >
                      <Icon size={15} />
                    </button>
                  );
                })}
              </div>
              <span className="text-[8px] uppercase text-blue-400 font-black tracking-widest">
                {TP_SCROLL_MODES.find((m) => m.value === scrollMode)?.label}
              </span>
            </div>

            <button 
              onClick={goNext} 
              className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 active:scale-90 transition-all border border-zinc-800 shadow-lg group"
              title="Próximo"
            >
              <ChevronDown className="w-8 h-8 text-zinc-500 group-hover:text-white transition-colors" />
            </button>
        </div>

        {/* BOTÃO PLAY/PAUSE CENTRAL */}
        <button 
          onClick={() => update({ isPlaying: !isPlaying })} 
          className={`w-36 h-36 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all active:scale-95 border-[6px] relative ${
            isPlaying 
            ? "border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20" 
            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
          }`}
        >
          {isPlaying ? (
            <Pause size={56} fill="currentColor" strokeWidth={2.5} />
          ) : (
            <Play size={56} className="ml-3" fill="currentColor" strokeWidth={2.5} />
          )}
          
          {/* Anel de progresso circular sutil em volta do botão */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
            <circle
              cx="50%"
              cy="50%"
              r="66"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="414"
              strokeDashoffset={414 - (414 * safeProgress)}
              className="opacity-40 transition-all duration-500"
            />
          </svg>
        </button>

        {/* AJUSTE DE VELOCIDADE */}
        <div className="flex items-center w-full justify-between bg-zinc-900/40 rounded-[2.5rem] p-4 border border-zinc-800/50 backdrop-blur-sm">
          <button 
            onClick={() => update({ speed: Math.max(speed - 0.25, 0) })} 
            className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center active:scale-90 hover:bg-zinc-700 text-zinc-400 border border-zinc-700/50 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="flex flex-col items-center flex-1">
            <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase mb-1">Velocidade</span>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black tabular-nums text-white tracking-tighter">{speed}</span>
              <span className="text-xs font-bold text-zinc-600">x</span>
            </div>
          </div>

          <button 
            onClick={() => update({ speed: Math.min(speed + 0.25, 30) })} 
            className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center active:scale-90 hover:bg-zinc-700 text-zinc-400 border border-zinc-700/50 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* BOTÃO REINICIAR (SESSÃO INFERIOR) */}
      <button 
        onClick={() => update({ resetRequest: Date.now(), isPlaying: false, progress: 0 })} 
        className="mt-6 flex items-center justify-center w-full py-5 rounded-2xl bg-zinc-900 text-zinc-500 hover:text-white active:scale-95 transition-all border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/50 group shrink-0"
      >
        <RotateCcw className="w-4 h-4 mr-3 group-hover:rotate-[-45deg] transition-transform" />
        <span className="text-[11px] font-black uppercase tracking-[0.15em]">Reiniciar roteiro!</span>
      </button>
    </div>
  );
}