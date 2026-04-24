"use client";

import React, { useState, useRef } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderNode, ScriptDoc } from "@/types/script";
import { renameFolder } from "@/lib/pathUtils";
import { toast } from "sonner";

// Depth-based accent colors
const DEPTH_COLORS = [
  "bg-zinc-400",   // 0 – root
  "bg-blue-400",   // 1
  "bg-purple-400", // 2
  "bg-emerald-400",// 3
  "bg-orange-400", // 4
  "bg-pink-400",   // 5
];

const DEPTH_TEXT_COLORS = [
  "text-zinc-500",
  "text-blue-500",
  "text-purple-500",
  "text-emerald-500",
  "text-orange-500",
  "text-pink-500",
];

interface FolderTreeProps {
  /** Top-level folder map (project scope) */
  nodes: Record<string, FolderNode>;
  projectName: string;
  projectId: string;
  /** All scripts for this project (needed for rename) */
  allScripts: ScriptDoc[];
  onScriptsChanged: () => void;
  /** Called when user clicks "Criar aqui" at a specific path */
  onCreateScript: (path: string[]) => void;
  /** Called when user wants to add a sub-folder node */
  onCreateSubfolder: (parentPath: string[]) => void;
  /** Render the script cards for a given node */
  renderScripts: (scripts: ScriptDoc[], path: string[]) => React.ReactNode;
  /** Initial depth (used internally for recursion) */
  depth?: number;
}

export function FolderTree({
  nodes,
  projectName,
  projectId,
  allScripts,
  onScriptsChanged,
  onCreateScript,
  onCreateSubfolder,
  renderScripts,
  depth = 0,
}: FolderTreeProps) {
  const sortedEntries = Object.entries(nodes).sort((a, b) =>
    a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: "base" })
  );

  return (
    <div className={`space-y-6 ${depth > 0 ? "ml-4 border-l border-zinc-100 dark:border-zinc-800 pl-4" : ""}`}>
      {sortedEntries.map(([, node]) => (
        <FolderNodeItem
          key={node.fullPath.join("/")}
          node={node}
          projectName={projectName}
          projectId={projectId}
          allScripts={allScripts}
          onScriptsChanged={onScriptsChanged}
          onCreateScript={onCreateScript}
          onCreateSubfolder={onCreateSubfolder}
          renderScripts={renderScripts}
          depth={depth}
        />
      ))}
    </div>
  );
}

interface FolderNodeItemProps {
  node: FolderNode;
  projectName: string;
  projectId: string;
  allScripts: ScriptDoc[];
  onScriptsChanged: () => void;
  onCreateScript: (path: string[]) => void;
  onCreateSubfolder: (parentPath: string[]) => void;
  renderScripts: (scripts: ScriptDoc[], path: string[]) => React.ReactNode;
  depth: number;
}

function FolderNodeItem({
  node,
  projectName,
  projectId,
  allScripts,
  onScriptsChanged,
  onCreateScript,
  onCreateSubfolder,
  renderScripts,
  depth,
}: FolderNodeItemProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.name);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasChildren = Object.keys(node.children).length > 0;
  const accentColor = DEPTH_COLORS[Math.min(depth, DEPTH_COLORS.length - 1)];
  const textColor = DEPTH_TEXT_COLORS[Math.min(depth, DEPTH_TEXT_COLORS.length - 1)];

  // Build ancestor breadcrumb label
  const breadcrumb = node.fullPath.map((seg, i) => (
    <React.Fragment key={seg}>
      {i > 0 && <ChevronRight className="w-3 h-3 text-zinc-400" />}
      <span className={i === node.fullPath.length - 1 ? textColor : "text-zinc-400"}>
        {seg}
      </span>
    </React.Fragment>
  ));

  const handleStartEdit = () => {
    setEditValue(node.name);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleRename = async () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === node.name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await renameFolder(allScripts, node.fullPath, trimmed);
      toast.success(`Pasta renomeada para "${trimmed}"`);
      onScriptsChanged();
    } catch {
      toast.error("Erro ao renomear pasta.");
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const canAddSubfolder = node.fullPath.length < 5;

  return (
    <div className="space-y-3">
      {/* Folder header */}
      <div className="flex items-center justify-between px-1 group/folder">
        <div className="flex items-center gap-2 min-w-0">
          {/* Depth accent */}
          <div className={`w-0.5 h-5 rounded-full ${accentColor} shrink-0`} />

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors shrink-0"
          >
            {collapsed ? (
              <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            )}
          </button>

          {/* Folder icon */}
          {collapsed ? (
            <Folder className={`w-3.5 h-3.5 ${textColor} shrink-0`} />
          ) : (
            <FolderOpen className={`w-3.5 h-3.5 ${textColor} shrink-0`} />
          )}

          {/* Name or inline edit */}
          {editing ? (
            <div className="flex items-center gap-1">
              <Input
                ref={inputRef}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") handleRename();
                  if (e.key === "Escape") setEditing(false);
                }}
                className="h-6 w-40 text-[11px] px-2"
                disabled={saving}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-green-500"
                onClick={handleRename}
                disabled={saving}
              >
                <Check className="w-3 h-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setEditing(false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <h3 className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-400 flex items-center gap-1 min-w-0 truncate">
              {breadcrumb}
              <Badge
                variant="outline"
                className="text-[9px] h-4 px-1.5 font-black border-zinc-200 dark:border-zinc-800 text-zinc-400 ml-1 shrink-0"
              >
                {node.totalScripts}
              </Badge>
              <button
                onClick={handleStartEdit}
                className="opacity-0 group-hover/folder:opacity-100 p-0.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-all ml-1 shrink-0"
                title="Renomear pasta"
              >
                <Edit2 className="w-2.5 h-2.5 text-zinc-400" />
              </button>
            </h3>
          )}
        </div>

        {/* Actions (shown on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover/folder:opacity-100 transition-opacity shrink-0">
          {canAddSubfolder && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-blue-500 px-2"
              onClick={() => onCreateSubfolder(node.fullPath)}
              title="Criar subpasta aqui"
            >
              <Plus className="w-3 h-3 mr-0.5" /> Pasta
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-emerald-500 px-2"
            onClick={() => onCreateScript(node.fullPath)}
            title="Criar roteiro aqui"
          >
            <Plus className="w-3 h-3 mr-0.5" /> Roteiro
          </Button>
        </div>
      </div>

      {/* Content (scripts + children) */}
      {!collapsed && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Scripts at this level */}
          {node.scripts.length > 0 && (
            <div className="relative">
              <div className="flex gap-6 overflow-x-auto p-4 custom-scrollbar snap-x snap-mandatory pb-6">
                {renderScripts(node.scripts, node.fullPath)}
              </div>
            </div>
          )}

          {/* Recursive children */}
          {hasChildren && (
            <FolderTree
              nodes={node.children}
              projectName={projectName}
              projectId={projectId}
              allScripts={allScripts}
              onScriptsChanged={onScriptsChanged}
              onCreateScript={onCreateScript}
              onCreateSubfolder={onCreateSubfolder}
              renderScripts={renderScripts}
              depth={depth + 1}
            />
          )}
        </div>
      )}
    </div>
  );
}
