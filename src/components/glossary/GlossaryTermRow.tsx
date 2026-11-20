"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { deleteGlossaryTerm } from "@/app/actions/glossary";
import { ConfirmButton } from "@/components/ConfirmButton";
import type { GlossaryTerm } from "@/lib/types";
import { TermHeading } from "./TermCard";
import { GlossaryTermForm } from "./GlossaryAdminForms";

export function GlossaryTermRow({ term }: { term: GlossaryTerm }) {
  const t = useTranslations("glossaryAdmin");
  const [open, setOpen] = useState(false);

  return (
    <li className="card p-4">
      <div className="flex items-start gap-3">
        <span className="w-8 shrink-0 pt-0.5 text-center text-sm font-bold text-muted">{term.sort}</span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold"><TermHeading term={term} /></p>
          {!open && (
            <p className="mt-0.5 truncate text-sm text-muted">
              {[term.plural, term.explanation, term.en].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <button type="button" className="btn-outline px-3 py-1.5" onClick={() => setOpen(!open)}>
          {open ? t("close") : t("edit")}
        </button>
      </div>
      {open && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <GlossaryTermForm topicId={term.topic_id} term={term} />
          <form action={deleteGlossaryTerm} className="text-right">
            <input type="hidden" name="id" value={term.id} />
            <ConfirmButton message={t("confirmDeleteTerm")} className="btn-danger px-3 py-1.5">{t("deleteTerm")}</ConfirmButton>
          </form>
        </div>
      )}
    </li>
  );
}
