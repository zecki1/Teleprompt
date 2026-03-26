export interface Scene {
  id: string;
  sceneNumber: string;
  description?: string | null;
  onScreenText?: string | null;
  spokenText?: string | null;
  pronunciation?: string | null;
}

export function parseScript(text: string): Scene[] {
  const scenes: Scene[] = [];
  
  // Split using the exact word "Cena" ignoring case.
  const parts = text.split(/Cena\s*(?:\[)?([\w\d]+(?:-\w+)*)?(?:\])?\s*/i);
  
  for (let i = 1; i < parts.length; i += 2) {
    const sceneNumber = parts[i] ? parts[i].trim() : String(Math.floor(i / 2) + 1);
    const content = parts[i + 1] || "";
    
    // Method A: Try Strict Label-based parsing first
    const labels = [
      { key: "description", label: "Descrição" },
      { key: "onScreenText", label: "Texto em tela" },
      { key: "spokenText", label: "Locução | Legenda" },
      { key: "pronunciation", label: "Pronúncia" },
      { key: "spokenTextAlternative", label: "Locução" }
    ];

    const foundLabels = labels.map(l => {
      const escapedLabel = l.label.replace(/\|/g, '\\|');
      const regexStr = `^\\s*${escapedLabel}.*$`;
      const regex = new RegExp(regexStr, 'im');
      const match = content.match(regex);
      return {
        key: l.key === "spokenTextAlternative" ? "spokenText" : l.key,
        matchIndex: match ? match.index! : -1,
        contentStartIndex: match ? match.index! + match[0].length : -1,
      };
    }).filter(l => l.matchIndex !== -1).sort((a, b) => a.matchIndex - b.matchIndex);

    if (foundLabels.length > 0) {
        // Label format matched
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
          description: result.description || null,
          onScreenText: result.onScreenText || null,
          spokenText: result.spokenText || null,
          pronunciation: result.pronunciation || null,
        });

    } else {
        // Method B: Positional Fallback for Word Table copy-paste
        const rawLines = content.split('\n');
        // Remove invisible/formatting chars usually left by Word copies
        const lines = rawLines.map(l => l.trim().replace(/[\u202F\u00A0\u2000-\u200A]/g, '')).filter(l => l.length > 0);
        
        if (lines.length === 0) continue;
        
        let description = "";
        let onScreenText: string[] = [];
        let spokenText: string[] = [];
        
        let startIndex = 0;
        // Skip time formatting like "0-20s" or "00:20-00:40"
        if (lines[0] && lines[0].match(/^[\d:-]+s?$/i)) {
           startIndex = 1;
        }

        if (lines[startIndex]) {
            description = lines[startIndex];
            startIndex++;
        }

        const linkIndex = lines.findIndex((l, idx) => idx >= startIndex && /^Link da imagem/i.test(l));

        if (linkIndex !== -1) {
            // Lines between Desc tools and Link da imagem usually contain OnScreen text
            for(let k = startIndex; k < linkIndex; k++) onScreenText.push(lines[k]);
            
            // Everything after Link da imagem is usually Spoken Text
            for(let k = linkIndex + 1; k < lines.length; k++) spokenText.push(lines[k]);
        } else {
            // Assume the remaining is all spoken text
            for(let k = startIndex; k < lines.length; k++) {
                spokenText.push(lines[k]);
            }
        }
        
        scenes.push({
           id: crypto.randomUUID(),
           sceneNumber,
           description: description || null,
           onScreenText: onScreenText.length ? onScreenText.join('\n') : null,
           spokenText: spokenText.length ? spokenText.join('\n') : null,
           pronunciation: null
        });
    }
  }
  
  return scenes;
}
