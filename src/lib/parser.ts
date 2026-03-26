export interface Scene {
  id: string;
  sceneNumber: string;
  time?: string | null;
  imageUrl?: string | null;     // Tag img: (miniatura)
  images?: string[];            // Múltiplas imagens
  sourceUrl?: string | null;    // Tag url: (download)
  lettering?: string | null;    // Tag let: (lettering)
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
  
  // Divide o texto pelo delimitador "Cena" (ignora maiúsculas/minúsculas)
  const parts = text.split(/Cena\s*(?:\[)?([\w\d]+(?:-\w+)*)?(?:\])?\s*/i);
  
  for (let i = 1; i < parts.length; i += 2) {
    const sceneNumber = parts[i] ? parts[i].trim() : String(Math.floor(i / 2) + 1);
    const content = parts[i + 1] || "";
    
    // MÉTODO A: Busca por Labels Estritos
    const labels = [
      { key: "time", label: "Tempo|Duração" },
      { key: "description", label: "Descrição" },
      { key: "onScreenText", label: "Texto em tela|GC" },
      { key: "imageUrl", label: "img|Link da imagem|Imagem" },
      { key: "sourceUrl", label: "url|Download|Link" },
      { key: "lettering", label: "let|Letreiro|Lettering" },
      { key: "spokenText", label: "Locução | Legenda|Locução" },
      { key: "pronunciation", label: "Pronúncia" },
    ];

    const foundLabels = labels.flatMap(l => {
      const escapedLabel = l.label.replace(/\|/g, '\\|');
      const regexStr = `^\\s*[-]?\\s*(${escapedLabel})\\s*[:\\-]?\\s*`;
      const regex = new RegExp(regexStr, 'im');
      const match = content.match(regex);
      
      if (match) {
        return [{
          key: l.key,
          matchIndex: match.index!,
          contentStartIndex: match.index! + match[0].length,
        }];
      }
      return [];
    }).sort((a, b) => a.matchIndex - b.matchIndex);

    if (foundLabels.length > 0) {
      const result: Record<string, string> = {};
      for (let j = 0; j < foundLabels.length; j++) {
        const current = foundLabels[j];
        const next = foundLabels[j + 1];
        let fieldText = "";
        
        if (next) {
          fieldText = content.substring(current.contentStartIndex, next.matchIndex).trim();
        } else {
          fieldText = content.substring(current.contentStartIndex).trim();
        }
        
        // Formatação especial para lettering: 
        // Se encontrar [1], [2], etc., garante que fiquem em linhas separadas para o editor
        if (current.key === "lettering") {
          fieldText = fieldText.replace(/(\[\d+\])/g, '\n$1').trim();
        }

        result[current.key] = result[current.key] 
          ? result[current.key] + "\n" + fieldText 
          : fieldText;
      }

      scenes.push({
        id: crypto.randomUUID(),
        sceneNumber,
        time: result.time || null,
        imageUrl: result.imageUrl || null,
        sourceUrl: result.sourceUrl || null,
        lettering: result.lettering || null,
        description: result.description || null,
        onScreenText: result.onScreenText || null,
        spokenText: result.spokenText || null,
        pronunciation: result.pronunciation || null,
      });

    } else {
      // MÉTODO B: Fallback Posicional (Tempo -> Texto -> img -> url -> let)
      const rawLines = content.split('\n');
      const lines = rawLines
        .map(l => l.trim().replace(/[\u202F\u00A0\u2000-\u200A]/g, ''))
        .filter(l => l.length > 0);
      
      if (lines.length === 0) continue;
      
      let time: string | null = null;
      let imageUrl: string | null = null;
      let sourceUrl: string | null = null;
      let lettering: string | null = null;
      const textParts: string[] = [];
      
      lines.forEach(line => {
        const lowerLine = line.toLowerCase();

        // 1. Verifica se é tempo (ex: 0-20s ou 00:10)
        if (line.match(/^[\d:.\-s]+$/i) && !time) {
          time = line;
        } 
        // 2. Verifica se é img:
        else if (lowerLine.startsWith('img:')) {
          imageUrl = line.replace(/^img:\s*/i, '').trim();
        }
        // 3. Verifica se é url:
        else if (lowerLine.startsWith('url:')) {
          sourceUrl = line.replace(/^url:\s*/i, '').trim();
        }
        // 4. Verifica se é let:
        else if (lowerLine.startsWith('let:')) {
          // Formata letreiro para garantir que [1] [2] fiquem em linhas separadas
          lettering = line.replace(/^let:\s*/i, '').replace(/(\[\d+\])/g, '\n$1').trim();
        }
        // 5. Se for uma URL pura sem tag
        else if (line.match(/^https?:\/\/[^\s]+$/i)) {
          if (!imageUrl && (lowerLine.includes('.jpg') || lowerLine.includes('.png') || lowerLine.includes('.webp') || lowerLine.includes('.envatousercontent'))) {
             imageUrl = line;
          } else if (!sourceUrl) {
             sourceUrl = line;
          }
        }
        // 6. O que sobrar é Locução / Texto
        else {
          textParts.push(line);
        }
      });
      
      scenes.push({
         id: crypto.randomUUID(),
         sceneNumber,
         time,
         imageUrl,
         sourceUrl,
         lettering,
         spokenText: textParts.join('\n').trim() || null,
         description: null,
         onScreenText: null,
         pronunciation: null
      });
    }
  }
  
  // Caso de segurança: se houver texto mas nenhuma tag "Cena", assume cena 1
  if (scenes.length === 0 && text.trim().length > 0) {
    scenes.push({ 
      id: crypto.randomUUID(), 
      sceneNumber: "1", 
      spokenText: text.trim() 
    });
  }

  return scenes;
}