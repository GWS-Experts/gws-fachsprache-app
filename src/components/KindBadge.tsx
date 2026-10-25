import { useTranslations } from "next-intl";
import type { LessonKind } from "@/lib/types";

const ICONS: Record<LessonKind, string> = {
  reading: "📖",
  listening: "🎧",
  vocabulary: "🗂️",
  quiz: "❓",
  dialogue: "🗣️",
  writing: "✍️",
  speaking: "🎙️",
};

export function KindBadge({ kind }: { kind: LessonKind }) {
  const t = useTranslations("kinds");
  return (
    <span className="badge bg-accent-light text-accent">
      <span aria-hidden className="mr-1">{ICONS[kind]}</span>
      {t(kind)}
    </span>
  );
}
