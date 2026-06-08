"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  Edit3,
  Clock,
  Trash2,
  MessageSquare,
  Video,
  Download,
  RotateCcw,
  FolderOpen,
  Briefcase,
  Loader2,
  User,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ActivityData, ActivityAction } from "@/lib/activity";

const actionConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  Editou: { label: "Edição", color: "bg-blue-500", icon: Edit3 },
  Criou: { label: "Criação", color: "bg-emerald-500", icon: FileText },
  Revisou: { label: "Revisão", color: "bg-yellow-500", icon: Clock },
  Gravou: { label: "Gravação", color: "bg-purple-500", icon: Video },
  Comentou: { label: "Comentário", color: "bg-amber-500", icon: MessageSquare },
  ExcluiuRoteiro: { label: "Exclusão", color: "bg-red-500", icon: Trash2 },
  ExcluiuPasta: { label: "Excluir Pasta", color: "bg-red-600", icon: FolderOpen },
  ExcluiuProjeto: { label: "Excluir Projeto", color: "bg-red-700", icon: Briefcase },
  ExportouBackup: { label: "Exportação", color: "bg-indigo-500", icon: Download },
  Reverteu: { label: "Restauração", color: "bg-cyan-500", icon: RotateCcw },
  EditouProjeto: { label: "Editar Projeto", color: "bg-teal-500", icon: Briefcase },
};

export default function ActivitiesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<(ActivityData & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const q = query(
      collection(db, "activities"),
      where("workspaceId", "==", user.workspaceId || "senai"),
      orderBy("timestamp", "desc"),
      limit(200)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (ActivityData & { id: string })[];
      setActivities(list);
      setLoading(false);
    });

    return () => unsub();
  }, [user, router]);

  const filtered = useMemo(() => {
    let result = activities;
    if (actionFilter !== "all") {
      result = result.filter((a) => a.action === actionFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.scriptTitle?.toLowerCase().includes(q) ||
          a.userName?.toLowerCase().includes(q) ||
          a.projectName?.toLowerCase().includes(q) ||
          a.action?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activities, actionFilter, search]);

  const formatDate = (ts: unknown) => {
    if (!ts) return "";
    if (ts && typeof ts === "object" && "toDate" in ts) {
      return format((ts as Timestamp).toDate(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    }
    return "";
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" asChild className="h-8 w-8">
              <Link href="/dashboard"><ArrowLeft className="w-4 h-4" /></Link>
            </Button>
            <div>
              <h1 className="text-lg font-black flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Log de Atividades
              </h1>
              <p className="text-[11px] text-zinc-500 font-medium">
                Últimas {activities.length} atividades registradas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Buscar por título, usuário, projeto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 text-[12px] rounded border-zinc-200 dark:border-zinc-800"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40 h-9 text-[11px] font-bold rounded border-zinc-200 dark:border-zinc-800">
                <SelectValue placeholder="Filtrar ação" />
              </SelectTrigger>
              <SelectContent className="rounded border-none">
                <SelectItem value="all" className="text-[11px] font-bold">Todas as ações</SelectItem>
                {Object.keys(actionConfig).map((key) => {
                  const cfg = actionConfig[key];
                  return (
                    <SelectItem key={key} value={key} className="text-[11px] font-bold">
                      {cfg.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
            <Clock className="w-12 h-12 mb-4" />
            <p className="text-[13px] font-medium">Nenhuma atividade encontrada</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((activity) => {
              const cfg = actionConfig[activity.action] || { label: activity.action, color: "bg-zinc-500", icon: Clock };
              const Icon = cfg.icon;
              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full ${cfg.color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[12px] font-bold">{activity.userName}</span>
                      <span className="text-[11px] text-zinc-400">{cfg.label.toLowerCase()}</span>
                      {activity.scriptTitle && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-600">·</span>
                          <span className="text-[12px] font-bold text-blue-600 dark:text-blue-400 truncate max-w-[200px]">
                            {activity.scriptTitle}
                          </span>
                        </>
                      )}
                      {activity.projectName && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-600">·</span>
                          <Badge variant="outline" className="text-[9px] font-bold h-5 border-zinc-300 dark:border-zinc-700">
                            {activity.projectName}
                          </Badge>
                        </>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {formatDate(activity.timestamp)}
                    </p>
                  </div>
                  {activity.scriptId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-[10px] font-bold shrink-0"
                      asChild
                    >
                      <Link href={`/editor/${activity.scriptId}`}>
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        Abrir
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
