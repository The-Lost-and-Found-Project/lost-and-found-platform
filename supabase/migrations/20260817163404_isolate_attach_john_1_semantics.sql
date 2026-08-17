-- This legacy Scripture graph writer belongs to the separated Emmaus product.
-- Preserve it for trusted extraction work, but do not expose it as a Community
-- Member RPC endpoint.
revoke all on function public.attach_john_1_semantics(text)
from public, anon, authenticated;

grant execute on function public.attach_john_1_semantics(text)
to service_role;
