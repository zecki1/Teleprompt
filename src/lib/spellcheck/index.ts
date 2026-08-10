import Typo from "typo-js";

export interface SpellCheckResult {
  word: string;
  start: number;
  end: number;
  suggestions: string[];
}

const MIN_WORD_LENGTH = 2;

let typoInstance: Typo | null = null;
let supplementalSet: Set<string> | null = null;
let loadingPromise: Promise<void> | null = null;
let listeners: Array<() => void> = [];

async function loadDictionaries(): Promise<void> {
  if (typoInstance) return;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const [affRes, dicRes, supRes] = await Promise.all([
      fetch("/dictionaries/pt_BR/pt_BR.aff"),
      fetch("/dictionaries/pt_BR/pt_BR.dic"),
      fetch("/dictionaries/pt_BR/supplemental.dic"),
    ]);

    const [affData, dicData, supData] = await Promise.all([
      affRes.text(),
      dicRes.text(),
      supRes.text(),
    ]);

    // Cede ao event loop antes do parse síncrono do Typo para não travar a UI
    await new Promise<void>((resolve) => setTimeout(resolve, 0));

    typoInstance = new Typo("pt_BR", affData, dicData);
    supplementalSet = new Set(supData.split("\n").map((w) => w.trim().toLowerCase()).filter(Boolean));
    listeners.forEach((fn) => fn());
    listeners = [];
  })().catch((err) => {
    loadingPromise = null;
    throw err;
  });

  return loadingPromise;
}

export function isSpellCheckReady(): boolean {
  return typoInstance !== null;
}

export function onSpellCheckReady(fn: () => void): () => void {
  if (typoInstance) {
    fn();
    return () => {};
  }
  // Inicia o download dos dicionários só quando alguém realmente precisa
  loadDictionaries();
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

function checkWord(word: string, typo: Typo, supplemental: Set<string>): boolean {
  if (supplemental.has(word.toLowerCase())) return true;
  if (typo.check(word)) return true;
  if (word.includes("-")) {
    const parts = word.split("-").filter(Boolean);
    if (parts.length > 1 && parts.every((p) => checkWord(p, typo, supplemental))) return true;
  }
  return false;
}

/**
 * Núcleo puro da verificação ortográfica. Recebe uma instância Typo já
 * carregada e o conjunto suplementar — permite testes unitários com os
 * dicionários reais sem depender de `fetch`.
 */
export function checkTextWith(
  typo: Typo,
  supplemental: Set<string>,
  text: string
): SpellCheckResult[] {
  if (!text) return [];

  const results: SpellCheckResult[] = [];

  for (const match of text.matchAll(/\p{L}+/gu)) {
    const word = match[0];
    if (word.length < MIN_WORD_LENGTH) continue;
    if (checkWord(word, typo, supplemental)) continue;

    const suggestions = typo
      .suggest(word)
      .slice(0, 4)
      .filter((s: string) => s.toLowerCase() !== word.toLowerCase());
    results.push({
      word,
      start: match.index,
      end: match.index + word.length,
      suggestions,
    });
  }

  return results;
}

export function checkText(text: string): SpellCheckResult[] {
  if (!text) return [];
  const typo = typoInstance;
  const supplemental = supplementalSet;
  if (!typo || !supplemental) return [];
  return checkTextWith(typo, supplemental, text);
}
