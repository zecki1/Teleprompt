"use client";

import { useMemo } from "react";
import { Scene, stripHtml } from "@/lib/parser";
import { Ear } from "lucide-react";

export interface PronunciationPanelProps {
  scenes: Scene[];
}

export function PronunciationPanel({ scenes }: PronunciationPanelProps) {
  const notes = useMemo(
    () =>
      scenes
        .map((s, index) => {
          const lines = (s.pronunciation || "").split("\n").filter((l) => l.trim());
          return { scene: s, index, lines };
        })
        .filter((n) => n.lines.length > 0),
    [scenes]
  );

  if (notes.length === 0) {
    return (
      <div className="py-4 space-y-4">
        <p className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2 tracking-widest">
          <Ear size={14} className="text-cyan-400" /> Pronúncias
        </p>
        <div className="text-center py-10 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-2">
          <Ear size={20} className="mx-auto text-zinc-700" />
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-6">
            Nenhuma anotação de pronúncia neste roteiro
          </p>
          <p className="text-[9px] text-zinc-700 px-8 leading-relaxed">
            No editor, use o botão <span className="text-cyan-500 font-bold">Pron</span> de cada cena para anotar como palavras e termos devem ser escritos ou falados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      <p className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2 tracking-widest">
        <Ear size={14} className="text-cyan-400" /> Pronúncias ({notes.length})
      </p>
      <p className="text-[9px] text-zinc-600 leading-relaxed">
        Como palavras e termos de cada cena devem ser escritos ou falados.
      </p>
      <div className="space-y-3">
        {notes.map(({ scene, index, lines }) => (
          <div key={scene.id} className="bg-zinc-900/50 border border-cyan-500/20 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                <Ear size={12} /> CENA {scene.sceneNumber}
              </span>
              <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">
                #{index + 1}
              </span>
            </div>
            <div className="space-y-1.5">
              {lines.map((line, i) => (
                <div key={i} className="flex items-start gap-2 bg-cyan-950/20 border border-cyan-900/30 rounded-lg p-2">
                  <span className="text-[8px] font-black text-cyan-500 bg-cyan-950/60 px-1.5 py-0.5 rounded shrink-0 mt-0.5">
                    pron{i + 1}
                  </span>
                  <p className="text-[11px] font-bold text-cyan-200 leading-snug">{line}</p>
                </div>
              ))}
            </div>
            {scene.spokenText && (
              <p className="text-[10px] text-zinc-500 leading-snug line-clamp-2">
                {stripHtml(scene.spokenText)}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
