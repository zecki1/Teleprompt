"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Project } from "@/services/projects";

interface ProjectFinderProps {
  projects: Project[];
  value: string;
  onSelect: (projectId: string) => void;
}

export function ProjectFinder({ projects, value, onSelect }: ProjectFinderProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find(p => p.id === value);

  useEffect(() => {
    setSearch(selectedProject?.name || "");
  }, [selectedProject]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const q = search.trim().toLowerCase();
  const filtered = projects.filter(p =>
    !q
      ? true
      : (p.name || "").toLowerCase().includes(q) || (p.code || "").toLowerCase().includes(q)
  );

  return (
    <div className="relative" ref={ref}>
      <Input
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Buscar por nome ou código do projeto..."
        className="h-9 w-full rounded-lg border-zinc-200 dark:border-zinc-800 text-[12px] font-bold pr-8"
      />
      <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      {open && (
        <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl">
          {filtered.length === 0 ? (
            <p className="px-3 py-2.5 text-[12px] font-bold text-zinc-400">Nenhum projeto encontrado</p>
          ) : (
            filtered.map(p => {
              const active = p.id === value;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    onSelect(p.id);
                    setSearch(p.name);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${
                    active
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  }`}
                >
                  {p.code && (
                    <Badge
                      variant={active ? "default" : "outline"}
                      className="text-[9px] uppercase font-mono px-1.5 py-0 h-4 shrink-0"
                    >
                      {p.code}
                    </Badge>
                  )}
                  <span className="text-[12px] font-bold truncate">{p.name}</span>
                  {active && <Check className="w-3.5 h-3.5 ml-auto shrink-0 text-blue-500" />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
