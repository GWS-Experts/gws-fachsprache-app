"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { submitWork } from "@/app/actions/learning";
import { createClient } from "@/lib/supabase/client";

type State = "idle" | "recording" | "recorded" | "uploading";

export function Speaking({ lessonId, userId, maxSeconds, startedAt, onDone, preview }: { lessonId: string; userId: string; maxSeconds: number; startedAt: number; onDone: () => void; preview?: boolean }) {
  const t = useTranslations("lesson");
  const [state, setState] = useState<State>("idle");
  const [seconds, setSeconds] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
    recorder.current?.stream.getTracks().forEach((tr) => tr.stop());
  }, []);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

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
        const b = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        setBlob(b);
        setUrl(URL.createObjectURL(b));
        setState("recorded");
      };
      recorder.current = rec;
      rec.start();
      setSeconds(0);
      setState("recording");
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError(t("micError"));
    }
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  useEffect(() => {
    if (state === "recording" && seconds >= maxSeconds) stop();
  }, [state, seconds, maxSeconds]);

  async function upload() {
    if (!blob) return;
    if (preview) return onDone();
    setState("uploading");
    setError(null);
    const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
    const path = `${userId}/${lessonId}/${Date.now()}.${ext}`;
    const supabase = createClient();
    const { error: upError } = await supabase.storage.from("fsp-recordings").upload(path, blob, { contentType: blob.type.split(";")[0] });
    if (upError) {
      setError(t("submitError"));
      setState("recorded");
      return;
    }
    const res = await submitWork({ lessonId, audioPath: path, durationSeconds: Math.round((Date.now() - startedAt) / 1000) });
    if (res.ok) onDone();
    else {
      setError(t("submitError"));
      setState("recorded");
    }
  }

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="card space-y-4">
      <p className="text-sm text-muted">{t("recordIntro", { max: mmss(maxSeconds) })}</p>
      <div className="flex flex-wrap items-center gap-3">
        {state === "recording" ? (
          <button className="btn-danger" onClick={stop}>⏹ {t("stopRecording")} ({mmss(seconds)})</button>
        ) : (
          <button className="btn-primary" onClick={start} disabled={state === "uploading"}>
            🎙️ {state === "recorded" ? t("recordAgain") : t("record")}
          </button>
        )}
        {state === "recording" && <span className="h-3 w-3 animate-pulse rounded-full bg-danger" aria-hidden />}
      </div>
      {url && state !== "recording" && (
        <div className="space-y-3">
          <audio controls src={url} className="w-full" />
          <button className="btn-accent" onClick={upload} disabled={state === "uploading"}>
            {state === "uploading" ? t("sending") : t("submitRecording")}
          </button>
        </div>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
