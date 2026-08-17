-- RLS and member-state lookups filter by user_id. The unique constraint is
-- ordered by praise_report_id first, so add the matching member index.
do $migration$
begin
  if to_regclass('public.praise_loves') is null then
    raise notice 'Skipping Praise Love member index: praise_loves is not present.';
    return;
  end if;

  create index if not exists praise_loves_user_id_idx
    on public.praise_loves (user_id);
end;
$migration$;
