"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingScreen } from "@/components/PageTransitionLoader";
import { ExtendedUser, Role, ROLES } from "@/services/schemas";
import { getUsers, updateUserRole } from "@/services/users";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  Users as UsersIcon, 
  ShieldAlert, 
  ShieldCheck, 
  Users, 
  UserCheck, 
  GraduationCap, 
  Award, 
  UserPlus, 
  Search, 
  BookOpen, 
  Activity, 
  Wrench, 
  User,
  UserCog,
  Mail,
  Calendar,
  Shield,
  Eye,
  Link2 as LinkIcon,
  RotateCcw,
  Trash2,
  Download,
  FileText,
  Video,
  CheckCircle2,
  Edit2,
  LogOut,
  Hourglass,
  Check,
  X,
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateDoc, doc, deleteDoc, serverTimestamp, collection, getDocs, query, orderBy, limit, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/firebase-utils";
import { backfillActivitiesWorkspaceId, BackfillResult } from "@/lib/migrate-activities";
import { Presenter, getPresenters, addPresenter, deletePresenter, updatePresenter as updatePresenterService } from "@/services/presenters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const roleConfig: Record<Role, { label: string; color: string; icon: React.ElementType }> = {
  "SuperAdmin": { label: "Super Admin", color: "bg-red-600", icon: ShieldAlert },
  "Diretor": { label: "Diretor", color: "bg-red-500", icon: ShieldCheck },
  "Coordenador": { label: "Coordenador", color: "bg-orange-500", icon: Users },
  "Orientador": { label: "Orientador", color: "bg-amber-500", icon: UserCheck },
  "Docente": { label: "Docente", color: "bg-emerald-500", icon: GraduationCap },
  "Especialista": { label: "Especialista", color: "bg-blue-500", icon: Award },
  "Assistente": { label: "Assistente", color: "bg-sky-500", icon: UserPlus },
  "Analista": { label: "Analista", color: "bg-indigo-500", icon: Search },
  "Tutor": { label: "Tutor", color: "bg-purple-500", icon: BookOpen },
  "Monitor": { label: "Monitor", color: "bg-violet-500", icon: Activity },
  "Técnico": { label: "Técnico", color: "bg-zinc-600", icon: Wrench },
  "Estagiário": { label: "Estagiário", color: "bg-zinc-400", icon: User },
  "editor": { label: "Editor", color: "bg-blue-600", icon: UserCog },
  "validador": { label: "Validador", color: "bg-purple-600", icon: ShieldCheck },
  "publico": { label: "Público", color: "bg-zinc-500", icon: Eye },
};

const actionConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  Criou: { label: "Criou", color: "bg-zinc-100 text-zinc-700 dark:bg-zinc-900/30 dark:text-zinc-400", icon: FileText },
  Editou: { label: "Editou", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: FileText },
  Revisou: { label: "Revisou", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: CheckCircle2 },
  Gravou: { label: "Gravou", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Video },
  Comentou: { label: "Comentou", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Activity },
  ExcluiuRoteiro: { label: "Excluiu Roteiro", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: Trash2 },
  ExcluiuPasta: { label: "Excluiu Pasta", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: Trash2 },
  ExcluiuProjeto: { label: "Excluiu Projeto", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: Trash2 },
   ExportouBackup: { label: "Exportou Backup", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: Download },
   Reverteu: { label: "Reverteu", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: RotateCcw },
   EditouProjeto: { label: "Editou Projeto", color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400", icon: Edit2 },
   Entrou: { label: "Entrou", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: UserPlus },
   Saiu: { label: "Saiu", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: LogOut },
 };

interface ActivityItem {
  id: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  action?: string;
  scriptId?: string;
  scriptTitle?: string;
  projectId?: string | null;
  projectName?: string | null;
  folder?: string | null;
  subfolder?: string | null;
  lesson?: string | null;
  path?: string[];
  workspaceId?: string;
  timestamp?: unknown;
  metadata?: string | null;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [usersList, setUsersList] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [revertingId, setRevertingId] = useState<string | null>(null);
  const [revertConfirmId, setRevertConfirmId] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [backfilling, setBackfilling] = useState(false);
  const [presenters, setPresenters] = useState<Presenter[]>([]);
  const [loadingPresenters, setLoadingPresenters] = useState(true);
  const [newPresenterName, setNewPresenterName] = useState("");
  const [editingPresenter, setEditingPresenter] = useState<Presenter | null>(null);
  const [editPresenterName, setEditPresenterName] = useState("");
  const [savingPresenter, setSavingPresenter] = useState(false);
  
  const handleCopyInvite = () => {
    if (!user?.workspaceId) {
      toast.error("Você não está vinculado a um workspace.");
      return;
    }
    const inviteUrl = `${window.location.origin}/login?workspaceId=${user.workspaceId}`;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Link de convite copiado para a área de transferência!");
  };

  useEffect(() => {
    const canAccess = user?.role === "SuperAdmin" || user?.isSuperAdmin === true || user?.canViewAdmin === true;
    
    if (user && !canAccess) {
      router.push("/dashboard");
      return;
    }

    if (user) {
      loadUsers();
      loadActivities();
      loadPresenters();
    }
  }, [user, router]);

  const loadActivities = async () => {
    try {
      const constraints: Parameters<typeof query>[1][] = [
        orderBy("timestamp", "desc"),
        limit(100),
      ];
      if (user?.workspaceId) {
        constraints.unshift(where("workspaceId", "==", user.workspaceId));
      }
      const q = query(collection(db, "activities"), ...constraints);
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActivities(data);
    } catch (error) {
      console.error("Erro ao carregar atividades:", error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleRevert = async () => {
    if (!revertConfirmId) return;
    const id = revertConfirmId;
    setRevertConfirmId(null);
    setRevertingId(id);
    try {
      const { revertActivity } = await import("@/lib/activity");
      const success = await revertActivity(id);
      if (success) {
        if (user) {
          const { logActivity } = await import("@/lib/activity");
          await logActivity({
            userId: user.uid,
            userName: user.displayName || user.name || user.email || "Usuário",
            userAvatar: user.photoURL || null,
            action: "Reverteu",
            metadata: `Reverteu atividade ${id}`,
            workspaceId: user.workspaceId || "",
          });
        }
        toast.success("Item restaurado com sucesso!");
        loadActivities();
      } else {
        toast.error("Não foi possível reverter. Pode ter excedido 30 dias.");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao reverter.");
    } finally {
      setRevertingId(null);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta atividade?")) return;
    try {
      await deleteDoc(doc(db, "activities", activityId));
      setActivities(prev => prev.filter(a => a.id !== activityId));
      toast.success("Atividade excluída!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao excluir atividade.");
    }
  };

  const handleBackfillActivities = async () => {
    if (!confirm("Isso vai preencher o workspaceId nas atividades antigas. Continuar?")) return;
    setBackfilling(true);
    try {
      const result = await backfillActivitiesWorkspaceId();
      toast.success(`${result.updated} atividades atualizadas.`);
      loadActivities();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao migrar atividades.");
    } finally {
      setBackfilling(false);
    }
  };

  const loadUsers = async () => {
    try {
      let usersData = await getUsers(user?.workspaceId, user?.isSuperAdmin);
      // Fallback: se não achou usuários com workspaceId, tenta sem filtro (admin)
      if (usersData.length === 0 && !user?.isSuperAdmin) {
        usersData = await getUsers(user?.workspaceId, true);
      }
      setUsersList(usersData);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  };

  const loadPresenters = async () => {
    if (!user?.workspaceId) return;
    try {
      const data = await getPresenters(user.workspaceId);
      setPresenters(data);
    } catch {
      toast.error("Erro ao carregar apresentadores.");
    } finally {
      setLoadingPresenters(false);
    }
  };

  const handleAddPresenter = async () => {
    if (!newPresenterName.trim() || !user?.workspaceId) return;
    setSavingPresenter(true);
    try {
      const id = await addPresenter(newPresenterName.trim(), user.workspaceId, user.uid);
      setPresenters([...presenters, { id, name: newPresenterName.trim(), workspaceId: user.workspaceId, createdBy: user.uid }]);
      setNewPresenterName("");
      toast.success("Apresentador cadastrado!");
    } catch {
      toast.error("Erro ao cadastrar apresentador.");
    } finally {
      setSavingPresenter(false);
    }
  };

  const handleSaveEditPresenter = async () => {
    if (!editingPresenter || !editPresenterName.trim()) return;
    setSavingPresenter(true);
    try {
      await updatePresenterService(editingPresenter.id, { name: editPresenterName.trim() });
      setPresenters(presenters.map(p => p.id === editingPresenter.id ? { ...p, name: editPresenterName.trim() } : p));
      setEditingPresenter(null);
      toast.success("Apresentador atualizado!");
    } catch {
      toast.error("Erro ao atualizar apresentador.");
    } finally {
      setSavingPresenter(false);
    }
  };

  const handleDeletePresenter = async (presenterId: string) => {
    try {
      await deletePresenter(presenterId);
      setPresenters(presenters.filter(p => p.id !== presenterId));
      toast.success("Apresentador excluído!");
    } catch {
      toast.error("Erro ao excluir apresentador.");
    }
  };

  const handleRoleChange = async (uid: string, newRole: Role) => {
    setUpdating(uid);
    try {
      await updateUserRole(uid, newRole);
      setUsersList(usersList.map(u => u.uid === uid ? { ...u, role: newRole } : u));
      toast.success(`Cargo de ${usersList.find(u => u.uid === uid)?.displayName} atualizado!`);
    } catch (error) {
      console.error("Erro ao atualizar papel:", error);
      toast.error("Erro ao atualizar cargo.");
    } finally {
      setUpdating(null);
    }
  };

  const togglePermission = async (uid: string, field: 'isEditor' | 'isRevisor' | 'requiresChecklist' | 'canRevert' | 'canAssign' | 'canViewAdmin' | 'canViewReports' | 'canViewActivityHistory', value: boolean) => {
    setUpdating(uid);
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        [field]: value,
        updatedAt: serverTimestamp()
      });
      setUsersList(usersList.map(u => u.uid === uid ? { ...u, [field]: value } : u));
      
      const labels: Record<string, string> = {
        isEditor: "Editor",
        isRevisor: "Revisor",
        canRevert: "Reverter",
        canAssign: "Atribuir",
        canViewAdmin: "Ver Administração",
        canViewReports: "Ver Relatórios",
        canViewActivityHistory: "Ver Histórico",
        requiresChecklist: "Checklist",
      };

      toast.success(`Permissão "${labels[field] || field}" atualizada!`);
    } catch (error) {
      console.error("Erro ao atualizar permissão:", error);
      toast.error("Erro ao atualizar permissão.");
    } finally {
      setUpdating(null);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const isRevertible = (action: string | undefined): boolean => {
    return action === "ExcluiuRoteiro" || action === "ExcluiuPasta" || action === "ExcluiuProjeto"
      || action === "EditouProjeto" || action === "Editou" || action === "Criou" || action === "Gravou";
  };

  const isWithin30Days = (timestamp: unknown): boolean => {
    if (!timestamp) return false;
    const date = toDate(timestamp);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date > thirtyDaysAgo;
  };

  const filteredActivities = actionFilter === "all"
    ? activities
    : activities.filter(a => a.action === actionFilter);

  if (loading) return <LoadingScreen />;

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <UserCog className="w-10 h-10 text-primary" />
            Administração
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Gerencie usuários, cargos, permissões e histórico de ações.</p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleCopyInvite}
            className="h-14 rounded-2xl font-bold border-zinc-200 dark:border-zinc-800 flex gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 px-6 shadow-sm"
          >
            <LinkIcon className="w-4 h-4 text-blue-500" />
            Convidar Equipe
          </Button>
          <div className="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 h-14">
             <div className="bg-primary/10 p-2 rounded-lg">
                <UsersIcon className="w-5 h-5 text-primary" />
             </div>
             <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Usuários</p>
                <p className="text-xl font-black leading-none">{usersList.length}</p>
             </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList className="bg-zinc-100 dark:bg-zinc-900 p-1 mb-8 rounded-2xl h-14 border border-zinc-200 dark:border-zinc-800">
          <TabsTrigger value="usuarios" className="rounded-xl px-8 h-full data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-lg font-bold flex gap-2">
            <UsersIcon className="w-4 h-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="rounded-xl px-8 h-full data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-lg font-bold flex gap-2">
            <Shield className="w-4 h-4" /> Permissões e Cargos
          </TabsTrigger>
          {(user?.role === "SuperAdmin" || user?.isSuperAdmin || user?.canViewActivityHistory) && (
            <TabsTrigger value="atividades" className="rounded-xl px-8 h-full data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-lg font-bold flex gap-2">
              <Activity className="w-4 h-4" /> Histórico de Atividades
            </TabsTrigger>
          )}
          <TabsTrigger value="apresentadores" className="rounded-xl px-8 h-full data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:shadow-lg font-bold flex gap-2">
            <UserPlus className="w-4 h-4" /> Apresentadores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usuarios">
          <Card className="border-none shadow-2xl bg-white dark:bg-zinc-950 overflow-hidden rounded-[32px]">
            <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-900 p-8">
              <CardTitle className="text-2xl font-bold">Base de Usuários</CardTitle>
              <CardDescription className="text-base">
                Visualize e altere o nível de acesso de cada colaborador do sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50/30 dark:bg-zinc-900/30">
                  <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-900">
                    <TableHead className="w-[300px] h-14 px-8 font-bold text-zinc-900 dark:text-zinc-100">Colaborador</TableHead>
                    <TableHead className="font-bold text-zinc-900 dark:text-zinc-100">Informações</TableHead>
                    <TableHead className="w-[240px] font-bold text-zinc-900 dark:text-zinc-100">Cargo Hierárquico</TableHead>
                    <TableHead className="text-right px-8 font-bold text-zinc-900 dark:text-zinc-100">Cadastro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersList.map((userItem) => {
                    const config = roleConfig[userItem.role as Role] || roleConfig["Estagiário"];
                    const Icon = config.icon;

                    return (
                      <TableRow key={userItem.uid} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 border-zinc-100 dark:border-zinc-900 transition-colors group">
                        <TableCell className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <Avatar className="h-12 w-12 border-2 border-background shadow-md">
                                <AvatarImage src={userItem.avatarUrl || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                  {getInitials(userItem.displayName || userItem.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${userItem.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors">
                                {userItem.displayName || userItem.name || "Sem nome"}
                              </span>
                              <span className="text-xs text-muted-foreground font-mono uppercase tracking-tighter">
                                ID: {userItem.uid.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                              <Mail className="w-3.5 h-3.5" />
                              {userItem.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={userItem.role}
                            onValueChange={(value) => handleRoleChange(userItem.uid, value as Role)}
                            disabled={updating === userItem.uid || userItem.uid === user?.uid}
                          >
                            <SelectTrigger className="w-full h-10 bg-transparent border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-primary/20">
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  <div className={`p-1 rounded-md ${config.color} text-white`}>
                                    <Icon className="w-3 h-3" />
                                  </div>
                                  <span className="text-sm font-semibold">{config.label}</span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-xl">
                              {ROLES.map((role) => {
                                const rConfig = roleConfig[role as Role];
                                const RIcon = rConfig.icon;
                                return (
                                  <SelectItem key={role} value={role} className="rounded-lg my-1">
                                    <div className="flex items-center gap-2">
                                      <div className={`p-1.5 rounded-md ${rConfig.color} text-white`}>
                                        <RIcon className="w-3.5 h-3.5" />
                                      </div>
                                      <span className="font-medium">{rConfig.label}</span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right px-8">
                           <div className="flex items-center justify-end gap-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                              <Calendar className="w-3.5 h-3.5" />
                              {userItem.createdAt ? toDate(userItem.createdAt).toLocaleDateString("pt-BR") : "N/A"}
                           </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

          <TabsContent value="permissoes">
          <Card className="border-none shadow-2xl bg-white dark:bg-zinc-950 overflow-hidden rounded-[32px]">
            <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-900 p-8">
              <CardTitle className="text-2xl font-bold">Gestão de Operadores</CardTitle>
              <CardDescription className="text-base">
                Defina quem são os Editores e Revisores que aparecerão no Dashboard para atribuição de roteiros.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50/30 dark:bg-zinc-900/30">
                  <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-900">
                    <TableHead className="w-[300px] h-14 px-8 font-bold text-zinc-900 dark:text-zinc-100">Colaborador</TableHead>
                    <TableHead className="w-[120px] text-center font-bold text-zinc-900 dark:text-zinc-100">Editor</TableHead>
                    <TableHead className="w-[120px] text-center font-bold text-zinc-900 dark:text-zinc-100">Revisor</TableHead>
                    <TableHead className="w-[120px] text-center font-bold text-zinc-900 dark:text-zinc-100">Reverter</TableHead>
                    <TableHead className="w-[120px] text-center font-bold text-zinc-900 dark:text-zinc-100">Checklist</TableHead>
                    <TableHead className="w-[100px] text-center font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">Atribuir</TableHead>
                    <TableHead className="w-[100px] text-center font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">Admin</TableHead>
                    <TableHead className="w-[100px] text-center font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">Relatórios</TableHead>
                    <TableHead className="w-[100px] text-center font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">Histórico</TableHead>
                    <TableHead className="font-bold text-zinc-900 dark:text-zinc-100">Status Atual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-12 text-zinc-400">
                        <Users className="w-8 h-8 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">Nenhum colaborador encontrado</p>
                        <p className="text-sm mt-1">Verifique se os usuários possuem um workspace vinculado.</p>
                      </TableCell>
                    </TableRow>
                  ) : usersList.map((userItem) => (
                    <TableRow key={userItem.uid} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 border-zinc-100 dark:border-zinc-900 transition-colors">
                      <TableCell className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={userItem.avatarUrl || undefined} />
                            <AvatarFallback>{getInitials(userItem.displayName || userItem.name)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-bold">{userItem.displayName || userItem.name || "Sem nome"}</span>
                            <span className="text-xs text-muted-foreground">{userItem.role}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch 
                            checked={userItem.isEditor} 
                            onCheckedChange={(val) => togglePermission(userItem.uid, 'isEditor', val)}
                            disabled={updating === userItem.uid}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch 
                            checked={userItem.isRevisor} 
                            onCheckedChange={(val) => togglePermission(userItem.uid, 'isRevisor', val)}
                            disabled={updating === userItem.uid}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch 
                            checked={userItem.canRevert} 
                            onCheckedChange={(val) => togglePermission(userItem.uid, 'canRevert', val)}
                            disabled={updating === userItem.uid}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch 
                            checked={userItem.requiresChecklist ?? true} 
                            onCheckedChange={(val) => togglePermission(userItem.uid, 'requiresChecklist', val)}
                            disabled={updating === userItem.uid}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch 
                            checked={userItem.canAssign} 
                            onCheckedChange={(val) => togglePermission(userItem.uid, 'canAssign', val)}
                            disabled={updating === userItem.uid}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch 
                            checked={userItem.canViewAdmin} 
                            onCheckedChange={(val) => togglePermission(userItem.uid, 'canViewAdmin', val)}
                            disabled={updating === userItem.uid}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch 
                            checked={userItem.canViewReports} 
                            onCheckedChange={(val) => togglePermission(userItem.uid, 'canViewReports', val)}
                            disabled={updating === userItem.uid}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Switch 
                            checked={userItem.canViewActivityHistory} 
                            onCheckedChange={(val) => togglePermission(userItem.uid, 'canViewActivityHistory', val)}
                            disabled={updating === userItem.uid}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex gap-1 flex-wrap">
                            {userItem.isEditor && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none text-[9px]">EDITOR</Badge>}
                            {userItem.isRevisor && <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-none text-[9px]">REVISOR</Badge>}
                            {userItem.canRevert && <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none text-[9px]">REVERTER</Badge>}
                            {userItem.canAssign && <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-none text-[9px]">ATRIBUIR</Badge>}
                            {userItem.canViewAdmin && <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-none text-[9px]">ADMIN</Badge>}
                            {userItem.canViewReports && <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-none text-[9px]">RELATÓRIOS</Badge>}
                            {userItem.canViewActivityHistory && <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-none text-[9px]">HISTÓRICO</Badge>}
                            {!userItem.isEditor && !userItem.isRevisor && !userItem.canRevert && !userItem.canAssign && !userItem.canViewAdmin && !userItem.canViewReports && !userItem.canViewActivityHistory && <span className="text-zinc-400 text-xs italic">Sem atribuições</span>}
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="atividades">
          <Card className="border-none shadow-2xl bg-white dark:bg-zinc-950 overflow-hidden rounded-[32px]">
            <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-900 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">Histórico de Atividades</CardTitle>
                  <CardDescription className="text-base">
                    Registro completo de ações. Exclusões podem ser revertidas em até 30 dias.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {(user?.role === "SuperAdmin" || user?.isSuperAdmin) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBackfillActivities}
                      disabled={backfilling}
                      className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest border-zinc-200 dark:border-zinc-800"
                    >
                      {backfilling ? "Migrando..." : "Migrar Activities"}
                    </Button>
                  )}
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Filtrar:</span>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger className="w-[180px] h-9 rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-bold">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800">
                      <SelectItem value="all" className="text-xs font-bold">Todas</SelectItem>
                      {Object.entries(actionConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key} className="text-xs font-bold">{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-zinc-50/30 dark:bg-zinc-900/30">
                  <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-900">
                    <TableHead className="w-[220px] h-14 px-8 font-bold text-zinc-900 dark:text-zinc-100">Colaborador</TableHead>
                    <TableHead className="w-[140px] font-bold text-zinc-900 dark:text-zinc-100">Ação</TableHead>
                    <TableHead className="font-bold text-zinc-900 dark:text-zinc-100">Roteiro / Detalhes</TableHead>
                    <TableHead className="w-[180px] font-bold text-zinc-900 dark:text-zinc-100">Projeto / Pasta</TableHead>
                    <TableHead className="text-right px-8 font-bold text-zinc-900 dark:text-zinc-100">Data/Hora</TableHead>
                    <TableHead className="w-[100px] text-center font-bold text-zinc-900 dark:text-zinc-100">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingActivities ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <LoadingScreen fullScreen={false} className="py-8" />
                      </TableCell>
                    </TableRow>
                  ) : filteredActivities.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                        Nenhuma atividade registrada ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredActivities.map((act) => {
                      const actionConf = actionConfig[act.action || ""] || { label: act.action || "Desconhecido", color: "", icon: Activity };
                      const ActionIcon = actionConf.icon;
                      const canRevert = isRevertible(act.action) && isWithin30Days(act.timestamp) && (user?.canRevert || user?.role === "SuperAdmin");

                      return (
                        <TableRow key={act.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 border-zinc-100 dark:border-zinc-900 transition-colors group">
                          <TableCell className="px-8 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={act.userAvatar} />
                                <AvatarFallback className="text-[10px] bg-zinc-100">{getInitials(act.userName)}</AvatarFallback>
                              </Avatar>
                              <span className="font-bold text-sm">{act.userName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`text-[10px] font-black uppercase tracking-widest px-2 h-5 border-none ${actionConf.color}`}
                            >
                              <ActionIcon className="w-3 h-3 mr-1" />
                              {actionConf.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm line-clamp-1">{act.scriptTitle || act.metadata || "-"}</span>
                              {act.scriptId && <span className="text-[9px] text-muted-foreground font-mono">ID: {act.scriptId.slice(0, 8)}</span>}
                            </div>
                          </TableCell>
                          <TableCell>
                             <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter">{act.projectName || "Geral"}</span>
                                {act.folder && <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{act.folder}</span>}
                                {act.metadata === "Word" && <span className="text-[9px] text-emerald-500 font-black">Word</span>}
                                {act.metadata === "PPT" && <span className="text-[9px] text-orange-500 font-black">PPT</span>}
                                {act.metadata === "JSON" && <span className="text-[9px] text-zinc-500 font-black">JSON</span>}
                             </div>
                          </TableCell>
                          <TableCell className="text-right px-8 font-medium text-xs text-zinc-500">
                            {act.timestamp ? toDate(act.timestamp).toLocaleString("pt-BR", {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : "N/A"}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              {canRevert ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-[9px] font-black uppercase tracking-widest text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => setRevertConfirmId(act.id)}
                                  disabled={revertingId === act.id}
                                >
                                  {revertingId === act.id ? (
                                    <span className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                                  ) : (
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                  )}
                                  Reverter
                                </Button>
                              ) : null}
                              {(user?.role === "SuperAdmin" || user?.isSuperAdmin) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-zinc-400 hover:text-red-500 hover:bg-red-50"
                                  onClick={() => handleDeleteActivity(act.id)}
                                  title="Excluir atividade"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="apresentadores">
          <Card className="border-none shadow-2xl bg-white dark:bg-zinc-950 overflow-hidden rounded-[32px]">
            <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-900 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold">Apresentadores</CardTitle>
                  <CardDescription className="text-base">
                    Gerencie os nomes dos professores/apresentadores que aparecerão nos roteiros.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Input
                  placeholder="Nome do apresentador..."
                  value={newPresenterName}
                  onChange={(e) => setNewPresenterName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddPresenter(); }}
                  className="h-11 rounded-xl border-zinc-200 dark:border-zinc-800 font-bold flex-1"
                />
                <Button
                  onClick={handleAddPresenter}
                  disabled={savingPresenter || !newPresenterName.trim()}
                  className="h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] px-6"
                >
                  {savingPresenter ? <Hourglass className="w-4 h-4 animate-spin" style={{ animationDuration: "2s" }} /> : <UserPlus className="w-4 h-4 mr-2" />}
                  Adicionar
                </Button>
              </div>

              {loadingPresenters ? (
                <div className="py-12 text-center">
                  <LoadingScreen fullScreen={false} className="py-8" />
                </div>
              ) : presenters.length === 0 ? (
                <div className="py-12 text-center text-zinc-400">
                  <UserPlus className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Nenhum apresentador cadastrado</p>
                  <p className="text-sm mt-1">Adicione o primeiro acima.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-zinc-50/30 dark:bg-zinc-900/30">
                    <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-900">
                      <TableHead className="h-14 px-6 font-bold text-zinc-900 dark:text-zinc-100">Nome</TableHead>
                      <TableHead className="w-[80px] text-center font-bold text-zinc-900 dark:text-zinc-100">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {presenters.map((presenter) => (
                      <TableRow key={presenter.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 border-zinc-100 dark:border-zinc-900 transition-colors group">
                        <TableCell className="px-6 py-4">
                          {editingPresenter?.id === presenter.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={editPresenterName}
                                onChange={(e) => setEditPresenterName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSaveEditPresenter(); if (e.key === "Escape") setEditingPresenter(null); }}
                                autoFocus
                                className="h-9 rounded-lg text-sm font-bold"
                              />
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500" onClick={handleSaveEditPresenter} disabled={savingPresenter}>
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingPresenter(null)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-black">
                                  {presenter.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-bold text-zinc-800 dark:text-zinc-200">{presenter.name}</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => { setEditingPresenter(presenter); setEditPresenterName(presenter.name); }}
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                              onClick={() => handleDeletePresenter(presenter.id)}
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* Revert Confirmation */}
      <AlertDialog open={revertConfirmId !== null} onOpenChange={(open) => !open && setRevertConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverter Ação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja reverter esta ação? O estado anterior será restaurado. Esta ação é registrada no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRevert} className="bg-blue-600 hover:bg-blue-700">
              Reverter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
