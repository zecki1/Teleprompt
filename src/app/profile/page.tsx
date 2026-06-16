"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Save, Hourglass, User, Shield, Mail, Briefcase, Plus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { CreateOrJoinWorkspaceModal } from "@/components/auth/CreateOrJoinWorkspaceModal";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState(user?.displayName || user?.name || "");
  const [saving, setSaving] = useState(false);
  const [showCreateWs, setShowCreateWs] = useState(false);

  if (!user) {
    router.push("/login");
    return null;
  }

  const getInitials = (n: string | null | undefined) => {
    if (!n) return "U";
    return n.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleSaveName = async () => {
    if (!name.trim()) {
      toast.error("O nome não pode estar vazio.");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        displayName: name.trim(),
        updatedAt: new Date().toISOString(),
      });
      toast.success("Nome atualizado com sucesso!");
    } catch {
      toast.error("Erro ao atualizar nome.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-2xl">
      <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <Avatar className="h-20 w-20 border-4 border-blue-100 dark:border-blue-900">
              <AvatarImage src={user.photoURL || undefined} />
              <AvatarFallback className="text-2xl">{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl font-black tracking-tight">Meu Perfil</CardTitle>
          <CardDescription>Gerencie suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações básicas */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Informações Pessoais
            </h3>
            <div className="rounded-xl border p-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Nome</Label>
                <div className="flex gap-2">
                  <Input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="bg-background"
                  />
                  <Button onClick={handleSaveName} disabled={saving}>
                    {saving ? (
                      <Hourglass className="h-4 w-4 animate-spin" style={{ animationDuration: "2s" }} />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-zinc-500">Email</Label>
                <p className="text-sm font-medium flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-400" />
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Função e permissões */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" /> Função & Permissões
            </h3>
            <div className="rounded-xl border p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Função</span>
                <span className="text-sm font-bold">{user.role}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Admin</span>
                <span className={`text-xs font-bold ${user.canViewAdmin ? "text-green-500" : "text-zinc-400"}`}>
                  {user.canViewAdmin ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Relatórios</span>
                <span className={`text-xs font-bold ${user.canViewReports ? "text-green-500" : "text-zinc-400"}`}>
                  {user.canViewReports ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Histórico de Atividades</span>
                <span className={`text-xs font-bold ${user.canViewActivityHistory ? "text-green-500" : "text-zinc-400"}`}>
                  {user.canViewActivityHistory ? "Ativo" : "Inativo"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Reverter Ações</span>
                <span className={`text-xs font-bold ${user.canRevert ? "text-green-500" : "text-zinc-400"}`}>
                  {user.canRevert ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Workspaces */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5" /> Workspaces
            </h3>
            <div className="rounded-xl border p-4 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
              {user.workspaces && user.workspaces.length > 0 ? (
                <div className="space-y-2">
                  {user.workspaces.map((wsId) => (
                    <div key={wsId} className="flex items-center gap-2 text-sm">
                      <Briefcase className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="font-mono text-xs text-zinc-600 truncate">{wsId}</span>
                      {wsId === user.workspaceId && (
                        <span className="text-[10px] font-bold text-green-500 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                          ATIVO
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-2">
                  Você ainda não tem nenhum workspace.
                </p>
              )}
              <Button
                variant="outline"
                className="w-full mt-2 gap-2"
                onClick={() => setShowCreateWs(true)}
              >
                <Plus className="w-4 h-4" />
                Novo Workspace
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <CreateOrJoinWorkspaceModal open={showCreateWs} onOpenChange={setShowCreateWs} />
    </div>
  );
}
