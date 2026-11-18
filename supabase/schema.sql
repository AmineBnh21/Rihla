-- Diaspora Routes : schéma Supabase (Postgres 15+)
-- À exécuter dans l'éditeur SQL de Supabase.

-- ─────────────────────────────────────────────
-- prices : un relevé par ligne, date, profil et jour de collecte
-- ─────────────────────────────────────────────
create table if not exists public.prices (
  id                  bigint generated always as identity primary key,
  collected_at        date        not null default current_date,
  origin              text        not null,          -- code ville suivi (LYS, MRS, PAR, ALG…)
  destination         text        not null,
  origin_airport      text,                          -- aéroport réel (CDG, ORY…)
  destination_airport text,
  departure_date      date        not null,
  return_date         date,                          -- null = aller simple
  passengers          text        not null default '1A',
  airline             text,
  flight_number       text,
  transfers           smallint,
  price_eur           numeric(8,2) not null check (price_eur > 0),
  days_to_departure   integer     not null,          -- départ - jour de collecte
  days_to_eid         integer,                       -- Aïd le plus proche - départ (négatif = après l'Aïd)
  source              text        not null default 'travelpayouts',
  inserted_at         timestamptz not null default now(),
  constraint prices_unique_obs unique nulls not distinct
    (collected_at, origin, destination, departure_date, return_date, passengers, airline, flight_number)
);

create index if not exists prices_route_dep_idx
  on public.prices (origin, destination, departure_date);
create index if not exists prices_collected_idx
  on public.prices (collected_at);

-- ─────────────────────────────────────────────
-- advice : le conseil du jour pour chaque combinaison
-- ─────────────────────────────────────────────
create table if not exists public.advice (
  id             bigint generated always as identity primary key,
  computed_at    date    not null default current_date,
  origin         text    not null,
  destination    text    not null,
  period         text    not null,                   -- ex. eid-fitr-2027
  passengers     text    not null,                   -- ex. 1A, 2A2C, 2A3C
  status         text    not null check (status in ('book', 'watch', 'wait')),
  reason         text    not null,
  price_eur      numeric(9,2),                       -- prix total pour le profil
  cheaper_option jsonb,                              -- voir CONTRACT.md
  calendar       jsonb,                              -- [{ "date": "2027-03-01", "price_eur": 912 }, …] prix famille par jour
  reference      jsonb,                              -- { "p25": …, "p50": …, "p75": …, "n_obs": …, "days_to_eid": … }
  constraint advice_unique unique (computed_at, origin, destination, period, passengers)
);

-- ─────────────────────────────────────────────
-- alerts : inscriptions aux alertes e-mail (sans compte)
-- ─────────────────────────────────────────────
create table if not exists public.alerts (
  id                bigint generated always as identity primary key,
  email             text    not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  origin            text    not null,
  destination       text    not null,
  period            text    not null,
  passengers        text    not null default '1A',
  threshold_eur     numeric(9,2),
  unsubscribe_token uuid    not null default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  unsubscribed_at   timestamptz
);

-- ─────────────────────────────────────────────
-- Sécurité (RLS) : le site n'a que la clé anon
--   prices, advice : lecture seule
--   alerts         : insertion seule (aucune lecture des e-mails)
-- La clé service (pipeline) contourne RLS.
-- ─────────────────────────────────────────────
alter table public.prices enable row level security;
alter table public.advice enable row level security;
alter table public.alerts enable row level security;

drop policy if exists "lecture publique des prix" on public.prices;
create policy "lecture publique des prix"
  on public.prices for select to anon, authenticated using (true);

drop policy if exists "lecture publique des conseils" on public.advice;
create policy "lecture publique des conseils"
  on public.advice for select to anon, authenticated using (true);

drop policy if exists "inscription aux alertes" on public.alerts;
create policy "inscription aux alertes"
  on public.alerts for insert to anon, authenticated
  with check (unsubscribed_at is null);

revoke select, update, delete on public.alerts from anon, authenticated;

-- ─────────────────────────────────────────────
-- Droits sur les tables (les projets Supabase récents ne les donnent plus
-- automatiquement). RLS ci-dessus filtre ensuite les lignes.
-- ─────────────────────────────────────────────
grant usage on schema public to anon, authenticated, service_role;

grant select on public.prices, public.advice to anon, authenticated;
grant insert on public.alerts to anon, authenticated;

-- Le pipeline (clé service) lit et écrit tout.
grant select, insert, update, delete on public.prices, public.advice, public.alerts to service_role;
