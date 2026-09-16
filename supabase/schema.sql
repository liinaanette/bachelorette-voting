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
