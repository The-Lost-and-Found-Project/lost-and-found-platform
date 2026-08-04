-- Keep administrative semantic attachment unavailable to unauthenticated roles.
revoke all on function public.attach_john_1_semantics(text) from public, anon;
grant execute on function public.attach_john_1_semantics(text) to authenticated;

-- Pin lookup helper resolution to the application schema.
alter function public.get_emmaus_level(integer) set search_path = public;
alter function public.classify_emmaus_confidence(integer) set search_path = public;
