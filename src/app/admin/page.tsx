"use client";

import { useEffect, useState } from "react";
import { useAuth, TelepromptUser, UserRole } from "@/contexts/AuthContext";
import { getUsers, updateUserRole } from "@/services/users";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Users as UsersIcon, Shield, Edit3, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";

const roleLabels: Record<UserRole, { label: string; color: string }> = {
  editor: { label: "Editor", color: "bg-blue-500" },
  validador: { label: "Validador", color: "bg-purple-500" },
  publico: { label: "Público", color: "bg-zinc-500" },
};

export default function AdminPage() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<TelepromptUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email !== "zecki1@hotmail.com") {
      router.push("/dashboard");
      return;
    }

    loadUsers();
  }, [user, router]);

  const loadUsers = async () => {
    try {
      const usersData = await getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    setUpdating(uid);
    try {
      await updateUserRole(uid, newRole);
      setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Erro ao atualizar papel:", error);
    } finally {
      setUpdating(null);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-3">
            <UserCog className="w-8 h-8" />
            Administração
          </h1>
          <p className="text-zinc-500 mt-1">Gerencie usuários e permissões do sistema</p>
        </div>
      </div>

      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5" />
              Usuários ({users.length})
            </CardTitle>
            <CardDescription>
              Lista de todos os usuários cadastrados no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userItem) => (
                  <TableRow key={userItem.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={userItem.photoURL || undefined} />
                          <AvatarFallback>{getInitials(userItem.displayName)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {userItem.displayName || "Sem nome"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-500">
                      {userItem.email}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={userItem.role}
                        onValueChange={(value) => handleRoleChange(userItem.uid, value as UserRole)}
                        disabled={updating === userItem.uid || userItem.uid === user?.uid}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue>
                            <Badge className={`${roleLabels[userItem.role].color} hover:${roleLabels[userItem.role].color}`}>
                              <Shield className="w-3 h-3 mr-1" />
                              {roleLabels[userItem.role].label}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="editor">
                            <Badge className="bg-blue-500 hover:bg-blue-600">
                              <Edit3 className="w-3 h-3 mr-1" />
                              Editor
                            </Badge>
                          </SelectItem>
                          <SelectItem value="validador">
                            <Badge className="bg-purple-500 hover:bg-purple-600">
                              <Shield className="w-3 h-3 mr-1" />
                              Validador
                            </Badge>
                          </SelectItem>
                          <SelectItem value="publico">
                            <Badge className="bg-zinc-500 hover:bg-zinc-600">
                              Público
                            </Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm">
                      {userItem.createdAt instanceof Date 
                        ? userItem.createdAt.toLocaleDateString("pt-BR")
                        : "-"
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
