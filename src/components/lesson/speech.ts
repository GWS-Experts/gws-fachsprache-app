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
  const voice = germanVoice();
  if (voice) utterance.voice = voice;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

// Beste deutsche Stimme: natürliche Online-Stimmen (Edge, Chrome, Safari) vor einfachen Systemstimmen.
function germanVoice() {
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.replace("_", "-").toLowerCase().startsWith("de"));
  const score = (v: SpeechSynthesisVoice) =>
    (/natural|neural|online|premium|enhanced/i.test(v.name) ? 4 : 0) + (/google/i.test(v.name) ? 2 : 0) + (v.lang.toLowerCase() === "de-de" ? 1 : 0);
  return voices.sort((a, b) => score(b) - score(a))[0];
}

// Manche Browser laden die Stimmenliste erst nach dem ersten Aufruf.
if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.getVoices();

export function stopSpeaking() {
  if (speechSupported()) window.speechSynthesis.cancel();
}

const noopSubscribe = () => () => {};

// Liefert beim Server-Rendering false und im Browser den echten Wert, ohne Hydration-Fehler.
export function useSpeechSupported() {
  return useSyncExternalStore(noopSubscribe, speechSupported, () => false);
}
