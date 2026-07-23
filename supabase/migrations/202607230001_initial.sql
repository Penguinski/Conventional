create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null unique,
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  constraint curated_nickname check (
    nickname ~ '^(Calzino|Tazza|Ombrello|Lista|Pomello|Chiave) (Stanco|Sbeccata|Perso|Piegata|Consunto|Spostata) [0-9]{2}$'
  )
);

create or replace function public.assign_anonymous_nickname()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  objects text[] := array['Calzino','Tazza','Ombrello','Lista','Pomello','Chiave'];
  adjectives text[] := array['Stanco','Sbeccata','Perso','Piegata','Consunto','Spostata'];
  candidate text;
  attempt integer := 0;
begin
  loop
    candidate := objects[1 + floor(random() * array_length(objects, 1))::int]
      || ' ' || adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
      || ' ' || lpad(floor(random() * 100)::int::text, 2, '0');
    begin
      insert into public.profiles (id, nickname) values (new.id, candidate);
      exit;
    exception when unique_violation then
      attempt := attempt + 1;
      if attempt > 20 then raise; end if;
    end;
  end loop;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.assign_anonymous_nickname();

create table public.best_scores (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id text not null,
  game_version integer not null default 1,
  score integer not null check (score between 0 and 86400000),
  detail jsonb not null default '{}'::jsonb check (pg_column_size(detail) < 4096),
  updated_at timestamptz not null default now(),
  primary key (user_id, game_id, game_version)
);

create table public.dust_drawings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  strokes jsonb not null,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  constraint strokes_size check (pg_column_size(strokes) < 131072),
  constraint strokes_shape check (jsonb_typeof(strokes) = 'array' and jsonb_array_length(strokes) <= 4000)
);

create table public.maze_choices (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  choice text not null check (choice in ('ufficiale','scorciatoia','ibrido')),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.best_scores enable row level security;
alter table public.dust_drawings enable row level security;
alter table public.maze_choices enable row level security;

create policy "public profile nicknames" on public.profiles for select using (true);
create policy "owner updates profile activity" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "public scores" on public.best_scores for select using (true);
create policy "owner inserts score" on public.best_scores for insert with check (auth.uid() = user_id);
create policy "owner updates score" on public.best_scores for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "approved drawings are public" on public.dust_drawings for select using (status = 'approved' or auth.uid() = user_id);
create policy "owner submits pending drawing" on public.dust_drawings for insert with check (auth.uid() = user_id and status = 'pending');
create policy "owner deletes pending drawing" on public.dust_drawings for delete using (auth.uid() = user_id and status = 'pending');

create policy "maze aggregate submissions" on public.maze_choices for insert with check (auth.uid() = user_id);
create policy "maze owner updates" on public.maze_choices for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace view public.maze_choice_totals
with (security_invoker = on)
as select choice, count(*)::bigint as total from public.maze_choices group by choice;

-- Moderation: use the Supabase dashboard with a privileged operator. Never expose
-- a service-role key to this frontend. Schedule deletion of inactive anonymous
-- users according to the project's retention policy before public launch.
