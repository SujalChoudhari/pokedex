-- Create trainers table
create table public.trainers (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null unique,
    name text not null,
    age integer,
    gender text check (gender in ('male', 'female', 'other')),
    avatar_url text,
    region text,
    stats jsonb default '{
        "totalPokemonCaught": 0,
        "uniquePokemonTypes": 0,
        "highestLevelPokemon": 0,
        "favoritePokemonType": "",
        "winRate": 0
    }'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create RLS policies
alter table public.trainers enable row level security;

create policy "Users can view their own trainer profile"
  on public.trainers for select
  using ( auth.uid() = user_id );

create policy "Users can update their own trainer profile"
  on public.trainers for update
  using ( auth.uid() = user_id );

create policy "Users can insert their own trainer profile"
  on public.trainers for insert
  with check ( auth.uid() = user_id );

-- Create function to update trainer stats
create or replace function public.update_trainer_stats()
returns trigger as $$
declare
    total_caught integer;
    unique_types integer;
    highest_level integer;
    favorite_type text;
begin
    -- Calculate total pokemon caught
    select count(*)
    into total_caught
    from public.captured_pokemon    
    where user_id = NEW.user_id;

    -- Calculate unique types
    with types as (
        select distinct unnest(jsonb_array_elements_text(stats->'currentForm'->'types')) as type
        from public.captured_pokemon
        where user_id = NEW.user_id
    )
    select count(*)
    into unique_types
    from types;

    -- Get highest level
    select max((stats->'currentForm'->>'level')::integer)
    into highest_level
    from public.captured_pokemon
    where user_id = NEW.user_id;

    -- Get favorite type
    with type_counts as (
        select type, count(*) as count
        from public.captured_pokemon,
             lateral jsonb_array_elements_text(stats->'currentForm'->'types') as type
        where user_id = NEW.user_id
        group by type
        order by count desc
        limit 1
    )
    select type
    into favorite_type
    from type_counts;

    -- Update trainer stats
    update public.trainers
    set stats = jsonb_build_object(
        'totalPokemonCaught', total_caught,
        'uniquePokemonTypes', unique_types,
        'highestLevelPokemon', highest_level,
        'favoritePokemonType', coalesce(favorite_type, ''),
        'winRate', 0
    )
    where user_id = NEW.user_id;
    
    return NEW;
end;
$$ language plpgsql security definer;

-- Create trigger to update trainer stats when pokemon are captured
create trigger update_trainer_stats_after_pokemon_capture
    after insert or update or delete
    on public.captured_pokemon
    for each row
    execute function public.update_trainer_stats();

-- Storage policies for trainer avatars
create policy "Users can upload their own avatar"
    on storage.objects for insert
    with check (
        bucket_id = 'trainer-avatars' and
        auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "Avatar images are publicly accessible"
    on storage.objects for select
    using ( bucket_id = 'trainer-avatars' );
