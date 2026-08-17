-- Preserve historical notifications while moving their destinations away
-- from Devotions, Trivia, and Emmaus routes retired from the Community App.
do $migration$
begin
  if to_regclass('public.notifications') is not null then
    update public.notifications
    set link = '/programs#separate-products',
        body = case
          when type = 'devotion_week_review'
            then 'This historical Devotions notice is preserved. Devotions are moving to a separate app.'
          else body
        end
    where link = '/admin/devotions'
       or link = '/admin/trivia'
       or link = '/devotions'
       or link = '/trivia'
       or link like '/emmaus%';
  end if;
end;
$migration$;
