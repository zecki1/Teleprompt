import Typo from "typo-js";

export interface SpellCheckResult {
  word: string;
  start: number;
  end: number;
  suggestions: string[];
}

const MIN_WORD_LENGTH = 2;

let typoInstance: Typo | null = null;
let loadingPromise: Promise<Typo> | null = null;
let listeners: Array<() => void> = [];

async function loadTypo(): Promise<Typo> {
  if (typoInstance) return typoInstance;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const [affRes, dicRes] = await Promise.all([
      fetch("/dictionaries/pt_BR/pt_BR.aff"),
      fetch("/dictionaries/pt_BR/pt_BR.dic"),
    ]);
    const [affData, dicData] = await Promise.all([
      affRes.text(),
      dicRes.text(),
    ]);
    typoInstance = new Typo("pt_BR", affData, dicData);
    listeners.forEach((fn) => fn());
    listeners = [];
    return typoInstance;
  })();

  return loadingPromise;
}

if (typeof window !== "undefined") {
  loadTypo();
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

const supplementalDictionary = new Set([
  // Portuguese hyphenated compounds (bem-, recém-, mal-, etc.)
  "bem-vindo", "bem-vinda", "bem-vindos", "bem-vindas",
  "bem-estar", "bem-me-quer", "bem-te-vi",
  "mal-estar", "maldito", "mal-agradecido",
  "recém-chegado", "recém-nascido", "recém-casado",
  "recém-chegada", "recém-nascida", "recém-casada",
  "recém-formado", "recém-eleito", "recém-contratado",
  "ex-aluno", "ex-aluna", "ex-presidente", "ex-diretor",
  "ex-marido", "ex-namorado", "ex-ministro",
  "vice-presidente", "vice-diretor", "vice-coordenador",
  "vice-reitor", "vice-campeão", "vice-governador",
  "pós-graduação", "pós-graduado", "pós-doutorado",
  "pré-requisito", "pré-requisitos",
  "pré-história", "pré-histórico",
  "pré-natal", "pré-escola", "pré-vestibular",
  "auto-ajuda", "auto-conhecimento",
  "auto-estima", "auto-imagem",
  "contra-ataque", "contra-ataques",
  "contra-indicação", "contra-indicado",
  "semi-automático", "semi-final", "semi-novo",
  "supra-sumo", "supra-sensível",
  "recém", "recém",

  // Domain-specific: video production and education
  "videoaula", "videoaulas",
  "videoconferência", "videoconferências",
  "videomonitor", "videomonitores",
  "videofone", "videofones",
  "teleprompter", "teleprompters",
  "teleprompter", "teleprompters",
  "supervisório", "supervisórios", "supervisória", "supervisórias",
  "microvariação", "microvariações",
  "microfone", "microfones",
  "micro-ondas",
  "macroeconomia", "macrogestão",
  "multimídia", "multimídias",
  "multidisciplinar", "multidisciplinares",
  "plurianual", "plurianuais",
  "semipresencial", "semipresenciais",
  "autoaprendizagem", "autoavaliação",
  "interdisciplinar", "interdisciplinares",
  "transversal", "transversais",

  // Common words and variations
  "gratuito", "gratuita", "gratuitos", "gratuitas",
  "gratuidade",
  "gratuito", "gratuita",
  "ortografia", "ortográfico", "ortográfica",
  "paralelo", "paralela", "paralelos", "paralelas",
  "paralelamente",
  "paralelismo",
  "supervisionar", "supervisionado", "supervisionou",
  "coordenadoria", "coordenadorias",
  "departamento", "departamentos",
  "departamental", "departamentais",
  "administrativo", "administrativa", "administrativos",
  "pedagógico", "pedagógica", "pedagógicos",
  "tecnológico", "tecnológica", "tecnológicos",
  "cientifico", "cientifica", "cientificos",
  "didático", "didática", "didático-pedagógico",

  // Numbers written in full
  "primeiro", "primeira", "primeiros", "primeiras",
  "segundo", "segunda", "segundos", "segundas",
  "terceiro", "terceira", "terceiros", "terceiras",
  "quarto", "quarta", "quartos", "quartas",
  "quinto", "quinta", "quintos", "quintas",
  "sexto", "sexta", "sextos", "sextas",
  "sétimo", "sétima", "sétimos", "sétimas",
  "oitavo", "oitava", "oitavos", "oitavas",
  "nono", "nona", "nonos", "nonas",
  "décimo", "décima", "décimos", "décimas",
  "vigésimo", "trigésimo", "quadragésimo",
  "quinquagésimo", "sexagésimo", "septuagésimo",
  "octogésimo", "nonagésimo", "centésimo",
  "milésimo", "milionésimo", "bilionésimo",

  // Days of week with lowercase (used in text)
  "segunda-feira", "terça-feira", "quarta-feira",
  "quinta-feira", "sexta-feira",
  "sábado", "domingo",
  "segundas-feiras", "terças-feiras", "quartas-feiras",
  "quintas-feiras", "sextas-feiras",
  "sábados", "domingos",

  // Months with lowercase (used in text)
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",

  // Temporal expressions
  "hoje", "ontem", "amanhã", "cedo", "tarde", "noite",
  "diariamente", "semanalmente", "mensalmente", "anualmente",
  "trimestralmente", "semestralmente",

  // Common verbs variations that might be missing
  "haver", "há", "houve", "houver", "houvesse",
  "advir", "advém", "advier", "advindo", "advinda",
  "intervir", "interveio", "intervindo",
  "conter", "conteve", "contendo", "contido",
  "deter", "deteve", "detendo", "detido",
  "manter", "manteve", "mantendo", "mantido",
  "abster", "absteve", "abstendo", "abstido",
  "obter", "obteve", "obtendo", "obtido",
  "rever", "reveja", "revisto", "revendo",
  "antever", "anteveja", "antevisto",
  "entrever", "entreveja",

  // Adjectives that change meaning
  "sensível", "sensíveis", "sensibilidade",
  "razoável", "razoáveis", "razoavelmente",
  "possível", "possíveis", "possivelmente",
  "acessível", "acessíveis", "acessibilidade",
  "visível", "visíveis", "visibilidade",
  "audível", "audíveis", "audibilidade",
  "legível", "legíveis", "legibilidade",
  "palatável", "palatáveis",
  "confortável", "confortáveis", "confortavelmente",
  "lamentável", "lamentáveis", "lamentavelmente",
  "notável", "notáveis", "notavelmente",
  "amável", "amáveis", "amavelmente",
  "saudável", "saudáveis",

  // Technical education terms
  "ementa", "ementas", "ementário",
  "ementa curricular", "ementas curriculares",
  "matriz curricular", "matrizes curriculares",
  "grade curricular", "grades curriculares",
  "plano de ensino", "planos de ensino",
  "projeto pedagógico", "projetos pedagógicos",
  "competência", "competências",
  "habilidade", "habilidades",
  "atividade", "atividades",
]);

export function checkText(text: string): SpellCheckResult[] {
  if (!text) return [];
  const typo = typoInstance;
  if (!typo) return [];

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
    if (checkWord(word, typo, supplementalDictionary)) continue;

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
