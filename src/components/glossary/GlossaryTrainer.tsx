"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { GlossaryTerm } from "@/lib/types";
import { recordGlossaryReview } from "@/app/actions/glossary";
import { speak, useSpeechSupported } from "@/components/lesson/speech";
import { TermHeading, termLabel } from "./TermCard";

type Direction = "term" | "meaning";

export function GlossaryTrainer({ cards, backHref }: { cards: GlossaryTerm[]; backHref: string }) {
  const t = useTranslations("glossary");
  const router = useRouter();
  const canSpeak = useSpeechSupported();
  const [deck, setDeck] = useState(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState<Direction>("term");
  const [missed, setMissed] = useState<GlossaryTerm[]>([]);
  const [known, setKnown] = useState(0);
  const [done, setDone] = useState(false);

  if (deck.length === 0) {
    return (
      <div className="card space-y-3 text-center">
        <p className="text-muted">{t("trainEmpty")}</p>
        <Link href={backHref} className="btn-outline">{t("back")}</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card space-y-4">
        <h2 className="text-xl font-bold text-primary">{t("trainDone")}</h2>
        <p className="text-lg">{t("trainResult", { known, total: deck.length })}</p>
        {missed.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-semibold text-muted">{t("trainMissed")}</p>
            <ul className="space-y-1 text-sm">
              {missed.map((m) => (
                <li key={m.id}>
                  <TermHeading term={m} className="font-semibold" />
                  {m.explanation && <span className="text-muted"> – {m.explanation}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-3">
          {missed.length > 0 && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setDeck(missed);
                setMissed([]);
                setKnown(0);
                setIndex(0);
                setFlipped(false);
                setDone(false);
              }}
            >
              {t("trainMissedAgain")}
            </button>
          )}
          <button type="button" className="btn-outline" onClick={() => router.refresh()}>{t("trainNext")}</button>
          <Link href={backHref} className="btn-outline">{t("back")}</Link>
        </div>
      </div>
    );
  }

  const card = deck[index];
  const showTermFirst = direction === "term";

  function answer(knewIt: boolean) {
    void recordGlossaryReview({ termId: card.id, known: knewIt });
    if (knewIt) setKnown((k) => k + 1);
    else setMissed((m) => [...m, card]);
    if (index + 1 >= deck.length) setDone(true);
    else {
      setIndex(index + 1);
      setFlipped(false);
    }
  }

  const termSide = (
    <>
      <span className="text-3xl font-bold text-primary"><TermHeading term={card} /></span>
      {card.plural && <span className="text-sm text-muted">{t("plural")}: {card.plural}</span>}
    </>
  );
  const meaningSide = (
    <>
      {card.explanation && <span className="max-w-lg text-lg text-ink">{card.explanation}</span>}
      {card.en && <span className="text-base font-semibold text-accent">🇬🇧 {card.en}</span>}
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{t("cardOf", { n: index + 1, total: deck.length })}</p>
        <div className="flex gap-1 rounded-md border border-line bg-surface p-1 text-sm" role="group" aria-label={t("direction")}>
          {(["term", "meaning"] as Direction[]).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDirection(d);
                setFlipped(false);
              }}
              className={`rounded px-3 py-1 font-semibold ${direction === d ? "bg-primary text-white" : "text-ink hover:bg-primary-light"}`}
              aria-pressed={direction === d}
            >
              {d === "term" ? t("directionTerm") : t("directionMeaning")}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        className="card flex min-h-64 w-full flex-col items-center justify-center gap-3 text-center transition hover:border-primary"
        aria-label={t("flip")}
      >
        {showTermFirst ? termSide : meaningSide}
        {flipped ? (
          <>
            <span className="my-1 h-px w-24 bg-line" aria-hidden />
            {showTermFirst ? meaningSide : termSide}
            {card.example && <span className="max-w-md text-sm italic text-muted">„{card.example}“</span>}
          </>
        ) : (
          <span className="text-sm text-muted">{showTermFirst ? t("flipHintTerm") : t("flipHintMeaning")}</span>
        )}
      </button>
      <div className="flex flex-wrap items-center gap-3">
        {canSpeak && (showTermFirst || flipped) && (
          <button type="button" className="btn-outline" onClick={() => speak(card.example ? `${termLabel(card)}. ${card.example}` : termLabel(card))}>
            🔊 {t("listen")}
          </button>
        )}
        {flipped ? (
          <>
            <button type="button" className="btn-outline" onClick={() => answer(false)}>{t("didntKnow")}</button>
            <button type="button" className="btn-primary" onClick={() => answer(true)}>{t("knew")}</button>
          </>
        ) : (
          <button type="button" className="btn-primary" onClick={() => setFlipped(true)}>{t("reveal")}</button>
        )}
      </div>
    </div>
  );
}
