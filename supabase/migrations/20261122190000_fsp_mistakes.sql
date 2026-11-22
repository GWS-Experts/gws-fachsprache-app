-- Fehlertrainer: sammelt die Fehler jeder Person und übt sie gezielt.
-- Nur eine neue Tabelle, Funktion und Policies im Schema fsp; bestehende Tabellen bleiben unverändert.
--
-- Quellen:
--   lesson  – falsch beantwortete Frage in einer Übung (Lesen, Hören, Sprachbausteine …)
--   exam    – falsch beantwortete Frage in einer Probeprüfung
--   writing – Korrektur aus dem freigegebenen Feedback zu einem eigenen Text
-- Ein Fehler gilt als "sicher", wenn er zweimal hintereinander richtig beantwortet wurde.
-- Wird er später wieder falsch beantwortet, kommt er zurück in den Trainer.

create table fsp.mistakes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references fsp.profiles (id) on delete cascade,
  -- Eindeutiger Schlüssel pro Person, z. B. "q:<lesson_id>:<frage>" oder "w:<submission_id>:<hash>"
  item_key text not null check (length(item_key) between 1 and 200),
  source text not null check (source in ('lesson', 'exam', 'writing')),
  lesson_id uuid references fsp.lessons (id) on delete cascade,
  submission_id uuid references fsp.submissions (id) on delete cascade,
  -- Kopie der Frage (gleiches Format wie lessons.content.questions[]), damit spätere
  -- Änderungen an der Lektion den Trainer nicht durcheinanderbringen.
  question jsonb not null,
  wrong_count int not null default 1 check (wrong_count >= 0),
  right_streak int not null default 0 check (right_streak >= 0),
  last_wrong_at timestamptz not null default now(),
  last_practiced_at timestamptz,
  mastered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, item_key)
);
create index mistakes_user_open_idx on fsp.mistakes (user_id, mastered_at, last_wrong_at desc);
create index mistakes_lesson_idx on fsp.mistakes (lesson_id);
create index mistakes_submission_idx on fsp.mistakes (submission_id);

-- Geübter Fehler zählt im Lernplan wie eine Karteikarte (20 Sekunden).
create or replace function fsp_private.on_mistake_practiced()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.last_practiced_at is distinct from old.last_practiced_at then
    perform fsp_private.log_study_activity(new.user_id, 20, 0, 1);
  end if;
  return new;
end;
$$;
revoke execute on function fsp_private.on_mistake_practiced() from public, anon, authenticated;

create trigger mistakes_log_activity after update on fsp.mistakes
  for each row execute function fsp_private.on_mistake_practiced();

-- Rechte -------------------------------------------------------------------
grant all on fsp.mistakes to service_role;
grant select, delete on fsp.mistakes to authenticated;
grant insert (item_key, source, lesson_id, submission_id, question, wrong_count, right_streak,
              last_wrong_at, last_practiced_at, mastered_at) on fsp.mistakes to authenticated;
grant update (question, wrong_count, right_streak, last_wrong_at, last_practiced_at, mastered_at)
  on fsp.mistakes to authenticated;

alter table fsp.mistakes enable row level security;

-- Jede Person sieht und pflegt nur ihre eigenen Fehler; GWS darf alle lesen.
create policy "mistakes_select_own_or_staff" on fsp.mistakes
  for select to authenticated
  using (user_id = (select auth.uid()) or (select fsp_private.is_staff()));
create policy "mistakes_insert_own" on fsp.mistakes
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "mistakes_update_own" on fsp.mistakes
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "mistakes_delete_own_or_staff" on fsp.mistakes
  for delete to authenticated
  using (user_id = (select auth.uid()) or (select fsp_private.is_staff()));
