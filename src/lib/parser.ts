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

/**
 * Converte um texto bruto (geralmente vindo de uma colagem do Word) 
 * em um array de objetos Scene estruturados.
 */
export function parseScript(text: string): Scene[] {
  const scenes: Scene[] = [];
  
  // Função para extrair referências no novo formato:
  // [img1]: https://...
  // [url1]: https://...
  // [let1]: Texto
  // [let2]: Texto 2
  // [abe]: Abertura
  // [enc]: Encerramento
  // Locução: Olá! [let1] texto [img1]
  function extractSceneData(content: string): { images: string[]; sources: string[]; lettering: string[]; opening: string | null; closing: string | null; spokenText: string; time: string | null } {
    const images: string[] = [];
    const sources: string[] = [];
    const lettering: string[] = [];
    let opening: string | null = null;
    let closing: string | null = null;
    let spokenText = '';
    let time: string | null = null;
    
    // Divide em linhas
    const lines = content.split('\n');
    let inSpokenText = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detectar [img1]: https://...
      const imgMatch = trimmedLine.match(/^\[img(\d+)\]\s*[:\-]\s*(https?:\/\/\S+)/i);
      if (imgMatch) {
        const index = parseInt(imgMatch[1]) - 1;
        if (images[index] === undefined) {
          images[index] = imgMatch[2].trim();
        }
        continue;
      }
      
      // Detectar [url1]: https://...
      const urlMatch = trimmedLine.match(/^\[url(\d+)\]\s*[:\-]\s*(https?:\/\/\S+)/i);
      if (urlMatch) {
        const index = parseInt(urlMatch[1]) - 1;
        if (sources[index] === undefined) {
          sources[index] = urlMatch[2].trim();
        }
        continue;
      }
      
      // Detectar [let1]: Texto
      const letMatch = trimmedLine.match(/^\[let(\d+)\]\s*[:\-]\s*(.+)/i);
      if (letMatch) {
        const index = parseInt(letMatch[1]) - 1;
        if (lettering[index] === undefined) {
          lettering[index] = letMatch[2].trim();
        }
        continue;
      }

      // Detectar [abe]: Abertura
      const abeMatch = trimmedLine.match(/^\[abe\]\s*[:\-]\s*(.+)/i);
      if (abeMatch) {
        opening = abeMatch[1].trim();
        continue;
      }

      // Detectar [enc]: Encerramento
      const encMatch = trimmedLine.match(/^\[enc\]\s*[:\-]\s*(.+)/i);
      if (encMatch) {
        closing = encMatch[1].trim();
        continue;
      }
      
      // Detectar Tempo: ou Duração:
      const timeMatch = trimmedLine.match(/^(?:Tempo|Duração)\s*[:\-]\s*(.+)/i);
      if (timeMatch && !time) {
        time = timeMatch[1].trim();
        continue;
      }
      
      // Detectar início do spoken text ([Locução]: ou [Legenda]: ou Locução: ou Legenda:)
      if (trimmedLine.match(/^\[?(?:Locução|Legenda)\]?\s*[:\-]\s*/i)) {
        inSpokenText = true;
        spokenText = trimmedLine.replace(/^\[?(?:Locução|Legenda)\]?\s*[:\-]\s*/i, '').trim();
        continue;
      }
      
      // Se já está em modo spoken text, continua acumulando
      if (inSpokenText && trimmedLine) {
        spokenText += '\n' + trimmedLine;
        continue;
      }
      
      // Se não tem nenhum label e não é uma referência, é parte do spoken text
      if (!trimmedLine.match(/^\[(?:img|url|let|abe|enc)\d*\]/i) && 
          !trimmedLine.match(/^(?:Tempo|Duração)\s*[:\-]/i) &&
          trimmedLine) {
        // Primeira linha sem label = começa o spoken text
        inSpokenText = true;
        spokenText = trimmedLine;
      }
    }
    
    return { images, sources, lettering, opening, closing, spokenText, time };
  }
  
  // Divide o texto pelo delimitador "Cena" (ignora maiúsculas/minúsculas)
  const parts = text.split(/Cena\s*(?:\[)?([0-9]+(?:-[a-zA-Z0-9]+)*)?(?:\])?\s*/i);
  
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
    };
    scenes.push(sceneObj);
  }

  return scenes;
}