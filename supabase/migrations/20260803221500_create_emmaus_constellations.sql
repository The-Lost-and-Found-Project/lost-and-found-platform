create table if not exists public.emmaus_constellations (
  id uuid primary key default gen_random_uuid(),
  constellation_key text not null unique,
  title text not null,
  description text not null,
  hero_scripture text,
  difficulty text not null default 'growing' check (difficulty in ('explorer','growing','deep','mentor')),
  xp_reward integer not null default 100 check (xp_reward >= 0),
  estimated_minutes integer not null default 30 check (estimated_minutes > 0),
  unlock_threshold integer not null default 1 check (unlock_threshold > 0),
  is_hidden boolean not null default false,
  status text not null default 'published' check (status in ('draft','published','archived')),
  display_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.emmaus_constellation_nodes (
  id uuid primary key default gen_random_uuid(),
  constellation_id uuid not null references public.emmaus_constellations(id) on delete cascade,
  node_id uuid not null references public.emmaus_graph_nodes(id) on delete cascade,
  position integer not null default 0,
  is_required boolean not null default true,
  weight integer not null default 1 check (weight > 0),
  metadata jsonb not null default '{}'::jsonb,
  unique(constellation_id,node_id)
);

create table if not exists public.emmaus_constellation_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  constellation_id uuid not null references public.emmaus_constellations(id) on delete cascade,
  discovered_required integer not null default 0,
  required_total integer not null default 0,
  completion_percent integer not null default 0 check (completion_percent between 0 and 100),
  unlocked boolean not null default false,
  completed boolean not null default false,
  unlocked_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id,constellation_id)
);

create index if not exists emmaus_constellation_nodes_constellation_idx on public.emmaus_constellation_nodes(constellation_id,position);
create index if not exists emmaus_constellation_progress_user_idx on public.emmaus_constellation_progress(user_id,updated_at desc);

alter table public.emmaus_constellations enable row level security;
alter table public.emmaus_constellation_nodes enable row level security;
alter table public.emmaus_constellation_progress enable row level security;

create policy "Authenticated users read published constellations"
on public.emmaus_constellations for select
to authenticated using (status='published');

create policy "Authenticated users read constellation nodes"
on public.emmaus_constellation_nodes for select
to authenticated using (
  exists(select 1 from public.emmaus_constellations c where c.id=constellation_id and c.status='published')
);

create policy "Users read their constellation progress"
on public.emmaus_constellation_progress for select
to authenticated using (user_id=auth.uid());

create policy "Users manage their constellation progress"
on public.emmaus_constellation_progress for all
to authenticated
using (user_id=auth.uid())
with check (user_id=auth.uid());

insert into public.emmaus_constellations(
  constellation_key,title,description,hero_scripture,difficulty,xp_reward,estimated_minutes,unlock_threshold,is_hidden,display_order,metadata
) values
('seven-signs','The Seven Signs','Trace the seven signs in John and discover how each reveals Jesus’s identity and glory.','John 20:30-31','growing',500,90,2,false,10,jsonb_build_object('book','john','route','seven-signs')),
('seven-i-am','The Seven I AM Statements','Explore the seven major I AM declarations in John and the Old Testament imagery behind them.','John 8:58','deep',500,90,2,false,20,jsonb_build_object('book','john','route','seven-i-am')),
('john-1-prologue','The Word and the Light','Follow John 1 from creation and Logos to incarnation, glory, grace, and witness.','John 1:1-18','growing',300,60,3,false,30,jsonb_build_object('book','john','chapter',1)),
('lamb-thread','The Lamb Thread','Trace the Lamb of God from Passover imagery into John’s witness and the larger redemptive story.','John 1:29','deep',350,75,2,true,40,jsonb_build_object('theme','lamb'))
on conflict(constellation_key) do update set
  title=excluded.title,
  description=excluded.description,
  hero_scripture=excluded.hero_scripture,
  difficulty=excluded.difficulty,
  xp_reward=excluded.xp_reward,
  estimated_minutes=excluded.estimated_minutes,
  unlock_threshold=excluded.unlock_threshold,
  is_hidden=excluded.is_hidden,
  status='published',
  display_order=excluded.display_order,
  metadata=public.emmaus_constellations.metadata||excluded.metadata,
  updated_at=now();

insert into public.emmaus_constellation_nodes(constellation_id,node_id,position,is_required)
select c.id,n.id,x.position,true
from public.emmaus_constellations c
join (values
  ('seven-signs','event:john-sign-1-water-to-wine',1),
  ('seven-signs','event:john-sign-2-official-son',2),
  ('seven-signs','event:john-sign-3-bethesda',3),
  ('seven-signs','event:john-sign-4-feeding-five-thousand',4),
  ('seven-signs','event:john-sign-5-walking-on-water',5),
  ('seven-signs','event:john-sign-6-man-born-blind',6),
  ('seven-signs','event:john-sign-7-raising-lazarus',7),
  ('seven-i-am','discovery:i-am-bread-of-life',1),
  ('seven-i-am','discovery:i-am-light-of-world',2),
  ('seven-i-am','discovery:i-am-door',3),
  ('seven-i-am','discovery:i-am-good-shepherd',4),
  ('seven-i-am','discovery:i-am-resurrection-life',5),
  ('seven-i-am','discovery:i-am-way-truth-life',6),
  ('seven-i-am','discovery:i-am-true-vine',7),
  ('john-1-prologue','language:logos',1),
  ('john-1-prologue','theme:creation',2),
  ('john-1-prologue','theme:light',3),
  ('john-1-prologue','theme:life',4),
  ('john-1-prologue','discovery:word-became-flesh',5),
  ('john-1-prologue','theme:incarnation',6),
  ('john-1-prologue','theme:glory',7),
  ('john-1-prologue','theme:grace',8),
  ('lamb-thread','passage:exodus-12-passover-lamb',1),
  ('lamb-thread','discovery:lamb-of-god',2)
) as x(constellation_key,node_key,position) on x.constellation_key=c.constellation_key
join public.emmaus_graph_nodes n on n.node_key=x.node_key
on conflict(constellation_id,node_id) do update set position=excluded.position,is_required=excluded.is_required;

create or replace function public.evaluate_emmaus_constellations()
returns table(
  constellation_key text,
  title text,
  discovered_required integer,
  required_total integer,
  completion_percent integer,
  unlocked boolean,
  completed boolean
)
language plpgsql
security definer
set search_path=public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;

  insert into public.emmaus_constellation_progress(
    user_id,constellation_id,discovered_required,required_total,completion_percent,unlocked,completed,unlocked_at,completed_at,updated_at
  )
  select
    auth.uid(),
    c.id,
    count(*) filter(where v.node_id is not null and cn.is_required),
    count(*) filter(where cn.is_required),
    case when count(*) filter(where cn.is_required)=0 then 0 else
      floor((count(*) filter(where v.node_id is not null and cn.is_required)::numeric / count(*) filter(where cn.is_required)::numeric)*100)::integer
    end,
    count(*) filter(where v.node_id is not null and cn.is_required) >= least(c.unlock_threshold,count(*) filter(where cn.is_required)),
    count(*) filter(where cn.is_required)>0 and count(*) filter(where v.node_id is not null and cn.is_required)=count(*) filter(where cn.is_required),
    case when count(*) filter(where v.node_id is not null and cn.is_required) >= least(c.unlock_threshold,count(*) filter(where cn.is_required)) then now() else null end,
    case when count(*) filter(where cn.is_required)>0 and count(*) filter(where v.node_id is not null and cn.is_required)=count(*) filter(where cn.is_required) then now() else null end,
    now()
  from public.emmaus_constellations c
  join public.emmaus_constellation_nodes cn on cn.constellation_id=c.id
  left join public.emmaus_graph_exploration_visits v on v.node_id=cn.node_id and v.user_id=auth.uid()
  where c.status='published'
  group by c.id
  on conflict(user_id,constellation_id) do update set
    discovered_required=excluded.discovered_required,
    required_total=excluded.required_total,
    completion_percent=excluded.completion_percent,
    unlocked=public.emmaus_constellation_progress.unlocked or excluded.unlocked,
    completed=public.emmaus_constellation_progress.completed or excluded.completed,
    unlocked_at=coalesce(public.emmaus_constellation_progress.unlocked_at,excluded.unlocked_at),
    completed_at=coalesce(public.emmaus_constellation_progress.completed_at,excluded.completed_at),
    updated_at=now();

  return query
  select c.constellation_key,c.title,p.discovered_required,p.required_total,p.completion_percent,p.unlocked,p.completed
  from public.emmaus_constellation_progress p
  join public.emmaus_constellations c on c.id=p.constellation_id
  where p.user_id=auth.uid() and c.status='published'
  order by c.display_order,c.title;
end;
$$;

grant execute on function public.evaluate_emmaus_constellations() to authenticated;
