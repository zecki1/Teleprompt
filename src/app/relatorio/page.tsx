"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/PageTransitionLoader";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { ScriptDoc } from "@/types/script";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Video,
  Edit3,
  CheckCircle2,
  FileText,
  Users,
  FolderKanban,
} from "lucide-react";

interface UserInfo {
  uid: string;
  displayName: string;
  email: string;
}

interface ProjectStats {
  projectName: string;
  total: number;
  recorded: number;
  edited: number;
  reviewed: number;
  rejected: number;
  draft: number;
}

interface UserStats {
  uid: string;
  name: string;
  recorded: number;
  edited: number;
  reviewed: number;
}

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

export default function RelatorioPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [senaiUsers, setSenaiUsers] = useState<Map<string, UserInfo>>(new Map());

  const isSuperAdmin = user?.role === "SuperAdmin" || user?.isSuperAdmin === true;

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const canAccess = isSuperAdmin || user?.canViewReports === true;

    if (!canAccess) {
      router.push("/dashboard");
      return;
    }

    loadData(user?.workspaceId || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, user?.workspaceId]);

  const loadData = async (workspaceId: string) => {
    try {
      const scriptsQuery = query(collection(db, "scripts"), where("workspaceId", "==", workspaceId));
      const usersQuery = query(collection(db, "users"), where("workspaceId", "==", workspaceId));

      const [scriptsSnap, usersSnap] = await Promise.all([
        getDocs(scriptsQuery),
        getDocs(usersQuery),
      ]);

      const userMap = new Map<string, UserInfo>();
      usersSnap.forEach((d) => {
        const data = d.data();
        const email = data.email || "";
        if (email.endsWith("@sp.senai.br")) {
          userMap.set(d.id, {
            uid: d.id,
            displayName: data.displayName || data.name || email.split("@")[0],
            email,
          });
        }
      });
      setSenaiUsers(userMap);

      const allScripts: ScriptDoc[] = [];
      scriptsSnap.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as ScriptDoc;
        if (!data.isPlaceholder) allScripts.push(data);
      });

      aggregateData(allScripts, userMap);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const aggregateData = (allScripts: ScriptDoc[], userMap: Map<string, UserInfo>) => {
    const projectMap = new Map<string, ScriptDoc[]>();

    for (const script of allScripts) {
      const project = script.projectName || script.project || "Sem Projeto";
      if (!projectMap.has(project)) projectMap.set(project, []);
      projectMap.get(project)!.push(script);
    }

    const stats: ProjectStats[] = [];
    for (const [projectName, projectScripts] of projectMap) {
      const total = projectScripts.length;
      const recorded = projectScripts.filter((s) => s.status === "gravado").length;
      const rejected = projectScripts.filter((s) => s.status === "rejeitado").length;
      const reviewed = projectScripts.filter(
        (s) => s.status === "revisao_realizada" || s.status === "aguardando_gravacao" || s.status === "gravado"
      ).length;
      const edited = projectScripts.filter((s) => s.status !== "rascunho").length;
      const draft = projectScripts.filter((s) => s.status === "rascunho").length;

      stats.push({
        projectName,
        total,
        recorded,
        edited,
        reviewed,
        rejected,
        draft,
      });
    }

    stats.sort((a, b) => b.total - a.total);
    setProjectStats(stats);

    const userContribMap = new Map<string, { name: string; recorded: Set<string>; edited: Set<string>; reviewed: Set<string> }>();

    for (const script of allScripts) {
      const vId = script.videomakerId;
      const eId = script.editorId;
      const rId = script.reviewerId;

      if (vId && userMap.has(vId)) {
        const info = userMap.get(vId)!;
        if (!userContribMap.has(vId))
          userContribMap.set(vId, { name: info.displayName, recorded: new Set(), edited: new Set(), reviewed: new Set() });
        userContribMap.get(vId)!.recorded.add(script.id);
      }
      if (eId && userMap.has(eId)) {
        const info = userMap.get(eId)!;
        if (!userContribMap.has(eId))
          userContribMap.set(eId, { name: info.displayName, recorded: new Set(), edited: new Set(), reviewed: new Set() });
        userContribMap.get(eId)!.edited.add(script.id);
      }
      if (rId && userMap.has(rId)) {
        const info = userMap.get(rId)!;
        if (!userContribMap.has(rId))
          userContribMap.set(rId, { name: info.displayName, recorded: new Set(), edited: new Set(), reviewed: new Set() });
        userContribMap.get(rId)!.reviewed.add(script.id);
      }
    }

    const uStats: UserStats[] = [];
    for (const [uid, contrib] of userContribMap) {
      uStats.push({
        uid,
        name: contrib.name,
        recorded: contrib.recorded.size,
        edited: contrib.edited.size,
        reviewed: contrib.reviewed.size,
      });
    }
    uStats.sort((a, b) => (b.recorded + b.edited + b.reviewed) - (a.recorded + a.edited + a.reviewed));
    setUserStats(uStats);
  };

  const total = projectStats.reduce((sum, p) => sum + p.total, 0);
  const totalRecorded = projectStats.reduce((sum, p) => sum + p.recorded, 0);
  const totalEdited = projectStats.reduce((sum, p) => sum + p.edited, 0);
  const totalReviewed = projectStats.reduce((sum, p) => sum + p.reviewed, 0);

  const completionRate = total > 0 ? Math.round((totalRecorded / total) * 100) : 0;

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
          <BarChart3 className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Acompanhe o progresso dos roteiros por projeto e usuário
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-10">
        <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Total</p>
                <p className="text-3xl font-black text-blue-700 dark:text-blue-300 mt-1">{total}</p>
              </div>
              <div className="p-2.5 bg-white/80 dark:bg-blue-900/40 rounded-xl shadow-sm">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Gravados</p>
                <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1">{totalRecorded}</p>
              </div>
              <div className="p-2.5 bg-white/80 dark:bg-emerald-900/40 rounded-xl shadow-sm">
                <Video className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/40 dark:to-purple-900/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-purple-600 dark:text-purple-400">Editados</p>
                <p className="text-3xl font-black text-purple-700 dark:text-purple-300 mt-1">{totalEdited}</p>
              </div>
              <div className="p-2.5 bg-white/80 dark:bg-purple-900/40 rounded-xl shadow-sm">
                <Edit3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Revisados</p>
                <p className="text-3xl font-black text-amber-700 dark:text-amber-300 mt-1">{totalReviewed}</p>
              </div>
              <div className="p-2.5 bg-white/80 dark:bg-amber-900/40 rounded-xl shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm rounded-2xl bg-gradient-to-br from-zinc-50 to-zinc-100/50 dark:from-zinc-800/40 dark:to-zinc-700/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Conclusão</p>
                <p className="text-3xl font-black text-zinc-700 dark:text-zinc-300 mt-1">{completionRate}%</p>
              </div>
              <div className="relative">
                <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15.5" fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="3"
                    strokeDasharray={`${completionRate} ${100 - completionRate}`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-zinc-600 dark:text-zinc-400">
                  {completionRate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Cards */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <FolderKanban className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <h2 className="text-lg font-black">Progresso por Projeto</h2>
        </div>

        {projectStats.length === 0 ? (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-12 text-center">
              <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">Nenhum roteiro encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {projectStats.map((proj) => {
              const pct = proj.total > 0 ? Math.round((proj.recorded / proj.total) * 100) : 0;
              return (
                <Card key={proj.projectName} className="border-0 shadow-sm rounded-2xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 p-5">
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: COLORS[projectStats.indexOf(proj) % COLORS.length] }}
                          />
                          <h3 className="font-bold text-base truncate">{proj.projectName}</h3>
                          <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 border-0 text-xs font-bold ml-auto lg:ml-0">
                            {proj.total} roteiros
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${pct}%`,
                                background: `linear-gradient(90deg, ${COLORS[projectStats.indexOf(proj) % COLORS.length]}, ${COLORS[(projectStats.indexOf(proj) + 1) % COLORS.length]})`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-bold text-muted-foreground w-10 text-right">{pct}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0 text-xs font-black">
                          {proj.recorded} gravados
                        </Badge>
                        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-0 text-xs font-black">
                          {proj.edited} editados
                        </Badge>
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border-0 text-xs font-black">
                          {proj.reviewed} revisados
                        </Badge>
                        {proj.draft > 0 && (
                          <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-0 text-xs font-black">
                            {proj.draft} rascunhos
                          </Badge>
                        )}
                        {proj.rejected > 0 && (
                          <Badge className="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-0 text-xs font-black">
                            {proj.rejected} rejeitados
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* User Cards */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
            <Users className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <h2 className="text-lg font-black">Produção por Usuário</h2>
        </div>

        {userStats.length === 0 ? (
          <Card className="border-0 shadow-sm rounded-2xl">
            <CardContent className="p-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">Nenhum usuário com domínio @sp.senai.br encontrado.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {userStats.map((uStat, idx) => {
              const totalUser = uStat.recorded + uStat.edited + uStat.reviewed;
              return (
                <Card key={uStat.uid} className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-sm"
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                      >
                        {uStat.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{uStat.name}</p>
                        <p className="text-[11px] text-muted-foreground">{totalUser} contribuições</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-xs text-muted-foreground">Gravou</span>
                        </div>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{uStat.recorded}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="text-xs text-muted-foreground">Editou</span>
                        </div>
                        <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{uStat.edited}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-xs text-muted-foreground">Revisou</span>
                        </div>
                        <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{uStat.reviewed}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
