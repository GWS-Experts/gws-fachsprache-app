"use client";

import { useTranslations } from "next-intl";
import type { DialogueLine } from "@/lib/types";
import { speak, useSpeechSupported } from "./speech";

export function Dialogue({ lines }: { lines: DialogueLine[] }) {
  const t = useTranslations("lesson");
  const canSpeak = useSpeechSupported();
  const speakers = [...new Set(lines.map((l) => l.speaker))];

  return (
    <div className="card space-y-3">
      {canSpeak && (
        <button className="btn-outline" onClick={() => speak(lines.map((l) => l.text).join(" "))}>🔊 {t("playDialogue")}</button>
      )}
      <ul className="space-y-3">
        {lines.map((line, i) => {
          const right = speakers.indexOf(line.speaker) % 2 === 1;
          return (
            <li key={i} className={`flex ${right ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-4 py-2.5 ${right ? "bg-primary text-white" : "bg-primary-light text-ink"}`}>
                <p className={`text-xs font-semibold ${right ? "text-white/80" : "text-primary"}`}>{line.speaker}</p>
                <p className="mt-0.5">{line.text}</p>
                {canSpeak && (
                  <button className={`mt-1 text-xs underline ${right ? "text-white/80" : "text-primary"}`} onClick={() => speak(line.text)}>
                    🔊 {t("listen")}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
