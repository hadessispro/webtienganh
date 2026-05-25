// apps/web/lib/vocab/sources.ts
export interface VocabResult {
  word: string;
  phonetic?: string;
  audio?: string;
  definitions: {
    partOfSpeech: string;
    definition: string;
    example?: string;
  }[];
}

export async function lookupFreeDictionary(word: string): Promise<VocabResult | null> {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    
    const entry = data[0];
    
    // Find first audio and phonetic
    let audioUrl = "";
    let phoneticText = entry.phonetic || "";
    for (const phon of entry.phonetics || []) {
      if (phon.audio && !audioUrl) {
        audioUrl = phon.audio;
      }
      if (phon.text && !phoneticText) {
        phoneticText = phon.text;
      }
    }
    
    // Gather definitions
    const definitions = [];
    for (const meaning of entry.meanings || []) {
      const partOfSpeech = meaning.partOfSpeech;
      for (const def of meaning.definitions || []) {
        definitions.push({
          partOfSpeech,
          definition: def.definition,
          example: def.example
        });
      }
    }
    
    return {
      word: entry.word,
      phonetic: phoneticText,
      audio: audioUrl,
      definitions
    };
  } catch (e) {
    console.error("FreeDictionary error:", e);
    return null;
  }
}

export async function lookupDatamuse(word: string): Promise<VocabResult | null> {
  try {
    const res = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`);
    if (!res.ok) return null;
    
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    
    const entry = data[0];
    if (!entry.defs) return null;
    
    const definitions = entry.defs.map((d: string) => {
      const [pos, ...rest] = d.split("\t");
      return {
        partOfSpeech: pos,
        definition: rest.join("\t")
      };
    });
    
    return {
      word: entry.word,
      definitions
    };
  } catch (e) {
    console.error("Datamuse error:", e);
    return null;
  }
}
