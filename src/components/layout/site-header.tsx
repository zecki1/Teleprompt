"use client";

import Link from "next/link";
import { Terminal, Menu, Maximize, LogOut, User, Settings, LayoutDashboard, FolderOpen, Users } from "lucide-react";
import { SettingsMenu } from "@/components/settings-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Text } from "@/components/providers/preferences-provider";
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

const navItems = [
  { href: "/dashboard", pt: "Dashboard", en: "Dashboard", es: "Dashboard" },
];

export function SiteHeader() {
  const { user, logOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

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
              <Text pt={item.pt} en={item.en} es={item.es} />
            </Link>
          ))}
          {user && (
            <Button variant="default" size="sm" asChild>
              <Link href="/editor/new">
                <Text pt="Novo Roteiro" en="New Script" es="Nuevo Guion" />
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
            <LanguageSwitcher />
            <SettingsMenu />
          </div>
          
          <Separator orientation="vertical" className="h-6 mx-2 hidden sm:block" />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer border hover:border-primary transition-colors">
                  <AvatarImage src={user.photoURL || undefined} />
                  <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.displayName}</p>
                    <p className="text-xs text-zinc-500">{user.email}</p>
                    <p className="text-xs font-semibold text-blue-500 uppercase">{user.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </DropdownMenuItem>
                {user.email === "zecki1@hotmail.com" && (
                  <DropdownMenuItem onClick={() => router.push("/admin")}>
                    <Users className="mr-2 h-4 w-4" />
                    Admin
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
                      <Text pt={item.pt} en={item.en} es={item.es} />
                    </Link>
                  ))}
                  {user && (
                    <Link href="/editor/new" className="text-lg font-medium hover:text-primary transition-colors">
                      <Text pt="Novo Roteiro" en="New Script" es="Nuevo Guion" />
                    </Link>
                  )}
                  <Separator className="my-2" />
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                      <span className="text-sm font-medium">Idioma</span>
                      <LanguageSwitcher />
                    </div>
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