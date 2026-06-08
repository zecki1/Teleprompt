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
const loadingPromise: Promise<void> | null = null;
let listeners: Array<() => void> = [];

async function loadDictionaries(): Promise<void> {
  if (typoInstance) return;

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

  typoInstance = new Typo("pt_BR", affData, dicData);
  supplementalSet = new Set(supData.split("\n").map((w) => w.trim().toLowerCase()).filter(Boolean));
  listeners.forEach((fn) => fn());
  listeners = [];
}

if (typeof window !== "undefined") {
  loadDictionaries();
}

export function isSpellCheckReady(): boolean {
  return typoInstance !== null;
}

export function onSpellCheckReady(fn: () => void): () => void {
  if (typoInstance) {
    fn();
    return () => {};
  }
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

export function checkText(text: string): SpellCheckResult[] {
  if (!text) return [];
  const typo = typoInstance;
  const supplemental = supplementalSet;
  if (!typo || !supplemental) return [];

  const results: SpellCheckResult[] = [];
  const letters = /[a-zA-Zà-üÀ-ÜçÇã-õÃ-Õ]/;
  let i = 0;

  while (i < text.length) {
    if (!letters.test(text[i])) {
      i++;
      continue;
    }
    const start = i;
    while (i < text.length && letters.test(text[i])) {
      i++;
    }
    const word = text.slice(start, i);
    if (word.length < MIN_WORD_LENGTH) continue;
    if (checkWord(word, typo, supplemental)) continue;

    const suggestions = typo
      .suggest(word)
      .slice(0, 4)
      .filter((s: string) => s.toLowerCase() !== word.toLowerCase());
    results.push({
      word,
      start,
      end: i,
      suggestions,
    });
  }

  return results;
}
