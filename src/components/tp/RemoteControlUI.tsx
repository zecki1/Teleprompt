"use client";

import { Play, Pause, ArrowDown, ArrowUp, RotateCcw, ChevronUp, ChevronDown } from "lucide-react";

export function RemoteControlUI({
  isPlaying,
  speed,
  duration,
  progress,
  update,
  manualScroll
}: {
  isPlaying: boolean;
  speed: number;
  duration: number;
  progress: number;
  update: (data: any) => void;
  manualScroll: (amount: number) => void;
}) {
  const remainingSeconds = Math.max(0, Math.floor(duration * (1 - progress)));
  const elapsedSeconds = Math.max(0, Math.floor(duration * progress));
  
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-950/90 backdrop-blur-md text-white font-sans p-6 overflow-hidden relative border border-zinc-800 rounded-3xl shadow-2xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-sm font-bold text-zinc-500 tracking-widest uppercase truncate shrink-0">CONTROLE TP</h1>
        <div className="text-zinc-400 font-mono flex items-center gap-1.5 text-sm">
          <span className="text-green-500 font-medium">{formatTime(elapsedSeconds)}</span>
          <span className="text-zinc-700">|</span>
          <span className="text-red-400">-{formatTime(remainingSeconds)}</span>
        </div>
      </div>

      <div className="w-full bg-zinc-900 h-2 rounded-full mb-10 overflow-hidden border border-zinc-800 relative shrink-0">
        <div className="bg-yellow-500 h-full transition-all duration-100 ease-linear shadow-[0_0_10px_orange]" style={{ width: `${progress * 100}%` }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-10 w-full">
        
        {/* Manual Scroll / Pular Mecânico */}
        <div className="flex justify-between w-full px-2 items-center">
            <button onClick={() => manualScroll(-500)} className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 active:scale-95 shadow-lg border border-zinc-800">
              <ChevronUp className="w-7 h-7 text-zinc-400" />
            </button>
            <div className="text-center">
             <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-[0.2em] block mb-1">Voltar/Avançar</span>
             <span className="text-xs text-zinc-600 font-mono block uppercase">Manual</span>
            </div>
            <button onClick={() => manualScroll(500)} className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 active:scale-95 shadow-lg border border-zinc-800">
              <ChevronDown className="w-7 h-7 text-zinc-400" />
            </button>
        </div>

        {/* Master Play Button */}
        <button onClick={() => update({ isPlaying: !isPlaying })} className={`w-36 h-36 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 border-2 relative overflow-hidden ${isPlaying ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20" : "bg-green-500/10 border-green-500/30 hover:bg-green-500/20"}`}>
          {isPlaying ? <Pause className="w-16 h-16 text-red-500 relative z-10" fill="currentColor" /> : <Play className="w-16 h-16 text-green-500 pl-3 relative z-10" fill="currentColor" />}
        </button>

        {/* Speed Adjustment */}
        <div className="flex items-center w-full justify-between bg-zinc-900/80 rounded-[2rem] p-4 border border-zinc-800">
          <button onClick={() => update({ speed: Math.max(speed - 1, 0) })} className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center active:scale-95 text-zinc-400 border border-zinc-700">
            <ArrowDown className="w-5 h-5 text-current" />
          </button>
          <div className="flex flex-col items-center flex-1">
            <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Velocidade</span>
            <span className="text-3xl font-black tabular-nums tracking-tighter text-white">{speed}</span>
          </div>
          <button onClick={() => update({ speed: Math.min(speed + 1, 15) })} className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center active:scale-95 text-zinc-400 border border-zinc-700">
            <ArrowUp className="w-5 h-5 text-current" />
          </button>
        </div>
      </div>

      <button onClick={() => update({ resetRequest: Date.now(), isPlaying: false, progress: 0 })} className="mt-8 flex items-center justify-center w-full py-4 rounded-xl bg-zinc-900/50 text-zinc-400 active:scale-95 hover:bg-zinc-800 transition-colors border border-zinc-800 hover:text-white shrink-0">
        <RotateCcw className="w-4 h-4 mr-3" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Reiniciar Teleprompter</span>
      </button>
    </div>
  );
}
