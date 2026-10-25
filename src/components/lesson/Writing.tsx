"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { submitWork } from "@/app/actions/learning";

export function Writing({ lessonId, minWords, startedAt, onDone, preview }: { lessonId: string; minWords: number; startedAt: number; onDone: () => void; preview?: boolean }) {
  const t = useTranslations("lesson");
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  async function submit() {
    if (preview) return onDone();
    setPending(true);
    setError(false);
    const res = await submitWork({ lessonId, text, durationSeconds: Math.round((Date.now() - startedAt) / 1000) });
    setPending(false);
    if (res.ok) onDone();
    else setError(true);
  }

  return (
    <div className="card space-y-3">
      <label className="label" htmlFor="writing">{t("yourText")}</label>
      <textarea id="writing" className="input min-h-64" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("writePlaceholder")} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm ${words >= minWords ? "text-success" : "text-muted"}`}>{t("words", { count: words, min: minWords })}</p>
        <button className="btn-primary" disabled={pending || words < Math.min(minWords, 10)} onClick={submit}>
          {pending ? t("sending") : t("submit")}
        </button>
      </div>
      {error && <p className="text-sm text-danger">{t("submitError")}</p>}
    </div>
  );
}
