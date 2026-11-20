import { useTranslations } from "next-intl";
import type { PartStat, Readiness, ReadinessStatus } from "@/lib/readiness";

const STATUS_STYLE: Record<ReadinessStatus, string> = {
  ready: "bg-success-light text-success",
  onTrack: "bg-primary-light text-primary",
  behind: "bg-danger-light text-danger",
  inactive: "bg-accent-light text-accent",
};
const STATUS_ICON: Record<ReadinessStatus, string> = { ready: "✅", onTrack: "📈", behind: "⚠️", inactive: "💤" };

export function ReadinessBadge({ status }: { status: ReadinessStatus }) {
  const t = useTranslations("readiness");
  return (
    <span className={`badge whitespace-nowrap ${STATUS_STYLE[status]}`}>
      <span aria-hidden className="mr-1">{STATUS_ICON[status]}</span>
      {t(`status.${status}`)}
    </span>
  );
}

const PART_ICON: Partial<Record<PartStat["kind"], string>> = { listening: "🎧", reading: "📖", writing: "✍️", speaking: "🎙️" };

// Vier kleine Kästchen: Hören, Lesen, Schreiben, Sprechen
export function PartChips({ parts }: { parts: PartStat[] }) {
  const t = useTranslations("kinds");
  return (
    <div className="flex gap-1">
      {parts.map((p) => {
        const tone = p.total === 0 ? "bg-page text-muted" : p.done === 0 ? "bg-danger-light text-danger" : p.percent >= 80 ? "bg-success-light text-success" : "bg-primary-light text-primary";
        const detail = p.total === 0 ? "–" : `${p.done}/${p.total}${p.scorePercent !== null ? ` · ${p.scorePercent} %` : ""}`;
        return (
          <span key={p.kind} title={`${t(p.kind)}: ${detail}`} className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${tone}`}>
            <span aria-hidden>{PART_ICON[p.kind]}</span>
            <span className="sr-only">{t(p.kind)}: {detail}</span>
          </span>
        );
      })}
    </div>
  );
}

// Ausführliche Karte für die Kundenseite
export function ReadinessCard({ r }: { r: Readiness }) {
  const t = useTranslations("readiness");
  const k = useTranslations("kinds");
  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-primary">{t("title")}</h2>
        <ReadinessBadge status={r.status} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div><div className="text-xs text-muted">{t("score")}</div><div className="text-2xl font-bold text-primary">{r.score}</div></div>
        <div><div className="text-xs text-muted">{t("lessons")}</div><div className="text-2xl font-bold text-primary">{r.percent} %</div></div>
        <div><div className="text-xs text-muted">{t("avg")}</div><div className="text-2xl font-bold text-primary">{r.avgScore ?? "–"}{r.avgScore !== null && " %"}</div></div>
      </div>
      <ul className="grid gap-2 sm:grid-cols-4">
        {r.parts.map((p) => (
          <li key={p.kind} className="rounded-md border border-line px-3 py-2 text-sm">
            <div className="font-semibold">{k(p.kind)}</div>
            <div className="text-muted">{p.total ? t("partDone", { done: p.done, total: p.total }) : t("partNone")}</div>
            {p.scorePercent !== null && <div className="text-muted">{t("partScore", { score: p.scorePercent })}</div>}
          </li>
        ))}
      </ul>
      {r.reasons.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
          {r.reasons.map((reason) => <li key={reason}>{t(`reasons.${reason}`)}</li>)}
        </ul>
      )}
      <p className="text-xs text-muted">{t("rule")}</p>
    </section>
  );
}
