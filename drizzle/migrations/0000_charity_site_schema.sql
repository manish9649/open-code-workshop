create type public.app_role as enum ('admin','moderator','user');
create table public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id) on delete cascade not null, role app_role not null, unique(user_id, role));
grant select on public.user_roles to authenticated; grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create or replace function public.has_role(_user_id uuid, _role app_role) returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create table public.gallery_categories (id uuid primary key default gen_random_uuid(), name text not null, description text not null default '', sort_order int not null default 0, created_at timestamptz not null default now());
create table public.gallery_albums (id uuid primary key default gen_random_uuid(), title text not null default 'Untitled album', category_id uuid references public.gallery_categories(id) on delete set null, event_date date, location text not null default '', description text not null default '', cover_photo_id uuid, published boolean not null default false, featured boolean not null default false, created_at timestamptz not null default now());
create table public.gallery_photos (id uuid primary key default gen_random_uuid(), album_id uuid not null, storage_path text not null, caption text not null default '', width int, height int, sort_order int not null default 0, created_at timestamptz not null default now(), constraint gallery_photos_album_id_fkey foreign key (album_id) references public.gallery_albums(id) on delete cascade);
alter table public.gallery_albums add constraint gallery_albums_cover_fkey foreign key (cover_photo_id) references public.gallery_photos(id) on delete set null;

grant select on public.gallery_categories, public.gallery_albums, public.gallery_photos to anon;
grant select, insert, update, delete on public.gallery_categories, public.gallery_albums, public.gallery_photos to authenticated;
grant all on public.gallery_categories, public.gallery_albums, public.gallery_photos to service_role;
alter table public.gallery_categories enable row level security;
alter table public.gallery_albums enable row level security;
alter table public.gallery_photos enable row level security;

create policy "public read cats" on public.gallery_categories for select using (true);
create policy "admin cats" on public.gallery_categories for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read albums" on public.gallery_albums for select using (published or public.has_role(auth.uid(),'admin'));
create policy "admin albums" on public.gallery_albums for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "read photos" on public.gallery_photos for select using (exists(select 1 from public.gallery_albums a where a.id=album_id and (a.published or public.has_role(auth.uid(),'admin'))));
create policy "admin photos" on public.gallery_photos for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy "gallery read" on storage.objects for select using (bucket_id='gallery' and exists(select 1 from public.gallery_photos p join public.gallery_albums a on a.id=p.album_id where p.storage_path=name and (a.published or public.has_role(auth.uid(),'admin'))));
create policy "gallery admin write" on storage.objects for insert to authenticated with check (bucket_id='gallery' and public.has_role(auth.uid(),'admin'));
create policy "gallery admin update" on storage.objects for update to authenticated using (bucket_id='gallery' and public.has_role(auth.uid(),'admin'));
create policy "gallery admin delete" on storage.objects for delete to authenticated using (bucket_id='gallery' and public.has_role(auth.uid(),'admin'));

CREATE TYPE public.donation_status AS ENUM ('pending','verified','failed','refunded');
CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name text NOT NULL,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  cause text NOT NULL DEFAULT 'General',
  payment_method text NOT NULL DEFAULT 'bank_transfer',
  transaction_ref text NOT NULL DEFAULT '',
  status public.donation_status NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  verified_by uuid,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX donations_created_idx ON public.donations(created_at DESC);
CREATE INDEX donations_status_idx ON public.donations(status);
CREATE INDEX donations_email_idx ON public.donations(lower(email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.donations TO authenticated;
GRANT ALL ON public.donations TO service_role;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin donations" ON public.donations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Grant admin automatically to the organization's admin email once that account exists.
create or replace function public.grant_initial_admin() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if lower(new.email) = 'shivseva1707@gmail.com' then
    insert into public.user_roles(user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created_grant_admin after insert on auth.users for each row execute function public.grant_initial_admin();