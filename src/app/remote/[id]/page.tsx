"use client";

import { useEffect, useState, use } from "react";
import { doc, onSnapshot, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Play, Pause, ArrowDown, ArrowUp, RotateCcw, ChevronUp, ChevronDown } from "lucide-react";

export default function RemoteControlPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [loading, setLoading] = useState(true);
  
  // Progress tracker syncing
  const [progress, setProgress] = useState(0); 
  const [duration, setDuration] = useState(1); // from TP estimation

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "scripts", id), (docObj) => {
      if (docObj.exists()) {
        const d = docObj.data();
        if (typeof d.isPlaying === "boolean") setIsPlaying(d.isPlaying);
        if (typeof d.speed === "number") setSpeed(d.speed);
        if (typeof d.progress === "number") setProgress(d.progress);
        if (typeof d.duration === "number" && d.duration > 0) setDuration(d.duration);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [id]);

  const update = async (data: any) => {
    try { await updateDoc(doc(db, "scripts", id), data); } catch (e) {}
  };

  const manualScroll = (amount: number) => {
    updateDoc(doc(db, "scripts", id), {
      manualScroll: increment(amount)
    });
  };

  if (loading) {
    return <div className="flex inset-0 h-screen w-screen items-center justify-center bg-zinc-950 text-white font-sans">Conectando...</div>;
  }

  // Calculate times
  const remainingSeconds = Math.max(0, Math.floor(duration * (1 - progress)));
  const elapsedSeconds = Math.max(0, Math.floor(duration * progress));
  
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-zinc-950 text-white font-sans p-6 overflow-hidden max-w-sm mx-auto relative">
      
      {/* Top Header info (Time remaining calculation) */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-sm font-bold text-zinc-500 tracking-widest uppercase truncate">REMOTO TP</h1>
        <div className="text-zinc-400 font-mono flex items-center gap-1.5 text-sm">
          <span className="text-green-500 font-medium">{formatTime(elapsedSeconds)}</span>
          <span className="text-zinc-700">|</span>
          <span className="text-red-400">-{formatTime(remainingSeconds)}</span>
        </div>
      </div>

      {/* Progress Bar Display */}
      <div className="w-full bg-zinc-900 h-2 rounded-full mb-10 overflow-hidden border border-zinc-800 relative">
        <div 
          className="bg-yellow-500 h-full transition-all duration-1000 ease-linear shadow-[0_0_10px_orange]" 
          style={{ width: `${progress * 100}%` }} 
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-10 w-full">
        
        {/* Manual Scroll Buttons (Mecânico) */}
        <div className="flex justify-between w-full px-2 items-center">
            <button 
              onClick={() => manualScroll(-500)} 
              className="w-16 h-16 rounded-[1.5rem] bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 active:scale-95 shadow-lg border border-zinc-800"
            >
              <ChevronUp className="w-8 h-8 text-zinc-400" />
            </button>
            <div className="text-center">
             <span className="text-[10px] uppercase text-zinc-500 font-bold tracking-[0.2em] block mb-1">Voltar/Avançar</span>
             <span className="text-xs text-zinc-600 font-mono block uppercase">Manual</span>
            </div>
            <button 
              onClick={() => manualScroll(500)} 
              className="w-16 h-16 rounded-[1.5rem] bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 active:scale-95 shadow-lg border border-zinc-800"
            >
              <ChevronDown className="w-8 h-8 text-zinc-400" />
            </button>
        </div>

        {/* Big Play/Pause Logic */}
        <button
          onClick={() => update({ isPlaying: !isPlaying })}
          className={`w-[14rem] h-[14rem] rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 border-2 relative overflow-hidden ${
            isPlaying 
              ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20" 
              : "bg-green-500/10 border-green-500/30 hover:bg-green-500/20"
          }`}
        >
          {isPlaying ? (
            <Pause className="w-24 h-24 text-red-500 relative z-10" fill="currentColor" />
          ) : (
            <Play className="w-24 h-24 text-green-500 pl-4 relative z-10" fill="currentColor" />
          )}
        </button>

        {/* Speed Adjustment Controller */}
        <div className="flex items-center w-full justify-between bg-zinc-900/80 rounded-[2.5rem] p-4 border border-zinc-800 backdrop-blur-sm">
          <button onClick={() => update({ speed: Math.max(speed - 1, 0) })} className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center active:scale-95 text-zinc-400 border border-zinc-700">
            <ArrowDown className="w-6 h-6 text-current" />
          </button>
          
          <div className="flex flex-col items-center flex-1">
            <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase mb-1">Velocidade</span>
            <span className="text-4xl font-black tabular-nums tracking-tighter text-white">{speed}</span>
          </div>

          <button onClick={() => update({ speed: Math.min(speed + 1, 15) })} className="w-14 h-14 rounded-full bg-zinc-800 flex items-center justify-center active:scale-95 text-zinc-400 border border-zinc-700">
            <ArrowUp className="w-6 h-6 text-current" />
          </button>
        </div>

      </div>

      {/* Reboot/Reset Bar */}
      <button
        onClick={() => update({ resetRequest: Date.now(), isPlaying: false, progress: 0 })}
        className="mt-6 flex items-center justify-center w-full py-4 rounded-2xl bg-zinc-900/50 text-zinc-400 active:scale-95 hover:bg-zinc-800 transition-colors border border-zinc-800 hover:text-white"
      >
        <RotateCcw className="w-5 h-5 mr-3" />
        <span className="text-xs font-bold uppercase tracking-widest">Reiniciar Teleprompter</span>
      </button>

    </div>
  );
}
