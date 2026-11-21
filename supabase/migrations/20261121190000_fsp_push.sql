-- Handy-App (PWA): Push-Benachrichtigungen pro Gerät und Wahl des Erinnerungswegs.
-- Rein additiv, nur Schema fsp; Tabellen des Visa-Portals bleiben unberührt.

-- 1. Push-Abos: eine Zeile pro Gerät/Browser, auf dem Benachrichtigungen erlaubt wurden ----
create table fsp.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references fsp.profiles (id) on delete cascade,
  endpoint text not null unique check (length(endpoint) between 10 and 1000),
  p256dh text not null check (length(p256dh) between 1 and 200),
  auth text not null check (length(auth) between 1 and 100),
  user_agent text check (length(user_agent) <= 300),
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index push_subscriptions_user_idx on fsp.push_subscriptions (user_id);

-- Geschrieben wird nur serverseitig (Secret Key); Nutzer sehen und löschen ihre eigenen Geräte.
grant all on fsp.push_subscriptions to service_role;
grant select, delete on fsp.push_subscriptions to authenticated;

alter table fsp.push_subscriptions enable row level security;

create policy "push_subscriptions_select_own" on fsp.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "push_subscriptions_delete_own" on fsp.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));

-- 2. Lernplan: Erinnerung zusätzlich per E-Mail (Standard wie bisher: ja) ------------------
alter table fsp.study_plans add column if not exists remind_email boolean not null default true;
grant insert (remind_email), update (remind_email) on fsp.study_plans to authenticated;
