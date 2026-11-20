-- Fachwortschatz (Glossar und Vokabeltrainer) für die Trainings-App.
-- Nur Schema fsp; Tabellen des Visa-Portals bleiben unberührt.

create table fsp.glossary_topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  icon text not null default '📘',
  title_de text not null,
  title_en text not null default '',
  description_de text not null default '',
  description_en text not null default '',
  sort int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table fsp.glossary_terms (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references fsp.glossary_topics (id) on delete cascade,
  article text not null default '' check (article in ('', 'der', 'die', 'das')),
  term text not null check (length(trim(term)) > 0),
  plural text not null default '',
  explanation text not null default '',
  en text not null default '',
  example text not null default '',
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, term)
);
create index glossary_terms_topic_idx on fsp.glossary_terms (topic_id, sort);

-- Lernstand im Vokabeltrainer: pro Kunde und Begriff gewusst / nicht gewusst.
create table fsp.glossary_reviews (
  user_id uuid not null default auth.uid() references fsp.profiles (id) on delete cascade,
  term_id uuid not null references fsp.glossary_terms (id) on delete cascade,
  known boolean not null,
  reviews int not null default 1 check (reviews >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, term_id)
);
create index glossary_reviews_term_idx on fsp.glossary_reviews (term_id);

create trigger glossary_topics_touch before update on fsp.glossary_topics
  for each row execute function fsp_private.touch_updated_at();
create trigger glossary_terms_touch before update on fsp.glossary_terms
  for each row execute function fsp_private.touch_updated_at();
create trigger glossary_reviews_touch before update on fsp.glossary_reviews
  for each row execute function fsp_private.touch_updated_at();

-- Rechte -------------------------------------------------------------------
grant all on fsp.glossary_topics, fsp.glossary_terms, fsp.glossary_reviews to service_role;
grant select, insert, update, delete on fsp.glossary_topics, fsp.glossary_terms to authenticated;
grant select, insert, update, delete on fsp.glossary_reviews to authenticated;

alter table fsp.glossary_topics enable row level security;
alter table fsp.glossary_terms enable row level security;
alter table fsp.glossary_reviews enable row level security;

-- Themen und Begriffe: veröffentlichte Themen für alle, Pflege nur durch GWS.
create policy "glossary_topics_select" on fsp.glossary_topics
  for select to authenticated
  using (published or (select fsp_private.is_staff()));
create policy "glossary_topics_insert_staff" on fsp.glossary_topics
  for insert to authenticated with check ((select fsp_private.is_staff()));
create policy "glossary_topics_update_staff" on fsp.glossary_topics
  for update to authenticated
  using ((select fsp_private.is_staff())) with check ((select fsp_private.is_staff()));
create policy "glossary_topics_delete_staff" on fsp.glossary_topics
  for delete to authenticated using ((select fsp_private.is_staff()));

create policy "glossary_terms_select" on fsp.glossary_terms
  for select to authenticated
  using (
    (select fsp_private.is_staff())
    or exists (select 1 from fsp.glossary_topics t where t.id = topic_id and t.published)
  );
create policy "glossary_terms_insert_staff" on fsp.glossary_terms
  for insert to authenticated with check ((select fsp_private.is_staff()));
create policy "glossary_terms_update_staff" on fsp.glossary_terms
  for update to authenticated
  using ((select fsp_private.is_staff())) with check ((select fsp_private.is_staff()));
create policy "glossary_terms_delete_staff" on fsp.glossary_terms
  for delete to authenticated using ((select fsp_private.is_staff()));

-- Lernstand: jeder nur den eigenen, GWS liest alle.
create policy "glossary_reviews_select_own_or_staff" on fsp.glossary_reviews
  for select to authenticated
  using (user_id = (select auth.uid()) or (select fsp_private.is_staff()));
create policy "glossary_reviews_insert_own" on fsp.glossary_reviews
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "glossary_reviews_update_own" on fsp.glossary_reviews
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "glossary_reviews_delete_own" on fsp.glossary_reviews
  for delete to authenticated using (user_id = (select auth.uid()));
