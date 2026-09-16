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
-- person even from the dashboard.
--
-- anon has NO access to this table at all -- not select, not insert, not
-- update. It can only call set_pledge() below, which runs as the owner and
-- does its own validation, and read the aggregates-only view. That means
-- individual amounts cannot be read back by anyone using the public key.
--
-- (Writing directly with an upsert does not work here and cannot be made
-- to: INSERT ... ON CONFLICT DO UPDATE needs SELECT privilege on the
-- conflict column, which is exactly the privilege being withheld.)
-- ---------------------------------------------------------------

create table if not exists public.budgets (
  token      text primary key,
  amount     numeric(8,2) not null,
  updated_at timestamptz  not null default now()
);

alter table public.budgets enable row level security;

-- Undo the earlier direct-write attempt, if this file was run before.
drop policy if exists "anon can pledge"        on public.budgets;
drop policy if exists "anon can change pledge" on public.budgets;
revoke all on public.budgets from anon;

create or replace function public.set_pledge(
  p_token   text,
  p_amount  numeric,
  p_default numeric default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount is null or p_amount < 0 or p_amount > 1000 then
    raise exception 'amount out of range';
  end if;
  if p_token is null or length(p_token) not between 8 and 64 then
    raise exception 'bad token';
  end if;

  -- Going back to the agreed figure means "I haven't changed anything", so
  -- the row is removed rather than stored. Otherwise the page would report
  -- someone as having changed theirs when they had changed it back.
  if p_default is not null and p_amount = p_default then
    delete from public.budgets where token = p_token;
    return;
  end if;

  insert into public.budgets (token, amount, updated_at)
  values (p_token, p_amount, now())
  on conflict (token) do update
    set amount = excluded.amount, updated_at = now();
end
$$;

create or replace view public.budget_totals as
  select
    coalesce(sum(amount), 0)::numeric            as total,
    count(*)::int                                as people,
    coalesce(round(avg(amount), 2), 0)::numeric  as average
  from public.budgets;

-- the old two-argument version, if this file was run before
drop function if exists public.set_pledge(text, numeric);

revoke all on function public.set_pledge(text, numeric, numeric) from public;
grant execute on function public.set_pledge(text, numeric, numeric) to anon;
grant select on public.budget_totals to anon;

notify pgrst, 'reload schema';
