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
