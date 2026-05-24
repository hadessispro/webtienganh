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
  
  cache.set(word, result);
  return NextResponse.json(result);
}
