import { compareTwoStrings } from "string-similarity";

export interface ShadowScore {
  overall: number;
  fluency: number;
  accuracy: number;
  diff: { type: "match" | "extra" | "missing", text: string }[];
}

function cleanText(text: string) {
  return text.toLowerCase().replace(/[.,!?()[\]{}"']/g, "").trim();
}

export function scoreShadowingAttempt(targetText: string, userText: string): ShadowScore {
  const cleanTarget = cleanText(targetText);
  const cleanUser = cleanText(userText);

  // 1. Accuracy: string similarity
  const accuracy = Math.round(compareTwoStrings(cleanTarget, cleanUser) * 100);

  // 2. Fluency: Length ratio penalty
  const targetWords = cleanTarget.split(/\s+/).length;
  const userWords = cleanUser.split(/\s+/).length;
  let fluency = 100;
  
  if (userWords === 0) {
    fluency = 0;
  } else if (userWords < targetWords) {
    fluency = Math.round((userWords / targetWords) * 100);
  } else if (userWords > targetWords * 1.5) {
    fluency = Math.max(0, 100 - Math.round(((userWords - targetWords) / targetWords) * 50));
  }

  // 3. Diff generation for UI (simple word-level)
  const tWords = cleanTarget.split(/\s+/);
  const uWords = cleanUser.split(/\s+/);
  
  const diff: ShadowScore["diff"] = [];
  let uIndex = 0;

  for (let i = 0; i < tWords.length; i++) {
    const tWord = tWords[i];
    let matchFound = false;
    
    // Look ahead a little bit
    for (let j = uIndex; j < Math.min(uIndex + 3, uWords.length); j++) {
      if (uWords[j] === tWord) {
        // Add any skipped words as 'extra'
        for (let k = uIndex; k < j; k++) {
          diff.push({ type: "extra", text: uWords[k] });
        }
        diff.push({ type: "match", text: tWord });
        uIndex = j + 1;
        matchFound = true;
        break;
      }
    }
    
    if (!matchFound) {
      diff.push({ type: "missing", text: tWord });
    }
  }
  
  // Add remaining user words
  for (let k = uIndex; k < uWords.length; k++) {
    diff.push({ type: "extra", text: uWords[k] });
  }

  const overall = Math.round((accuracy * 0.7) + (fluency * 0.3));

  return {
    overall,
    accuracy,
    fluency,
    diff
  };
}

/* ════════════════════════════════════════════════════════════════════
   ADDITIONS — Auto-Loop + word-level inline diff (2026-05-25)
   These extend the original scoreShadowingAttempt without changing
   its behavior. Older callers still work.
   ════════════════════════════════════════════════════════════════════ */

export interface WordDiff {
  /** Target word as it appears in the script */
  target: string;
  /** Status after comparing user's spoken text */
  status: "match" | "missed" | "approx";
  /** What the user actually said for this slot, when approx */
  spoken?: string;
}

/**
 * Word-level diff aligned with the ORIGINAL target sentence.
 *
 * Unlike `diff` in ShadowScore which interleaves extras, this returns
 * one entry PER target word so the UI can render the script inline
 * with green/red highlights per word.
 *
 * `approx` means the user said something CLOSE to the target word
 * (>= 0.6 similarity) but not exact — for pronunciation errors. The UI
 * can show this in yellow rather than red.
 */
export function scoreWordsInline(
  targetText: string,
  userText: string,
): WordDiff[] {
  const cleanTarget = cleanText(targetText);
  const cleanUser = cleanText(userText);
  const tWords = cleanTarget.split(/\s+/).filter(Boolean);
  const uWords = cleanUser.split(/\s+/).filter(Boolean);
  if (tWords.length === 0) return [];

  const out: WordDiff[] = [];
  let uIdx = 0;

  for (let i = 0; i < tWords.length; i++) {
    const t = tWords[i];

    // 1) exact match within next 3 user words
    let matchedAt = -1;
    const lookAhead = Math.min(uIdx + 3, uWords.length);
    for (let j = uIdx; j < lookAhead; j++) {
      if (uWords[j] === t) {
        matchedAt = j;
        break;
      }
    }
    if (matchedAt !== -1) {
      out.push({ target: t, status: "match" });
      uIdx = matchedAt + 1;
      continue;
    }

    // 2) fuzzy match: any user word within 3 ahead with >= 0.6 similarity
    let approxAt = -1;
    let bestSim = 0;
    let bestWord: string | undefined;
    for (let j = uIdx; j < lookAhead; j++) {
      const sim = simpleSimilarity(t, uWords[j]);
      if (sim >= 0.6 && sim > bestSim) {
        bestSim = sim;
        approxAt = j;
        bestWord = uWords[j];
      }
    }
    if (approxAt !== -1) {
      out.push({ target: t, status: "approx", spoken: bestWord });
      uIdx = approxAt + 1;
      continue;
    }

    // 3) missed
    out.push({ target: t, status: "missed" });
  }

  return out;
}

/**
 * Bigram-overlap similarity (same idea as string-similarity dice).
 * Avoids importing another helper since we already have the lib.
 */
function simpleSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const ba = bigrams(a);
  const bb = bigrams(b);
  let common = 0;
  for (const x of ba) if (bb.has(x)) common++;
  return (2 * common) / (ba.size + bb.size);
}

function bigrams(s: string): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) out.add(s.slice(i, i + 2));
  return out;
}

/**
 * Returns whether the user can move on automatically: overall score
 * above threshold AND no obvious dropouts (more than 30% missed words).
 */
export function shouldAdvance(
  score: ShadowScore,
  wordDiffs: WordDiff[],
  threshold = 70,
): boolean {
  if (score.overall < threshold) return false;
  const missedRate =
    wordDiffs.filter((w) => w.status === "missed").length / Math.max(1, wordDiffs.length);
  return missedRate <= 0.3;
}
