-- Paint & sip voting — run this once in the Supabase SQL editor.
-- Safe to run again; it won't wipe anything.

create table if not exists public.votes (
  voter_name text primary key,
  venue_ids  text[]      not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.votes enable row level security;

-- No accounts, so everyone arrives as the "anon" role. The group is 11
-- friends, so anon gets to read and write freely — but only this table,
-- and only these three things. Deletes are deliberately not allowed, so a
-- stray tap can't wipe someone else's vote.
drop policy if exists "anon can read votes"   on public.votes;
drop policy if exists "anon can insert votes" on public.votes;
drop policy if exists "anon can update votes" on public.votes;

create policy "anon can read votes"
  on public.votes for select to anon using (true);

create policy "anon can insert votes"
  on public.votes for insert to anon with check (true);

create policy "anon can update votes"
  on public.votes for update to anon using (true) with check (true);

-- Live tally: push changes to everyone with the page open.
alter table public.votes replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.votes;
exception
  when duplicate_object then null;  -- already published, nothing to do
end
$$;


-- ---------------------------------------------------------------
-- Ideas wall: free-text notes for anything that isn't a venue vote
-- (what to paint, snacks, drinks, timings, another venue to look at).
-- ---------------------------------------------------------------

create table if not exists public.notes (
  id         bigint generated always as identity primary key,
  author     text        not null,
  body       text        not null,
  created_at timestamptz not null default now()
);

alter table public.notes enable row level security;

-- Same trust model as votes: anyone can read and add, nobody can delete or
-- rewrite someone else's note. Tidying up is done from the dashboard.
drop policy if exists "anon can read notes"   on public.notes;
drop policy if exists "anon can insert notes" on public.notes;

create policy "anon can read notes"
  on public.notes for select to anon using (true);

create policy "anon can insert notes"
  on public.notes for insert to anon
  with check (
    length(trim(body)) between 1 and 280
    and length(trim(author)) between 1 and 40
  );

create index if not exists notes_created_at_idx on public.notes (created_at desc);

alter table public.notes replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.notes;
exception
  when duplicate_object then null;
end
$$;


-- ---------------------------------------------------------------
-- Privileges and API cache.
--
-- A row level security policy says what a role MAY do, but the role also
-- needs the plain table grant. Supabase normally adds these by default;
-- granting them explicitly makes this file work on its own.
-- ---------------------------------------------------------------

grant usage on schema public to anon;
grant select, insert, update on public.votes to anon;
grant select, insert            on public.notes to anon;

-- PostgREST caches the schema, so a freshly created table can be invisible
-- to the API for a while and inserts come back as PGRST205. This nudges it.
notify pgrst, 'reload schema';


-- ---------------------------------------------------------------
-- The pot: what everyone is willing to chip in.
--
-- Anonymous by construction. A pledge is keyed by a random token the
-- browser makes up, never by a name, so a row cannot be traced back to a
-- person even from the dashboard. Individual amounts are never readable
-- either: anon may write to this table but NOT read it, and the page reads
-- the budget_totals view below, which only ever returns aggregates.
-- ---------------------------------------------------------------

create table if not exists public.budgets (
  token      text primary key,
  amount     numeric(8,2) not null,
  updated_at timestamptz  not null default now()
);

alter table public.budgets enable row level security;

drop policy if exists "anon can pledge"        on public.budgets;
drop policy if exists "anon can change pledge" on public.budgets;

create policy "anon can pledge"
  on public.budgets for insert to anon
  with check (amount >= 0 and amount <= 1000 and length(token) between 8 and 64);

create policy "anon can change pledge"
  on public.budgets for update to anon
  using (true) with check (amount >= 0 and amount <= 1000);

-- No select policy on purpose. Nobody, including whoever opens devtools,
-- can pull the list of individual pledges.

create or replace view public.budget_totals as
  select
    coalesce(sum(amount), 0)::numeric    as total,
    count(*)::int                        as people,
    coalesce(round(avg(amount), 2), 0)::numeric as average
  from public.budgets;

-- Write to the table, read only the aggregate.
grant insert, update on public.budgets      to anon;
grant select         on public.budget_totals to anon;

notify pgrst, 'reload schema';
