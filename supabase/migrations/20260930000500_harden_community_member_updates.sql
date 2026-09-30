-- Harden member-owned Community content so moderation fields cannot be
-- changed through direct PostgREST updates.
do $migration$
begin
  if to_regclass('public.testimonies') is not null then
    drop policy if exists testimonies_update_own on public.testimonies;

    execute $function$
    create or replace function public.update_own_testimony(
      p_testimony_id uuid,
      p_content_text text,
      p_is_anonymous boolean
    )
    returns void
    language plpgsql
    security definer
    set search_path = public
    as $body$
    begin
      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      update public.testimonies
      set content_text = left(coalesce(trim(p_content_text),''),5000),
          is_anonymous = coalesce(p_is_anonymous,false),
          moderation_status = 'pending',
          updated_at = now()
      where id = p_testimony_id
        and user_id = auth.uid();

      if not found then
        raise exception 'Testimony not found';
      end if;
    end;
    $body$;
    $function$;

    revoke all on function public.update_own_testimony(uuid,text,boolean)
      from public, anon;
    grant execute on function public.update_own_testimony(uuid,text,boolean)
      to authenticated;
  end if;

  if to_regclass('public.praise_reports') is not null then
    -- Members do not have an edit workflow for praise reports. Remove broad
    -- owner UPDATE access so moderation state cannot be changed directly.
    drop policy if exists praise_update_own on public.praise_reports;
  end if;
end
$migration$;
