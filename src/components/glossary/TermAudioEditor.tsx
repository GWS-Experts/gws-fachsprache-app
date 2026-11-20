"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { setTermAudio } from "@/app/actions/pronunciation";
import { createClient } from "@/lib/supabase/client";
import type { GlossaryTerm } from "@/lib/types";
import { PronounceButtons } from "./Pronounce";

const EXT: Record<string, string> = { "audio/webm": "webm", "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/wav": "wav", "audio/x-wav": "wav" };

// GWS kann pro Begriff eine eigene Aussprache aufnehmen oder hochladen. Ohne Aufnahme
// liest die App den Begriff mit der Stimme des Browsers vor.
export function TermAudioEditor({ term }: { term: GlossaryTerm }) {
  const t = useTranslations("pronounce");
  const router = useRouter();
  const [state, setState] = useState<"idle" | "recording" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);

  useEffect(() => () => recorder.current?.stream.getTracks().forEach((tr) => tr.stop()), []);

  async function save(blob: Blob) {
    const type = blob.type.split(";")[0];
    const ext = EXT[type];
    if (!ext) return setError(t("wrongType"));
    if (blob.size > 5 * 1024 * 1024) return setError(t("tooLarge"));
    setState("saving");
    setError(null);
    const path = `glossary/${term.id}-${Date.now()}.${ext}`;
    const { error: upError } = await createClient().storage.from("fsp-media").upload(path, blob, { contentType: type === "audio/x-m4a" ? "audio/mp4" : type === "audio/x-wav" ? "audio/wav" : type });
    const res = upError ? { ok: false } : await setTermAudio({ termId: term.id, path });
    setState("idle");
    if (!res.ok) setError(t("saveError"));
    else router.refresh();
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        void save(new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
      };
      recorder.current = rec;
      rec.start();
      setState("recording");
    } catch {
      setError(t("micError"));
    }
  }

  async function remove() {
    setState("saving");
    const res = await setTermAudio({ termId: term.id, path: null });
    setState("idle");
    if (!res.ok) setError(t("saveError"));
    else router.refresh();
  }

  return (
    <div className="space-y-2 rounded-md bg-page p-3">
      <p className="text-sm font-semibold">{t("adminTitle")}</p>
      <p className="text-xs text-muted">{term.audio_path ? t("adminHasAudio") : t("adminNoAudio")}</p>
      <div className="flex flex-wrap items-center gap-2">
        <PronounceButtons term={term} />
        {state === "recording" ? (
          <button type="button" className="btn-danger px-3 py-1.5" onClick={() => recorder.current?.stop()}>⏹ {t("stop")}</button>
        ) : (
          <button type="button" className="btn-outline px-3 py-1.5" onClick={start} disabled={state === "saving"}>🎙️ {t("record")}</button>
        )}
        <label className="btn-outline cursor-pointer px-3 py-1.5">
          ⬆️ {t("upload")}
          <input
            type="file"
            accept="audio/*"
            className="sr-only"
            disabled={state !== "idle"}
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void save(f);
            }}
          />
        </label>
        {term.audio_path && state === "idle" && (
          <button type="button" className="px-2 text-sm text-danger underline" onClick={remove}>{t("remove")}</button>
        )}
        {state === "recording" && <span className="h-3 w-3 animate-pulse rounded-full bg-danger" aria-hidden />}
        {state === "saving" && <span className="text-sm text-muted">{t("saving")}</span>}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
