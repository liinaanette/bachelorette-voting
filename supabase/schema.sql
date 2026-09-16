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
