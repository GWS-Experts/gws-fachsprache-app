"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { saveLesson } from "@/app/actions/content";
import { createClient } from "@/lib/supabase/client";
import type { DialogueLine, Lesson, LessonContent, Question, VocabItem } from "@/lib/types";
import { QuestionsEditor } from "./QuestionsEditor";

const usesQuestions = ["reading", "listening", "quiz", "dialogue"];
const usesTask = ["writing", "speaking"];

export function LessonEditor({ lesson }: { lesson: Lesson }) {
  const t = useTranslations("editor");
  const [title_de, setTitleDe] = useState(lesson.title_de);
  const [title_en, setTitleEn] = useState(lesson.title_en);
  const [sort, setSort] = useState(lesson.sort);
  const [published, setPublished] = useState(lesson.published);
  const [content, setContent] = useState<LessonContent>(lesson.content ?? {});
  const [status, setStatus] = useState<{ ok?: boolean; issues?: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const kind = lesson.kind;

  const set = <K extends keyof LessonContent>(key: K, value: LessonContent[K]) => setContent((c) => ({ ...c, [key]: value }));

  async function save() {
    setSaving(true);
    setStatus(null);
    const res = await saveLesson({ id: lesson.id, title_de, title_en, sort, published, content: clean(content, kind) });
    setSaving(false);
    setStatus({ ok: !res.error, issues: res.issues });
  }

  async function uploadAudio(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "mp3";
    const path = `lessons/${lesson.id}/${Date.now()}.${ext}`;
    const { error } = await createClient().storage.from("fsp-media").upload(path, file, { contentType: file.type });
    setUploading(false);
    if (!error) set("audio_path", path);
    else setStatus({ ok: false, issues: [error.message] });
  }

  return (
    <div className="space-y-6">
      <section className="card grid gap-4 sm:grid-cols-2">
        <Field label={t("titleDe")}><input className="input" value={title_de} onChange={(e) => setTitleDe(e.target.value)} /></Field>
        <Field label={t("titleEn")}><input className="input" value={title_en} onChange={(e) => setTitleEn(e.target.value)} /></Field>
        <Field label={t("introDe")}><textarea className="input min-h-20" value={content.intro_de ?? ""} onChange={(e) => set("intro_de", e.target.value)} /></Field>
        <Field label={t("introEn")}><textarea className="input min-h-20" value={content.intro_en ?? ""} onChange={(e) => set("intro_en", e.target.value)} /></Field>
        <div className="flex flex-wrap items-end gap-6 sm:col-span-2">
          <Field label={t("sort")}><input className="input w-24" type="number" min={0} value={sort} onChange={(e) => setSort(Number(e.target.value))} /></Field>
          <label className="flex items-center gap-2 pb-3 text-sm font-semibold">
            <input type="checkbox" className="h-4 w-4 accent-[var(--gws-primary)]" checked={published} onChange={(e) => setPublished(e.target.checked)} />
            {t("published")}
          </label>
        </div>
      </section>

      {usesTask.includes(kind) && (
        <section className="card grid gap-4 sm:grid-cols-2">
          <Field label={t("taskDe")}><textarea className="input min-h-28" value={content.task_de ?? ""} onChange={(e) => set("task_de", e.target.value)} /></Field>
          <Field label={t("taskEn")}><textarea className="input min-h-28" value={content.task_en ?? ""} onChange={(e) => set("task_en", e.target.value)} /></Field>
          <Field label={t("hints")} hint={t("hintsHint")}>
            <textarea className="input min-h-24" value={(content.hints ?? []).join("\n")} onChange={(e) => set("hints", e.target.value.split("\n"))} />
          </Field>
          {kind === "writing" ? (
            <Field label={t("minWords")}><input className="input w-32" type="number" min={0} value={content.min_words ?? 80} onChange={(e) => set("min_words", Number(e.target.value))} /></Field>
          ) : (
            <Field label={t("maxSeconds")}><input className="input w-32" type="number" min={10} max={900} value={content.max_seconds ?? 120} onChange={(e) => set("max_seconds", Number(e.target.value))} /></Field>
          )}
        </section>
      )}

      {(kind === "reading" || usesTask.includes(kind)) && (
        <section className="card">
          <Field label={kind === "reading" ? t("readingText") : t("material")}>
            <textarea className="input min-h-48" value={content.text ?? ""} onChange={(e) => set("text", e.target.value)} />
          </Field>
        </section>
      )}

      {kind === "listening" && (
        <section className="card space-y-4">
          <Field label={t("transcript")} hint={t("transcriptHint")}>
            <textarea className="input min-h-40" value={content.transcript ?? ""} onChange={(e) => set("transcript", e.target.value)} />
          </Field>
          <div>
            <span className="label">{t("audio")}</span>
            <div className="flex flex-wrap items-center gap-3">
              <input type="file" accept="audio/*" disabled={uploading} onChange={(e) => e.target.files?.[0] && uploadAudio(e.target.files[0])} className="text-sm" aria-label={t("audio")} />
              {content.audio_path && (
                <>
                  <span className="text-xs text-muted">{content.audio_path}</span>
                  <button type="button" className="text-sm text-danger underline" onClick={() => set("audio_path", null)}>{t("removeAudio")}</button>
                </>
              )}
            </div>
            <span className="mt-1 block text-xs text-muted">{t("audioHint")}</span>
          </div>
        </section>
      )}

      {kind === "vocabulary" && <VocabEditor items={content.items ?? []} onChange={(items) => set("items", items)} />}
      {kind === "dialogue" && <LinesEditor lines={content.lines ?? []} onChange={(lines) => set("lines", lines)} />}
      {usesQuestions.includes(kind) && <QuestionsEditor questions={content.questions ?? []} onChange={(q: Question[]) => set("questions", q)} />}

      <div className="sticky bottom-20 z-10 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-surface p-3 shadow-md md:bottom-4">
        <button className="btn-primary" onClick={save} disabled={saving}>{saving ? t("saving") : t("save")}</button>
        <Link className="btn-outline" href={`/admin/content/lesson/${lesson.id}/preview`}>{t("preview")}</Link>
        {status?.ok && <span className="text-sm text-success">{t("saved")}</span>}
        {status && !status.ok && (
          <span className="text-sm text-danger">
            {t("error")}
            {status.issues?.length ? `: ${status.issues.slice(0, 3).join("; ")}` : ""}
          </span>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

// Leere Zeilen und Felder entfernen, die für den Übungstyp nicht gebraucht werden.
function clean(c: LessonContent, kind: Lesson["kind"]): LessonContent {
  const out: LessonContent = { intro_de: c.intro_de ?? "", intro_en: c.intro_en ?? "" };
  if (kind === "reading" || usesTask.includes(kind)) out.text = c.text ?? "";
  if (kind === "listening") {
    out.transcript = c.transcript ?? "";
    out.audio_path = c.audio_path ?? null;
  }
  if (kind === "vocabulary") out.items = (c.items ?? []).filter((i) => i.term.trim() && i.en.trim());
  if (kind === "dialogue") out.lines = (c.lines ?? []).filter((l) => l.speaker.trim() && l.text.trim());
  if (usesQuestions.includes(kind)) out.questions = c.questions ?? [];
  if (usesTask.includes(kind)) {
    out.task_de = c.task_de ?? "";
    out.task_en = c.task_en ?? "";
    out.hints = (c.hints ?? []).map((h) => h.trim()).filter(Boolean);
    if (kind === "writing") out.min_words = c.min_words ?? 80;
    else out.max_seconds = c.max_seconds ?? 120;
  }
  return out;
}

function VocabEditor({ items, onChange }: { items: VocabItem[]; onChange: (items: VocabItem[]) => void }) {
  const t = useTranslations("editor");
  const update = (i: number, patch: Partial<VocabItem>) => onChange(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  return (
    <section className="card space-y-3">
      <h2 className="font-bold text-primary">{t("vocabulary")}</h2>
      {items.map((item, i) => (
        <div key={i} className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-[5rem_1fr_1fr_1fr_auto]">
          <input className="input" placeholder={t("article")} value={item.article ?? ""} onChange={(e) => update(i, { article: e.target.value })} />
          <input className="input" placeholder={t("term")} value={item.term} onChange={(e) => update(i, { term: e.target.value })} />
          <input className="input" placeholder={t("plural")} value={item.plural ?? ""} onChange={(e) => update(i, { plural: e.target.value })} />
          <input className="input" placeholder="English" value={item.en} onChange={(e) => update(i, { en: e.target.value })} />
          <button type="button" className="btn-danger px-3" aria-label={t("remove")} onClick={() => onChange(items.filter((_, idx) => idx !== i))}>✕</button>
          <input className="input sm:col-span-5" placeholder={t("example")} value={item.example ?? ""} onChange={(e) => update(i, { example: e.target.value })} />
        </div>
      ))}
      <button type="button" className="btn-outline" onClick={() => onChange([...items, { term: "", en: "", article: "", plural: "", example: "" }])}>+ {t("addTerm")}</button>
    </section>
  );
}

function LinesEditor({ lines, onChange }: { lines: DialogueLine[]; onChange: (lines: DialogueLine[]) => void }) {
  const t = useTranslations("editor");
  const update = (i: number, patch: Partial<DialogueLine>) => onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  // Neue Zeile: abwechselnd die beiden ersten Sprecher vorschlagen.
  const speakers = [...new Set(lines.map((l) => l.speaker).filter(Boolean))];
  const nextSpeaker = speakers.length >= 2 ? (lines[lines.length - 1]?.speaker === speakers[0] ? speakers[1] : speakers[0]) : "";
  return (
    <section className="card space-y-3">
      <h2 className="font-bold text-primary">{t("dialogue")}</h2>
      {lines.map((line, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
          <input className="input" placeholder={t("speaker")} value={line.speaker} onChange={(e) => update(i, { speaker: e.target.value })} />
          <textarea className="input min-h-11" placeholder={t("lineText")} value={line.text} onChange={(e) => update(i, { text: e.target.value })} />
          <button type="button" className="btn-danger px-3" aria-label={t("remove")} onClick={() => onChange(lines.filter((_, idx) => idx !== i))}>✕</button>
        </div>
      ))}
      <button type="button" className="btn-outline" onClick={() => onChange([...lines, { speaker: nextSpeaker, text: "" }])}>+ {t("addLine")}</button>
    </section>
  );
}
