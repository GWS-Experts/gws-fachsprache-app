-- KI-Korrekturvorschläge für Schreibabgaben.
-- Nur ergänzend: eine neue Tabelle, bestehende Tabellen bleiben unverändert.
-- Der Vorschlag liegt bewusst in einer eigenen Tabelle, die nur GWS lesen darf.
-- Kunden sehen ausschließlich fsp.submissions.feedback, also erst nach Freigabe.

create table fsp.feedback_drafts (
  submission_id uuid primary key references fsp.submissions (id) on delete cascade,
  draft text not null check (length(draft) <= 20000),
  model text not null default '',
  created_by uuid references fsp.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index feedback_drafts_created_by_idx on fsp.feedback_drafts (created_by);

grant select, insert, update, delete on fsp.feedback_drafts to authenticated;
grant all on fsp.feedback_drafts to service_role;

alter table fsp.feedback_drafts enable row level security;

create policy "feedback_drafts_select_staff" on fsp.feedback_drafts
  for select to authenticated using ((select fsp_private.is_staff()));
create policy "feedback_drafts_insert_staff" on fsp.feedback_drafts
  for insert to authenticated with check ((select fsp_private.is_staff()));
create policy "feedback_drafts_update_staff" on fsp.feedback_drafts
  for update to authenticated
  using ((select fsp_private.is_staff())) with check ((select fsp_private.is_staff()));
create policy "feedback_drafts_delete_staff" on fsp.feedback_drafts
  for delete to authenticated using ((select fsp_private.is_staff()));
