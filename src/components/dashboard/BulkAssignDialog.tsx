"use client";

import React, { useEffect, useState } from "react";
import { ScriptDoc } from "@/types/script";
import { Presenter } from "@/services/presenters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, UserPlus, Users, Video, Plus, Hourglass, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { addPresenter } from "@/services/presenters";
import { updateScript } from "@/api/scripts";

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scripts: ScriptDoc[];
  allUsers: { uid: string; displayName?: string | null; name?: string | null; photoURL?: string | null; isEditor?: boolean; isRevisor?: boolean }[];
  presenters: Presenter[];
  workspaceId?: string;
  currentUserId?: string;
  onAssigned: (updatedScripts: ScriptDoc[]) => void;
  onPresenterCreated?: (presenter: Presenter) => void;
}

const SELECTED_CLASS = "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5";

export function BulkAssignDialog({
  open,
  onOpenChange,
  scripts,
  allUsers,
  presenters: presentersList,
  workspaceId,
  currentUserId,
  onAssigned,
  onPresenterCreated,
}: BulkAssignDialogProps) {
  const [loading, setLoading] = useState(false);
  const [presenterSearch, setPresenterSearch] = useState("");
  const [selectedEditor, setSelectedEditor] = useState<string | null>(null);
  const [selectedReviewer, setSelectedReviewer] = useState<string | null>(null);
  const [selectedVideomaker, setSelectedVideomaker] = useState<string | null>(null);
  const [selectedPresenters, setSelectedPresenters] = useState<Set<string>>(new Set());

  const count = scripts.length;
  const label = count === 1 ? "1 roteiro" : `${count} roteiros`;

  const getUserName = (uid: string) =>
    allUsers.find(u => u.uid === uid)?.displayName || allUsers.find(u => u.uid === uid)?.name || "Usuário";

  useEffect(() => {
    if (!open) return;
    setLoading(false);
    setPresenterSearch("");

    const commonId = (field: "editorId" | "reviewerId" | "videomakerId"): string | null => {
      if (scripts.length === 0) return null;
      const first = scripts[0][field];
      if (!first) return null;
      return scripts.every(s => s[field] === first) ? first : null;
    };

    setSelectedEditor(commonId("editorId"));
    setSelectedReviewer(commonId("reviewerId"));
    setSelectedVideomaker(commonId("videomakerId"));

    let common: Set<string> | null = null;
    for (const s of scripts) {
      const ids = new Set(s.presenterIds || []);
      if (common === null) {
        common = ids;
      } else {
        const next = new Set<string>();
        common.forEach(id => { if (ids.has(id)) next.add(id); });
        common = next;
      }
    }
    setSelectedPresenters(common || new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when the dialog opens
  }, [open]);

  const hasSelection = Boolean(
    selectedEditor || selectedReviewer || selectedVideomaker || selectedPresenters.size > 0
  );

  const handleTogglePresenter = (id: string) => {
    setSelectedPresenters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreatePresenter = async (name: string) => {
    if (!name.trim()) return;
    try {
      const id = await addPresenter(name.trim(), workspaceId || "", currentUserId || "");
      const newPresenter: Presenter = {
        id,
        name: name.trim(),
        workspaceId: workspaceId || "",
        createdBy: currentUserId || "",
      };
      onPresenterCreated?.(newPresenter);
      setSelectedPresenters(prev => new Set(prev).add(id));
      setPresenterSearch("");
      toast.success(`Apresentador "${name.trim()}" cadastrado!`);
    } catch {
      toast.error("Erro ao cadastrar apresentador.");
    }
  };

  const handleApply = async () => {
    if (scripts.length === 0) return;
    if (!hasSelection) return;
    setLoading(true);
    try {
      const updates: ScriptDoc[] = [];
      const appliedParts: string[] = [];

      for (const script of scripts) {
        const next: ScriptDoc = { ...script, updatedAt: new Date().toISOString() };

        if (selectedEditor) {
          const editorName = getUserName(selectedEditor);
          next.editorId = selectedEditor;
          next.editorName = editorName;
          appliedParts.push("Editor");
        }
        if (selectedReviewer) {
          const reviewerName = getUserName(selectedReviewer);
          next.reviewerId = selectedReviewer;
          next.reviewerName = reviewerName;
          appliedParts.push("Revisor");
        }
        if (selectedVideomaker) {
          const videomakerName = getUserName(selectedVideomaker);
          next.videomakerId = selectedVideomaker;
          next.videomakerName = videomakerName;
          appliedParts.push("Videomaker");
        }
        if (selectedPresenters.size > 0) {
          next.presenterIds = Array.from(selectedPresenters);
          appliedParts.push("Apresentador");
        }

        updates.push(next);
      }

      await Promise.all(
        updates.map(script =>
          updateScript(script.id, {
            editorId: script.editorId ?? undefined,
            editorName: script.editorName ?? undefined,
            reviewerId: script.reviewerId ?? undefined,
            reviewerName: script.reviewerName ?? undefined,
            videomakerId: script.videomakerId ?? undefined,
            videomakerName: script.videomakerName ?? undefined,
            presenterIds: script.presenterIds ?? undefined,
          }),
        ),
      );

      const uniqueParts = Array.from(new Set(appliedParts)).join(", ");
      onAssigned(updates);
      onOpenChange(false);
      toast.success(`Atribuição de ${uniqueParts} aplicada a ${label}!`);
    } catch (error) {
      console.error("Erro na atribuição em lote:", error);
      toast.error("Erro ao atribuir em lote.");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-none rounded p-8 shadow-[0_0_100px_rgba(0,0,0,0.2)] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center mb-2">Atribuir em Lote</DialogTitle>
          <p className="text-center text-zinc-500 text-sm font-medium mb-6">
            Selecione os colaboradores para <span className="font-bold text-white">{label}</span> e clique em
            <span className="font-bold text-emerald-500"> Atribuir</span> para confirmar.
          </p>
        </DialogHeader>

        <div className="space-y-8">
          {/* Editor */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
              <UserPlus className="w-4 h-4" /> Editor Responsável
            </h4>
            <div className="grid gap-2">
              {allUsers.filter(u => u.isEditor).length > 0 ? (
                allUsers.filter(u => u.isEditor).map(u => {
                  const isSelected = selectedEditor === u.uid;
                  return (
                    <Button
                      key={u.uid}
                      variant="outline"
                      className={`justify-between h-12 rounded font-bold transition-all ${isSelected ? SELECTED_CLASS : ""}`}
                      onClick={() => setSelectedEditor(isSelected ? null : u.uid)}
                      disabled={loading}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={u.photoURL || undefined} />
                          <AvatarFallback className="text-[10px]">{getInitials(u.displayName || u.name)}</AvatarFallback>
                        </Avatar>
                        <span>{u.displayName || u.name}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                    </Button>
                  );
                })
              ) : (
                <p className="text-xs text-zinc-400 italic">Nenhum editor definido no painel admin.</p>
              )}
            </div>
          </div>

          {/* Revisor */}
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-purple-500 flex items-center gap-2">
              <Users className="w-4 h-4" /> Revisor Designado
            </h4>
            <div className="grid gap-2">
              {allUsers.filter(u => u.isRevisor).length > 0 ? (
                allUsers.filter(u => u.isRevisor).map(u => {
                  const isSelected = selectedReviewer === u.uid;
                  return (
                    <Button
                      key={u.uid}
                      variant="outline"
                      className={`justify-between h-12 rounded font-bold transition-all ${isSelected ? SELECTED_CLASS : ""}`}
                      onClick={() => setSelectedReviewer(isSelected ? null : u.uid)}
                      disabled={loading}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={u.photoURL || undefined} />
                          <AvatarFallback className="text-[10px]">{getInitials(u.displayName || u.name)}</AvatarFallback>
                        </Avatar>
                        <span>{u.displayName || u.name}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                    </Button>
                  );
                })
              ) : (
                <p className="text-xs text-zinc-400 italic">Nenhum revisor definido no painel admin.</p>
              )}
            </div>
          </div>

          {/* Videomaker */}
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
              <Video className="w-4 h-4" /> Videomaker Responsável
            </h4>
            <div className="grid gap-2">
              {allUsers.length > 0 ? (
                allUsers.map(u => {
                  const isSelected = selectedVideomaker === u.uid;
                  return (
                    <Button
                      key={u.uid}
                      variant="outline"
                      className={`justify-between h-12 rounded font-bold transition-all ${isSelected ? SELECTED_CLASS : ""}`}
                      onClick={() => setSelectedVideomaker(isSelected ? null : u.uid)}
                      disabled={loading}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={u.photoURL || undefined} />
                          <AvatarFallback className="text-[10px]">{getInitials(u.displayName || u.name)}</AvatarFallback>
                        </Avatar>
                        <span>{u.displayName || u.name}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                    </Button>
                  );
                })
              ) : (
                <p className="text-xs text-zinc-400 italic">Nenhum usuário disponível.</p>
              )}
            </div>
          </div>

          {/* Apresentador */}
          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
              <Users className="w-4 h-4" /> Apresentador(es)
            </h4>
            <Input
              value={presenterSearch}
              onChange={e => setPresenterSearch(e.target.value)}
              placeholder="Pesquisar ou cadastrar apresentador..."
              className="h-10 text-sm rounded bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            />
            <div className="grid gap-2 max-h-40 overflow-y-auto">
              {(() => {
                const filtered = presenterSearch.trim()
                  ? presentersList.filter(p => p.name.toLowerCase().includes(presenterSearch.toLowerCase()))
                  : presentersList;
                if (filtered.length > 0) {
                  return filtered.map(p => {
                    const isSelected = selectedPresenters.has(p.id);
                    return (
                      <Button
                        key={p.id}
                        variant="outline"
                        className={`justify-between h-10 rounded font-bold transition-all ${isSelected ? SELECTED_CLASS : ""}`}
                        onClick={() => handleTogglePresenter(p.id)}
                        disabled={loading}
                      >
                        <span>{p.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                      </Button>
                    );
                  });
                }
                if (presenterSearch.trim()) {
                  return (
                    <Button
                      variant="outline"
                      className="h-10 rounded font-bold text-emerald-600 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
                      onClick={() => handleCreatePresenter(presenterSearch.trim())}
                      disabled={loading}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />
                      Cadastrar &quot;{presenterSearch.trim()}&quot;
                    </Button>
                  );
                }
                return <p className="text-xs text-zinc-400 italic text-center py-4">Nenhum apresentador cadastrado.</p>;
              })()}
            </div>
          </div>

          {/* Resumo da seleção */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <div className="bg-zinc-50 dark:bg-zinc-900 rounded-xl p-4 border border-zinc-100 dark:border-zinc-800 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Resumo da atribuição</p>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                <span className="text-blue-500 uppercase tracking-wider text-[9px]">Editor</span>
                <span className="text-right truncate">{selectedEditor ? getUserName(selectedEditor) : <span className="text-zinc-400">—</span>}</span>
                <span className="text-purple-500 uppercase tracking-wider text-[9px]">Revisor</span>
                <span className="text-right truncate">{selectedReviewer ? getUserName(selectedReviewer) : <span className="text-zinc-400">—</span>}</span>
                <span className="text-blue-500 uppercase tracking-wider text-[9px]">Videomaker</span>
                <span className="text-right truncate">{selectedVideomaker ? getUserName(selectedVideomaker) : <span className="text-zinc-400">—</span>}</span>
                <span className="text-amber-500 uppercase tracking-wider text-[9px]">Apresentadores</span>
                <span className="text-right truncate">
                  {selectedPresenters.size > 0
                    ? Array.from(selectedPresenters).map(id => presentersList.find(p => p.id === id)?.name || id).join(", ")
                    : <span className="text-zinc-400">—</span>}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-14 rounded font-black uppercase tracking-widest text-[10px]"
            disabled={loading}
          >
            <X className="w-4 h-4 mr-2" /> Cancelar
          </Button>
          <Button
            onClick={handleApply}
            disabled={loading || !hasSelection}
            className="flex-[2] h-14 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg"
          >
            {loading ? (
              <Hourglass className="w-4 h-4 animate-spin" style={{ animationDuration: "2s" }} />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Atribuir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
