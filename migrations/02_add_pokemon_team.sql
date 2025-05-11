-- Add team column to trainers table
alter table public.trainers 
add column team jsonb default '[]'::jsonb;

-- Create trigger function to validate team size
create or replace function validate_team_size()
returns trigger as $$
begin
    if jsonb_array_length(NEW.team) > 6 then
        raise exception 'Team cannot have more than 6 Pokemon';
    end if;
    return NEW;
end;
$$ language plpgsql;

-- Create trigger
create trigger check_team_size
    before insert or update on public.trainers
    for each row
    execute function validate_team_size();
