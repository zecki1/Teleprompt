"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import { listDebugLogs } from "@/api/admin";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LoadingScreen } from "@/components/PageTransitionLoader";
import { debugLog as clientDebugLog, setDebugLogEnabled, isDebugLogEnabled } from "@/lib/debug-log";
import { toDebugLog } from "@/lib/script-mappers";
import { toDate } from "@/lib/data-utils";
import { usePolling } from "@/lib/polling";
import { RefreshCw, Download, ChevronDown, ChevronRight, Bug } from "lucide-react";
import { toast } from "sonner";

const LEVELS = ["all", "debug", "info", "warn", "error"] as const;
type Level = typeof LEVELS[number];

const LEVEL_COLORS: Record<string, string> = {
  debug: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  warn: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const PERM_LABELS: Record<string, string> = {
  collaborate: "COLABORAR",
  editor: "EDITOR",
  revisor: "REVISOR",
  revert: "REVERTER",
  assign: "ATRIBUIR",
  admin: "ADMIN",
  reports: "RELATÓRIOS",
  history: "HISTÓRICO",
  debuglogs: "DEBUG LOGS",
  superadmin: "SUPER ADMIN",
};

interface LogDoc {
  id: string;
  level: Level;
  context: string;
  message: string;
  stack?: string;
  uid?: string;
  email?: string;
  name?: string;
  role?: string;
  workspaceId?: string;
  permissions?: string[];
  url?: string;
  page?: string;
  meta?: Record<string, unknown>;
  durationMs?: number;
  t?: number;
  ts?: unknown;
}

const PER_PAGE = 200;

export function DebugLogsPanel() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<LogDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelFilter, setLevelFilter] = useState<Level>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [debugEnabled, setDebugEnabled] = useState(true);

  useEffect(() => {
    setDebugEnabled(isDebugLogEnabled());
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const dtos = await listDebugLogs(PER_PAGE);
      setLogs(dtos.map(dto => {
        const local = toDebugLog(dto);
        return {
          id: local.id,
          level: local.level as Level,
          context: local.source,
          message: local.message,
          ts: local.createdAt,
        } as LogDoc;
      }));
    } catch (e) {
      clientDebugLog("warn", "admin.debuglogs", "Falha ao carregar logs", undefined, e);
      toast.error("Erro ao carregar logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  usePolling(loadLogs, 5000, []);

  const isSuperAdmin = user?.isSuperAdmin === true || user?.role === "SuperAdmin";
  const canSeeLogs = isSuperAdmin || user?.canViewDebugLogs === true;

  if (!canSeeLogs) return null;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `debug_logs_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = logs.filter(l => {
    if (levelFilter !== "all" && l.level !== levelFilter) return false;
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return [l.message, l.context, l.email, l.uid, l.page, l.name].some(v => v?.toLowerCase().includes(s));
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={loadLogs}
          disabled={loading}
          className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest border-zinc-200 dark:border-zinc-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest border-zinc-200 dark:border-zinc-800"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Exportar JSON
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const next = !debugEnabled;
            setDebugEnabled(next);
            setDebugLogEnabled(next);
            toast.success(next ? "Logs de debug ativados." : "Logs de debug desativados.");
          }}
          className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest border-zinc-200 dark:border-zinc-800"
        >
          <Bug className="w-3.5 h-3.5 mr-1.5" />
          {debugEnabled ? "Desativar debug" : "Ativar debug"}
        </Button>
        <div className="flex-1" />
        <Input
          placeholder="Buscar por mensagem, contexto, e-mail, usuário..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-72 h-9 rounded-xl text-xs font-bold"
        />
        <Select value={levelFilter} onValueChange={v => setLevelFilter(v as Level)}>
          <SelectTrigger className="w-36 h-9 rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-bold">
            <SelectValue placeholder="Nível" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
            {LEVELS.map(l => (
              <SelectItem key={l} value={l} className="text-xs font-bold uppercase">{l === "all" ? "Todos" : l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-xs text-zinc-400 font-medium">
        {filtered.length} de {logs.length} logs · gravação no servidor + console · atualização automática a cada 5s
      </p>

      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
        {loading ? (
          <div className="py-12 text-center">
            <LoadingScreen fullScreen={false} className="py-8" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-zinc-400">
            <Bug className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum log encontrado</p>
            <p className="text-sm mt-1">Use a aplicação (editor/TP) para gerar logs.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-zinc-50/30 dark:bg-zinc-900/30">
                <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-900">
                  <TableHead className="w-[150px] h-12 px-6 font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">Data/Hora</TableHead>
                  <TableHead className="w-[80px] font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">Nível</TableHead>
                  <TableHead className="w-[160px] font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">Contexto</TableHead>
                  <TableHead className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">Mensagem</TableHead>
                  <TableHead className="w-[220px] font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">Usuário / Permissões</TableHead>
                  <TableHead className="w-[80px] text-center font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">Duração</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(log => {
                  const isOpen = expanded === log.id;
                  return (
                    <Fragment key={log.id}>
                      <TableRow
                        onClick={() => setExpanded(isOpen ? null : log.id)}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 border-zinc-100 dark:border-zinc-900 cursor-pointer align-top"
                      >
                        <TableCell className="px-6 py-3 text-[11px] text-zinc-500 whitespace-nowrap">
                          {log.t ? new Date(log.t).toLocaleString("pt-BR") : toDate(log.ts).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge className={`${LEVEL_COLORS[log.level] || LEVEL_COLORS.info} border-none text-[9px] font-black uppercase`}>
                            {log.level}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-[11px] font-mono font-bold text-blue-600 dark:text-blue-400">{log.context}</span>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 line-clamp-2">{log.message}</span>
                          {log.durationMs !== undefined && <span className="ml-2 text-[10px] font-black text-emerald-600">⏱ {log.durationMs}ms</span>}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                              {log.name ? `${log.name} ` : ""}{log.email ? <span className="text-zinc-400 font-mono">{log.email}</span> : ""}
                            </span>
                            {log.role && <span className="text-[9px] text-zinc-400 font-black uppercase">{log.role}</span>}
                            {(log.permissions || []).length > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {log.permissions!.map(p => (
                                  <span key={p} className="text-[8px] font-black uppercase text-zinc-400 border border-zinc-200 dark:border-zinc-700 rounded px-1 py-0.5">
                                    {PERM_LABELS[p] || p}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400 mx-auto" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400 mx-auto" />}
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow className="border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/30">
                          <TableCell colSpan={6} className="px-6 py-4">
                            <div className="space-y-3 text-[11px] font-mono">
                              <div>
                                <p className="font-black text-zinc-400 uppercase text-[9px] mb-1">Detalhes</p>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-zinc-600 dark:text-zinc-400">
                                  <span>UID: {log.uid || "-"}</span>
                                  <span>WS: {log.workspaceId || "-"}</span>
                                  <span>Página: {log.page || "-"}</span>
                                  <span>URL: {log.url || "-"}</span>
                                </div>
                              </div>
                              {log.meta && (
                                <div>
                                  <p className="font-black text-zinc-400 uppercase text-[9px] mb-1">Meta</p>
                                  <pre className="whitespace-pre-wrap break-all bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-[11px] text-zinc-600 dark:text-zinc-400">
                                    {JSON.stringify(log.meta, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.stack && (
                                <div>
                                  <p className="font-black text-zinc-400 uppercase text-[9px] mb-1">Stack</p>
                                  <pre className="whitespace-pre-wrap break-all bg-white dark:bg-zinc-950 border border-red-200 dark:border-red-900/30 rounded-lg p-3 text-[11px] text-red-600 dark:text-red-400">
                                    {log.stack}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
