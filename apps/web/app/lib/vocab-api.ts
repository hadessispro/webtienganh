/**
 * Path: apps/web/app/lib/vocab-api.ts
 *
 * Thin wrapper around the Free Dictionary API (https://dictionaryapi.dev/).
 * No API key required. CORS-friendly. Returns IPA pronunciation, US/UK
 * audio URLs, definitions, and example sentences.
 *
 * We use this for two purposes:
 *  1. Authoring: when seeding ASU vocab payloads (script-time), we
 *     pre-fill pronunciation + audio from the dictionary so we don't
 *     have to record audio ourselves.
 *  2. Runtime fallback: if a vocab ASU is missing audio_url, the
 *     lesson player can call this on-demand to render TTS playback.
 *
 * Endpoint: https://api.dictionaryapi.dev/api/v2/entries/en/<word>
 *
 * Rate limits: undocumented. Anecdotal reports of ~200 req/min per IP
 * before throttling. For seeding, we batch with 100ms delay.
 *
 * Cache: we add a tiny in-memory LRU so repeated lookups in the same
 * page session don't refetch. Persistent caching across sessions can
 * be added later (localStorage) if needed.
 */

const API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";

/* ────────────────────────────────────────────────────────────────────
   Types matching the API response shape
   ──────────────────────────────────────────────────────────────────── */

interface DictionaryPhonetic {
  text?: string;     // "/ˈʃed.juːl/"
  audio?: string;    // sometimes "" or absolute URL
}

interface DictionaryDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
}

interface DictionaryMeaning {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
  synonyms?: string[];
}

interface DictionaryEntry {
  word: string;
  phonetic?: string;
  phonetics: DictionaryPhonetic[];
  meanings: DictionaryMeaning[];
  origin?: string;
}

/** Our flattened, lesson-ready view of a word. */
export interface VocabLookup {
  word: string;
  ipa: string;            // first non-empty phonetic.text or ""
  audioUrl: string;       // first non-empty phonetic.audio or ""
  /** All distinct (pos, definition, example) rows, deduplicated. */
  senses: Array<{
    pos: string;
    definition: string;
    example: string;
  }>;
  /** Source for attribution / debugging. */
  source: "freedictionaryapi";
}

/* ────────────────────────────────────────────────────────────────────
   In-memory LRU cache
   ──────────────────────────────────────────────────────────────────── */

const CACHE_CAPACITY = 200;
const cache = new Map<string, VocabLookup | null>();

function rememberInCache(key: string, value: VocabLookup | null): void {
  // Touch: move to end so the least-recently-used drops off when we
  // hit capacity. Map iteration order is insertion order in JS.
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  while (cache.size > CACHE_CAPACITY) {
    const firstKey = cache.keys().next().value;
    if (firstKey === undefined) break;
    cache.delete(firstKey);
  }
}

/* ────────────────────────────────────────────────────────────────────
   Public API
   ──────────────────────────────────────────────────────────────────── */

/**
 * Look up a single word. Returns null if the word isn't found or the
 * network call fails. Use try/catch only if you need to distinguish
 * 'not found' from 'network error' — for most UI flows, null = no
 * data, render a fallback.
 *
 * NEVER call this in a render path inside a tight loop. Use the
 * batchLookup helper for seeding scripts.
 */
export async function lookupWord(word: string): Promise<VocabLookup | null> {
  const key = word.trim().toLowerCase();
  if (!key) return null;

  if (cache.has(key)) return cache.get(key) ?? null;

  try {
    const res = await fetch(`/api/vocab/${encodeURIComponent(key)}`);
    if (!res.ok) {
      rememberInCache(key, null);
      return null;
    }
    const data = await res.json();
    
    // Transform backend VocabResult back to VocabLookup
    const senses = data.definitions.map((d: any) => ({
      pos: d.partOfSpeech,
      definition: d.definition,
      example: d.example ?? ""
    }));

    const lookup: VocabLookup = {
      word: data.word,
      ipa: data.phonetic ?? "",
      audioUrl: data.audio ?? "",
      senses,
      source: "freedictionaryapi"
    };

    rememberInCache(key, lookup);
    return lookup;
  } catch (err) {
    console.warn("[vocab-api] lookup failed for", key, err);
    rememberInCache(key, null);
    return null;
  }
}

/**
 * Look up many words in sequence, with a small delay between calls
 * to be polite to the free API. Returns a map keyed by lowercase word.
 *
 * For 80 ASU seeding, expect ~10 seconds total. Run this in a Node
 * script, not in the browser at startup.
 */
export async function batchLookup(
  words: string[],
  options: { delayMs?: number } = {},
): Promise<Map<string, VocabLookup | null>> {
  const { delayMs = 100 } = options;
  const out = new Map<string, VocabLookup | null>();
  for (const word of words) {
    const result = await lookupWord(word);
    out.set(word.trim().toLowerCase(), result);
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }
  return out;
}

/* ────────────────────────────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────────────────────────────── */

function flattenEntry(entry: DictionaryEntry): VocabLookup {
  // Find the first usable IPA and audio URL across all phonetics
  const ipa =
    entry.phonetics.find((p) => p.text && p.text.trim() !== "")?.text ??
    entry.phonetic ??
    "";
  const audioUrl =
    entry.phonetics.find((p) => p.audio && p.audio.trim() !== "")?.audio ?? "";

  // Flatten definitions; keep only the first example per definition
  const senses: VocabLookup["senses"] = [];
  for (const meaning of entry.meanings) {
    for (const def of meaning.definitions) {
      senses.push({
        pos: meaning.partOfSpeech,
        definition: def.definition,
        example: def.example ?? "",
      });
    }
  }

  return {
    word: entry.word,
    ipa: ipa.trim(),
    audioUrl: audioUrl.startsWith("//") ? `https:${audioUrl}` : audioUrl,
    senses,
    source: "freedictionaryapi",
  };
}

/**
 * Speak a word using the browser's SpeechSynthesis API as a free
 * fallback when no audio_url is available. No network required.
 *
 * Returns true if speech was triggered, false otherwise (no support
 * or no voice).
 */
export function speakWord(word: string, lang = "en-US"): boolean {
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  try {
    const utt = new SpeechSynthesisUtterance(word);
    utt.lang = lang;
    utt.rate = 0.9;
    window.speechSynthesis.cancel(); // stop any queued
    window.speechSynthesis.speak(utt);
    return true;
  } catch {
    return false;
  }
}
