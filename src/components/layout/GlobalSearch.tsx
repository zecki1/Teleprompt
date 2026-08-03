"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FolderOpen, FileText, Users, Filter, Loader2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProjects, Project, getScriptsByWorkspace } from "@/services/projects";
import { ScriptDoc } from "@/types/script";

export function GlobalSearch() {
  const { user, allUsers } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<{ projects: Project[]; scripts: ScriptDoc[] } | null>(null);

  const loading = open && data === null;

  const openFinder = () => {
    setQuery("");
    setData(null);
    setOpen(true);
  };

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setQuery("");
        setData(null);
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    if (!open) return;
    const workspaceId = user?.workspaceId || "";
    const isSuper = !!user?.isSuperAdmin;
    let cancelled = false;

    Promise.all([
      fetchProjects(workspaceId, isSuper),
      getScriptsByWorkspace(workspaceId, isSuper),
    ])
      .then(([p, s]) => {
        if (!cancelled) setData({ projects: p, scripts: s });
      })
      .catch((err) => console.error("Erro no finder:", err));

    return () => {
      cancelled = true;
    };
  }, [open, user?.workspaceId, user?.isSuperAdmin]);

  const run = (handler: () => void) => {
    setOpen(false);
    setQuery("");
    handler();
  };

  const q = query.trim().toLowerCase();

  const projects = useMemo(() => data?.projects || [], [data]);
  const scripts = useMemo(() => data?.scripts || [], [data]);

  const filteredProjects = useMemo(() => {
    if (!q) return projects;
    return projects.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.code || "").toLowerCase().includes(q)
    );
  }, [q, projects]);

  const filteredScripts = useMemo(() => {
    if (!q) return scripts;
    return scripts.filter(s =>
      (s.title || "").toLowerCase().includes(q) ||
      (s.projectName || s.project || "").toLowerCase().includes(q) ||
      (s.path || []).join(" ").toLowerCase().includes(q) ||
      (s.editorName || "").toLowerCase().includes(q) ||
      (s.reviewerName || "").toLowerCase().includes(q)
    ).slice(0, 30);
  }, [q, scripts]);

  const filteredUsers = useMemo(() => {
    if (!q) return [];
    return allUsers.filter(u =>
      (u.displayName || u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    ).slice(0, 10);
  }, [q, allUsers]);

  const hasResults = filteredProjects.length > 0 || filteredScripts.length > 0 || filteredUsers.length > 0;

  const navigateToFilter = useCallback(() => {
    const term = query.trim();
    run(() => {
      router.push(`/dashboard?q=${encodeURIComponent(term)}`);
    });
  }, [query, router]);

  return (
    <>
      <Button
        variant="outline"
        onClick={openFinder}
        className="hidden md:inline-flex items-center gap-2 h-9 rounded px-3 text-sm font-normal text-zinc-400 border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 min-w-[180px] justify-between"
      >
        <span className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          Localizar...
        </span>
        <Kbd className="text-[10px]">⌘K</Kbd>
      </Button>
      <button
        onClick={openFinder}
        className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        title="Buscar"
      >
        <Search className="h-5 w-5" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} title="Finder" description="Localize projetos, roteiros ou usuários">
        <CommandInput
          placeholder="Buscar projetos, roteiros, usuários ou palavras-chave..."
          value={query}
          onValueChange={setQuery}
          autoFocus
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Buscando...
            </div>
          )}

          {!loading && q.length > 0 && (
            <CommandGroup heading="Ações">
              <CommandItem
                value={`filter:${q}`}
                onSelect={() => navigateToFilter()}
                className="cursor-pointer"
              >
                <Filter className="w-4 h-4 text-emerald-500" />
                <span>
                  Filtrar roteiros por <span className="font-bold">&quot;{query.trim()}&quot;</span>
                </span>
              </CommandItem>
            </CommandGroup>
          )}

          {!loading && q.length === 0 && (
            <CommandEmpty className="py-6 text-center text-sm text-zinc-400">
              Digite para localizar projetos, roteiros ou usuários.
            </CommandEmpty>
          )}

          {!loading && q.length > 0 && !hasResults && (
            <CommandEmpty className="py-6 text-center text-sm">
              Nenhum resultado para &quot;{query.trim()}&quot;.
            </CommandEmpty>
          )}

          {!loading && filteredProjects.length > 0 && (
            <>
              <CommandGroup heading={`Projetos (${filteredProjects.length})`}>
                {filteredProjects.map(p => (
                  <CommandItem
                    key={`proj-${p.id}`}
                    value={`projeto ${p.name} ${p.code || ""}`}
                    onSelect={() => run(() => router.push(`/dashboard?projectId=${p.id}`))}
                    className="cursor-pointer"
                  >
                    <FolderOpen className="w-4 h-4 text-blue-500" />
                    <span className="flex-1 truncate">{p.name}</span>
                    {p.code && (
                      <span className="text-[10px] font-mono uppercase text-zinc-400">{p.code}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {!loading && filteredScripts.length > 0 && (
            <>
              <CommandGroup heading={`Roteiros (${filteredScripts.length})`}>
                {filteredScripts.map(s => (
                  <CommandItem
                    key={`script-${s.id}`}
                    value={`roteiro ${s.title} ${s.projectName || s.project || ""}`}
                    onSelect={() => run(() => router.push(`/editor/${s.id}`))}
                    className="cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{s.title}</span>
                      <span className="block text-[10px] text-zinc-400">
                        {(s.projectName || s.project || "Geral")}
                        {s.path && s.path.length > 0 ? ` › ${s.path.join(" › ")}` : ""}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {!loading && filteredUsers.length > 0 && (
            <CommandGroup heading={`Usuários (${filteredUsers.length})`}>
              {filteredUsers.map(u => (
                <CommandItem
                  key={`user-${u.uid}`}
                  value={`usuario ${u.displayName || u.name} ${u.email || ""}`}
                  onSelect={() => run(() => router.push("/admin"))}
                  className="cursor-pointer"
                >
                  <Users className="w-4 h-4 text-purple-500" />
                  <span className="flex-1 truncate">{u.displayName || u.name}</span>
                  <span className="text-[10px] text-zinc-400">{u.role}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
