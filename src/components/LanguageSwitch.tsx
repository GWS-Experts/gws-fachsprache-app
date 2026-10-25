"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "@/app/actions/locale";

export function LanguageSwitch() {
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  return (
    <div className="inline-flex overflow-hidden rounded-md border border-line bg-surface text-xs font-semibold" aria-label="Sprache / Language">
      {(["de", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          disabled={pending}
          aria-pressed={locale === l}
          onClick={() => startTransition(() => setLocale(l))}
          className={`px-2.5 py-1.5 uppercase ${locale === l ? "bg-primary text-white" : "text-muted hover:bg-primary-light"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
