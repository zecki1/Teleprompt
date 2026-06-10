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
 * Divide texto em parágrafos (blocos separados por linhas em branco).
 */
function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Converte um texto bruto (geralmente vindo de uma colagem do Word) 
 * em um array de objetos Scene estruturados.
 */
export function parseScript(text: string, options?: ParseScriptOptions): Scene[] {
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
    for (const m of content.matchAll(/^\[img(\d+)\]\s*[:\-]\s*(https?:\/\/\S+)/img)) {
      const idx = parseInt(m[1]) - 1;
      if (images[idx] === undefined) images[idx] = m[2].trim();
    }
    for (const m of content.matchAll(/^\[url(\d+)\]\s*[:\-]\s*(https?:\/\/\S+)/img)) {
      const idx = parseInt(m[1]) - 1;
      if (sources[idx] === undefined) sources[idx] = m[2].trim();
    }
    for (const m of content.matchAll(/^\[let(\d+)\]\s*[:\-]\s*(.+)/img)) {
      const idx = parseInt(m[1]) - 1;
      if (lettering[idx] === undefined) lettering[idx] = m[2].trim();
    }
    opening = extractFirst(content, /^\[abe\]\s*[:\-]\s*(.+)/im);
    closing = extractFirst(content, /^\[enc\]\s*[:\-]\s*(.+)/im);
    time = extractFirst(content, /^(?:Tempo|Duração)\s*[:\-]\s*(.+)/im);

    // Remove todas as linhas de metadados estruturados para obter o spoken text
    const spokenText = content
      .replace(/^\[(?:img|url|let)\d+\]\s*[:\-]\s*.+/img, '')
      .replace(/^\[(?:abe|enc)\]\s*[:\-]\s*.+/img, '')
      .replace(/^(?:Tempo|Duração)\s*[:\-]\s*.+/img, '')
      .replace(/^\[?(?:Locução|Legenda)\]?\s*[:\-]\s*/img, '')
      .replace(/^\s*[\r\n]/gm, '')
      .trim();

    return { images, sources, lettering, opening, closing, spokenText, time };
  }
  
  // Divide o texto pelo delimitador "Cena" (ignora maiúsculas/minúsculas)
  const parts = text.split(/\bCena\b\s*(?:\[)?([0-9]+(?:-[a-zA-Z0-9]+)*)?(?:\])?\s*/i);
  
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
  if (scenes.length === 0 && text.trim().length > 0) {
    const ppScene = options?.paragraphsPerScene ?? 0;

    const paragraphs = splitParagraphs(text);
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
      const { images, sources, lettering, opening, closing, spokenText, time } = extractSceneData(text);
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