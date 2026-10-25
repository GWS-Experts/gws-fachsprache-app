"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { VocabItem } from "@/lib/types";
import { speak, useSpeechSupported } from "./speech";

export function Vocabulary({ items, onComplete }: { items: VocabItem[]; onComplete: (score: number, max: number) => void }) {
  const t = useTranslations("lesson");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [showList, setShowList] = useState(false);
  const canSpeak = useSpeechSupported();

  if (items.length === 0) return null;
  const item = items[index];
  const front = [item.article, item.term].filter(Boolean).join(" ");

  function answer(knewIt: boolean) {
    const nextKnown = known + (knewIt ? 1 : 0);
    if (index + 1 >= items.length) {
      onComplete(nextKnown, items.length);
      return;
    }
    setKnown(nextKnown);
    setIndex(index + 1);
    setFlipped(false);
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("cardOf", { n: index + 1, total: items.length })}</p>
      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className="card flex min-h-56 w-full flex-col items-center justify-center gap-3 text-center transition hover:border-primary"
        aria-label={t("flip")}
      >
        <span className="text-3xl font-bold text-primary">{front}</span>
        {flipped ? (
          <>
            {item.plural && <span className="text-sm text-muted">{t("plural")}: {item.plural}</span>}
            <span className="text-lg font-semibold text-accent">{item.en}</span>
            {item.example && <span className="max-w-md text-sm italic text-ink">„{item.example}“</span>}
          </>
        ) : (
          <span className="text-sm text-muted">{t("flipHint")}</span>
        )}
      </button>
      <div className="flex flex-wrap items-center gap-3">
        {canSpeak && (
          <button type="button" className="btn-outline" onClick={() => speak(item.example ? `${front}. ${item.example}` : front)}>
            🔊 {t("listen")}
          </button>
        )}
        {flipped && (
          <>
            <button type="button" className="btn-outline" onClick={() => answer(false)}>{t("didntKnow")}</button>
            <button type="button" className="btn-primary" onClick={() => answer(true)}>{t("knew")}</button>
          </>
        )}
      </div>
      <button type="button" className="text-sm text-primary underline" onClick={() => setShowList(!showList)}>
        {showList ? t("hideList") : t("showList")}
      </button>
      {showList && (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="bg-primary-light text-primary">
              <tr>
                <th className="px-3 py-2">{t("term")}</th>
                <th className="px-3 py-2">{t("plural")}</th>
                <th className="px-3 py-2">English</th>
              </tr>
            </thead>
            <tbody>
              {items.map((v, i) => (
                <tr key={i} className="border-t border-line">
                  <td className="px-3 py-2 font-semibold">{[v.article, v.term].filter(Boolean).join(" ")}</td>
                  <td className="px-3 py-2">{v.plural}</td>
                  <td className="px-3 py-2">{v.en}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
