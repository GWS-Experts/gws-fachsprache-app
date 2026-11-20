"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { speakScript, stopSpeaking, useSpeechSupported } from "@/components/lesson/speech";

// Hörtext in der Prüfung: begrenzte Zahl an Durchgängen, kein Vorspulen, kein Transkript.
export function ExamAudio({ audioUrl, script, maxPlays }: { audioUrl: string | null; script: string; maxPlays: number }) {
  const t = useTranslations("exam");
  const canSpeak = useSpeechSupported();
  const audio = useRef<HTMLAudioElement | null>(null);
  const [plays, setPlays] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const left = maxPlays > 0 ? maxPlays - plays : Infinity;

  useEffect(() => () => {
    audio.current?.pause();
    stopSpeaking();
  }, []);

  function play() {
    if (playing || left <= 0) return;
    setPlays((p) => p + 1);
    setPlaying(true);
    if (audioUrl) {
      // Nach dem Ende startet play() automatisch wieder am Anfang.
      void audio.current?.play().catch(() => setPlaying(false));
    } else {
      speakScript(script, { onEnd: () => setPlaying(false) });
    }
  }

  if (!audioUrl && !canSpeak) return <p className="card text-sm text-danger">{t("noAudio")}</p>;

  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn-primary" onClick={play} disabled={playing || left <= 0}>
          {playing ? `🔊 ${t("playing")}` : `▶ ${plays === 0 ? t("playAudio") : t("playAgain")}`}
        </button>
        <span className="text-sm text-muted">
          {maxPlays > 0 ? t("playsLeft", { count: Math.max(0, left) }) : t("playsUnlimited")}
        </span>
      </div>
      {audioUrl && (
        <audio
          ref={audio}
          src={audioUrl}
          preload="auto"
          className="hidden"
          onTimeUpdate={(e) => setProgress(e.currentTarget.duration ? e.currentTarget.currentTime / e.currentTarget.duration : 0)}
          onEnded={() => { setPlaying(false); setProgress(1); }}
          onError={() => setPlaying(false)}
        />
      )}
      {audioUrl && (
        <div className="h-2 overflow-hidden rounded-full bg-primary-light" aria-hidden>
          <div className="h-full bg-primary transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
    </div>
  );
}
