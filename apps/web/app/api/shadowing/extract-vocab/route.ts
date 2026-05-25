import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { SkillPayload } from "@/app/lib/skill-units";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ matches: [] });
    }

    const textLower = text.toLowerCase();

    // In a production app, we would cache this or query JSON directly.
    // For this prototype, fetching all skills and filtering in memory is extremely fast.
    const allSkills = await prisma.skill.findMany();

    const matches: any[] = [];
    const seenWords = new Set<string>();

    for (const skill of allSkills) {
      const payload = skill.payload as unknown as SkillPayload;
      if (payload.type === "vocab" && payload.word) {
        const wordStr = payload.word.toLowerCase();
        
        // Skip duplicate words
        if (seenWords.has(wordStr)) continue;

        // Basic whole-word boundary regex match
        const regex = new RegExp(`\\b${wordStr}\\b`);
        if (regex.test(textLower)) {
          matches.push({
            skillId: skill.id,
            word: payload.word,
            pos: payload.pos,
            definition_vi: payload.definition_vi,
            pronunciation_ipa: payload.pronunciation_ipa,
            level: skill.level,
          });
          seenWords.add(wordStr);
        }
      }
    }

    return NextResponse.json({ matches });
  } catch (error) {
    console.error("[extract-vocab] error", error);
    return NextResponse.json({ matches: [] }, { status: 500 });
  }
}
