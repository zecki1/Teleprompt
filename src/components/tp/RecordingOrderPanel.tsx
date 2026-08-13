"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getScriptsByProject } from "@/services/projects";
import { ScriptDoc } from "@/types/script";
import { getScriptPath } from "@/lib/pathUtils";
import { ChevronUp, ChevronDown, Save, Loader2, CheckCircle2 } from "lucide-react";

export interface RecordingOrderPanelProps {
  projectId: string | null;
  folderPath: string[];
  onOrderSaved?: (order: string[]) => void;
}

function folderKeyOf(path: string[]): string {
  return path.length > 0 ? path.join("/") : "Raiz";
}

function storageKeyOf(projectId: string, folderPath: string[]): string {
  return `recording-order-${projectId}-${folderKeyOf(folderPath)}`;
}

/** Lê a ordem customizada persistida no localStorage para uma pasta. */
export async function getRecordingOrder(projectId: string | null, folderPath: string[]): Promise<string[] | null> {
  if (!projectId) return null;
  try {
    const raw = localStorage.getItem(storageKeyOf(projectId, folderPath));
    if (!raw) return null;
    const list = JSON.parse(raw);
    return Array.isArray(list) ? (list as string[]) : null;
  } catch {
    return null;
  }
}

export function RecordingOrderPanel({ projectId, folderPath, onOrderSaved }: RecordingOrderPanelProps) {
  const [scripts, setScripts] = useState<ScriptDoc[]>([]);
  const [order, setOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const folderKey = useMemo(() => folderPath.join("/"), [folderPath]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const load = async () => {
      if (!projectId) {
        setLoading(false);
        return;
      }
      const all = await getScriptsByProject(projectId);
      if (!active) return;
      const inFolder = all.filter((s) => {
        const p = getScriptPath(s);
        if (p.length !== folderPath.length) return false;
        return p.every((seg, i) => seg === folderPath[i]);
      });
      inFolder.sort((a, b) => (a.title || "").localeCompare(b.title || "", undefined, { numeric: true, sensitivity: 'base' }));
      const savedOrder = await getRecordingOrder(projectId, folderPath);
      if (!active) return;
      setScripts(inFolder);
      if (savedOrder) {
        const map = new Map(inFolder.map((s) => [s.id, s]));
        const valid = savedOrder.filter((id) => map.has(id));
        const missing = inFolder.filter((s) => !valid.includes(s.id)).map((s) => s.id);
        setOrder([...valid, ...missing]);
      } else {
        setOrder(inFolder.map((s) => s.id));
      }
      setLoading(false);
    };
    void load();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, folderKey]);

  const scriptById = useMemo(() => {
    const m = new Map<string, ScriptDoc>();
    scripts.forEach((s) => m.set(s.id, s));
    return m;
  }, [scripts]);

  const move = useCallback((index: number, delta: -1 | 1) => {
    setOrder((prev) => {
      const next = [...prev];
      const target = index + delta;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }, []);

  const save = useCallback(async () => {
    if (!projectId) return;
    setSaving(true);
    try {
      localStorage.setItem(storageKeyOf(projectId, folderPath), JSON.stringify(order));
      setSaved(true);
      onOrderSaved?.(order);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // armazenamento indisponível
    } finally {
      setSaving(false);
    }
  }, [projectId, folderPath, order, onOrderSaved]);

  const readyCount = scripts.filter(
    (s) => s.status === "revisao_realizada" || s.status === "aguardando_gravacao"
  ).length;

  return (
    <div className="py-4 space-y-4">
      <p className="text-[10px] font-bold uppercase text-zinc-500 flex items-center gap-2 tracking-widest">
        Ordem de Gravação
      </p>
      <p className="text-[9px] text-zinc-600 leading-relaxed">
        Defina a sequência em que os roteiros desta pasta serão gravados. Ao marcar um roteiro como gravado, o TP sugere o próximo desta ordem.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-zinc-600">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : scripts.length === 0 ? (
        <div className="text-center py-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl">
          <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Nenhum roteiro nesta pasta</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {order.map((scriptId, index) => {
            const s = scriptById.get(scriptId);
            if (!s) return null;
            const ready = s.status === "revisao_realizada" || s.status === "aguardando_gravacao";
            return (
              <div
                key={scriptId}
                className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                  ready
                    ? "bg-zinc-900/70 border-emerald-500/30"
                    : "bg-zinc-900/40 border-zinc-800 opacity-70"
                }`}
              >
                <span className="w-6 h-6 shrink-0 flex items-center justify-center rounded-lg bg-zinc-800 text-[10px] font-black text-zinc-400">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white truncate">{s.title}</p>
                  <p className={`text-[8px] uppercase font-black tracking-widest ${
                    s.status === "gravado" ? "text-blue-400"
                    : s.status === "rejeitado" ? "text-red-400"
                    : ready ? "text-emerald-400"
                    : "text-zinc-600"
                  }`}>
                    {s.status === "gravado" ? "✓ GRAVADO" : s.status === "rejeitado" ? "REJEITADO" : ready ? "PRONTO PARA GRAVAR" : "FALTA GRAVAR"}
                  </p>
                </div>
                <div className="flex flex-col gap-0.5 shrink-0">
                  <button
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
                    title="Subir na ordem"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={() => move(index, 1)}
                    disabled={index === order.length - 1}
                    className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 transition-colors"
                    title="Descer na ordem"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-2">
        <button
          onClick={save}
          disabled={saving || scripts.length === 0}
          className="w-full py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 bg-zinc-900 text-white border border-zinc-800 hover:border-zinc-600"
        >
          {saved ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-400" /> Ordem salva!
            </>
          ) : saving ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Salvando...
            </>
          ) : (
            <>
              <Save size={14} /> Salvar ordem ({readyCount} pronto{readyCount === 1 ? "" : "s"})
            </>
          )}
        </button>
      </div>
    </div>
  );
}
