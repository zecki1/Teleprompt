"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ExtendedUser, Role, ROLES } from "@/services/schemas";
import { getUsers, updateUserRole } from "@/services/users";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Loader2, 
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
  Shield
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
import { updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
};

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [usersList, setUsersList] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    // Apenas zecki1@hotmail.com ou ezequiel.rmoncao@sp.senai.br têm acesso ao painel de admin global por enquanto
    const isAdmin = user?.email === "zecki1@hotmail.com" || user?.email === "ezequiel.rmoncao@sp.senai.br" || user?.role === "SuperAdmin";
    
    if (user && !isAdmin) {
      router.push("/dashboard");
      return;
    }

    if (user) {
      loadUsers();
    }
  }, [user, router]);

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsersList(usersData);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários.");
    } finally {
      setLoading(false);
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

  const togglePermission = async (uid: string, field: 'isEditor' | 'isRevisor', value: boolean) => {
    setUpdating(uid);
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        [field]: value,
        updatedAt: serverTimestamp()
      });
      setUsersList(usersList.map(u => u.uid === uid ? { ...u, [field]: value } : u));
      toast.success(`Permissão de "${field === 'isEditor' ? 'Editor' : 'Revisor'}" atualizada!`);
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

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <UserCog className="w-10 h-10 text-primary" />
            Administração
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Gerencie usuários, cargos e permissões de todos os Workspaces.</p>
        </div>
        <div className="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800">
           <div className="bg-primary/10 p-3 rounded-xl">
              <UsersIcon className="w-6 h-6 text-primary" />
           </div>
           <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
              <p className="text-2xl font-black">{usersList.length}</p>
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
                              {userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString("pt-BR") : "N/A"}
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
                    <TableHead className="w-[150px] text-center font-bold text-zinc-900 dark:text-zinc-100">Editor</TableHead>
                    <TableHead className="w-[150px] text-center font-bold text-zinc-900 dark:text-zinc-100">Revisor</TableHead>
                    <TableHead className="font-bold text-zinc-900 dark:text-zinc-100">Status Atual</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersList.map((userItem) => (
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
                      <TableCell>
                         <div className="flex gap-2">
                            {userItem.isEditor && <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-none">EDITOR</Badge>}
                            {userItem.isRevisor && <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-none">REVISOR</Badge>}
                            {!userItem.isEditor && !userItem.isRevisor && <span className="text-zinc-400 text-xs italic">Sem atribuições</span>}
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

