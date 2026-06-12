-- ─────────────────────────────────────────────────────────────────────────────
-- journal_entries — a daily journal paired with the Daily Scripture reflection.
--
-- One entry per client per day. Each entry has a per-entry privacy flag:
-- share_with_coach = false (default) means private to the client; true means the
-- coach assigned to that client may read it as a check-in.
--
-- Run this in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.journal_entries (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  entry_date    date not null,
  scripture_ref text,                       -- the verse reference shown that day, for context
  body          text not null default '',
  share_with_coach boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (client_id, entry_date)
);

create index if not exists journal_entries_client_date_idx
  on public.journal_entries (client_id, entry_date desc);

-- Keep updated_at fresh on edits.
create or replace function public.touch_journal_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists journal_entries_touch on public.journal_entries;
create trigger journal_entries_touch
  before update on public.journal_entries
  for each row execute function public.touch_journal_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.journal_entries enable row level security;

-- A client can fully manage their own entries.
-- NOTE: this assumes clients.auth_user_id maps the Supabase auth user to the
-- client row, matching the pattern used by the rest of the app. If your column
-- is named differently, adjust the subselect below to match.
drop policy if exists journal_client_all on public.journal_entries;
create policy journal_client_all
  on public.journal_entries
  for all
  using (
    client_id in (
      select id from public.clients where auth_user_id = auth.uid()
    )
  )
  with check (
    client_id in (
      select id from public.clients where auth_user_id = auth.uid()
    )
  );

-- A coach may READ entries that the client chose to share, for clients they own.
-- Adjust clients.coach_id if your ownership column differs.
drop policy if exists journal_coach_read_shared on public.journal_entries;
create policy journal_coach_read_shared
  on public.journal_entries
  for select
  using (
    share_with_coach = true
    and client_id in (
      select id from public.clients where coach_id = auth.uid()
    )
  );
