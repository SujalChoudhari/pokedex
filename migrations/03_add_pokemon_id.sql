-- Add ID column to captured_pokemon if it doesn't exist
do $$ 
begin
    if not exists (select 1 from information_schema.columns 
                   where table_name = 'captured_pokemon' and column_name = 'id') then
        alter table public.captured_pokemon 
        add column id uuid default uuid_generate_v4() primary key;
    end if;
end $$;
