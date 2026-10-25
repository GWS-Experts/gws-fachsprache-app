"use client";

import { useSyncExternalStore } from "react";

// Vorlesen über die Sprachausgabe des Browsers, wenn keine Audiodatei hinterlegt ist.
export function speechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, { rate = 0.9, onEnd }: { rate?: number; onEnd?: () => void } = {}) {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = rate;
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith("de"));
  if (voice) utterance.voice = voice;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}

const noopSubscribe = () => () => {};

// Liefert beim Server-Rendering false und im Browser den echten Wert, ohne Hydration-Fehler.
export function useSpeechSupported() {
  return useSyncExternalStore(noopSubscribe, speechSupported, () => false);
}
