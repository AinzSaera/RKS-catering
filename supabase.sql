-- RKS Catering website setup
-- Run this in Supabase SQL Editor.
-- IMPORTANT: Admin access is granted only by inserting Sir MJ's Auth user UUID into admin_users.
-- Do not expose a service_role key in website files.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  label text not null default 'Sir MJ',
  created_at timestamptz not null default now()
);

create table if not exists public.rks_gallery (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Other event',
  image_path text not null,
  is_published boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.rks_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rks_gallery_updated_at on public.rks_gallery;
create trigger rks_gallery_updated_at
before update on public.rks_gallery
for each row execute function public.rks_touch_updated_at();

alter table public.admin_users enable row level security;
alter table public.rks_gallery enable row level security;

-- A user cannot self-authorize. Only the project owner can add an admin row in SQL Editor.
drop policy if exists "admin can read own admin membership" on public.admin_users;
create policy "admin can read own admin membership"
on public.admin_users for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "public can read published RKS gallery" on public.rks_gallery;
create policy "public can read published RKS gallery"
on public.rks_gallery for select to anon, authenticated
using (is_published = true or exists (
  select 1 from public.admin_users au where au.user_id = (select auth.uid())
));

drop policy if exists "approved admin can insert RKS gallery" on public.rks_gallery;
create policy "approved admin can insert RKS gallery"
on public.rks_gallery for insert to authenticated
with check (exists (
  select 1 from public.admin_users au where au.user_id = (select auth.uid())
));

drop policy if exists "approved admin can update RKS gallery" on public.rks_gallery;
create policy "approved admin can update RKS gallery"
on public.rks_gallery for update to authenticated
using (exists (
  select 1 from public.admin_users au where au.user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.admin_users au where au.user_id = (select auth.uid())
));

drop policy if exists "approved admin can delete RKS gallery" on public.rks_gallery;
create policy "approved admin can delete RKS gallery"
on public.rks_gallery for delete to authenticated
using (exists (
  select 1 from public.admin_users au where au.user_id = (select auth.uid())
));

-- Seed the uploaded event photos. Re-running this script will not duplicate these titles.
insert into public.rks_gallery (title, category, image_path, is_published, sort_order)
select seed.title, seed.category, seed.image_path, true, seed.sort_order
from (values
  ('Nicole''s 18th Birthday', 'Debut', 'assets/nicoles-18th-birthday.png', 1),
  ('Olivia Turns Six', 'Birthday', 'assets/olivia-turns-six.png', 2),
  ('A day to remember', 'Wedding', 'assets/wedding-event.png', 3),
  ('Celebrations made special', 'Other event', 'assets/rks-event-highlight.png', 4),
  ('Wedding styling', 'Wedding', 'assets/wedding-decor.png', 5),
  ('Event details', 'Other event', 'assets/event-gallery-1.png', 6),
  ('Celebration setup', 'Other event', 'assets/event-gallery-2.png', 7),
  ('Special touches', 'Other event', 'assets/event-gallery-3.png', 8),
  ('Made for the occasion', 'Other event', 'assets/event-gallery-4.png', 9),
  ('Sweet details', 'Wedding', 'assets/wedding-cake.png', 10),
  ('Birthday celebration', 'Birthday', 'assets/birthday.png', 11),
  ('Reception venue', 'Wedding', 'assets/wedding-venue.png', 12),
  ('Our event collection', 'Other event', 'assets/banner.png', 13),
  ('A milestone to remember', 'Debut', 'assets/debut.png', 14)
) as seed(title, category, image_path, sort_order)
where not exists (
  select 1 from public.rks_gallery existing where existing.title = seed.title
);

-- Remove the earlier accidental Google business-info screenshot from the public gallery.
delete from public.rks_gallery
where image_path = 'assets/wedding-buffet.png'
   or title = 'Buffet presentation';

-- After creating Sir MJ's account in Authentication > Users:
-- copy his User UID, then run the following separately after replacing the UUID:
-- insert into public.admin_users (user_id, label)
-- values ('PASTE-SIR-MJ-AUTH-USER-UUID-HERE'::uuid, 'Sir MJ')
-- on conflict (user_id) do nothing;
