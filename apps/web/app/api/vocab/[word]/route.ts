import { NextResponse } from "next/server";
import { lookupFreeDictionary, lookupDatamuse } from "@/lib/vocab/sources";

// Simple in-memory cache for MVP. Upstash Redis would be better.
const cache = new Map<string, any>();

export async function GET(
  req: Request,
  { params }: { params: Promise<{ word: string }> }
) {
  const { word: rawWord } = await params;
  const word = rawWord.toLowerCase();
  
  if (cache.has(word)) {
    return NextResponse.json(cache.get(word));
  }
  
  // 1. Try Free Dictionary
  let result = await lookupFreeDictionary(word);
  
  // 2. Fallback to Datamuse
  if (!result) {
    result = await lookupDatamuse(word);
  }
  
  if (!result) {
    return NextResponse.json({ error: "Word not found" }, { status: 404 });
  }

  // 3. Translate the first definition to Vietnamese using Free Google Translate API
  if (result.definitions.length > 0) {
    try {
      const englishDef = result.definitions[0].definition;
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(englishDef)}`;
      const gtRes = await fetch(url);
      if (gtRes.ok) {
        const data = await gtRes.json();
        const translated = data[0]?.[0]?.[0];
        if (translated) {
          result.definitions[0].definition = translated;
        }
      }
    } catch (e) {
      console.error("Google Translate error:", e);
    }
  }
  
  cache.set(word, result);
  return NextResponse.json(result);
}
