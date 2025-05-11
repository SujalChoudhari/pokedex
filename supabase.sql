
create table public.captured_pokemon (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  image_path text not null,
  stats jsonb not null,
  captured_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Set up RLS (Row Level Security)
alter table public.captured_pokemon enable row level security;

-- Create policy to allow users to view only their own pokemon
create policy "Users can view their own pokemon"
  on public.captured_pokemon
  for select
  using (auth.uid() = user_id);

-- Create policy to allow users to insert their own pokemon
create policy "Users can insert their own pokemon"
  on public.captured_pokemon
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Create storage bucket for pokemon images
insert into storage.buckets (id, name, public)
values ('pokemon-images', 'pokemon-images', false);

-- Create storage policies for pokemon-images bucket
create policy "Users can upload their own pokemon images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'pokemon-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own pokemon images"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'pokemon-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
  on public.captured_pokemon
  for insert
  with check (auth.uid() = user_id);
