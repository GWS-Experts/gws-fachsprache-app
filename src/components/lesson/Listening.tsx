"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Question } from "@/lib/types";
import { QuestionSet } from "./QuestionSet";
import { speak, stopSpeaking, useSpeechSupported } from "./speech";

export function Listening({
  transcript,
  audioUrl,
  questions,
  onComplete,
}: {
  transcript: string;
  audioUrl: string | null;
  questions: Question[];
  onComplete: (score: number, max: number) => void;
}) {
  const t = useTranslations("lesson");
  const canSpeak = useSpeechSupported();
  const [playing, setPlaying] = useState(false);
  const [plays, setPlays] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [answered, setAnswered] = useState(false);

  function play(rate: number) {
    setPlays((p) => p + 1);
    setPlaying(true);
    speak(transcript, { rate, onEnd: () => setPlaying(false) });
  }

  return (
    <div className="space-y-5">
      <div className="card space-y-3">
        <p className="text-sm text-muted">{t("listenIntro")}</p>
        {audioUrl ? (
          <audio controls src={audioUrl} className="w-full" onPlay={() => setPlays((p) => p + 1)} />
        ) : canSpeak ? (
          <div className="flex flex-wrap gap-3">
            {playing ? (
              <button className="btn-outline" onClick={() => { stopSpeaking(); setPlaying(false); }}>⏹ {t("stop")}</button>
            ) : (
              <>
                <button className="btn-primary" onClick={() => play(0.9)}>▶ {t("play")}</button>
                <button className="btn-outline" onClick={() => play(0.7)}>🐢 {t("playSlow")}</button>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-danger">{t("noSpeech")}</p>
        )}
        {plays > 0 && <p className="text-xs text-muted">{t("plays", { count: plays })}</p>}
        {(answered || (!audioUrl && !canSpeak)) && (
          <button className="text-sm text-primary underline" onClick={() => setShowTranscript(!showTranscript)}>
            {showTranscript ? t("hideTranscript") : t("showTranscript")}
          </button>
        )}
        {showTranscript && <p className="whitespace-pre-line rounded-md bg-primary-light p-3 text-sm">{transcript}</p>}
      </div>
      <QuestionSet
        questions={questions}
        onComplete={(s, m) => {
          setAnswered(true);
          onComplete(s, m);
        }}
      />
    </div>
  );
}
