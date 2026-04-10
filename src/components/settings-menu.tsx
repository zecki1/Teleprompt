import { usePreferences } from "@/components/providers/preferences-provider";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import {
    Accessibility,
    Type as TypeIcon,
    Eye,
    RotateCcw,
    Palette
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Definindo o tipo localmente para garantir a tipagem correta no cast
type AccessibilityMode = "none" | "monochrome" | "protanopia" | "deuteranopia" | "tritanopia";

export const SettingsMenu = () => {
    const {
        accessibilityMode, setAccessibilityMode,
        fontSize, setFontSize,
        fontFamily, setFontFamily,
        theme, setTheme
    } = usePreferences();

    const resetSettings = () => {
        setAccessibilityMode("none");
        setFontSize(16);
        setFontFamily("default");
        setTheme("system");
    };

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                    <Accessibility className="h-[1.2rem] w-[1.2rem]" />
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[350px] sm:w-[400px] overflow-y-auto px-4 border-l border-zinc-200 dark:border-zinc-800">
                <SheetHeader>
                    <SheetTitle>Acessibilidade & Aparência</SheetTitle>
                    <SheetDescription>
                        Personalize sua experiência visual no Teleprompt.
                    </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-8">
                    {/* SEÇÃO FONTE */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-widest">
                            <TypeIcon className="h-4 w-4" />
                            Tipografia
                        </div>
                        <div className="space-y-4 rounded-2xl border p-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="dyslexic" className="font-medium">Modo Disléxico (OpenDyslexic)</Label>
                                <Switch
                                    id="dyslexic"
                                    checked={fontFamily === "dyslexic"}
                                    onCheckedChange={(checked) => setFontFamily(checked ? "dyslexic" : "default")}
                                />
                            </div>
                            <Separator />
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <Label className="font-medium">Tamanho da Fonte</Label>
                                    <span className="text-xs font-bold text-primary">{fontSize}px</span>
                                </div>
                                <Slider
                                    value={[fontSize]}
                                    onValueChange={(val) => setFontSize(val[0])}
                                    min={12} max={24} step={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO CORES */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-widest">
                            <Palette className="h-4 w-4" />
                            Aparência
                        </div>
                        <div className="rounded-2xl border p-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                            <div className="grid grid-cols-3 gap-2">
                                {(['light', 'dark', 'system'] as const).map((mode) => (
                                    <Button
                                        key={mode}
                                        variant={theme === mode ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setTheme(mode)}
                                        className="capitalize rounded-xl font-bold"
                                    >
                                        {mode === 'light' ? 'Claro' : mode === 'dark' ? 'Escuro' : 'Sistema'}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3 rounded-2xl border p-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                            <Label className="flex items-center gap-2 mb-2 font-medium">
                                <Eye className="h-4 w-4" />
                                Modos de Daltonismo
                            </Label>
                            <RadioGroup
                                value={accessibilityMode}
                                onValueChange={(val) => setAccessibilityMode(val as AccessibilityMode)}
                            >
                                <div className="grid grid-cols-1 gap-2">
                                    {[
                                        { id: "none", l: "Normal" },
                                        { id: "monochrome", l: "Monocromático" },
                                        { id: "protanopia", l: "Protanopia" },
                                        { id: "deuteranopia", l: "Deuteranopia" },
                                        { id: "tritanopia", l: "Tritanopia" }
                                    ].map((m) => (
                                        <div key={m.id} className="flex items-center space-x-2 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-transparent hover:border-primary/20 transition-all">
                                            <RadioGroupItem value={m.id} id={m.id} />
                                            <Label htmlFor={m.id} className="font-medium cursor-pointer w-full text-sm">{m.l}</Label>
                                        </div>
                                    ))}
                                </div>
                            </RadioGroup>
                        </div>
                    </div>

                    <Button variant="destructive" className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px]" onClick={resetSettings}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Resetar Preferências
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};