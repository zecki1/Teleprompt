"use client";

import Link from "next/link";
import { Terminal, Menu, Maximize } from "lucide-react";
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

const navItems = [
  { href: "/dashboard", pt: "Dashboard", en: "Dashboard", es: "Dashboard" },
  { href: "/editor", pt: "Novo Roteiro", en: "New Script", es: "Nuevo Guion" },
];

export function SiteHeader() {
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
              Super<span className="text-primary">Template</span>
            </span>
          </Link>
        </div>

        {/* Navegação Principal (Desktop) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="hover:text-primary transition-colors whitespace-nowrap"
            >
              <Text pt={item.pt} en={item.en} es={item.es} />
            </Link>
          ))}
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
          
          <Avatar className="h-8 w-8 cursor-pointer border hover:border-primary transition-colors">
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>

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
                  <Link href="#components" className="text-lg font-medium hover:text-primary transition-colors">
                    <Text pt="Componentes" en="Components" es="Componentes" />
                  </Link>
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