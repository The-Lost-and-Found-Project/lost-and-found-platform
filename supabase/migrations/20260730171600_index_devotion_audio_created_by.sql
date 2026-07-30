do $migration$
begin
  if to_regclass('public.devotion_audio') is null then
    raise notice 'Skipping devotion audio creator index: devotion_audio is not present.';
    return;
  end if;

  create index if not exists devotion_audio_created_by_idx
    on public.devotion_audio (created_by);
end;
$migration$;
