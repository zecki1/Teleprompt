export interface Scene {
  id: string;
  sceneNumber: string;
  time?: string | null;
  imageUrl?: string | null;     // Tag img: (miniatura)
  images?: string[];            // Múltiplas imagens
  sourceUrl?: string | null;    // Tag url: (principal)
  sources?: string[];           // Múltiplas URLs adicionais
  lettering?: string | null;    // Tag let: (lettering)
  opening?: string | null;      // Tag abe: (abertura)
  closing?: string | null;      // Tag enc: (encerramento)
  observation?: string | null;  // Observação interna
  description?: string | null;
  onScreenText?: string | null;
  spokenText?: string | null;
  pronunciation?: string | null;
}

export interface ParseScriptOptions {
  paragraphsPerScene?: number;
}

/**
 * Divide texto em parágrafos.
 * Tenta primeiro separar por linhas em branco (\n\n).
 * Se não encontrar, separa por quebra de linha simples (\n).
 */
function splitParagraphs(text: string): string[] {
  const byBlank = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (byBlank.length > 1) return byBlank;

  return text
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Converte um texto bruto (geralmente vindo de uma colagem do Word) 
 * em um array de objetos Scene estruturados.
 */
export function parseScript(text: string, options?: ParseScriptOptions): Scene[] {
  // Normalizar texto vindo do Word:
  // 1. \r\n → \n e \r solo → \n (Word usa \r\n no Windows, \r no Mac antigo)
  // 2. \u00A0 (non-breaking space) → espaço normal (Word usa em textos justificados)
  // 3. Outros Unicode whitespace → espaço normal
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/g, ' ');

  const scenes: Scene[] = [];
  
  // Extrai o primeiro match de um padrão (ou null)
  function extractFirst(content: string, pattern: RegExp): string | null {
    const match = content.match(pattern);
    return match ? match[1].trim() : null;
  }

  function extractSceneData(content: string): { images: string[]; sources: string[]; lettering: string[]; opening: string | null; closing: string | null; spokenText: string; time: string | null } {
    const images: string[] = [];
    const sources: string[] = [];
    const lettering: string[] = [];
    let opening: string | null = null;
    let closing: string | null = null;
    let time: string | null = null;

    // Usa matchAll com flag m (multiline) para buscar no texto completo
    // sem precisar dividir em linhas manualmente
    // Nota: ^ com flag m + \s* permite espaços iniciais (indentação)
    for (const m of content.matchAll(/^\s*\[img(\d+)\]\s*[:\-]\s*(https?:\/\/\S+)/img)) {
      const idx = parseInt(m[1]) - 1;
      if (images[idx] === undefined) images[idx] = m[2].trim();
    }
    for (const m of content.matchAll(/^\s*\[url(\d+)\]\s*[:\-]\s*(https?:\/\/\S+)/img)) {
      const idx = parseInt(m[1]) - 1;
      if (sources[idx] === undefined) sources[idx] = m[2].trim();
    }
    for (const m of content.matchAll(/^\s*\[let(\d+)\]\s*[:\-]\s*(.+)/img)) {
      const idx = parseInt(m[1]) - 1;
      if (lettering[idx] === undefined) lettering[idx] = m[2].trim();
    }
    opening = extractFirst(content, /^\s*\[abe\]\s*[:\-]\s*(.+)/im);
    closing = extractFirst(content, /^\s*\[enc\]\s*[:\-]\s*(.+)/im);
    time = extractFirst(content, /^\s*(?:Tempo|Duração)\s*[:\-]\s*(.+)/im);

    // Remove todas as linhas de metadados estruturados para obter o spoken text
    const spokenText = content
      .replace(/^\s*\[(?:img|url|let)\d+\]\s*[:\-]\s*.+/img, '')
      .replace(/^\s*\[(?:abe|enc)\]\s*[:\-]\s*.+/img, '')
      .replace(/^\s*(?:Tempo|Duração)\s*[:\-]\s*.+/img, '')
      .replace(/^\s*\[?(?:Locução|Legenda)\]?\s*[:\-]\s*/img, '')
      .replace(/^\s*[\r\n]/gm, '')
      .trim();

    return { images, sources, lettering, opening, closing, spokenText, time };
  }
  
  // Divide o texto pelo delimitador "Cena" (apenas no início da linha)
  // Nota: (?:^|\n) evita falsos positivos como "cena" no meio do texto
  // Agora também aceita "CENA", "Cena:" (com dois-pontos opcional) e "Cena1" (sem espaço)
  const parts = normalized.split(/(?:^|\n)\s*Cena\b\s*:?\s*(?:\[)?([0-9]+(?:-[a-zA-Z0-9]+)*)(?:\])?\s*/i);
  
  for (let i = 1; i < parts.length; i += 2) {
    const sceneNumber = parts[i] ? parts[i].trim() : String(Math.floor(i / 2) + 1);
    const rawContent = parts[i + 1] || "";
    
    // Usa a nova função de extração
    const { images, sources, lettering, opening, closing, spokenText, time } = extractSceneData(rawContent);
    
    scenes.push({
      id: crypto.randomUUID(),
      sceneNumber,
      time,
      imageUrl: images[0] || null,
      images: images.length > 1 ? images.slice(1) : undefined,
      sourceUrl: sources[0] || null,
      sources: sources.length > 1 ? sources.slice(1) : undefined,
      lettering: lettering.length > 0 ? lettering.join('\n') : null,
      opening,
      closing,
      spokenText: spokenText || null,
      description: null,
      onScreenText: null,
      pronunciation: null,
    });
  }
  
  // Caso de segurança: se houver texto mas nenhuma tag "Cena", assume cena 1
  if (scenes.length === 0 && normalized.trim().length > 0) {
    const ppScene = options?.paragraphsPerScene ?? 0;

    const paragraphs = splitParagraphs(normalized);
    const autoSplit = ppScene === 0 && paragraphs.length >= 4;
    if (ppScene > 0 || autoSplit) {
      const n = autoSplit ? 2 : ppScene;
      const groups: string[] = [];
      for (let i = 0; i < paragraphs.length; i += n) {
        groups.push(paragraphs.slice(i, i + n).join('\n\n'));
      }
      for (let g = 0; g < groups.length; g++) {
        const { images, sources, lettering, opening, closing, spokenText, time } = extractSceneData(groups[g]);
        scenes.push({
          id: crypto.randomUUID(),
          sceneNumber: String(g + 1),
          time,
          imageUrl: images[0] || null,
          images: images.length > 1 ? images.slice(1) : undefined,
          sourceUrl: sources[0] || null,
          sources: sources.length > 1 ? sources.slice(1) : undefined,
          lettering: lettering.length > 0 ? lettering.join('\n') : null,
          opening,
          closing,
          spokenText: spokenText || null,
          description: null,
          onScreenText: null,
          pronunciation: null,
        });
      }
    } else {
      const { images, sources, lettering, opening, closing, spokenText, time } = extractSceneData(normalized);
      const sceneObj: Scene = { 
        id: crypto.randomUUID(), 
        sceneNumber: "1", 
        time,
        imageUrl: images[0] || null,
        images: images.length > 1 ? images.slice(1) : undefined,
        sourceUrl: sources[0] || null,
        sources: sources.length > 1 ? sources.slice(1) : undefined,
        lettering: lettering.length > 0 ? lettering.join('\n') : null,
        opening,
        closing,
        spokenText: spokenText || null,
        description: null,
        onScreenText: null,
        pronunciation: null,
      };
      scenes.push(sceneObj);
    }
  }

  return scenes;
}