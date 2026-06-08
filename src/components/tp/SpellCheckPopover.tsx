"use client";

import React, { useState, useRef, useEffect } from "react";

interface SpellCheckPopoverProps {
  word: string;
  suggestions: string[];
  onApply: (word: string, replacement: string) => void;
}

export function SpellCheckWord({ word, suggestions, onApply }: SpellCheckPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <span ref={ref} className="relative cursor-pointer pointer-events-auto">
      <span
        onClick={() => setOpen(!open)}
        className="relative text-red-500 dark:text-red-400 font-medium"
        style={{ textDecoration: "underline wavy red", textUnderlineOffset: "3px" }}
      >
        {word}
      </span>
      {open && (
        <div className="absolute z-[200] top-full left-0 mt-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-2xl py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-150">
          {suggestions.length > 0 ? (
            <>
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onApply(word, s);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[12px] font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {s}
                </button>
              ))}
            </>
          ) : (
            <div className="px-3 py-2 text-[11px] text-zinc-400 italic">
              Nenhuma sugestão disponível
            </div>
          )}
          <div className="border-t border-zinc-200 dark:border-zinc-700 mt-1 pt-1 px-3 py-1">
            <button
              onClick={() => setOpen(false)}
              className="text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              Ignorar
            </button>
          </div>
        </div>
      )}
    </span>
  );
}
