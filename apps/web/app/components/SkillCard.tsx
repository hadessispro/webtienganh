"use client";

/**
 * Path: apps/web/app/components/SkillCard.tsx
 *
 * Lesson player for ONE ASU. Branches on payload.type and renders a
 * type-specific UI. After the user interacts, onComplete fires with
 * correct + elapsedMs which feeds the SM-2 update in the parent.
 *
 * Schema reference — see apps/web/app/lib/skill-units.ts for the
 * SkillPayload union shape.
 */

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { speakWord } from "../lib/vocab-api";
import type { SkillUnit } from "../lib/skill-units";

type Props = {
  skill: SkillUnit;
  onComplete: (correct: boolean, elapsedMs: number) => void;
};

export function SkillCard({ skill, onComplete }: Props) {
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    startedAt.current = Date.now();
  }, [skill.id]);

  const handleComplete = (correct: boolean) => {
    const elapsed = Date.now() - startedAt.current;
    onComplete(correct, elapsed);
  };

  return (
    <motion.div
      key={skill.id}
      className="ll-skill-card"
      initial={{ y: 18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -10, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {skill.payload.type === "vocab" && (
        <VocabCard skill={skill} onComplete={handleComplete} />
      )}
      {skill.payload.type === "phrase" && (
        <PhraseCard skill={skill} onComplete={handleComplete} />
      )}
      {skill.payload.type === "grammar" && (
        <GrammarCard skill={skill} onComplete={handleComplete} />
      )}
      {skill.payload.type === "listening" && (
        <ListeningCard skill={skill} onComplete={handleComplete} />
      )}
      {skill.payload.type === "pronunciation" && (
        <PronunciationCard skill={skill} onComplete={handleComplete} />
      )}
      {skill.payload.type === "reading" && (
        <ReadingCard skill={skill} onComplete={handleComplete} />
      )}
      {skill.payload.type === "writing" && (
        <WritingCard skill={skill} onComplete={handleComplete} />
      )}
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Vocab
   ────────────────────────────────────────────────────────────────── */

function VocabCard({
  skill,
  onComplete,
}: {
  skill: SkillUnit;
  onComplete: (correct: boolean) => void;
}) {
  if (skill.payload.type !== "vocab") return null;
  const p = skill.payload;
  const [revealed, setRevealed] = useState(false);

  const speak = () => {
    if (p.audio_url) {
      try {
        new Audio(p.audio_url).play();
        return;
      } catch {
        // fall through
      }
    }
    speakWord(p.word);
  };

  return (
    <div className="ll-card-inner">
      <div className="ll-card-type-tag">📝 Từ vựng</div>
      <div className="ll-card-word">{p.word}</div>
      {p.pronunciation_ipa && (
        <div className="ll-card-ipa">/{p.pronunciation_ipa}/</div>
      )}
      <button type="button" className="ll-card-audio-btn" onClick={speak}>
        🔊 Nghe phát âm
      </button>
      <div className="ll-card-pos">{p.pos}</div>

      {!revealed ? (
        <button
          type="button"
          className="ll-card-cta-secondary"
          onClick={() => setRevealed(true)}
        >
          Xem nghĩa
        </button>
      ) : (
        <>
          <div className="ll-card-definitions">
            <div className="ll-card-def-vi">{p.definition_vi}</div>
            <div className="ll-card-def-example">
              <em>{p.example_en}</em>
              <span> — {p.example_vi}</span>
            </div>
          </div>
          <div className="ll-card-self-check">
            <p>Bạn đã thuộc từ này chưa?</p>
            <div className="ll-card-self-check-btns">
              <button
                type="button"
                className="ll-card-cta-secondary"
                onClick={() => onComplete(false)}
              >
                Chưa thuộc
              </button>
              <button
                type="button"
                className="ll-card-cta-primary"
                onClick={() => onComplete(true)}
              >
                Đã thuộc →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Phrase
   ────────────────────────────────────────────────────────────────── */

function PhraseCard({
  skill,
  onComplete,
}: {
  skill: SkillUnit;
  onComplete: (correct: boolean) => void;
}) {
  if (skill.payload.type !== "phrase") return null;
  const p = skill.payload;
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="ll-card-inner">
      <div className="ll-card-type-tag">💬 Cụm từ / Mẫu câu</div>
      <div className="ll-card-phrase">{p.phrase_en}</div>
      <button
        type="button"
        className="ll-card-audio-btn"
        onClick={() => speakWord(p.phrase_en)}
      >
        🔊 Nghe phát âm
      </button>

      {!revealed ? (
        <button
          type="button"
          className="ll-card-cta-secondary"
          onClick={() => setRevealed(true)}
        >
          Xem nghĩa
        </button>
      ) : (
        <>
          <div className="ll-card-phrase-vi">{p.phrase_vi}</div>
          {p.context && (
            <div className="ll-card-note">💡 Khi dùng: {p.context}</div>
          )}
          {p.example_en && (
            <div className="ll-card-def-example">
              <em>{p.example_en}</em>
              <span> — {p.example_vi}</span>
            </div>
          )}
          <div className="ll-card-self-check">
            <p>Đã hiểu chưa?</p>
            <div className="ll-card-self-check-btns">
              <button
                type="button"
                className="ll-card-cta-secondary"
                onClick={() => onComplete(false)}
              >
                Cần ôn thêm
              </button>
              <button
                type="button"
                className="ll-card-cta-primary"
                onClick={() => onComplete(true)}
              >
                Đã hiểu →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Grammar
   ────────────────────────────────────────────────────────────────── */

function GrammarCard({
  skill,
  onComplete,
}: {
  skill: SkillUnit;
  onComplete: (correct: boolean) => void;
}) {
  if (skill.payload.type !== "grammar") return null;
  const p = skill.payload;

  return (
    <div className="ll-card-inner ll-card-grammar">
      <div className="ll-card-type-tag">📐 Ngữ pháp</div>
      <h3 className="ll-card-grammar-title">{p.rule_title_vi}</h3>
      <div className="ll-card-grammar-pattern">{p.pattern}</div>
      <p className="ll-card-grammar-explain">{p.explain_vi}</p>

      <div className="ll-card-grammar-examples">
        <span className="ll-card-grammar-section-label">Ví dụ:</span>
        {p.examples.map((ex, i) => (
          <div key={i} className="ll-card-grammar-example">
            <div className="ll-card-grammar-example-en">{ex.en}</div>
            <div className="ll-card-grammar-example-vi">{ex.vi}</div>
          </div>
        ))}
      </div>

      {p.common_mistakes_vi && p.common_mistakes_vi.length > 0 && (
        <div className="ll-card-grammar-mistakes">
          <span className="ll-card-grammar-section-label">
            ⚠ Lỗi thường gặp:
          </span>
          <ul>
            {p.common_mistakes_vi.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="ll-card-self-check">
        <div className="ll-card-self-check-btns">
          <button
            type="button"
            className="ll-card-cta-secondary"
            onClick={() => onComplete(false)}
          >
            Cần xem lại
          </button>
          <button
            type="button"
            className="ll-card-cta-primary"
            onClick={() => onComplete(true)}
          >
            Đã hiểu rõ →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Listening
   ────────────────────────────────────────────────────────────────── */

function ListeningCard({
  skill,
  onComplete,
}: {
  skill: SkillUnit;
  onComplete: (correct: boolean) => void;
}) {
  if (skill.payload.type !== "listening") return null;
  const p = skill.payload;
  const [picked, setPicked] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const play = () => {
    if (p.audio_url) {
      try {
        new Audio(p.audio_url).play();
        return;
      } catch {
        // fall through
      }
    }
    speakWord(p.transcript_en);
  };

  const handlePick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    setShowAnswer(true);
    setTimeout(() => onComplete(i === p.answer_index), 1500);
  };

  return (
    <div className="ll-card-inner">
      <div className="ll-card-type-tag">👂 Luyện nghe</div>
      <button type="button" className="ll-card-audio-big" onClick={play}>
        🔊 Nhấn để nghe
      </button>
      <div className="ll-card-listening-q">{p.question_vi}</div>
      <div className="ll-card-listening-opts">
        {p.options.map((opt, i) => {
          const showCorrect = showAnswer && i === p.answer_index;
          const showWrong = showAnswer && i === picked && i !== p.answer_index;
          const cls = [
            "ll-card-listening-opt",
            showCorrect ? "is-correct" : "",
            showWrong ? "is-wrong" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={i}
              type="button"
              className={cls}
              onClick={() => handlePick(i)}
              disabled={picked !== null}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          );
        })}
      </div>
      {showAnswer && p.transcript_vi && (
        <div className="ll-card-note">📜 {p.transcript_vi}</div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Pronunciation
   ────────────────────────────────────────────────────────────────── */

function PronunciationCard({
  skill,
  onComplete,
}: {
  skill: SkillUnit;
  onComplete: (correct: boolean) => void;
}) {
  if (skill.payload.type !== "pronunciation") return null;
  const p = skill.payload;

  const speak = () => {
    if (p.target_audio_url) {
      try {
        new Audio(p.target_audio_url).play();
        return;
      } catch {
        // fall through
      }
    }
    speakWord(p.target_text_en);
  };

  return (
    <div className="ll-card-inner">
      <div className="ll-card-type-tag">🗣️ Phát âm</div>
      <h3 className="ll-card-pronunciation-title">{p.target_text_en}</h3>
      {p.ipa && <div className="ll-card-ipa">/{p.ipa}/</div>}
      <button type="button" className="ll-card-audio-btn" onClick={speak}>
        🔊 Nghe mẫu
      </button>
      {p.tip_vi && (
        <p className="ll-card-pronunciation-tip">💡 {p.tip_vi}</p>
      )}

      <div className="ll-card-self-check">
        <p>Bạn đã luyện theo và nghe rõ?</p>
        <div className="ll-card-self-check-btns">
          <button
            type="button"
            className="ll-card-cta-secondary"
            onClick={() => onComplete(false)}
          >
            Cần luyện thêm
          </button>
          <button
            type="button"
            className="ll-card-cta-primary"
            onClick={() => onComplete(true)}
          >
            Đã rõ →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Reading
   ────────────────────────────────────────────────────────────────── */

function ReadingCard({
  skill,
  onComplete,
}: {
  skill: SkillUnit;
  onComplete: (correct: boolean) => void;
}) {
  if (skill.payload.type !== "reading") return null;
  const p = skill.payload;
  const [picked, setPicked] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const handlePick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    setShowAnswer(true);
    setTimeout(() => onComplete(i === p.answer_index), 1500);
  };

  return (
    <div className="ll-card-inner">
      <div className="ll-card-type-tag">📖 Đọc hiểu</div>
      <div className="ll-card-reading-passage">{p.passage_en}</div>
      <div className="ll-card-listening-q">{p.question_vi}</div>
      <div className="ll-card-listening-opts">
        {p.options.map((opt, i) => {
          const showCorrect = showAnswer && i === p.answer_index;
          const showWrong = showAnswer && i === picked && i !== p.answer_index;
          const cls = [
            "ll-card-listening-opt",
            showCorrect ? "is-correct" : "",
            showWrong ? "is-wrong" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={i}
              type="button"
              className={cls}
              onClick={() => handlePick(i)}
              disabled={picked !== null}
            >
              {String.fromCharCode(65 + i)}. {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Writing
   ────────────────────────────────────────────────────────────────── */

function WritingCard({
  skill,
  onComplete,
}: {
  skill: SkillUnit;
  onComplete: (correct: boolean) => void;
}) {
  if (skill.payload.type !== "writing") return null;
  const p = skill.payload;
  const [text, setText] = useState("");
  return (
    <div className="ll-card-inner">
      <div className="ll-card-type-tag">✍️ Viết</div>
      <p className="ll-card-grammar-explain">{p.prompt_vi}</p>
      <p className="ll-card-pos">
        Mục tiêu: ~{p.target_word_count} từ
      </p>
      <textarea
        className="ll-card-writing-textarea"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder="Viết câu trả lời của bạn ở đây..."
      />
      <p className="ll-card-pos">
        Đã viết: {text.trim().split(/\s+/).filter(Boolean).length} từ
      </p>
      <button
        type="button"
        className="ll-card-cta-primary"
        onClick={() => onComplete(text.trim().split(/\s+/).filter(Boolean).length >= p.target_word_count * 0.6)}
        disabled={text.trim().length < 5}
      >
        Hoàn tất →
      </button>
    </div>
  );
}
