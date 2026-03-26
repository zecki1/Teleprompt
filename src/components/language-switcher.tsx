"use client";

import { usePreferences } from "@/components/providers/preferences-provider";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";

const languages = {
    pt: { label: "Português", flag: "🇧🇷" },
    en: { label: "English", flag: "🇺🇸" },
    es: { label: "Español", flag: "🇪🇸" },
};

export function LanguageSwitcher() {
    const { language, setLanguage } = usePreferences();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Globe className="h-[1.2rem] w-[1.2rem]" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {Object.entries(languages).map(([key, value]) => (
                    <DropdownMenuItem
                        key={key}
                        // @ts-expect-error - Chave é segura aqui
                        onClick={() => setLanguage(key)}
                        className="gap-2 cursor-pointer"
                    >
                        <span className="text-lg">{value.flag}</span>
                        <span>{value.label}</span>
                        {language === key && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}