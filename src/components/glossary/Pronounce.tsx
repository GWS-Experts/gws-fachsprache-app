"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { speak, stopSpeaking, useSpeechSupported } from "@/components/lesson/speech";
import type { GlossaryTerm } from "@/lib/types";

type Pronounceable = Pick<GlossaryTerm, "id" | "article" | "term" | "example"> & { has_audio?: boolean; audio_path?: string | null };

// Was vorgelesen wird: Artikel + Begriff, bei Verben ohne die Formen in Klammern.
export function spokenTerm(t: Pick<GlossaryTerm, "article" | "term">) {
  return [t.article, t.term.replace(/\s*\([^)]*\)/g, "")].filter(Boolean).join(" ").trim();
}

// Aussprache eines Fachbegriffs: Aufnahme von GWS, wenn vorhanden, sonst die Stimme des Browsers.
// Langsam = 0,7-fache Geschwindigkeit; „Beispiel“ liest den Beispielsatz vor.
export function PronounceButtons({ term, size = "sm", withExample = false, light = false }: { term: Pronounceable; size?: "sm" | "md"; withExample?: boolean; light?: boolean }) {
  const t = useTranslations("pronounce");
  const canSpeak = useSpeechSupported();
  const audio = useRef<HTMLAudioElement | null>(null);
  const [failed, setFailed] = useState(false);
  const recorded = Boolean(term.has_audio || term.audio_path) && !failed;

  useEffect(() => () => {
    audio.current?.pause();
    stopSpeaking();
  }, []);

  function play(slow: boolean) {
    if (recorded) {
      audio.current?.pause();
      const a = new Audio(`/api/glossary/audio/${term.id}`);
      a.playbackRate = slow ? 0.7 : 1;
      a.onerror = () => {
        setFailed(true);
        speak(spokenTerm(term), { rate: slow ? 0.6 : 0.85 });
      };
      audio.current = a;
      void a.play().catch(() => a.onerror?.(new Event("error")));
    } else {
      speak(spokenTerm(term), { rate: slow ? 0.6 : 0.85 });
    }
  }

  if (!recorded && !canSpeak) return null;
  const base = size === "md" ? "btn-outline" : `rounded-md px-1.5 py-0.5 text-sm font-semibold ${light ? "text-white hover:bg-white/15" : "text-primary hover:bg-primary-light"}`;

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <button type="button" className={base} onClick={() => play(false)} aria-label={t("listen")} title={t("listen")}>
        🔊{size === "md" && ` ${t("listen")}`}
      </button>
      <button type="button" className={base} onClick={() => play(true)} aria-label={t("slow")} title={t("slow")}>
        🐢{size === "md" && ` ${t("slow")}`}
      </button>
      {withExample && term.example && canSpeak && (
        <button type="button" className={base} onClick={() => speak(term.example, { rate: 0.85 })} aria-label={t("example")} title={t("example")}>
          💬{size === "md" && ` ${t("example")}`}
        </button>
      )}
    </span>
  );
}
