"use client";

import React, { useState } from "react";
import { doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ScriptDoc } from "@/types/script";
import { Presenter } from "@/services/presenters";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, UserPlus, Users, Video, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { addPresenter } from "@/services/presenters";

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scripts: ScriptDoc[];
  allUsers: { uid: string; displayName?: string | null; name?: string | null; photoURL?: string | null; isEditor?: boolean; isRevisor?: boolean }[];
  presenters: Presenter[];
  onAssigned: (updatedScripts: ScriptDoc[]) => void;
}

type AssignField = "editor" | "reviewer" | "videomaker" | "presenter";

export function BulkAssignDialog({
  open,
  onOpenChange,
  scripts,
  allUsers,
  presenters: presentersList,
  onAssigned,
}: BulkAssignDialogProps) {
  const [loading, setLoading] = useState(false);
  const [presenterSearch, setPresenterSearch] = useState("");
  const [selectedEditor, setSelectedEditor] = useState<string | null>(null);
  const [selectedReviewer, setSelectedReviewer] = useState<string | null>(null);
  const [selectedVideomaker, setSelectedVideomaker] = useState<string | null>(null);
  const [selectedPresenter, setSelectedPresenter] = useState<string | null>(null);

  const count = scripts.length;
  const label = count === 1 ? "1 roteiro" : `${count} roteiros`;

  const handleApply = async (field: AssignField, value: string, name: string) => {
    if (scripts.length === 0) return;
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const updates: ScriptDoc[] = [];

      for (const script of scripts) {
        const ref = doc(db, "scripts", script.id);
        const data: Record<string, unknown> = { updatedAt: new Date().toISOString() };

        if (field === "editor") {
          data.editorId = value;
          data.editorName = name;
          updates.push({ ...script, editorId: value, editorName: name });
        } else if (field === "reviewer") {
          data.reviewerId = value;
          data.reviewerName = name;
          updates.push({ ...script, reviewerId: value, reviewerName: name });
        } else if (field === "videomaker") {
          data.videomakerId = value;
          data.videomakerName = name;
          updates.push({ ...script, videomakerId: value, videomakerName: name });
        } else if (field === "presenter") {
          const current = script.presenterIds || [];
          const isAssigned = current.includes(value);
          const newIds = isAssigned ? current.filter(id => id !== value) : [...current, value];
          data.presenterIds = newIds;
          updates.push({ ...script, presenterIds: newIds });
        }

        batch.update(ref, data);
      }

      await batch.commit();
      onAssigned(updates);

      const fieldLabel = field === "editor" ? "Editor" : field === "reviewer" ? "Revisor" : field === "videomaker" ? "Videomaker" : "Apresentador";
      toast.success(`${fieldLabel} atribuído a ${label}!`);
    } catch (error) {
      console.error("Erro na atribuição em lote:", error);
      toast.error("Erro ao atribuir em lote.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePresenter = async (name: string) => {
    if (!name.trim()) return;
    try {
      const id = await addPresenter(name.trim(), "", "");
      toast.success(`Apresentador "${name}" cadastrado!`);
      return id;
    } catch {
      toast.error("Erro ao cadastrar apresentador.");
      return null;
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-950 border-none rounded-[40px] p-8 shadow-[0_0_100px_rgba(0,0,0,0.2)] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center mb-2">Atribuir em Lote</DialogTitle>
          <p className="text-center text-zinc-500 text-sm font-medium mb-6">
            Atribuir colaboradores para <span className="font-bold text-white">{label}</span>.
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
                allUsers.filter(u => u.isEditor).map(u => (
                  <Button
                    key={u.uid}
                    variant={selectedEditor === u.uid ? "secondary" : "outline"}
                    className={`justify-between h-12 rounded font-bold transition-all ${selectedEditor === u.uid ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : ''}`}
                    onClick={() => { setSelectedEditor(u.uid); handleApply("editor", u.uid, u.displayName || u.name || "Usuário"); }}
                    disabled={loading}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={u.photoURL || undefined} />
                        <AvatarFallback className="text-[10px]">{getInitials(u.displayName || u.name)}</AvatarFallback>
                      </Avatar>
                      <span>{u.displayName || u.name}</span>
                    </div>
                    {selectedEditor === u.uid && <Check className="w-4 h-4 text-primary" />}
                  </Button>
                ))
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
                allUsers.filter(u => u.isRevisor).map(u => (
                  <Button
                    key={u.uid}
                    variant={selectedReviewer === u.uid ? "secondary" : "outline"}
                    className={`justify-between h-12 rounded font-bold transition-all ${selectedReviewer === u.uid ? 'border-purple-500 ring-2 ring-purple-500/20 bg-purple-500/5' : ''}`}
                    onClick={() => { setSelectedReviewer(u.uid); handleApply("reviewer", u.uid, u.displayName || u.name || "Usuário"); }}
                    disabled={loading}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={u.photoURL || undefined} />
                        <AvatarFallback className="text-[10px]">{getInitials(u.displayName || u.name)}</AvatarFallback>
                      </Avatar>
                      <span>{u.displayName || u.name}</span>
                    </div>
                    {selectedReviewer === u.uid && <Check className="w-4 h-4 text-purple-500" />}
                  </Button>
                ))
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
                allUsers.map(u => (
                  <Button
                    key={u.uid}
                    variant={selectedVideomaker === u.uid ? "secondary" : "outline"}
                    className={`justify-between h-12 rounded font-bold transition-all ${selectedVideomaker === u.uid ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5' : ''}`}
                    onClick={() => { setSelectedVideomaker(u.uid); handleApply("videomaker", u.uid, u.displayName || u.name || "Usuário"); }}
                    disabled={loading}
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={u.photoURL || undefined} />
                        <AvatarFallback className="text-[10px]">{getInitials(u.displayName || u.name)}</AvatarFallback>
                      </Avatar>
                      <span>{u.displayName || u.name}</span>
                    </div>
                    {selectedVideomaker === u.uid && <Check className="w-4 h-4 text-blue-500" />}
                  </Button>
                ))
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
              placeholder="Pesquisar apresentador..."
              className="h-10 text-sm rounded bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
            />
            <div className="grid gap-2 max-h-40 overflow-y-auto">
              {(() => {
                const filtered = presenterSearch.trim()
                  ? presentersList.filter(p => p.name.toLowerCase().includes(presenterSearch.toLowerCase()))
                  : presentersList;
                if (filtered.length > 0) {
                  return filtered.map(p => {
                    const isAnyAssigned = scripts.some(s => s.presenterIds?.includes(p.id));
                    return (
                      <Button
                        key={p.id}
                        variant={isAnyAssigned ? "secondary" : "outline"}
                        className={`justify-between h-10 rounded font-bold transition-all ${isAnyAssigned ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5' : ''}`}
                        onClick={() => { setSelectedPresenter(p.id); handleApply("presenter", p.id, p.name); }}
                        disabled={loading}
                      >
                        <span>{p.name}</span>
                        {isAnyAssigned && <Check className="w-4 h-4 text-amber-500" />}
                      </Button>
                    );
                  });
                }
                if (presenterSearch.trim()) {
                  return (
                    <Button
                      variant="outline"
                      className="h-10 rounded font-bold text-emerald-600 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all"
                      onClick={async () => {
                        const id = await handleCreatePresenter(presenterSearch.trim());
                        if (id) {
                          setPresenterSearch("");
                          handleApply("presenter", id, presenterSearch.trim());
                        }
                      }}
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
        </div>

        <Button onClick={() => onOpenChange(false)} className="w-full h-14 rounded bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px] mt-4">
          Concluir
        </Button>
      </DialogContent>
    </Dialog>
  );
}
