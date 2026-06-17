"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/PageTransitionLoader";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";

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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  Video,
  Edit3,
  CheckCircle2,
  FileText,
  Users,
  FolderKanban,
  Clock,
  TrendingUp,
  Zap,
  Award,
  Sparkles,
  Activity,
  ArrowUpRight,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

interface UserInfo {
  uid: string;
  displayName: string;
  email: string;
  role?: string;
  createdAt?: string | { toDate?: () => Date } | null;
}

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  scriptId?: string;
  scriptTitle?: string;
  projectName?: string;
  timestamp?: string | { toDate?: () => Date } | number | null;
}

interface ProjectStats {
  projectName: string;
  total: number;
  recorded: number;
  edited: number;
  reviewed: number;
  rejected: number;
  draft: number;
  totalScenes: number;
  totalChars: number;
  avgLeadTimeHours: number;
  avgWritingTimeHours: number;   // createdAt → primeira ação "Gravou"
  avgRecordingTimeHours: number; // primeira ação "Gravou" → última ação "Gravou"
  totalWritingTimeHours: number; // soma total de criação (todos os roteiros)
  totalRecordingTimeHours: number; // soma total de gravação (todos os roteiros)
}

interface EnhancedUserStats {
  uid: string;
  name: string;
  email: string;
  role: string;
  recorded: number;
  edited: number;
  reviewed: number;

  // Pilar 1: Tempo e Engajamento
  tenureDays: number;
  lastActiveStr: string;
  lastActiveTimestamp: number | null;
  activityStreak: number; // dias ativos nos últimos 30 dias

  // Pilar 2: Contribuição (Volume)
  throughput: number;
  fillingDensity: number;
  updateFrequency: number; // logs/semana

  // Pilar 3: Avanço e Progressão
  complexityScore: number; // 1.0 a 4.0
  scopeReach: number; // projetos únicos
  onboardingDays: number; // dias até 1º gravado/editado

  // Pilar 4: Desempenho e Qualidade
  leadTimeHours: number;
  rejectionRate: number;
  relativeEfficiency: number;
}

const parseDate = (ts: unknown): Date | null => {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === "object" && ts !== null && "toDate" in ts) {
    const obj = ts as Record<string, unknown>;
    if (typeof obj.toDate === "function") {
      return obj.toDate();
    }
  }
  if (typeof ts === "string" || typeof ts === "number") {
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const formatDuration = (minutes: number) => {
  const WORK_DAY = 8 * 60;
  const rounded = Math.round(minutes);
  if (rounded <= 0) return "N/A";
  if (rounded < 60) return `${rounded} min`;
  if (rounded < WORK_DAY) {
    const h = Math.floor(rounded / 60);
    const m = rounded % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const days = rounded / WORK_DAY;
  return `${days.toFixed(1)} dias`;
};

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16",
];

export default function RelatorioPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [projectStats, setProjectStats] = useState<ProjectStats[]>([]);
  const [userStats, setUserStats] = useState<EnhancedUserStats[]>([]);
  const [workspaceActivities, setWorkspaceActivities] = useState<ActivityLog[]>([]);
  const [selectedUser, setSelectedUser] = useState<EnhancedUserStats | null>(null);
  const [allScripts, setAllScripts] = useState<ScriptDoc[]>([]);

  // Referências globais para radar
  const [maxThroughput, setMaxThroughput] = useState(1);
  const [totalProjectsCount, setTotalProjectsCount] = useState(1);

  // Adoção e ROI
  const [totalScenes, setTotalScenes] = useState(0);
  const [totalTimeSaved, setTotalTimeSaved] = useState(0);
  const [userAdoptionRate, setUserAdoptionRate] = useState(0);
  const [monthlyAdoptionData, setMonthlyAdoptionData] = useState<{ name: string; "Novos Roteiros": number; "Total Acumulado": number }[]>([]);

  const isSuperAdmin = user?.role === "SuperAdmin" || user?.isSuperAdmin === true;

  useEffect(() => {
    setMounted(true);
  }, []);

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
            role: data.role || "Docente",
            createdAt: data.createdAt || null,
          });
        }
      });

      const allScripts: ScriptDoc[] = [];
      scriptsSnap.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as ScriptDoc;
        if (!data.isPlaceholder) allScripts.push(data);
      });
      setAllScripts(allScripts);

      // Busca de logs de atividades com fallback
      const allActivities: ActivityLog[] = [];
      try {
        const activitiesQuery = query(
          collection(db, "activities"),
          where("workspaceId", "==", workspaceId),
          orderBy("timestamp", "desc"),
          limit(1000)
        );
        const activitiesSnap = await getDocs(activitiesQuery);
        activitiesSnap.forEach((doc) => {
          const actData = doc.data();
          allActivities.push({
            id: doc.id,
            userId: actData.userId || "",
            userName: actData.userName || "",
            action: actData.action || "",
            scriptId: actData.scriptId,
            scriptTitle: actData.scriptTitle,
            projectName: actData.projectName,
            timestamp: actData.timestamp,
          });
        });
      } catch (err) {
        console.warn("Failed to load activities with orderBy, trying fallback:", err);
        try {
          const fallbackQuery = query(
            collection(db, "activities"),
            where("workspaceId", "==", workspaceId),
            limit(1000)
          );
          const activitiesSnap = await getDocs(fallbackQuery);
          activitiesSnap.forEach((doc) => {
            const actData = doc.data();
            allActivities.push({
              id: doc.id,
              userId: actData.userId || "",
              userName: actData.userName || "",
              action: actData.action || "",
              scriptId: actData.scriptId,
              scriptTitle: actData.scriptTitle,
              projectName: actData.projectName,
              timestamp: actData.timestamp,
            });
          });
          // ordenar localmente
          allActivities.sort((a, b) => {
            const dateA = parseDate(a.timestamp);
            const dateB = parseDate(b.timestamp);
            const timeA = dateA ? dateA.getTime() : 0;
            const timeB = dateB ? dateB.getTime() : 0;
            return timeB - timeA;
          });
        } catch (fallbackErr) {
          console.error("Failed to load activities completely:", fallbackErr);
        }
      }

      setWorkspaceActivities(allActivities);
      const charMap = await fetchScriptsCharMap(allScripts);
      aggregateData(allScripts, userMap, allActivities, charMap);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchScriptsCharMap = async (scripts: ScriptDoc[]): Promise<Map<string, number>> => {
    const charMap = new Map<string, number>();
    const batchSize = 20;
    for (let i = 0; i < scripts.length; i += batchSize) {
      const batch = scripts.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (script) => {
          const vQ = query(
            collection(db, "scripts", script.id, "versions"),
            orderBy("createdAt", "desc"),
            limit(1)
          );
          const vSnap = await getDocs(vQ);
          if (!vSnap.empty) {
            const vData = vSnap.docs[0].data();
            const scenes = vData.scenes || [];
            if (Array.isArray(scenes)) {
              const chars = scenes.reduce((sum: number, sc: unknown) => {
                const s = sc as Record<string, unknown>;
                return sum + (typeof s.spokenText === "string" ? (s.spokenText as string).length : 0);
              }, 0);
              return { id: script.id, chars };
            }
          }
          return { id: script.id, chars: 0 };
        })
      );
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          charMap.set(result.value.id, result.value.chars);
        }
      }
    }
    return charMap;
  };

  const aggregateData = (
    allScripts: ScriptDoc[],
    userMap: Map<string, UserInfo>,
    allActivities: ActivityLog[],
    charMap: Map<string, number>
  ) => {
  // 1. Agregação por Projetos
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

      const totalScenes = projectScripts.reduce((sum, s) => {
        const script = s as unknown as Record<string, unknown>;
        const scenes = script.scenes;
        return sum + (Array.isArray(scenes) ? scenes.length : 10);
      }, 0);

      const totalChars = projectScripts.reduce((sum, s) => {
        const chars = charMap.get(s.id) || 0;
        return sum + chars;
      }, 0);

      // Calcular tempo ativo de criação e gravação por sessões de trabalho
      const SESSION_GAP_MS = 2 * 60 * 60 * 1000; // 2h de inatividade = nova sessão
      let projectWritingMs = 0;
      let projectRecordingMs = 0;
      let scriptsWithWriting = 0;
      let scriptsWithRecording = 0;

      projectScripts.forEach((s) => {
        const scriptActivities = allActivities.filter((a) => a.scriptId === s.id);

        // Atividades ordenadas com timestamp válido
        const sortedActs = scriptActivities
          .filter((a) => a.action)
          .map((a) => ({
            action: a.action.toLowerCase(),
            time: parseDate(a.timestamp)?.getTime() || 0,
          }))
          .filter((a) => a.time > 0)
          .sort((a, b) => a.time - b.time);

        if (sortedActs.length < 2) return;

        // Agrupar em sessões (gap > 2h = nova sessão)
        const sessions: { duration: number; hasRecording: boolean }[] = [];
        let sessStart = sortedActs[0].time;
        let sessEnd = sortedActs[0].time;
        let hasRecording = sortedActs[0].action.includes("grav");

        for (let i = 1; i < sortedActs.length; i++) {
          const gap = sortedActs[i].time - sortedActs[i - 1].time;
          if (gap > SESSION_GAP_MS) {
            sessions.push({ duration: sessEnd - sessStart, hasRecording });
            sessStart = sortedActs[i].time;
            sessEnd = sortedActs[i].time;
            hasRecording = sortedActs[i].action.includes("grav");
          } else {
            sessEnd = sortedActs[i].time;
            if (sortedActs[i].action.includes("grav")) hasRecording = true;
          }
        }
        sessions.push({ duration: sessEnd - sessStart, hasRecording });

        // Separar por tipo
        let scriptWritingMs = 0;
        let scriptRecordingMs = 0;
        for (const s of sessions) {
          if (s.duration <= 0) continue;
          if (s.hasRecording) scriptRecordingMs += s.duration;
          else scriptWritingMs += s.duration;
        }

        if (scriptWritingMs > 0) {
          projectWritingMs += scriptWritingMs;
          scriptsWithWriting++;
        }
        if (scriptRecordingMs > 0) {
          projectRecordingMs += scriptRecordingMs;
          scriptsWithRecording++;
        }
      });

      const avgWritingTimeHours = scriptsWithWriting > 0
        ? (projectWritingMs / scriptsWithWriting / (1000 * 60 * 60))
        : 0;
      const avgRecordingTimeHours = scriptsWithRecording > 0
        ? (projectRecordingMs / scriptsWithRecording / (1000 * 60 * 60))
        : 0;

      // Lead time total (soma dos tempos decorridos por roteiro)
      let projectLeadTimeSum = 0;
      let projectLeadTimeCount = 0;
      projectScripts.forEach((s) => {
        const scriptActivities = allActivities.filter((a) => a.scriptId === s.id);
        const activityTimestamps = scriptActivities
          .map((a) => parseDate(a.timestamp)?.getTime())
          .filter((t): t is number => !!t);
        const createdTime = parseDate(s.createdAt)?.getTime() ||
          (activityTimestamps.length > 0 ? Math.min(...activityTimestamps) : null);
        const completedTime = parseDate(s.updatedAt)?.getTime() ||
          (activityTimestamps.length > 0 ? Math.max(...activityTimestamps) : null);
        if (createdTime && completedTime && completedTime > createdTime) {
          projectLeadTimeSum += completedTime - createdTime;
          projectLeadTimeCount++;
        }
      });
      const avgLeadTimeHours = projectLeadTimeCount > 0 ? (projectLeadTimeSum / projectLeadTimeCount / (1000 * 60 * 60)) : 0;

      const totalWritingTimeHours = projectWritingMs / (1000 * 60 * 60);
      const totalRecordingTimeHours = projectRecordingMs / (1000 * 60 * 60);

      stats.push({
        projectName,
        total,
        recorded,
        edited,
        reviewed,
        rejected,
        draft,
        totalScenes,
        totalChars,
        avgLeadTimeHours,
        avgWritingTimeHours,
        avgRecordingTimeHours,
        totalWritingTimeHours,
        totalRecordingTimeHours,
      });
    }

    stats.sort((a, b) => b.total - a.total);
    setProjectStats(stats);
    setTotalProjectsCount(Math.max(1, stats.length));

    // 2. Lead Time Global (Benchmark)
    let globalLeadTimeSum = 0;
    let globalLeadTimeCount = 0;
    allScripts.forEach((s) => {
      const scriptActivities = allActivities.filter((a) => a.scriptId === s.id);
      const activityTimestamps = scriptActivities
        .map((a) => parseDate(a.timestamp)?.getTime())
        .filter((t): t is number => !!t);

      const createdTime = parseDate(s.createdAt)?.getTime() ||
        (activityTimestamps.length > 0 ? Math.min(...activityTimestamps) : null);

      const completedTime = parseDate(s.updatedAt)?.getTime() ||
        (activityTimestamps.length > 0 ? Math.max(...activityTimestamps) : null);

      if (createdTime && completedTime && completedTime > createdTime) {
        globalLeadTimeSum += completedTime - createdTime;
        globalLeadTimeCount++;
      }
    });
    const globalAvgLT = globalLeadTimeCount > 0 ? globalLeadTimeSum / globalLeadTimeCount / (1000 * 60 * 60) : 0;

    // 3. Agregação por Usuário com Novos KPIs
    const uStats: EnhancedUserStats[] = [];
    let currentMaxThroughput = 1;

    for (const [uid, info] of userMap) {
      const userActivities = allActivities.filter((a) => a.userId === uid);

      const userRecordedScripts = allScripts.filter((s) => s.videomakerId === uid && s.status === "gravado");
      const userEditedScripts = allScripts.filter((s) => s.editorId === uid);
      const userReviewedScripts = allScripts.filter((s) => s.reviewerId === uid);

      const contributedScriptIds = new Set([
        ...userRecordedScripts.map((s) => s.id),
        ...userEditedScripts.map((s) => s.id),
        ...userReviewedScripts.map((s) => s.id),
      ]);
      const contributedScripts = allScripts.filter((s) => contributedScriptIds.has(s.id));

      // --- Pilar 1: Tempo e Engajamento ---
      const timestamps = userActivities
        .map((a) => {
          const dateObj = parseDate(a.timestamp);
          return dateObj ? dateObj.getTime() : null;
        })
        .filter(Boolean) as number[];

      const oldestActivity = timestamps.length > 0 ? Math.min(...timestamps) : null;
      let userCreatedTime = oldestActivity || Date.now();
      const userDocCreated = parseDate(info.createdAt);
      if (userDocCreated) {
        userCreatedTime = userDocCreated.getTime();
      }
      const tenureDays = Math.max(1, Math.round((Date.now() - userCreatedTime) / (1000 * 60 * 60 * 24)));

      const lastActiveTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : null;
      let lastActiveStr = "Sem registros";
      if (lastActiveTimestamp) {
        const diffMs = Date.now() - lastActiveTimestamp;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 60) {
          lastActiveStr = `Há ${Math.max(1, diffMins)}m`;
        } else if (diffHours < 24) {
          lastActiveStr = `Há ${diffHours}h`;
        } else {
          lastActiveStr = `Há ${diffDays}d`;
        }
      }

      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const recentActivities = userActivities.filter((a) => {
        const dateObj = parseDate(a.timestamp);
        const t = dateObj ? dateObj.getTime() : 0;
        return t >= thirtyDaysAgo;
      });
      const uniqueActiveDays = new Set(
        recentActivities.map((a) => {
          const dateObj = parseDate(a.timestamp) || new Date();
          return dateObj.toDateString();
        })
      );
      const activityStreak = uniqueActiveDays.size;

      // --- Pilar 2: Contribuição ---
      const throughput = userRecordedScripts.length + userEditedScripts.length + userReviewedScripts.length;
      if (throughput > currentMaxThroughput) currentMaxThroughput = throughput;

      let fillingDensity = 100;
      if (userEditedScripts.length > 0) {
        let scoreSum = 0;
        userEditedScripts.forEach((s) => {
          let score = 0;
          if (s.title && s.title !== "Novo Roteiro") score += 20;
          if (s.path && s.path.length > 1) score += 20;
          if (s.category) score += 20;
          if (s.reviewerId && s.videomakerId) score += 20;
          else if (s.reviewerId || s.videomakerId) score += 10;
          if (s.commentCount && s.commentCount > 0) score += 20;
          scoreSum += score;
        });
        fillingDensity = Math.round(scoreSum / userEditedScripts.length);
      }

      const updateFrequency = Math.round((recentActivities.length / 4.3) * 10) / 10;

      // --- Pilar 3: Avanço e Progressão ---
      let complexityScore = 1.0;
      if (contributedScripts.length > 0) {
        let complexitySum = 0;
        contributedScripts.forEach((s) => {
          let scriptComplexity = 1.0;
          if (s.category === "video") scriptComplexity += 1.0;
          if (s.path && s.path.length >= 3) scriptComplexity += 1.0;
          else if (s.path && s.path.length === 2) scriptComplexity += 0.5;
          if (s.commentCount && s.commentCount > 3) scriptComplexity += 1.0;
          complexitySum += scriptComplexity;
        });
        complexityScore = Math.round((complexitySum / contributedScripts.length) * 10) / 10;
      }

      const scopeReach = new Set(contributedScripts.map((s) => s.projectName || s.project || "Geral")).size;

      let onboardingDays = 0;
      if (userRecordedScripts.length > 0) {
        const recordedTimes = userRecordedScripts.map((s) => {
          const dateObj = parseDate(s.updatedAt) || new Date();
          return dateObj.getTime();
        });
        const firstRecordedTime = Math.min(...recordedTimes);
        onboardingDays = Math.max(1, Math.round((firstRecordedTime - userCreatedTime) / (1000 * 60 * 60 * 24)));
      } else if (contributedScripts.length > 0) {
        const contributedTimes = contributedScripts.map((s) => {
          const dateObj = parseDate(s.createdAt) || new Date();
          return dateObj.getTime();
        });
        const firstContributedTime = Math.min(...contributedTimes);
        onboardingDays = Math.max(1, Math.round((firstContributedTime - userCreatedTime) / (1000 * 60 * 60 * 24)));
      }

      // --- Pilar 4: Desempenho e Qualidade ---
      let leadTimeHours = 0;
      let completedCount = 0;
      let leadTimeSum = 0;

      userEditedScripts.forEach((s) => {
        const scriptActivities = allActivities.filter((a) => a.scriptId === s.id);
        const activityTimestamps = scriptActivities
          .map((a) => parseDate(a.timestamp)?.getTime())
          .filter((t): t is number => !!t);

        const createdTime = parseDate(s.createdAt)?.getTime() ||
          (activityTimestamps.length > 0 ? Math.min(...activityTimestamps) : null);

        const completedTime = parseDate(s.updatedAt)?.getTime() ||
          (activityTimestamps.length > 0 ? Math.max(...activityTimestamps) : null);

        if (createdTime && completedTime && completedTime > createdTime) {
          leadTimeSum += completedTime - createdTime;
          completedCount++;
        }
      });
      if (completedCount > 0) {
        leadTimeHours = leadTimeSum / completedCount / (1000 * 60 * 60);
      }

      const rejectionRate =
        userEditedScripts.length > 0
          ? Math.round((userEditedScripts.filter((s) => s.status === "rejeitado").length / userEditedScripts.length) * 100)
          : 0;

      let relativeEfficiency = 0;
      if (leadTimeHours > 0 && globalAvgLT > 0) {
        relativeEfficiency = Math.round(((globalAvgLT - leadTimeHours) / globalAvgLT) * 100);
      }

      uStats.push({
        uid,
        name: info.displayName,
        email: info.email,
        role: info.role || "Docente",
        recorded: userRecordedScripts.length,
        edited: userEditedScripts.length,
        reviewed: userReviewedScripts.length,
        tenureDays,
        lastActiveStr,
        lastActiveTimestamp,
        activityStreak,
        throughput,
        fillingDensity,
        updateFrequency,
        complexityScore,
        scopeReach,
        onboardingDays,
        leadTimeHours,
        rejectionRate,
        relativeEfficiency,
      });
    }

    uStats.sort((a, b) => b.throughput - a.throughput);
    setUserStats(uStats);
    setMaxThroughput(currentMaxThroughput);

    // --- Cálculos de Adoção & ROI (Modelo de Estimativa) ---
    const totalCharsAll = allScripts.reduce((sum, s) => sum + (charMap.get(s.id) || 0), 0);
    const computedTotalScenes = allScripts.length * 12;
    setTotalScenes(computedTotalScenes);

    // Baseado em caracteres: Word 10 min / 1000 chars + PPT 5 min / 1000 chars
    const estTotalChars = totalCharsAll > 0 ? totalCharsAll : allScripts.length * 1000;
    const computedTimeSaved = (estTotalChars / 1000) * 15;
    setTotalTimeSaved(computedTimeSaved);

    const activeUserIds = new Set<string>();
    allScripts.forEach((s) => {
      if (s.editorId) activeUserIds.add(s.editorId);
      if (s.reviewerId) activeUserIds.add(s.reviewerId);
      if (s.videomakerId) activeUserIds.add(s.videomakerId);
    });

    const totalUsersCount = userMap.size;
    const activeUsersCount = Array.from(userMap.keys()).filter((uid) => activeUserIds.has(uid)).length;
    const computedAdoptionRate = totalUsersCount > 0 ? Math.round((activeUsersCount / totalUsersCount) * 100) : 0;
    setUserAdoptionRate(computedAdoptionRate);

    const scriptsByMonth = new Map<string, number>();
    allScripts.forEach((s) => {
      const date = parseDate(s.createdAt);
      if (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const key = `${year}-${month}`;
        scriptsByMonth.set(key, (scriptsByMonth.get(key) || 0) + 1);
      }
    });

    const sortedMonthKeys = Array.from(scriptsByMonth.keys()).sort();
    let cumulativeSum = 0;
    const computedMonthlyData = sortedMonthKeys.map((key) => {
      const [year, month] = key.split("-");
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      const label = date.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");
      const count = scriptsByMonth.get(key) || 0;
      cumulativeSum += count;
      return {
        name: label.charAt(0).toUpperCase() + label.slice(1),
        "Novos Roteiros": count,
        "Total Acumulado": cumulativeSum,
      };
    });
    setMonthlyAdoptionData(computedMonthlyData);
  };

  const total = projectStats.reduce((sum, p) => sum + p.total, 0);
  const totalRecorded = projectStats.reduce((sum, p) => sum + p.recorded, 0);
  const totalEdited = projectStats.reduce((sum, p) => sum + p.edited, 0);
  const totalReviewed = projectStats.reduce((sum, p) => sum + p.reviewed, 0);

  const completionRate = total > 0 ? Math.round((totalRecorded / total) * 100) : 0;

  // Gráficos comparativos de uso geral
  const userThroughputChartData = useMemo(() => {
    return userStats.slice(0, 8).map((u) => ({
      name: u.name.split(" ")[0],
      Gravados: u.recorded,
      Editados: u.edited,
      Revisados: u.reviewed,
    }));
  }, [userStats]);

  const activityChartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 })
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toDateString();
      })
      .reverse();

    const counts = last30Days.reduce((acc, dateStr) => {
      acc[dateStr] = 0;
      return acc;
    }, {} as Record<string, number>);

    workspaceActivities.forEach((a) => {
      const date = parseDate(a.timestamp);
      if (date) {
        const dateStr = date.toDateString();
        if (dateStr in counts) {
          counts[dateStr]++;
        }
      }
    });

    return Object.entries(counts).map(([dateStr, count]) => ({
      name: new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      Interações: count,
    }));
  }, [workspaceActivities]);

  if (loading || !mounted) return <LoadingScreen />;

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20 text-white">
            <BarChart3 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">Desempenho & Relatórios</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Acompanhe o engajamento, consistência e métricas de qualidade por usuário e projeto
            </p>
          </div>
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

      {/* Main Tabs UI */}
      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className="bg-zinc-100/80 dark:bg-zinc-900/80 backdrop-blur-md p-1 rounded-xl w-full sm:w-auto border border-zinc-200/50 dark:border-zinc-800/50">
          <TabsTrigger value="projects" className="flex items-center gap-2 rounded-lg py-2 px-4 font-bold text-xs">
            <FolderKanban className="w-4 h-4" />
            Progresso dos Projetos
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2 rounded-lg py-2 px-4 font-bold text-xs">
            <Users className="w-4 h-4" />
            Desempenho da Equipe
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2 rounded-lg py-2 px-4 font-bold text-xs">
            <TrendingUp className="w-4 h-4" />
            Gráficos Comparativos
          </TabsTrigger>
      <TabsTrigger value="adoption" className="flex items-center gap-2 rounded-lg py-2 px-4 font-bold text-xs">
        <Zap className="w-4 h-4 text-amber-500" />
        Adoção & Impacto (ROI)
      </TabsTrigger>
    </TabsList>

        {/* PROJECTS TAB */}
        <TabsContent value="projects" className="space-y-4">
          <div className="flex items-center gap-3 mb-4 mt-2">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <FolderKanban className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <h2 className="text-lg font-black">Roteiros e Progresso por Projeto</h2>
          </div>

          {projectStats.length === 0 ? (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-12 text-center">
                <FolderKanban className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground font-medium">Nenhum roteiro ou projeto cadastrado.</p>
              </CardContent>
            </Card>
          ) : (
              <div className="grid grid-cols-1 gap-3">
                {projectStats.map((proj) => {
                  const pct = proj.total > 0 ? Math.round((proj.recorded / proj.total) * 100) : 0;
                  return (
                  <motion.div
                    key={proj.projectName}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border-0 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
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
                              <Badge className="bg-zinc-150 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400 border-0 text-xs font-black">
                                {proj.rejected} rejeitados
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Ciclo Médio: Criação + Gravação */}
                        {(proj.avgWritingTimeHours > 0 || proj.avgRecordingTimeHours > 0 || proj.avgLeadTimeHours > 0) && (
                          <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-3 flex items-center gap-6 flex-wrap bg-zinc-50/50 dark:bg-zinc-900/30">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              Ciclo Médio no Teleprompt
                            </span>
                            <div className="flex items-center gap-4 flex-wrap">
                              {proj.avgWritingTimeHours > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">✏️ Criação:</span>
                                  <span className="text-[11px] font-black text-amber-700 dark:text-amber-300">
                                    {formatDuration(proj.avgWritingTimeHours * 60)}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground">(até 1ª gravação)</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">✏️ Criação:</span>
                                  <span className="text-[10px] text-muted-foreground italic">Sem dados</span>
                                </div>
                              )}
                              <span className="text-muted-foreground/30 text-xs">|</span>
                              {proj.avgRecordingTimeHours > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">🎬 Gravação:</span>
                                  <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                                    {formatDuration(proj.avgRecordingTimeHours * 60)}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground">(entre takes)</span>
                                </div>
                              ) : proj.recorded > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">🎬 Gravação:</span>
                                  <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300">1 sessão</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">🎬 Gravação:</span>
                                  <span className="text-[10px] text-muted-foreground italic">Não gravado</span>
                                </div>
                              )}
                              {proj.avgLeadTimeHours > 0 && (
                                <>
                                  <span className="text-muted-foreground/30 text-xs">|</span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">🔄 Total:</span>
                                    <span className="text-[11px] font-black text-blue-700 dark:text-blue-300">
                                      {formatDuration(proj.avgLeadTimeHours * 60)}
                                    </span>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TEAM TAB */}
        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center gap-3 mb-4 mt-2">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <Users className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <h2 className="text-lg font-black">Métricas de Performance da Equipe</h2>
          </div>

          {userStats.length === 0 ? (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground font-medium">Nenhum membro da equipe encontrado.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {userStats.map((uStat, idx) => (
                  <motion.div
                    key={uStat.uid}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    onClick={() => setSelectedUser(uStat)}
                    className="cursor-pointer"
                  >
                    <Card className="border-0 shadow-sm rounded-2xl hover:shadow-md transition-all border-l-4 border-l-blue-500 bg-white dark:bg-zinc-900 group">
                      <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="w-10 h-10 rounded-xl text-white text-sm font-black shadow-sm shrink-0">
                            <AvatarFallback style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                              {uStat.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate group-hover:text-blue-500 transition-colors">{uStat.name}</p>
                            <p className="text-[10px] text-muted-foreground">{uStat.role}</p>
                          </div>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>

                      <div className="space-y-2.5 pt-1.5 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Entregas Totais</span>
                          <span className="font-extrabold text-zinc-850 dark:text-zinc-100">{uStat.throughput}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Assiduidade (Streak)</span>
                          <Badge variant="secondary" className="text-[10px] font-bold px-1.5 py-0">
                            {uStat.activityStreak}/30 dias
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Lead Time Médio</span>
                          <span className="font-bold text-zinc-700 dark:text-zinc-350">
                            {uStat.leadTimeHours > 0 ? `${(uStat.leadTimeHours / 24).toFixed(1)} dias` : "Sem entregas"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground">Taxa de Refação</span>
                          <span className={`font-bold ${uStat.rejectionRate > 15 ? 'text-red-500' : 'text-zinc-500'}`}>
                            {uStat.rejectionRate}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* COMPARATIVE CHARTS TAB */}
        <TabsContent value="charts" className="space-y-6">
          <div className="flex items-center gap-3 mb-4 mt-2">
            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
              <TrendingUp className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </div>
            <h2 className="text-lg font-black">Visão Comparativa & Tendência</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-2xl bg-white dark:bg-zinc-900/60 overflow-hidden">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  Atividade Global (logs de alteração nos últimos 30 dias)
                </CardTitle>
                <CardDescription className="text-xs">
                  Quantidade total diária de logs, edições e comentários da equipe
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityChartData}>
                      <defs>
                        <linearGradient id="colorLogs" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                      <Area type="monotone" dataKey="Interações" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLogs)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-2xl bg-white dark:bg-zinc-900/60 overflow-hidden">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-500" />
                  Volume de Produção Pessoal (Top 8 Integrantes)
                </CardTitle>
                <CardDescription className="text-xs">
                  Quantidade de roteiros criados/editados/revisados por usuário
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                <div className="h-[280px] w-full">
                  {userThroughputChartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      Sem dados suficientes para gerar comparação
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={userThroughputChartData}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                        <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                        <Bar dataKey="Gravados" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Editados" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="Revisados" stackId="a" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ADOPTION & ROI TAB */}
        <TabsContent value="adoption" className="space-y-6">
          <div className="flex items-center gap-3 mb-4 mt-2">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl">
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-black">Adoção da Plataforma & Retorno de Produtividade (ROI)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Comparativo de eficiência operacional entre o fluxo tradicional (Word + PPT manual) e o Teleprompt
              </p>
            </div>
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-2xl bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Tempo Salvo (ROI)</p>
                    <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-2">
                      {formatDuration(totalTimeSaved)}
                    </p>
                  </div>
                  <div className="p-2 bg-white/80 dark:bg-amber-900/40 rounded-xl shadow-sm">
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 leading-normal">
                  Estimado com média de <strong>3 min/página</strong> e <strong>1,5 min/cena</strong> no Word, mais <strong>1 min/slide</strong> de cópia e espelhamento no PPT.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-2xl bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Taxa de Aceitação</p>
                    <p className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-2">{userAdoptionRate}%</p>
                  </div>
                  <div className="p-2 bg-white/80 dark:bg-blue-900/40 rounded-xl shadow-sm">
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 leading-normal">
                  Integrantes ativos que já criaram, editaram ou revisaram roteiros na plataforma.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-2xl bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Roteiros Criados</p>
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-2">{total}</p>
                  </div>
                  <div className="p-2 bg-white/80 dark:bg-emerald-900/40 rounded-xl shadow-sm">
                    <FileText className="w-4 h-4 text-emerald-500" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 leading-normal">
                  Roteiros digitais criados e gerenciados centralizadamente no workspace.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-2xl bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Total de Slides/Cenas</p>
                    <p className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-2">{totalScenes}</p>
                  </div>
                  <div className="p-2 bg-white/85 dark:bg-purple-900/40 rounded-xl shadow-sm">
                    <Video className="w-4 h-4 text-purple-500" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 leading-normal">
                  Cenas estruturadas e prontas para exibição imediata no teleprompter.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
            {/* Gráfico de Adoção Mensal */}
            <div className="lg:col-span-7">
              <Card className="border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-2xl bg-white dark:bg-zinc-900/60 overflow-hidden h-full">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    Crescimento Mensal de Adoção (Roteiros Criados)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Histórico de novos roteiros criados por mês e evolução do total acumulado
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-4">
                  <div className="h-[280px] w-full">
                    {monthlyAdoptionData.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        Dados de histórico insuficientes para gerar a curva de adoção
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyAdoptionData}>
                          <defs>
                            <linearGradient id="colorNovos" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
                          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                          <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: 8, fontSize: 11 }} />
                          <Legend wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                          <Area type="monotone" name="Novos Roteiros (Mensal)" dataKey="Novos Roteiros" stroke="#3b82f6" fillOpacity={1} fill="url(#colorNovos)" strokeWidth={2} />
                          <Area type="monotone" name="Volume Acumulado" dataKey="Total Acumulado" stroke="#f59e0b" fillOpacity={1} fill="url(#colorAcumulado)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparativo de Processo Rápido */}
            <div className="lg:col-span-5">
              <Card className="border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-2xl bg-white dark:bg-zinc-900/60 overflow-hidden h-full">
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Comparação de Etapas de Trabalho
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Redução de complexidade e tempo no fluxo de publicação
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 pt-2 space-y-4">
                  <div className="space-y-3">
                    <div className="bg-red-50/50 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/20 p-3.5 rounded-xl">
                      <p className="text-[11px] font-black uppercase text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                        🔴 Fluxo Tradicional (Word → PPT Manual)
                      </p>
                      <ul className="text-[10px] text-muted-foreground space-y-1 mt-2 list-disc list-inside">
                        <li>Escrever roteiro em tabela do Word</li>
                        <li>Copiar e colar célula a célula no PPT</li>
                        <li>Espelhar e girar caixas de texto manualmente</li>
                        <li>Sem controle de status ou comentários integrados</li>
                      </ul>
                      <p className="text-[10px] font-bold text-red-700 dark:text-red-400 mt-2 text-right">
                        Tempo médio: ~1 min por slide (manual)
                      </p>
                    </div>

                    <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 p-3.5 rounded-xl">
                      <p className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1">
                        🟢 Novo Fluxo (Teleprompt App)
                      </p>
                      <ul className="text-[10px] text-muted-foreground space-y-1 mt-2 list-disc list-inside">
                        <li>Escrever diretamente no editor estruturado</li>
                        <li>Comentários em tempo real e status de aprovação</li>
                        <li>Play instantâneo no teleprompter com 1 clique</li>
                        <li>Espelhamento horizontal nativo por software</li>
                      </ul>
                      <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mt-2 text-right">
                        Tempo de conversão: <strong>Automático / Zero</strong>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Explicação Detalhada do Funcionamento */}
          <Card className="border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-2xl bg-white dark:bg-zinc-900/60 overflow-hidden mt-6">
            <CardHeader className="p-5 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Funcionamento dos Fluxos: Do Roteiro Físico ao Teleprompt Digital
              </CardTitle>
              <CardDescription className="text-xs">
                Entenda a engenharia de processos, ferramentas e automações que transformaram a publicação de roteiros
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-3 space-y-4 text-xs leading-relaxed text-zinc-650 dark:text-zinc-400">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <span>📄</span> Como funcionava o fluxo anterior (Word & PowerPoint)
                  </h4>
                  <p>
                    No formato tradicional, o roteiro era redigido de forma <strong>estática</strong> em um arquivo de Word utilizando tabelas de metadados para controle de equipe e linhas para indicação de falas.
                  </p>
                  <p>
                    Para realizar a gravação, ocorria um processo manual de alta fricção: o roteirista ou videomaker precisava copiar o texto de cada cena e colá-lo em slides do PowerPoint. Em seguida, para que a leitura fosse possível no espelho físico do teleprompter, cada slide precisava ter sua caixa de texto <strong>espelhada horizontalmente</strong> de forma manual no PowerPoint (utilizando formatação de efeito 3D ou rotação vertical).
                  </p>
                  <p className="text-[11px] text-red-500 font-medium bg-red-500/5 p-2 rounded-lg">
                    ⚠️ <strong>Pontos críticos:</strong> Lentidão (1 minuto por slide para copiar e espelhar), falta de controle de versão (arquivos dispersos em e-mails ou chats), erros manuais de inversão e ausência de feedback centralizado de revisão.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-blue-500 flex items-center gap-1.5">
                    <span>⚡</span> Como funciona o novo fluxo (Teleprompt Digital)
                  </h4>
                  <p>
                    Com o Teleprompt, o roteiro é escrito e gerenciado em um <strong>banco de dados em tempo real (Firestore)</strong> através de um editor web estruturado. O texto é dividido automaticamente em cenas a partir de tags simples (ex: <code>Cena [1]</code>).
                  </p>
                  <p>
                    O sistema automatiza integralmente a gravação e a formatação com as seguintes ferramentas e implementações:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-[11px]">
                    <li><strong className="text-zinc-800 dark:text-zinc-200">Espelhamento por Software:</strong> O player inverte o texto instantaneamente com apenas 1 clique via CSS (<code>transform: scaleX(-1)</code>), mantendo o texto do banco de dados intacto.</li>
                    <li><strong className="text-zinc-800 dark:text-zinc-200">Revisão e Colaboração:</strong> Painel de comentários por cena e controle de status unificado para Docente, Analista e Mídia.</li>
                    <li><strong className="text-zinc-800 dark:text-zinc-200">Exportação Automatizada:</strong> Geração instantânea de arquivos Word e PPT formatados direto do navegador, sem necessidade de cópias manuais.</li>
                  </ul>
                  <p className="text-[11px] text-emerald-500 font-medium bg-emerald-500/5 p-2 rounded-lg">
                    ✅ <strong>Automações:</strong> Salvamento contínuo em nuvem, controle de velocidade e tamanho de fonte em tempo real durante a gravação, e histórico de logs de atividades da equipe para auditoria.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ROI e Economia de Tempo por Projeto */}
          <div className="mt-6">
            <Card className="border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-2xl bg-white dark:bg-zinc-900/60 overflow-hidden">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-blue-500" />
                  Retorno de Tempo (ROI) Estimado por Projeto
                </CardTitle>
                <CardDescription className="text-xs">
                  Comparativo de tempo gasto na formatação e espelhamento de slides de acordo com o volume de cenas de cada projeto
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-3">
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 text-[10px] font-black uppercase text-muted-foreground">
                        <th className="p-3">Projeto</th>
                        <th className="p-3 text-center">Roteiros</th>
                        <th className="p-3 text-center">Cenas</th>
                        <th className="p-3 text-center text-red-500 dark:text-red-400">Tempo Manual (Word + PPT) <span className="block text-[8px] font-normal opacity-70">total projeto</span></th>
                        <th className="p-3 text-center text-amber-500 dark:text-amber-400">✏️ Criação no Teleprompt <span className="block text-[8px] font-normal opacity-70">média por roteiro</span></th>
                        <th className="p-3 text-center text-emerald-500 dark:text-emerald-400">🎬 Gravação no Teleprompt <span className="block text-[8px] font-normal opacity-70">média por roteiro</span></th>
                        <th className="p-3 text-right text-blue-500 dark:text-blue-400">Poupado de Formatação</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] text-zinc-650 dark:text-zinc-400">
                      {projectStats.map((proj) => {
                        const scriptCount = proj.total;
                        const estChars = proj.totalChars > 0
                          ? proj.totalChars
                          : scriptCount * 1000;

                        // Tempo no Word: 10 min por 1000 caracteres (formatação de texto, tabelas)
                        const wordTime = (estChars / 1000) * 10;
                        // Tempo no PPT: 5 min por 1000 caracteres (cópia + espelhamento)
                        const pptTime = (estChars / 1000) * 5;
                        // Tempo Total do fluxo antigo
                        const oldTime = wordTime + pptTime;

                        const hasWriting = proj.avgWritingTimeHours > 0;
                        const hasRecording = proj.avgRecordingTimeHours > 0;

                        return (
                          <tr key={proj.projectName} className="border-b border-zinc-200 dark:border-zinc-800 last:border-0 hover:bg-zinc-50/50 dark:hover:bg-zinc-850/25">
                            <td className="p-3 font-bold text-zinc-800 dark:text-zinc-200">{proj.projectName}</td>
                            <td className="p-3 text-center">{scriptCount}</td>
                            <td className="p-3 text-center font-semibold">{proj.totalScenes}</td>
                            <td className="p-3 text-center text-red-600 dark:text-red-400/80 font-medium">
                              {formatDuration(oldTime)}
                              <span className="block text-[9px] text-muted-foreground mt-0.5">
                                Word: {formatDuration(wordTime)} + PPT: {formatDuration(pptTime)}
                              </span>
                            </td>

                            {/* ✏️ Tempo de Criação (escrita + revisão → antes da gravação) */}
                            <td className="p-3 text-center">
                              {hasWriting ? (
                                <span className="font-bold text-amber-600 dark:text-amber-400">
                                  {formatDuration(proj.avgWritingTimeHours * 60)}
                                  <span className="block text-[9px] text-muted-foreground font-normal mt-0.5">
                                    criação → 1ª gravação
                                  </span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-[10px] italic">Sem dados</span>
                              )}
                            </td>

                            {/* 🎬 Tempo de Gravação (1ª take → última take) */}
                            <td className="p-3 text-center">
                              {hasRecording ? (
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {formatDuration(proj.avgRecordingTimeHours * 60)}
                                  <span className="block text-[9px] text-muted-foreground font-normal mt-0.5">
                                    1ª take → última take
                                  </span>
                                </span>
                              ) : proj.recorded > 0 ? (
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px]">
                                  1 sessão
                                  <span className="block text-[9px] text-muted-foreground font-normal mt-0.5">
                                    gravado em 1 take
                                  </span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-[10px] italic">Não gravado</span>
                              )}
                            </td>

                            <td className="p-3 text-right text-blue-600 dark:text-blue-400 font-black">
                              <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full font-bold">
                                {formatDuration(oldTime)} salvos
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {projectStats.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-muted-foreground italic">
                            Nenhum projeto encontrado para comparação de ROI.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparativo Estrutural Lado a Lado (Word vs Teleprompt) */}
          <div className="mt-6">
            <Card className="border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm rounded-2xl bg-white dark:bg-zinc-900/60 overflow-hidden">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Mapeamento de Formatos & Estrutura
                </CardTitle>
                <CardDescription className="text-xs">
                  Como a tabela legada em Word foi digitalizada em metadados estruturados e banco de dados
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Mock Formato Antigo */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Formato Word Legado (Documento Estático)
                    </span>
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden text-xs bg-zinc-50 dark:bg-zinc-900/20">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 text-[10px] font-black uppercase text-muted-foreground">
                            <th className="p-2 border-r border-zinc-200 dark:border-zinc-700">Função</th>
                            <th className="p-2">Nome / Conteúdo</th>
                          </tr>
                        </thead>
                        <tbody className="text-[11px] text-zinc-650 dark:text-zinc-400">
                          <tr className="border-b border-zinc-200 dark:border-zinc-700">
                            <td className="p-2 font-bold bg-zinc-100/50 dark:bg-zinc-800/30 border-r border-zinc-200 dark:border-zinc-700">Projeto</td>
                            <td className="p-2">Nome do Projeto Exemplo</td>
                          </tr>
                          <tr className="border-b border-zinc-200 dark:border-zinc-700">
                            <td className="p-2 font-bold bg-zinc-100/50 dark:bg-zinc-800/30 border-r border-zinc-200 dark:border-zinc-700">Conteudista</td>
                            <td className="p-2">Docente Exemplo A</td>
                          </tr>
                          <tr className="border-b border-zinc-200 dark:border-zinc-700">
                            <td className="p-2 font-bold bg-zinc-100/50 dark:bg-zinc-800/30 border-r border-zinc-200 dark:border-zinc-700">Analista</td>
                            <td className="p-2">Analista Exemplo B</td>
                          </tr>
                          <tr className="border-b border-zinc-200 dark:border-zinc-700">
                            <td className="p-2 font-bold bg-zinc-100/50 dark:bg-zinc-800/30 border-r border-zinc-200 dark:border-zinc-700">Especialista/Pauta</td>
                            <td className="p-2">Especialista Exemplo C</td>
                          </tr>
                          <tr>
                            <td className="p-2 font-bold bg-zinc-100/50 dark:bg-zinc-800/30 border-r border-zinc-200 dark:border-zinc-700">Mídia/Gravação</td>
                            <td className="p-2">Videomaker Exemplo D</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic leading-normal">
                      ⚠️ <strong>Fricção:</strong> Para gravar, todos os textos de falas da tabela precisavam ser transferidos para slides do PPT e espelhados horizontalmente para o prompter de forma manual, gerando retrabalho e riscos de inversão.
                    </p>
                  </div>

                  {/* Mapeamento Teleprompt */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500 block">
                      Formato Digital Teleprompt (Banco de Dados Vivo)
                    </span>
                    <div className="border border-blue-100 dark:border-blue-900/30 rounded-xl p-4 bg-blue-50/10 dark:bg-blue-950/5 space-y-3 text-[11px]">
                      <div className="flex justify-between items-center pb-2 border-b border-blue-100/50 dark:border-blue-900/20">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">Estrutura de Dados (Firestore)</span>
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 border-0 text-[9px] font-black uppercase">
                          SCRIPT_DOC
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <p className="text-muted-foreground">Nome do Projeto</p>
                          <p className="font-bold text-zinc-800 dark:text-zinc-200">projectName / project</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Editor / Especialista</p>
                          <p className="font-bold text-zinc-800 dark:text-zinc-200">editorName / editorId</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Validador / Revisor</p>
                          <p className="font-bold text-zinc-800 dark:text-zinc-200">reviewerName / reviewerId</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mídia / Videomaker</p>
                          <p className="font-bold text-zinc-800 dark:text-zinc-200">videomakerName / videomakerId</p>
                        </div>
                      </div>

                      <div className="p-2.5 bg-blue-500/5 dark:bg-blue-400/5 border border-blue-500/10 rounded-lg space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-bold text-blue-600 dark:text-blue-400">
                          <span>Player de Teleprompter Integrado</span>
                          <span>Auto-Flip 🔄</span>
                        </div>
                        <p className="text-[9.5px] text-muted-foreground leading-normal">
                          O texto é processado dinamicamente em cenas e renderizado no navegador. O espelhamento horizontal é feito instantaneamente via CSS (`transform: scaleX(-1)`), sem tocar no texto original.
                        </p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic leading-normal">
                      ✅ <strong>Eficiência:</strong> Roteiro direto no editor digital, pronto para play. Permite exportar para Word e PPT (com slides formatados de forma automatizada pelo app) caso ainda haja necessidade de backup.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SCRIPTS TAB */}
        <TabsContent value="scripts" className="space-y-6">
          <div className="flex items-center gap-3 mb-4 mt-2">
            <div className="p-2 bg-purple-50 dark:bg-purple-950/40 rounded-xl">
              <FileText className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg font-black">Detalhes dos Roteiros - Métricas de Tempo por Script</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Análise detalhada de cada roteiro individual: tempos de criação, edição, revisão e gravação extraídos dos logs de atividades
              </p>
            </div>
          </div>

          {allScripts.length === 0 ? (
            <Card className="border-0 shadow-sm rounded-2xl">
              <CardContent className="p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground font-medium">Nenhum roteiro encontrado.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {allScripts.map((script, idx) => {
                const scriptActivities = workspaceActivities.filter((a) => a.scriptId === script.id);
                const activityTimestamps = scriptActivities
                  .map((a) => parseDate(a.timestamp)?.getTime())
                  .filter((t): t is number => !!t);

                const createdTime = parseDate(script.createdAt)?.getTime() || 
                  (activityTimestamps.length > 0 ? Math.min(...activityTimestamps) : null);

                const updatedTime = parseDate(script.updatedAt)?.getTime() || 
                  (activityTimestamps.length > 0 ? Math.max(...activityTimestamps) : null);

                const recordingActs = scriptActivities
                  .filter((a) => a.action && a.action.toLowerCase().includes("grav"))
                  .map((a) => parseDate(a.timestamp)?.getTime())
                  .filter((t): t is number => !!t)
                  .sort((a, b) => a - b);

                const editingActs = scriptActivities
                  .filter((a) => a.action && a.action.toLowerCase().includes("edit"))
                  .map((a) => parseDate(a.timestamp)?.getTime())
                  .filter((t): t is number => !!t)
                  .sort((a, b) => a - b);

                const reviewingActs = scriptActivities
                  .filter((a) => a.action && a.action.toLowerCase().includes("revis"))
                  .map((a) => parseDate(a.timestamp)?.getTime())
                  .filter((t): t is number => !!t)
                  .sort((a, b) => a - b);

                const creationTimeMinutes = createdTime ? Math.round((updatedTime || createdTime) - createdTime) / (1000 * 60) : 0;
                const editingTimeMinutes = editingActs.length > 1 ? Math.round((editingActs[editingActs.length - 1] - editingActs[0]) / (1000 * 60)) : 0;
                const reviewingTimeMinutes = reviewingActs.length > 1 ? Math.round((reviewingActs[reviewingActs.length - 1] - reviewingActs[0]) / (1000 * 60)) : 0;
                const recordingTimeMinutes = recordingActs.length > 1 ? Math.round((recordingActs[recordingActs.length - 1] - recordingActs[0]) / (1000 * 60)) : 0;

                const hasRecording = recordingActs.length > 0;
                const hasEditing = editingActs.length > 0;
                const hasReviewing = reviewingActs.length > 0;

                return (
                  <motion.div
                    key={script.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                  >
                    <Card className="border-0 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                            />
                            <div>
                              <h3 className="font-bold text-base truncate">{script.title}</h3>
                              <p className="text-xs text-muted-foreground">
                                ID: {script.id.substring(0, 8)}... | Status: {script.status}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            {script.projectName && (
                              <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 border-0 text-xs font-bold">
                                {script.projectName}
                              </Badge>
                            )}
                            {script.category && (
                              <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400 border-0 text-xs font-black">
                                {script.category}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          {/* Creation Time */}
                          <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20 p-3 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                📝 Criação
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">Tempo total (criação → edição)</p>
                            <p className="text-lg font-black text-amber-700 dark:text-amber-300">
                              {creationTimeMinutes > 0 ? formatDuration(creationTimeMinutes) : "N/A"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {createdTime && createdTime > 0 && (
                                `Criado: ${new Date(createdTime).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                              )}
                            </p>
                          </div>

                          {/* Editing Time */}
                          <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20 p-3 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                                ✏️ Edição
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">Tempo de edição contínua</p>
                            <p className="text-lg font-black text-blue-700 dark:text-blue-300">
                              {hasEditing ? formatDuration(editingTimeMinutes) : "N/A"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {hasEditing && editingActs.length > 0 && (
                                `Início: ${new Date(editingActs[0]).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                              )}
                            </p>
                          </div>

                          {/* Review Time */}
                          <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20 p-3 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                ✅ Revisão
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">Tempo de revisão contínua</p>
                            <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">
                              {hasReviewing ? formatDuration(reviewingTimeMinutes) : "N/A"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {hasReviewing && reviewingActs.length > 0 && (
                                `Início: ${new Date(reviewingActs[0]).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                              )}
                            </p>
                          </div>

                          {/* Recording Time */}
                          <div className="bg-purple-50/50 dark:bg-purple-950/10 border border-purple-100/50 dark:border-purple-900/20 p-3 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                                🎬 Gravação
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">Tempo de gravação (take → take)</p>
                            <p className="text-lg font-black text-purple-700 dark:text-purple-300">
                              {hasRecording ? formatDuration(recordingTimeMinutes) : "N/A"}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {hasRecording && recordingActs.length > 0 && (
                                `Início: ${new Date(recordingActs[0]).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Activity Timeline */}
                        {scriptActivities.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                              Timeline de Atividades ({scriptActivities.length} ações)
                            </p>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {scriptActivities.slice(0, 5).map((act) => (
                                <div key={act.id} className="flex items-center gap-2 text-[10px]">
                                  <div className="w-1.5 h-1.5 rounded-full bg-zinc-400 flex-shrink-0" />
                                  <span className="text-muted-foreground w-20">
                                    {parseDate(act.timestamp) ? parseDate(act.timestamp)?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '--'}
                                  </span>
                                  <span className="font-medium truncate">
                                    {act.action || 'Ação'}
                                  </span>
                                   <span className="text-muted-foreground ml-auto">
                                     {act.userName || 'Usuário'}
                                   </span>
                                 </div>
                               ))}
                               {scriptActivities.length > 5 && (
                                <div className="text-[10px] text-muted-foreground italic">
                                  ... e mais {scriptActivities.length - 5} ações
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dynamic Detail Performance Dialog */}
      <Dialog open={selectedUser !== null} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="w-6xl p-6 overflow-hidden rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Painel de Desempenho Individual
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (Radar Chart + Avatar) */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200/40 dark:border-zinc-800/40">
                <div className="text-center mb-2">
                  <Avatar className="w-14 h-14 mx-auto mb-2 text-lg font-black shadow-sm rounded-xl">
                    <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-indigo-600 text-white rounded-xl">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-bold text-base leading-none">{selectedUser.name}</h3>
                  <span className="text-[10px] text-muted-foreground block mt-1">{selectedUser.email}</span>
                  <Badge variant="outline" className="mt-2 text-[9px] font-black tracking-widest uppercase border-blue-500/20 bg-blue-500/5 text-blue-500">
                    {selectedUser.role}
                  </Badge>
                </div>

                <div className="w-full h-[240px] mt-2 select-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart
                      cx="50%"
                      cy="50%"
                      outerRadius="72%"
                      data={[
                        { subject: "Produtividade", A: Math.min(100, Math.round((selectedUser.throughput / Math.max(1, maxThroughput)) * 100)) },
                        { subject: "Assiduidade", A: Math.min(100, Math.round((selectedUser.activityStreak / 30) * 100)) },
                        { subject: "Complexidade", A: Math.min(100, Math.round((selectedUser.complexityScore / 4.0) * 100)) },
                        { subject: "Escopo", A: Math.min(100, Math.round((selectedUser.scopeReach / Math.max(1, totalProjectsCount)) * 100)) },
                        { subject: "Qualidade", A: Math.max(0, 100 - selectedUser.rejectionRate) },
                        { subject: "Eficiência", A: Math.max(10, Math.min(100, 50 + selectedUser.relativeEfficiency)) },
                      ]}
                    >
                      <PolarGrid stroke="#71717a" strokeOpacity={0.15} />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 9, fontWeight: "bold" }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name={selectedUser.name} dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[9px] text-muted-foreground text-center mt-2 bg-zinc-200/30 dark:bg-zinc-800/30 px-3 py-1 rounded">
                  Os valores do radar são normalizados em escala de 0 a 100.
                </p>
              </div>

              {/* Right Column (4 Pillars grid detailed) */}
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                    Pilares de Desenvolvimento & Métricas
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Pilar 1: Tempo & Engajamento */}
                    <Card className="border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-none">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                          <Clock className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-[11px] uppercase tracking-wider">Tempo & Fidelidade</span>
                      </div>
                      <div className="space-y-2.5">
                        <div>
                          <p className="text-[9px] text-muted-foreground leading-none">Tempo de Casa Ativo</p>
                          <p className="text-[13px] font-black mt-1">
                            {selectedUser.tenureDays >= 30
                              ? `${Math.floor(selectedUser.tenureDays / 30)} meses e ${selectedUser.tenureDays % 30} dias`
                              : `${selectedUser.tenureDays} dias`}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground leading-none">Última Modificação</p>
                          <p className="text-[13px] font-black mt-1">{selectedUser.lastActiveStr}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground leading-none">Taxa de Assiduidade</p>
                          <p className="text-[13px] font-black mt-1">{selectedUser.activityStreak} de 30 dias ativos ({Math.round((selectedUser.activityStreak / 30) * 100)}%)</p>
                        </div>
                      </div>
                    </Card>

                    {/* Pilar 2: Contribuição */}
                    <Card className="border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-none">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                          <Activity className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-[11px] uppercase tracking-wider">Volume & Contribuição</span>
                      </div>
                      <div className="space-y-2.5">
                        <div>
                          <p className="text-[9px] text-muted-foreground leading-none">Throughput de Roteiros</p>
                          <p className="text-[13px] font-black mt-1">{selectedUser.throughput} entregas totais</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground leading-none">Densidade de Preenchimento</p>
                          <p className="text-[13px] font-black mt-1">{selectedUser.fillingDensity}% dos metadados</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground leading-none">Frequência de Atualização</p>
                          <p className="text-[13px] font-black mt-1">{selectedUser.updateFrequency} interações/semana</p>
                        </div>
                      </div>
                    </Card>

                    {/* Pilar 3: Avanço & Progressão */}
                    <Card className="border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-none">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                          <Award className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-[11px] uppercase tracking-wider">Avanço & Crescimento</span>
                      </div>
                      <div className="space-y-2.5">
                        <div>
                          <p className="text-[9px] text-muted-foreground leading-none">Complexidade Média</p>
                          <p className="text-[13px] font-black mt-1">{selectedUser.complexityScore} / 4.0</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground leading-none">Expansão de Escopo</p>
                          <p className="text-[13px] font-black mt-1">{selectedUser.scopeReach} projetos ativos</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground leading-none">Tempo de Onboarding</p>
                          <p className="text-[13px] font-black mt-1">{selectedUser.onboardingDays} dias até a 1ª ação</p>
                        </div>
                      </div>
                    </Card>

                    {/* Pilar 4: Desempenho & Qualidade */}
                    <Card className="border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-none">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                          <Zap className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-[11px] uppercase tracking-wider">Qualidade & Eficiência</span>
                      </div>
                      <div className="space-y-2.5">
                        <div>
                          <p className="text-[9px] text-muted-foreground leading-none">Lead Time Médio</p>
                          <p className="text-[13px] font-black mt-1">
                            {selectedUser.leadTimeHours > 0 ? `${(selectedUser.leadTimeHours / 24).toFixed(1)} dias` : "Sem conclusão"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground leading-none">Taxa de Refação (Erro)</p>
                          <p className="text-[13px] font-black mt-1 text-red-500 dark:text-red-400">{selectedUser.rejectionRate}% de rejeitados</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-muted-foreground leading-none">Eficiência Relativa</p>
                          <p className={`text-[13px] font-black mt-1 ${selectedUser.relativeEfficiency >= 0 ? 'text-emerald-500' : 'text-zinc-500'}`}>
                            {selectedUser.relativeEfficiency >= 0 ? `+${selectedUser.relativeEfficiency}%` : `${selectedUser.relativeEfficiency}%`} vs média
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>

                {/* Historico de ações rápida do usuário */}
                <Card className="border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-4 rounded-xl shadow-none">
                  <span className="font-bold text-[11px] uppercase tracking-wider flex items-center gap-2 mb-2 text-muted-foreground">
                    <Activity className="w-3.5 h-3.5" />
                    Ações no Workspace (últimos logs)
                  </span>
                  <ScrollArea className="h-[90px] w-full pr-2">
                    <div className="space-y-2">
                      {workspaceActivities.filter(a => a.userId === selectedUser.uid).slice(0, 10).map((act, i) => {
                        const dateObj = parseDate(act.timestamp);
                        return (
                          <div key={i} className="flex justify-between items-center text-[11px] border-b border-zinc-100/50 dark:border-zinc-800/50 pb-1">
                            <span className="font-medium truncate max-w-[200px]">
                              {act.action} o roteiro <span className="font-bold text-blue-500">{act.scriptTitle || "Sem título"}</span>
                            </span>
                            <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                              {dateObj ? dateObj.toLocaleDateString("pt-BR") : "Recente"}
                            </span>
                          </div>
                        );
                      })}
                      {workspaceActivities.filter(a => a.userId === selectedUser.uid).length === 0 && (
                        <div className="text-[11px] text-muted-foreground italic text-center py-2">
                          Nenhum registro de atividade recente
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
