"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, RotateCcw, Eye, X, ArrowLeftRight, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Scene } from "@/lib/parser";
import { getVersions, restoreVersion, VersionData } from "@/lib/versions";

interface VersionHistoryProps {
  scriptId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VersionHistory({ scriptId, isOpen, onClose }: VersionHistoryProps) {
  const { user } = useAuth();
  const [versions, setVersions] = useState<VersionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<VersionData | null>(null);
  const [compareVersion, setCompareVersion] = useState<VersionData | null>(null);

  const loadVersions = useCallback(async () => {
    if (!scriptId) return;
    setLoading(true);
    try {
      const data = await getVersions(scriptId, 50);
      setVersions(data);
    } catch (e) {
      console.error("[VersionHistory] Erro ao carregar versões:", e);
    } finally {
      setLoading(false);
    }
  }, [scriptId]);

  useEffect(() => {
    if (!isOpen || !scriptId) return;
    loadVersions();

    const unsub = onSnapshot(
      query(
        collection(db, "scripts", scriptId, "versions"),
        orderBy("createdAt", "desc"),
        limit(50)
      ),
      () => {
        loadVersions();
      }
    );
    return () => unsub();
  }, [isOpen, scriptId, loadVersions]);

  const handleRestore = async (versionId: string) => {
    if (!user) return;
    setRestoring(versionId);
    try {
      const success = await restoreVersion(
        scriptId,
        versionId,
        user.uid,
        user.displayName || user.email || "Usuário"
      );
      if (success) {
        toast.success("Versão restaurada com sucesso!");
        loadVersions();
      } else {
        toast.error("Erro ao restaurar versão.");
      }
    } catch {
      toast.error("Erro ao restaurar versão.");
    } finally {
      setRestoring(null);
    }
  };

  const formatDate = (date: { toDate: () => Date } | string | undefined) => {
    if (!date) return "Data desconhecida";
    if (typeof date === "object" && date.toDate) {
      return format(date.toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    }
    if (typeof date === "string") {
      return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    }
    return "Data desconhecida";
  };

  const getDescription = (v: VersionData) => {
    if (v.description) return v.description;
    if (v.restoredFrom) return "Restauração";
    if (v.createdByName) return `Salvo por ${v.createdByName}`;
    return "Versão salva";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl bg-white dark:bg-zinc-950 border-none rounded p-0 shadow-[0_0_100px_rgba(0,0,0,0.2)] max-h-[90vh] overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-500" />
              Histórico de Versões
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[11px] text-zinc-500 font-medium mt-1">
            {versions.length} versão(ões) disponível(is)
          </p>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden" style={{ height: "60vh" }}>
          <ScrollArea className="flex-1 p-6 pt-2">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
              </div>
            ) : versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-zinc-400">
                <Clock className="w-8 h-8 mb-2" />
                <p className="text-[12px] font-medium">Nenhuma versão encontrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {versions.map((v, idx) => (
                  <div
                    key={v.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      selectedVersion?.id === v.id
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/20"
                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                          v{versions.length - idx}
                        </span>
                        <span className="text-[13px] font-bold truncate">
                          {getDescription(v)}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        {formatDate(v.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-[10px] font-bold"
                        onClick={() => setSelectedVersion(selectedVersion?.id === v.id ? null : v)}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-[10px] font-bold text-amber-600 hover:text-amber-700"
                        onClick={() => handleRestore(v.id)}
                        disabled={restoring === v.id || idx === 0}
                      >
                        {restoring === v.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        )}
                        Restaurar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {selectedVersion && (
            <div className="w-1/2 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                  Pré-visualização
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px]"
                  onClick={() => setSelectedVersion(null)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              <ScrollArea className="h-full p-4">
                {(() => {
                  const scenes = selectedVersion.scenes || [];
                  const content = selectedVersion.content || "";
                  return (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">
                        {scenes.length} cena(s) ·{" "}
                        {content.length > 0
                          ? `${content.split(/\s+/).length} palavras`
                          : "sem texto bruto"}
                      </p>
                      {scenes.length > 0 ? (
                        scenes.map((s: Scene, i: number) => (
                          <div key={i} className="p-3 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800">
                            <p className="text-[9px] font-black text-blue-500 mb-1">
                              Cena {s.sceneNumber}
                            </p>
                            {s.spokenText && (
                              <p className="text-[12px] leading-relaxed line-clamp-3">
                                {s.spokenText.slice(0, 200)}
                                {s.spokenText.length > 200 ? "..." : ""}
                              </p>
                            )}
                          </div>
                        ))
                      ) : content ? (
                        <p className="text-[12px] leading-relaxed whitespace-pre-wrap line-clamp-[20]">
                          {content.slice(0, 500)}
                          {content.length > 500 ? "..." : ""}
                        </p>
                      ) : (
                        <p className="text-[12px] text-zinc-400 italic">
                          Nenhum conteúdo disponível
                        </p>
                      )}
                    </div>
                  );
                })()}
              </ScrollArea>
            </div>
          )}
        </div>

        {selectedVersion && (
          <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] font-bold"
              onClick={() => setSelectedVersion(null)}
            >
              Fechar
            </Button>
            <Button
              size="sm"
              className="text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => handleRestore(selectedVersion.id)}
              disabled={restoring === selectedVersion.id}
            >
              {restoring === selectedVersion.id ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <RotateCcw className="w-3 h-3 mr-1" />
              )}
              Restaurar esta versão
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
