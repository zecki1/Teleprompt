"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

interface SpellCheckPopoverProps {
  word: string;
  suggestions: string[];
  onApply: (word: string, replacement: string) => void;
}

export function SpellCheckWord({ word, suggestions, onApply }: SpellCheckPopoverProps) {
  const [open, setOpen] = useState(false);
  const wordRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    if (!wordRef.current) return;
    const rect = wordRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const popupHeight = 200;
    const top = spaceBelow > popupHeight
      ? rect.bottom + 4
      : rect.top - popupHeight;
    setPos({ top, left: rect.left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handleOutsideClick = (e: MouseEvent) => {
      if (wordRef.current && !wordRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleScroll = () => updatePosition();
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open, updatePosition]);

  return (
    <span ref={wordRef} className="relative inline cursor-pointer pointer-events-auto">
      <span
        onClick={() => setOpen(!open)}
        className="text-red-500 dark:text-red-400 font-medium cursor-pointer"
        style={{ textDecoration: "underline wavy red", textUnderlineOffset: "3px" }}
      >
        {word}
      </span>
      {open && createPortal(
        <div
          className="fixed z-[9999] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-2xl py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-150"
          style={{ top: pos.top, left: pos.left }}
        >
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
        </div>,
        document.body
      )}
    </span>
  );
}
