"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

// Links zu Impressum und Datenschutz – auf jeder Seite im Fuß.
export function LegalLinks({ className = "" }: { className?: string }) {
  const t = useTranslations("legal");
  return (
    <span className={`inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-1 ${className}`}>
      <Link href="/impressum" className="hover:text-primary hover:underline">{t("imprint")}</Link>
      <Link href="/datenschutz" className="hover:text-primary hover:underline">{t("privacy")}</Link>
    </span>
  );
}
