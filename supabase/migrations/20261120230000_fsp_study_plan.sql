-- Fachbegriffe besser lernbar machen: Aussprache-Aufnahmen, Lernplan und Lernzeit pro Tag.
-- Rein additiv, nur Schema fsp; Tabellen des Visa-Portals bleiben unberührt.

-- 1. Aussprache: optionale Aufnahme pro Begriff (Datei im Bucket fsp-media) ----------
alter table fsp.glossary_terms add column if not exists audio_path text;

-- 2. Lernplan pro Kunde -------------------------------------------------------------
create table fsp.study_plans (
  user_id uuid primary key default auth.uid() references fsp.profiles (id) on delete cascade,
  daily_minutes int not null default 10 check (daily_minutes between 5 and 120),
  -- Lerntage als ISO-Wochentage: 1 = Montag … 7 = Sonntag
  days smallint[] not null default '{1,2,3,4,5,6,7}' check (days <@ '{1,2,3,4,5,6,7}'::smallint[]),
  remind boolean not null default true,
  remind_hour smallint not null default 18 check (remind_hour between 0 and 23),
  timezone text not null default 'Europe/Berlin' check (length(timezone) between 1 and 64),
  last_reminded_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger study_plans_touch before update on fsp.study_plans
  for each row execute function fsp_private.touch_updated_at();

-- 3. Lernzeit pro Kunde und Tag (wird automatisch über Trigger gefüllt) -------------
create table fsp.study_activity (
  user_id uuid not null references fsp.profiles (id) on delete cascade,
  day date not null,
  seconds int not null default 0 check (seconds >= 0),
  lessons int not null default 0 check (lessons >= 0),
  cards int not null default 0 check (cards >= 0),
  primary key (user_id, day)
);

-- Tag in der Zeitzone des Kunden (aus dem Lernplan, sonst Europe/Berlin).
create or replace function fsp_private.study_day(uid uuid)
returns date
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  tz text;
begin
  select timezone into tz from fsp.study_plans where user_id = uid;
  begin
    return (now() at time zone coalesce(tz, 'Europe/Berlin'))::date;
  exception when others then
    return (now() at time zone 'Europe/Berlin')::date;
  end;
end;
$$;

create or replace function fsp_private.log_study_activity(uid uuid, add_seconds int, add_lessons int, add_cards int)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into fsp.study_activity (user_id, day, seconds, lessons, cards)
  values (uid, fsp_private.study_day(uid), greatest(add_seconds, 0), add_lessons, add_cards)
  on conflict (user_id, day) do update
    set seconds = fsp.study_activity.seconds + excluded.seconds,
        lessons = fsp.study_activity.lessons + excluded.lessons,
        cards = fsp.study_activity.cards + excluded.cards;
$$;

-- Lektion abgeschlossen: gemessene Zeit, höchstens 1 Stunde pro Durchgang.
create or replace function fsp_private.on_progress_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform fsp_private.log_study_activity(new.user_id, least(new.duration_seconds, 3600), 1, 0);
  return new;
end;
$$;

-- Karteikarte im Vokabeltrainer beantwortet: 15 Sekunden pro Karte.
create or replace function fsp_private.on_glossary_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' and new.reviews > 0) or (tg_op = 'UPDATE' and new.reviews > old.reviews) then
    perform fsp_private.log_study_activity(new.user_id, 15, 0, 1);
  end if;
  return new;
end;
$$;

create trigger progress_log_activity after insert on fsp.progress
  for each row execute function fsp_private.on_progress_insert();
create trigger glossary_reviews_log_activity after insert or update on fsp.glossary_reviews
  for each row execute function fsp_private.on_glossary_review();

-- Bisherige Lektionen als Lernzeit übernehmen, damit der Verlauf nicht leer startet.
insert into fsp.study_activity (user_id, day, seconds, lessons)
select user_id, (completed_at at time zone 'Europe/Berlin')::date, sum(least(duration_seconds, 3600)), count(*)
from fsp.progress
group by 1, 2
on conflict (user_id, day) do nothing;

-- Rechte -----------------------------------------------------------------------------
revoke execute on function fsp_private.study_day(uuid) from public, anon, authenticated;
revoke execute on function fsp_private.log_study_activity(uuid, int, int, int) from public, anon, authenticated;
revoke execute on function fsp_private.on_progress_insert() from public, anon, authenticated;
revoke execute on function fsp_private.on_glossary_review() from public, anon, authenticated;

grant all on fsp.study_plans, fsp.study_activity to service_role;
grant select, delete on fsp.study_plans to authenticated;
grant insert (user_id, daily_minutes, days, remind, remind_hour, timezone) on fsp.study_plans to authenticated;
grant update (user_id, daily_minutes, days, remind, remind_hour, timezone) on fsp.study_plans to authenticated;
grant select on fsp.study_activity to authenticated;

alter table fsp.study_plans enable row level security;
alter table fsp.study_activity enable row level security;

create policy "study_plans_select_own_or_staff" on fsp.study_plans
  for select to authenticated
  using (user_id = (select auth.uid()) or (select fsp_private.is_staff()));
create policy "study_plans_insert_own" on fsp.study_plans
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "study_plans_update_own" on fsp.study_plans
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "study_plans_delete_own" on fsp.study_plans
  for delete to authenticated using (user_id = (select auth.uid()));

-- Lernzeit schreibt nur der Trigger; lesen dürfen der Kunde selbst und GWS.
create policy "study_activity_select_own_or_staff" on fsp.study_activity
  for select to authenticated
  using (user_id = (select auth.uid()) or (select fsp_private.is_staff()));
