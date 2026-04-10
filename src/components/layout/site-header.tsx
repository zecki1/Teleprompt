"use client";

import Link from "next/link";
import { Terminal, Menu, Maximize, LogOut, User, LayoutDashboard, FolderOpen, Users } from "lucide-react";
import { SettingsMenu } from "@/components/settings-menu";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Briefcase } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projetos" },
];

export function SiteHeader() {
  const { user, currentWorkspace, userWorkspacesDetailed, switchWorkspace, logOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const isAdmin = user?.email === "zecki1@hotmail.com" || user?.email === "ezequiel.rmoncao@sp.senai.br" || user?.role === "SuperAdmin";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">

        {/* Área do Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg shadow-sm">
              <Terminal className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg hidden sm:inline-block">
              <span className="text-primary">Teleprompt</span>
            </span>
          </Link>
        </div>

        {/* Navegação Principal (Desktop) */}
        <nav className="hidden lg:flex items-center gap-4 text-sm font-medium text-muted-foreground">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-primary transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin"
              className="hover:text-primary transition-colors whitespace-nowrap font-bold text-blue-500"
            >
              Administração
            </Link>
          )}
          {user && (
            <Button variant="default" size="sm" asChild className="ml-2">
              <Link href="/editor/new">
                Novo Roteiro
              </Link>
            </Button>
          )}
        </nav>

        {/* Ações & Menu Mobile */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden sm:flex" onClick={() => {
            if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(()=>{});
            else if (document.exitFullscreen) document.exitFullscreen();
          }} title="Alternar Tela Cheia">
             <Maximize className="h-5 w-5 text-muted-foreground" />
          </Button>
          <div className="hidden sm:flex items-center gap-2">
            <SettingsMenu />
          </div>
          
          {user && (
            <>
              <div className="hidden md:flex items-center gap-2">
                <Select
                  value={user.workspaceId}
                  onValueChange={(val) => switchWorkspace(val)}
                >
                  <SelectTrigger className="w-[180px] h-8 bg-zinc-900/50 border-zinc-700 text-xs text-white">
                    <Briefcase className="h-3 w-3 mr-2 text-primary" />
                    <SelectValue placeholder="Workspace">
                      {currentWorkspace?.name || "Workspace"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                    {userWorkspacesDetailed && userWorkspacesDetailed.map((ws) => (
                      <SelectItem key={ws.id} value={ws.id} className="text-xs">
                        {ws.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />
            </>
          )}
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-2 cursor-pointer group">
                  <div className="hidden flex-col items-end mr-1 md:flex">
                     <span className="text-[10px] font-bold text-zinc-400 group-hover:text-primary transition-colors">{user.displayName}</span>
                     <span className="text-[9px] text-zinc-500">{user.role}</span>
                  </div>
                  <Avatar className="h-8 w-8 border hover:border-primary transition-colors">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.displayName}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/projects")}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Projetos
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                    <Users className="mr-2 h-4 w-4" />
                    Painel Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
              Entrar
            </Button>
          )}

          {/* Gatilho do Menu Mobile */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Alternar menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-primary" />
                    <span>Navegação</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-lg font-medium hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                  {isAdmin && (
                    <Link href="/admin" className="text-lg font-bold text-blue-500 hover:text-primary transition-colors">
                      Administração
                    </Link>
                  )}
                  {user && (
                    <Link href="/editor/new" className="text-lg font-medium hover:text-primary transition-colors">
                      Novo Roteiro
                    </Link>
                  )}
                  <Separator className="my-2" />
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-sm font-medium">Configurações</span>
                      <SettingsMenu />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}