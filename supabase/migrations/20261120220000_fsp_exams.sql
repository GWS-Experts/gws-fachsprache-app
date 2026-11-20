-- Prüfungssimulation: Probeprüfungen mit Zeitlimit und Auswertung.
-- Nur neue Tabellen, Funktionen und Policies im Schema fsp; bestehende Tabellen bleiben unverändert.
--
-- Eine Prüfung (fsp.exams) gehört zu genau einem Modul. Die Lektionen dieses Moduls sind die
-- Prüfungsteile (in ihrer Sortierung). Das Modul bleibt unveröffentlicht, damit es nicht in der
-- normalen Modulliste erscheint; die Lektionen sind für Kunden über die veröffentlichte Prüfung lesbar.

create table fsp.exams (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null unique references fsp.modules (id) on delete cascade,
  slug text not null unique,
  title_de text not null,
  title_en text not null default '',
  description_de text not null default '',
  description_en text not null default '',
  pass_percent int not null default 60 check (pass_percent between 0 and 100),
  sort int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table fsp.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references fsp.profiles (id) on delete cascade,
  exam_id uuid not null references fsp.exams (id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  current_part int not null default 0 check (current_part >= 0),
  part_started_at timestamptz not null default now(),
  -- Antworten pro Prüfungsteil: { "<lesson_id>": { "answers": [...], "seconds": 0, "submission_id": "..." } }
  answers jsonb not null default '{}'::jsonb,
  -- Automatisch berechnete Punkte pro Teil (Lesen, Sprachbausteine, Hören).
  results jsonb not null default '[]'::jsonb,
  score int not null default 0 check (score >= 0),
  max_score int not null default 0 check (max_score >= 0),
  -- Punkte für Schreiben und Sprechen vergibt GWS: { "<lesson_id>": 8 }
  staff_points jsonb not null default '{}'::jsonb,
  staff_comment text,
  reviewed_by uuid references fsp.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index exam_attempts_user_idx on fsp.exam_attempts (user_id, started_at desc);
create index exam_attempts_exam_idx on fsp.exam_attempts (exam_id);
create index exam_attempts_reviewed_by_idx on fsp.exam_attempts (reviewed_by);

create trigger exams_touch before update on fsp.exams
  for each row execute function fsp_private.touch_updated_at();

-- Kunden dürfen ihre laufende Prüfung fortschreiben, aber keine GWS-Bewertung setzen.
create or replace function fsp_private.protect_exam_review()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not fsp_private.is_staff() then
    new.staff_points = old.staff_points;
    new.staff_comment = old.staff_comment;
    new.reviewed_by = old.reviewed_by;
    new.reviewed_at = old.reviewed_at;
    new.user_id = old.user_id;
    new.exam_id = old.exam_id;
    new.started_at = old.started_at;
  end if;
  return new;
end;
$$;
revoke execute on function fsp_private.protect_exam_review() from public, anon, authenticated;

create trigger exam_attempts_protect before update on fsp.exam_attempts
  for each row execute function fsp_private.protect_exam_review();

-- Rechte -------------------------------------------------------------------
grant all on fsp.exams, fsp.exam_attempts to service_role;
grant select, insert, update, delete on fsp.exams to authenticated;
grant select, delete on fsp.exam_attempts to authenticated;
grant insert (exam_id) on fsp.exam_attempts to authenticated;
grant update (current_part, part_started_at, answers, results, score, max_score, finished_at,
              staff_points, staff_comment, reviewed_by, reviewed_at) on fsp.exam_attempts to authenticated;

alter table fsp.exams enable row level security;
alter table fsp.exam_attempts enable row level security;

create policy "exams_select" on fsp.exams
  for select to authenticated
  using (published or (select fsp_private.is_staff()));
create policy "exams_insert_staff" on fsp.exams
  for insert to authenticated with check ((select fsp_private.is_staff()));
create policy "exams_update_staff" on fsp.exams
  for update to authenticated
  using ((select fsp_private.is_staff())) with check ((select fsp_private.is_staff()));
create policy "exams_delete_staff" on fsp.exams
  for delete to authenticated using ((select fsp_private.is_staff()));

create policy "exam_attempts_select_own_or_staff" on fsp.exam_attempts
  for select to authenticated
  using (user_id = (select auth.uid()) or (select fsp_private.is_staff()));
create policy "exam_attempts_insert_own" on fsp.exam_attempts
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from fsp.exams e where e.id = exam_id and e.published)
  );
create policy "exam_attempts_update_own_open" on fsp.exam_attempts
  for update to authenticated
  using (user_id = (select auth.uid()) and finished_at is null)
  with check (user_id = (select auth.uid()));
create policy "exam_attempts_update_staff" on fsp.exam_attempts
  for update to authenticated
  using ((select fsp_private.is_staff())) with check ((select fsp_private.is_staff()));
create policy "exam_attempts_delete_staff" on fsp.exam_attempts
  for delete to authenticated using ((select fsp_private.is_staff()));

-- Prüfungsteile: veröffentlichte Lektionen einer veröffentlichten Prüfung sind für alle lesbar,
-- auch wenn das zugehörige Modul (absichtlich) nicht veröffentlicht ist.
create policy "lessons_select_exam" on fsp.lessons
  for select to authenticated
  using (published and exists (select 1 from fsp.exams e where e.module_id = lessons.module_id and e.published));
