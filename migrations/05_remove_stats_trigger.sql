-- Remove the old stats trigger and function since we're handling stats in TypeScript now
drop trigger if exists update_trainer_stats_after_pokemon_capture on public.captured_pokemon;
drop function if exists public.update_trainer_stats();
