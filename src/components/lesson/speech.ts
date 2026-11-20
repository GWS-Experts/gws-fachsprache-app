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

// Zerlegt einen Hörtext in Sprecherzeilen. Format pro Zeile: "Sprecher: Text".
// Zeilen ohne Sprecher gehören zum vorherigen Sprecher (bzw. zu einer Erzählstimme).
export function parseScript(script: string): { speaker: string; text: string }[] {
  const out: { speaker: string; text: string }[] = [];
  for (const raw of script.split(/\n+/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^([^:]{1,40}):\s+(.+)$/);
    if (m && !/\d$/.test(m[1])) out.push({ speaker: m[1].trim(), text: m[2].trim() });
    else if (out.length) out[out.length - 1].text += ` ${line}`;
    else out.push({ speaker: "", text: line });
  }
  return out;
}

// Liest mehrere Sprecher nacheinander vor; jede Person bekommt, wenn möglich, eine eigene Stimme.
export function speakLines(lines: { speaker: string; text: string }[], { rate = 0.95, onEnd }: { rate?: number; onEnd?: () => void } = {}) {
  if (!speechSupported() || lines.length === 0) return onEnd?.();
  const synth = window.speechSynthesis;
  synth.cancel();
  const voices = synth.getVoices().filter((v) => v.lang.startsWith("de"));
  const speakers = [...new Set(lines.map((l) => l.speaker))];
  lines.forEach((line, i) => {
    const u = new SpeechSynthesisUtterance(line.text);
    u.lang = "de-DE";
    u.rate = rate;
    const idx = speakers.indexOf(line.speaker);
    if (voices.length) u.voice = voices[idx % voices.length];
    // Gibt es nur eine deutsche Stimme, unterscheiden sich die Sprecher über die Tonhöhe.
    if (voices.length < 2) u.pitch = [1, 0.75, 1.25, 0.9][idx % 4];
    if (i === lines.length - 1 && onEnd) u.onend = onEnd;
    synth.speak(u);
  });
}

export function speakScript(script: string, opts: { rate?: number; onEnd?: () => void } = {}) {
  speakLines(parseScript(script), opts);
}
