-- Create function to update trainer stats
create or replace function public.update_trainer_stats()
returns trigger as $$
begin
    -- Update trainer stats based on captured pokemon
    update public.trainers
    set stats = jsonb_build_object(
        'totalPokemonCaught', (
            select count(*)
            from public.captured_pokemon
            where user_id = NEW.user_id
        ),
        'uniquePokemonTypes', (
            select count(distinct jsonb_array_elements_text(stats->'currentForm'->'types'))
            from public.captured_pokemon
            where user_id = NEW.user_id
        ),
        'highestLevelPokemon', (
            select max((stats->'currentForm'->>'level')::int)
            from public.captured_pokemon
            where user_id = NEW.user_id
        ),
        'favoritePokemonType', (
            select type
            from (
                select jsonb_array_elements_text(stats->'currentForm'->'types') as type,
                       count(*) as count
                from public.captured_pokemon
                where user_id = NEW.user_id
                group by type
                order by count desc
                limit 1
            ) as most_common_type
        ),
        'winRate', 0  -- Placeholder for future battle system
    )
    where id = NEW.trainer_id;
    
    return NEW;
end;
$$ language plpgsql;

-- Create trigger to update stats on pokemon capture
create trigger update_stats_on_capture
    after insert or update or delete on public.captured_pokemon
    for each row
    execute function public.update_trainer_stats();
