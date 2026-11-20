"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
import { useTranslations } from "next-intl";
import { formatClock } from "@/lib/exam";

export interface RecorderHandle {
  // Beendet eine laufende Aufnahme und liefert die letzte Aufnahme (oder null).
  finish: () => Promise<Blob | null>;
}

export function ExamRecorder({ ref, maxSeconds }: { ref: Ref<RecorderHandle>; maxSeconds: number }) {
  const t = useTranslations("exam");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const blob = useRef<Blob | null>(null);
  const stopped = useRef<Promise<Blob | null> | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
    recorder.current?.stream.getTracks().forEach((tr) => tr.stop());
  }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  async function start() {
    setError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = ["audio/webm", "audio/mp4", "audio/ogg"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      stopped.current = new Promise((resolve) => {
        rec.onstop = () => {
          stream.getTracks().forEach((tr) => tr.stop());
          const b = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
          blob.current = b;
          setUrl(URL.createObjectURL(b));
          setRecording(false);
          resolve(b);
        };
      });
      recorder.current = rec;
      rec.start();
      setSeconds(0);
      setRecording(true);
      timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setError(true);
    }
  }

  function stop() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (recorder.current?.state === "recording") recorder.current.stop();
  }

  useEffect(() => {
    if (recording && seconds >= maxSeconds) stop();
  }, [recording, seconds, maxSeconds]);

  useImperativeHandle(ref, () => ({
    finish: async () => {
      if (recorder.current?.state === "recording") {
        stop();
        return (await stopped.current) ?? null;
      }
      return blob.current;
    },
  }));

  return (
    <div className="card space-y-4">
      <p className="text-sm text-muted">{t("recordIntro", { max: formatClock(maxSeconds) })}</p>
      <div className="flex flex-wrap items-center gap-3">
        {recording ? (
          <button className="btn-danger" onClick={stop}>⏹ {t("stopRecording")} ({formatClock(seconds)})</button>
        ) : (
          <button className="btn-primary" onClick={start}>🎙️ {url ? t("recordAgain") : t("record")}</button>
        )}
        {recording && <span className="h-3 w-3 animate-pulse rounded-full bg-danger" aria-hidden />}
      </div>
      {url && !recording && (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-success">✓ {t("recorded")}</p>
          <audio controls src={url} className="w-full" />
        </div>
      )}
      {error && <p className="text-sm text-danger">{t("micError")}</p>}
    </div>
  );
}
