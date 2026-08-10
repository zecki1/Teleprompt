export type TPScrollMode = "paragraph" | "scene" | "middle" | "all";

export const TP_SCROLL_MODES: { value: TPScrollMode; label: string; hint: string }[] = [
  { value: "paragraph", label: "Parágrafo", hint: "Sobe/desce um parágrafo (meia tela)" },
  { value: "scene", label: "Cena", hint: "Pula para a cena anterior/próxima" },
  { value: "middle", label: "Meio da Cena", hint: "Vai para o centro da cena" },
  { value: "all", label: "Avançar Todos", hint: "Passos curtos por todo o roteiro" },
];

export type TPActionId =
  | "playPause"
  | "prevScene"
  | "nextScene"
  | "prevParagraph"
  | "nextParagraph"
  | "middleScene"
  | "home"
  | "speedUp"
  | "speedDown";

export const TP_ACTION_LABELS: Record<TPActionId, string> = {
  playPause: "Play / Pausar",
  prevScene: "Cena anterior",
  nextScene: "Próxima cena",
  prevParagraph: "Parágrafo anterior",
  nextParagraph: "Próximo parágrafo",
  middleScene: "Meio da cena",
  home: "Voltar ao início",
  speedUp: "Aumentar velocidade",
  speedDown: "Diminuir velocidade",
};

export type TPBindings = Record<TPActionId, string[]>;

/** Matchers por código de tecla (KeyboardEvent.code) — valores padrão de fábrica. */
export const DEFAULT_TP_BINDINGS: TPBindings = {
  playPause: ["Space", "F5", "KeyB", "KeyP"],
  prevScene: ["ArrowUp", "KeyW", "BracketLeft"],
  nextScene: ["ArrowDown", "KeyS", "BracketRight"],
  prevParagraph: ["Comma"],
  nextParagraph: ["Period"],
  middleScene: ["KeyM"],
  home: ["Home"],
  speedUp: ["Equal", "NumpadAdd", "PageDown", "ArrowRight", "KeyD"],
  speedDown: ["Minus", "NumpadSubtract", "PageUp", "ArrowLeft", "KeyA"],
};

/**
 * Uma ação casa quando o matcher for o `code` da tecla OU (para caracteres)
 * for igual a `e.key`.
 */
export function matchesBinding(matcher: string, e: { key: string; code: string }): boolean {
  if (matcher === "Space") return e.code === "Space";
  if (matcher === e.code) return true;
  if (matcher === e.key) return true;
  return matcher.length === 1 && e.key.length === 1 && matcher.toLowerCase() === e.key.toLowerCase();
}

export function getEffectiveBindings(userShortcuts?: Partial<Record<TPActionId, string>>): TPBindings {
  const bindings: TPBindings = JSON.parse(JSON.stringify(DEFAULT_TP_BINDINGS));
  if (!userShortcuts) return bindings;
  for (const [action, key] of Object.entries(userShortcuts) as [TPActionId, string | undefined][]) {
    if (key && DEFAULT_TP_BINDINGS[action]) {
      // Override pessoal do usuário substitui a lista inteira por uma única tecla.
      bindings[action] = [key];
    }
  }
  return bindings;
}

export function findActionForEvent(bindings: TPBindings, e: { key: string; code: string }): TPActionId | null {
  for (const [action, matchers] of Object.entries(bindings) as [TPActionId, string[]][]) {
    if (matchers.some((m) => matchesBinding(m, e))) return action;
  }
  return null;
}

export function formatKey(matcher: string): string {
  const keyMap: Record<string, string> = {
    Space: "Espaço",
    F5: "F5",
    Home: "Home",
    ArrowUp: "↑",
    ArrowDown: "↓",
    ArrowLeft: "←",
    ArrowRight: "→",
    PageUp: "PgUp",
    PageDown: "PgDn",
    Equal: "+",
    NumpadAdd: "Num+",
    NumpadSubtract: "Num-",
    Minus: "-",
    Comma: ",",
    Period: ".",
    BracketLeft: "[",
    BracketRight: "]",
  };
  if (keyMap[matcher]) return keyMap[matcher];
  if (matcher.startsWith("Key")) return matcher.replace("Key", "");
  return matcher;
}
