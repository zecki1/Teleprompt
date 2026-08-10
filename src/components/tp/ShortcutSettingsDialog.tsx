"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Keyboard, RotateCcw, Save } from "lucide-react";
import {
  TPActionId,
  TP_ACTION_LABELS,
  DEFAULT_TP_BINDINGS,
  formatKey,
} from "@/lib/tp-controls";

export interface ShortcutSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userShortcuts: Partial<Record<TPActionId, string>>;
  onSave: (shortcuts: Partial<Record<TPActionId, string>>) => void;
}

const ACTIONS: TPActionId[] = [
  "playPause",
  "prevScene",
  "nextScene",
  "prevParagraph",
  "nextParagraph",
  "middleScene",
  "home",
  "speedUp",
  "speedDown",
];

function eventToMatcher(e: KeyboardEvent): string | null {
  if (e.metaKey || e.ctrlKey || e.altKey) return null;
  if (e.code.startsWith("Key") || e.code.startsWith("F")) return e.code;
  if (e.code === "Space" || e.code === "Home" || e.code === "Enter" || e.code === "Escape") return e.code;
  if (e.key.length === 1) return e.key;
  return e.code;
}

export function ShortcutSettingsDialog({
  open,
  onOpenChange,
  userShortcuts,
  onSave,
}: ShortcutSettingsDialogProps) {
  const [draft, setDraft] = useState<Partial<Record<TPActionId, string>>>(userShortcuts);
  const [capturing, setCapturing] = useState<TPActionId | null>(null);

  useEffect(() => {
    if (!capturing) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const matcher = eventToMatcher(e);
      if (matcher) {
        setDraft((prev) => ({ ...prev, [capturing]: matcher }));
        setCapturing(null);
      }
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [capturing]);

  const currentKey = (action: TPActionId): string => {
    if (draft[action]) return formatKey(draft[action]!);
    return DEFAULT_TP_BINDINGS[action].map(formatKey).join(" / ");
  };

  const reset = (action: TPActionId) => {
    setDraft((prev) => {
      const next = { ...prev };
      delete next[action];
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-zinc-950 border-zinc-800 rounded-3xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Keyboard size={18} /> Meus atalhos
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm">
            Personalize as teclas do seu controle. Cada usuário tem os seus — seus colegas não são afetados.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
          {ACTIONS.map((action) => (
            <div
              key={action}
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                capturing === action
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-zinc-800 bg-zinc-900/50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold text-white">{TP_ACTION_LABELS[action]}</p>
                <p className="text-[10px] font-mono text-blue-400 mt-0.5">
                  {capturing === action ? "Pressione uma tecla..." : currentKey(action)}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {!capturing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[10px] font-bold text-zinc-400"
                    onClick={() => reset(action)}
                    title="Restaurar padrão"
                  >
                    <RotateCcw size={12} />
                  </Button>
                )}
                <Button
                  size="sm"
                  className={`h-7 px-3 text-[10px] font-black uppercase tracking-widest ${
                    capturing === action
                      ? "bg-blue-600 text-white"
                      : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                  }`}
                  onClick={() => setCapturing(capturing === action ? null : action)}
                >
                  {capturing === action ? "Gravar..." : "Tecla"}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="pt-2 flex gap-3">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 rounded-xl font-bold text-sm text-zinc-400"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
            className="flex-[2] h-11 rounded-xl font-black text-[10px] uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20"
          >
            <Save size={14} className="mr-2" /> Salvar atalhos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
