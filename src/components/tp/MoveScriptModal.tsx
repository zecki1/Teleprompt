"use client";

import { useEffect, useState } from "react";
import { Folder, FolderOpen, Check, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderNode, ScriptDoc } from "@/types/script";
import { moveScripts, buildTree } from "@/lib/pathUtils";
import { getScriptsByProject, Project } from "@/services/projects";
import { ProjectFinder } from "@/components/tp/ProjectFinder";
import { toast } from "sonner";

interface MoveScriptModalProps {
  open: boolean;
  /** Script(s) to move (all must belong to the same current project) */
  scripts: ScriptDoc[];
  /** All scripts to build folder trees for different projects */
  allScripts: ScriptDoc[];
  /** All available projects */
  projects: Project[];
  /** Current project identifiers */
  currentProjectId: string;
  currentProjectName: string;
  onClose: () => void;
  onMoved: () => void;
}

const DEPTH_COLORS = [
  "text-zinc-500",
  "text-blue-500",
  "text-purple-500",
  "text-emerald-500",
  "text-orange-500",
  "text-pink-500",
];

export function MoveScriptModal({
  open,
  scripts,
  allScripts,
  projects,
  currentProjectId,
  currentProjectName,
  onClose,
  onMoved,
}: MoveScriptModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(currentProjectId);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [moving, setMoving] = useState(false);
  const [projectScripts, setProjectScripts] = useState<ScriptDoc[]>([]);
  const [loadingProjectScripts, setLoadingProjectScripts] = useState(false);

  // Load the destination project's scripts directly from Firestore so the full
  // folder tree shows even when the dashboard list is paginated.
  useEffect(() => {
    if (!selectedProjectId) return;
    let cancelled = false;
    setLoadingProjectScripts(true);
    getScriptsByProject(selectedProjectId)
      .then(s => {
        if (!cancelled) setProjectScripts(s);
      })
      .finally(() => {
        if (!cancelled) setLoadingProjectScripts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

  if (scripts.length === 0) return null;

  const isMultiple = scripts.length > 1;

  const resolveProjectId = (s: ScriptDoc) =>
    s.projectId || projects.find(p => p.name === (s.projectName || s.project))?.id || "";

  // Merge the freshly fetched project scripts with the already loaded ones
  // (covers legacy scripts that only carry projectName/project).
  const seenIds = new Set<string>();
  const mergedScripts: ScriptDoc[] = [];
  for (const s of projectScripts) {
    seenIds.add(s.id);
    mergedScripts.push(s);
  }
  for (const s of allScripts) {
    if (resolveProjectId(s) === selectedProjectId && !seenIds.has(s.id)) {
      seenIds.add(s.id);
      mergedScripts.push(s);
    }
  }
  const tree = buildTree(mergedScripts);

  const selectedProjectName = projects.find(p => p.id === selectedProjectId)?.name || selectedProjectId;

  const handleMove = async () => {
    if (scripts.length === 0) return;
    setMoving(true);
    try {
      const targetProject = selectedProjectId !== currentProjectId
        ? { projectId: selectedProjectId, projectName: selectedProjectName }
        : undefined;

      await moveScripts(scripts, selectedPath, targetProject);

      const projectSuffix = targetProject
        ? ` no projeto "${selectedProjectName}"`
        : "";
      const verb = isMultiple ? "roteiros" : "Roteiro";
      toast.success(
        selectedPath.length > 0
          ? `${verb} movido${isMultiple ? "s" : ""} para "${selectedPath.join(" › ")}"${projectSuffix}`
          : `${verb} movido${isMultiple ? "s" : ""} para a raiz do projeto${projectSuffix}`
      );
      onMoved();
      onClose();
    } catch {
      toast.error("Erro ao mover roteiro(s).");
    } finally {
      setMoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-none rounded-2xl p-8 shadow-[0_0_100px_rgba(0,0,0,0.2)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black uppercase tracking-widest text-center">
            {isMultiple ? "Mover Roteiros" : "Mover Roteiro"}
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-500 text-sm">
            Selecione a pasta de destino no projeto atual para{" "}
            {isMultiple ? (
              <span className="font-bold text-zinc-700 dark:text-zinc-300">
                {scripts.length} roteiros selecionados
              </span>
            ) : (
              <span className="font-bold text-zinc-700 dark:text-zinc-300">
                &ldquo;{scripts[0].title}&rdquo;
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Project selector + finder */}
        <div className="mt-4">
          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 block">
            Projeto destino
          </label>
          <ProjectFinder
            projects={projects}
            value={selectedProjectId}
            onSelect={id => {
              setSelectedProjectId(id);
              setSelectedPath([]);
            }}
          />
        </div>

        <div className="mt-3 space-y-1 max-h-64 overflow-y-auto border border-zinc-100 dark:border-zinc-800 rounded-xl p-3">
          {/* Root option */}
          <FolderOption
            path={[]}
            label={`⟨ Raiz — ${selectedProjectName} ⟩`}
            selected={selectedPath.length === 0}
            onClick={() => setSelectedPath([])}
            depth={0}
          />

          {/* Tree options */}
          {loadingProjectScripts ? (
            <div className="flex items-center justify-center gap-2 py-4 text-zinc-400 text-[12px] font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando pastas...
            </div>
          ) : mergedScripts.length === 0 ? (
            <p className="px-3 py-2.5 text-[12px] font-bold text-zinc-400">
              Nenhuma pasta encontrada neste projeto.
            </p>
          ) : (
            <TreeOptions
              nodes={tree}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
              depth={0}
            />
          )}
        </div>

        {/* Current selection breadcrumb */}
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2 min-h-[16px]">
          {selectedPath.length > 0 ? (
            <>
              Destino:{" "}
              <span className="text-blue-500">{selectedPath.join(" › ")}</span>
              <span className="text-zinc-500"> — {selectedProjectName}</span>
            </>
          ) : (
            `Destino: Raiz — ${selectedProjectName}`
          )}
        </p>

        <DialogFooter className="flex gap-3 mt-4">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 h-11 rounded font-bold"
            disabled={moving}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleMove}
            disabled={moving}
            className="flex-[2] h-11 rounded bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg"
          >
            {moving ? "Movendo..." : "MOVER AQUI"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Helper components ─────────────────────────────────── */

function FolderOption({
  path,
  label,
  selected,
  onClick,
  depth,
}: {
  path: string[];
  label?: string;
  selected: boolean;
  onClick: () => void;
  depth: number;
}) {
  const displayLabel = label ?? path[path.length - 1];
  const textColor = DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)];

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
        selected
          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
      }`}
    >
      {depth > 0 && (
        <span style={{ width: depth * 16 }} className="shrink-0" />
      )}
      {selected ? (
        <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${textColor}`} />
      ) : (
        <Folder className={`w-3.5 h-3.5 shrink-0 ${textColor}`} />
      )}
      <span className={`text-[12px] font-bold truncate ${selected ? "" : textColor}`}>
        {displayLabel}
      </span>
      {selected && (
        <Check className="w-3 h-3 text-blue-500 ml-auto shrink-0" />
      )}
    </button>
  );
}

function TreeOptions({
  nodes,
  selectedPath,
  onSelect,
  depth,
}: {
  nodes: Record<string, FolderNode>;
  selectedPath: string[];
  onSelect: (path: string[]) => void;
  depth: number;
}) {
  const sorted = Object.entries(nodes).sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: "base" })
  );

  return (
    <>
      {sorted.map(([key, node]) => {
        if (!key) return null; // skip root-level empty key
        const isSelected =
          selectedPath.length === node.fullPath.length &&
          node.fullPath.every((s, i) => s === selectedPath[i]);

        return (
          <div key={node.fullPath.join("/")}>
            <FolderOption
              path={node.fullPath}
              selected={isSelected}
              onClick={() => onSelect(node.fullPath)}
              depth={depth}
            />
            {Object.keys(node.children).length > 0 && (
              <TreeOptions
                nodes={node.children}
                selectedPath={selectedPath}
                onSelect={onSelect}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
