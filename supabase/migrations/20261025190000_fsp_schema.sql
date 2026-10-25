-- GWS Fachsprachprüfung Trainings-App: eigenes Schema "fsp" im Projekt GWS.
-- Die Tabellen des Visa-Portals (Schema public) bleiben unberührt.

create schema if not exists fsp;
create schema if not exists fsp_private;

create type fsp.role as enum ('customer', 'staff');
create type fsp.lesson_kind as enum ('reading', 'listening', 'vocabulary', 'quiz', 'dialogue', 'writing', 'speaking');

-- Profile ------------------------------------------------------------------
create table fsp.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  email text not null,
  role fsp.role not null default 'customer',
  locale text not null default 'de' check (locale in ('de', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Lerninhalte --------------------------------------------------------------
create table fsp.modules (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_de text not null,
  title_en text not null default '',
  description_de text not null default '',
  description_en text not null default '',
  sort int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table fsp.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references fsp.modules (id) on delete cascade,
  kind fsp.lesson_kind not null,
  title_de text not null,
  title_en text not null default '',
  content jsonb not null default '{}'::jsonb,
  sort int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lessons_module_idx on fsp.lessons (module_id, sort);

-- Lernfortschritt ----------------------------------------------------------
create table fsp.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references fsp.profiles (id) on delete cascade,
  lesson_id uuid not null references fsp.lessons (id) on delete cascade,
  score int not null default 0 check (score >= 0),
  max_score int not null default 0 check (max_score >= 0),
  duration_seconds int not null default 0 check (duration_seconds >= 0),
  completed_at timestamptz not null default now()
);
create index progress_user_idx on fsp.progress (user_id, completed_at desc);
create index progress_lesson_idx on fsp.progress (lesson_id);

-- Schreib- und Sprechabgaben -----------------------------------------------
create table fsp.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references fsp.profiles (id) on delete cascade,
  lesson_id uuid not null references fsp.lessons (id) on delete cascade,
  text text,
  audio_path text,
  feedback text,
  feedback_by uuid references fsp.profiles (id) on delete set null,
  feedback_at timestamptz,
  created_at timestamptz not null default now(),
  check (text is not null or audio_path is not null)
);
create index submissions_user_idx on fsp.submissions (user_id, created_at desc);
create index submissions_lesson_idx on fsp.submissions (lesson_id);
create index submissions_feedback_by_idx on fsp.submissions (feedback_by);

-- Nachrichten: ein Verlauf pro Kunde -------------------------------------
create table fsp.messages (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references fsp.profiles (id) on delete cascade,
  sender_id uuid not null default auth.uid() references fsp.profiles (id) on delete cascade,
  lesson_id uuid references fsp.lessons (id) on delete set null,
  body text not null check (length(trim(body)) > 0 and length(body) <= 5000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_customer_idx on fsp.messages (customer_id, created_at);
create index messages_sender_idx on fsp.messages (sender_id);
create index messages_lesson_idx on fsp.messages (lesson_id);

-- Hilfsfunktionen (nicht über die API erreichbar) ---------------------------
create or replace function fsp_private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from fsp.profiles
    where id = (select auth.uid()) and role = 'staff'
  );
$$;

create or replace function fsp_private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch before update on fsp.profiles
  for each row execute function fsp_private.touch_updated_at();
create trigger modules_touch before update on fsp.modules
  for each row execute function fsp_private.touch_updated_at();
create trigger lessons_touch before update on fsp.lessons
  for each row execute function fsp_private.touch_updated_at();

-- Neue Nutzer der Trainings-App bekommen automatisch ein fsp-Profil.
-- Nur Konten mit app = 'fsp' in den Metadaten (Einladung aus der App),
-- damit Konten des Visa-Portals nicht betroffen sind.
create or replace function fsp_private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.raw_user_meta_data ->> 'app' = 'fsp' then
    insert into fsp.profiles (id, email, first_name, last_name, locale)
    values (
      new.id,
      new.email,
      coalesce(new.raw_user_meta_data ->> 'first_name', ''),
      coalesce(new.raw_user_meta_data ->> 'last_name', ''),
      case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'de' end
    )
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

create trigger fsp_on_auth_user_created
  after insert on auth.users
  for each row execute function fsp_private.handle_new_user();

create or replace function fsp_private.handle_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update fsp.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger fsp_on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function fsp_private.handle_email_change();

-- Rechte -------------------------------------------------------------------
-- anon bekommt keinen Zugriff auf das Schema; alles läuft über angemeldete Nutzer.
grant usage on schema fsp to authenticated, service_role;
grant usage on schema fsp_private to authenticated;
grant execute on function fsp_private.is_staff() to authenticated;
revoke execute on function fsp_private.handle_new_user() from public, anon, authenticated;
revoke execute on function fsp_private.handle_email_change() from public, anon, authenticated;

grant all on all tables in schema fsp to service_role;

grant select on fsp.profiles to authenticated;
grant update (first_name, last_name, locale) on fsp.profiles to authenticated;

grant select on fsp.modules, fsp.lessons to authenticated;
grant insert, update, delete on fsp.modules, fsp.lessons to authenticated;

grant select, insert on fsp.progress to authenticated;

grant select on fsp.submissions to authenticated;
grant insert (lesson_id, text, audio_path) on fsp.submissions to authenticated;
grant update (feedback, feedback_by, feedback_at) on fsp.submissions to authenticated;

grant select on fsp.messages to authenticated;
grant insert (customer_id, lesson_id, body) on fsp.messages to authenticated;
grant update (read_at) on fsp.messages to authenticated;

-- Row Level Security -------------------------------------------------------
alter table fsp.profiles enable row level security;
alter table fsp.modules enable row level security;
alter table fsp.lessons enable row level security;
alter table fsp.progress enable row level security;
alter table fsp.submissions enable row level security;
alter table fsp.messages enable row level security;

-- profiles: Kunden sehen und ändern nur sich selbst, GWS sieht alle.
create policy "profiles_select_own_or_staff" on fsp.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select fsp_private.is_staff()));
create policy "profiles_update_own_or_staff" on fsp.profiles
  for update to authenticated
  using (id = (select auth.uid()) or (select fsp_private.is_staff()))
  with check (id = (select auth.uid()) or (select fsp_private.is_staff()));

-- modules / lessons: veröffentlichte Inhalte für alle, Pflege nur durch GWS.
create policy "modules_select" on fsp.modules
  for select to authenticated
  using (published or (select fsp_private.is_staff()));
create policy "modules_insert_staff" on fsp.modules
  for insert to authenticated with check ((select fsp_private.is_staff()));
create policy "modules_update_staff" on fsp.modules
  for update to authenticated
  using ((select fsp_private.is_staff())) with check ((select fsp_private.is_staff()));
create policy "modules_delete_staff" on fsp.modules
  for delete to authenticated using ((select fsp_private.is_staff()));

create policy "lessons_select" on fsp.lessons
  for select to authenticated
  using (
    (select fsp_private.is_staff())
    or (published and exists (select 1 from fsp.modules m where m.id = module_id and m.published))
  );
create policy "lessons_insert_staff" on fsp.lessons
  for insert to authenticated with check ((select fsp_private.is_staff()));
create policy "lessons_update_staff" on fsp.lessons
  for update to authenticated
  using ((select fsp_private.is_staff())) with check ((select fsp_private.is_staff()));
create policy "lessons_delete_staff" on fsp.lessons
  for delete to authenticated using ((select fsp_private.is_staff()));

-- progress: eigener Fortschritt, GWS liest alles.
create policy "progress_select_own_or_staff" on fsp.progress
  for select to authenticated
  using (user_id = (select auth.uid()) or (select fsp_private.is_staff()));
create policy "progress_insert_own" on fsp.progress
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- submissions: eigene Abgaben, Feedback nur durch GWS.
create policy "submissions_select_own_or_staff" on fsp.submissions
  for select to authenticated
  using (user_id = (select auth.uid()) or (select fsp_private.is_staff()));
create policy "submissions_insert_own" on fsp.submissions
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "submissions_update_staff" on fsp.submissions
  for update to authenticated
  using ((select fsp_private.is_staff())) with check ((select fsp_private.is_staff()));

-- messages: Kunden sehen nur ihren eigenen Verlauf; GWS sieht und beantwortet alle.
create policy "messages_select_own_or_staff" on fsp.messages
  for select to authenticated
  using (customer_id = (select auth.uid()) or (select fsp_private.is_staff()));
create policy "messages_insert" on fsp.messages
  for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (customer_id = (select auth.uid()) or (select fsp_private.is_staff()))
  );
create policy "messages_update_read" on fsp.messages
  for update to authenticated
  using (customer_id = (select auth.uid()) or (select fsp_private.is_staff()))
  with check (customer_id = (select auth.uid()) or (select fsp_private.is_staff()));

-- Storage ------------------------------------------------------------------
-- fsp-recordings: Sprachaufnahmen der Kunden, Ordner = Nutzer-ID.
-- fsp-media: Audiodateien für Hörübungen, von GWS hochgeladen.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('fsp-recordings', 'fsp-recordings', false, 10485760,
   array['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav']),
  ('fsp-media', 'fsp-media', false, 20971520,
   array['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "fsp_recordings_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'fsp-recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "fsp_recordings_select_own_or_staff" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'fsp-recordings'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or (select fsp_private.is_staff()))
  );

create policy "fsp_media_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'fsp-media' and exists (select 1 from fsp.profiles where id = (select auth.uid())));
create policy "fsp_media_insert_staff" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fsp-media' and (select fsp_private.is_staff()));
create policy "fsp_media_update_staff" on storage.objects
  for update to authenticated
  using (bucket_id = 'fsp-media' and (select fsp_private.is_staff()));
create policy "fsp_media_delete_staff" on storage.objects
  for delete to authenticated
  using (bucket_id = 'fsp-media' and (select fsp_private.is_staff()));
