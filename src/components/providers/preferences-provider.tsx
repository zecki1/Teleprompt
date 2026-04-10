"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useTheme as useNextTheme } from "next-themes";

// Tipagens
type AccessibilityMode = "none" | "monochrome" | "protanopia" | "deuteranopia" | "tritanopia";
type FontFamily = "default" | "dyslexic";

interface PreferencesContextType {
    accessibilityMode: AccessibilityMode;
    setAccessibilityMode: (mode: AccessibilityMode) => void;
    fontSize: number;
    setFontSize: (size: number) => void;
    fontFamily: FontFamily;
    setFontFamily: (font: FontFamily) => void;
    theme: string | undefined;
    setTheme: (theme: string) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
    const { theme, setTheme } = useNextTheme();

    // Estados
    const [accessibilityMode, setAccessibilityModeState] = useState<AccessibilityMode>("none");
    const [fontSize, setFontSizeState] = useState<number>(16);
    const [fontFamily, setFontFamilyState] = useState<FontFamily>("default");
    const [mounted, setMounted] = useState(false);

    // Efeito ÚNICO de carregamento
    useEffect(() => {
        const timer = setTimeout(() => {
            const savedMode = localStorage.getItem("pref-mode") as AccessibilityMode;
            const savedSize = localStorage.getItem("pref-size");
            const savedFont = localStorage.getItem("pref-font") as FontFamily;

            if (savedMode) setAccessibilityModeState(savedMode);
            if (savedSize) setFontSizeState(Number(savedSize));
            if (savedFont) setFontFamilyState(savedFont);

            setMounted(true);
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    // Efeito para aplicar classes no DOM
    useEffect(() => {
        if (!mounted) return;

        const root = document.documentElement;
        const body = document.body;

        // 1. Aplicar Fonte
        if (fontFamily === "dyslexic") body.classList.add("font-dyslexic");
        else body.classList.remove("font-dyslexic");

        // 2. Aplicar Tamanho
        root.style.fontSize = `${fontSize}px`;

        // 3. Aplicar Filtros de Cor
        body.classList.remove("mode-monochrome", "mode-protanopia", "mode-deuteranopia", "mode-tritanopia");
        if (accessibilityMode !== "none") body.classList.add(`mode-${accessibilityMode}`);

    }, [fontFamily, fontSize, accessibilityMode, mounted]);

    // Setters com persistência
    const setAccessibilityMode = (m: AccessibilityMode) => { setAccessibilityModeState(m); localStorage.setItem("pref-mode", m); };
    const setFontSize = (s: number) => { setFontSizeState(s); localStorage.setItem("pref-size", s.toString()); };
    const setFontFamily = (f: FontFamily) => { setFontFamilyState(f); localStorage.setItem("pref-font", f); };

    // Evita renderizar filhos até montar para não dar erro de hidratação
    if (!mounted) {
        return <div className="min-h-screen bg-background" />;
    }

    return (
        <PreferencesContext.Provider value={{
            accessibilityMode, setAccessibilityMode,
            fontSize, setFontSize,
            fontFamily, setFontFamily,
            theme, setTheme
        }}>
            {children}
        </PreferencesContext.Provider>
    );
}

export function usePreferences() {
    const context = useContext(PreferencesContext);
    if (!context) throw new Error("usePreferences must be used within a PreferencesProvider");
    return context;
}

// Exportação do Componente Text (Simplificado para Português)
export function Text({ pt, className }: { pt: string; en?: string; es?: string; className?: string }) {
    return <span className={className}>{pt}</span>;
}