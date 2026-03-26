export interface Scene {
  id: string;
  sceneNumber: string;
  time?: string | null;
  imageUrl?: string | null;     // Tag img: (miniatura)
  sourceUrl?: string | null;    // Tag url: (download)
  description?: string | null;
  onScreenText?: string | null;
  spokenText?: string | null;
  pronunciation?: string | null;
}

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
        result[current.key] = fieldText;
      }

      scenes.push({
        id: crypto.randomUUID(),
        sceneNumber,
        time: result.time || null,
        imageUrl: result.imageUrl || null,
        sourceUrl: result.sourceUrl || null,
        description: result.description || null,
        onScreenText: result.onScreenText || null,
        spokenText: result.spokenText || null,
        pronunciation: result.pronunciation || null,
      });

    } else {
      // MÉTODO B: Fallback Posicional (Tempo -> Texto -> img -> url)
      const rawLines = content.split('\n');
      const lines = rawLines
        .map(l => l.trim().replace(/[\u202F\u00A0\u2000-\u200A]/g, ''))
        .filter(l => l.length > 0);
      
      if (lines.length === 0) continue;
      
      let time: string | null = null;
      let imageUrl: string | null = null;
      let sourceUrl: string | null = null;
      const textParts: string[] = [];
      
      lines.forEach(line => {
        // Verifica se é tempo (ex: 0-20s ou 00:10)
        if (line.match(/^[\d:.\-s]+$/i) && !time) {
          time = line;
        } 
        // Verifica se é img:
        else if (line.toLowerCase().startsWith('img:')) {
          imageUrl = line.replace(/^img:\s*/i, '').trim();
        }
        // Verifica se é url:
        else if (line.toLowerCase().startsWith('url:')) {
          sourceUrl = line.replace(/^url:\s*/i, '').trim();
        }
        // Se for uma URL pura sem tag
        else if (line.match(/^https?:\/\/[^\s]+$/i)) {
          if (!imageUrl) imageUrl = line;
          else if (!sourceUrl) sourceUrl = line;
        }
        // O que sobrar é Locução
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
         spokenText: textParts.join('\n').trim() || null,
         description: null,
         onScreenText: null,
         pronunciation: null
      });
    }
  }
  
  if (scenes.length === 0 && text.trim().length > 0) {
    scenes.push({ id: crypto.randomUUID(), sceneNumber: "1", spokenText: text.trim() });
  }

  return scenes;
}