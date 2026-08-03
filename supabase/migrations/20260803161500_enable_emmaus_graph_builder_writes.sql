create policy "Admins can view all Emmaus graph nodes"
on public.emmaus_graph_nodes
for select
to authenticated
using (public.is_emmaus_admin());

create policy "Admins can create Emmaus graph nodes"
on public.emmaus_graph_nodes
for insert
to authenticated
with check (public.is_emmaus_admin());

create policy "Admins can update Emmaus graph nodes"
on public.emmaus_graph_nodes
for update
to authenticated
using (public.is_emmaus_admin())
with check (public.is_emmaus_admin());

create policy "Admins can delete Emmaus graph nodes"
on public.emmaus_graph_nodes
for delete
to authenticated
using (public.is_emmaus_admin());

create policy "Admins can view all Emmaus graph edges"
on public.emmaus_graph_edges
for select
to authenticated
using (public.is_emmaus_admin());

create policy "Admins can create Emmaus graph edges"
on public.emmaus_graph_edges
for insert
to authenticated
with check (public.is_emmaus_admin());

create policy "Admins can update Emmaus graph edges"
on public.emmaus_graph_edges
for update
to authenticated
using (public.is_emmaus_admin())
with check (public.is_emmaus_admin());

create policy "Admins can delete Emmaus graph edges"
on public.emmaus_graph_edges
for delete
to authenticated
using (public.is_emmaus_admin());

create policy "Admins can view all Emmaus edge evidence"
on public.emmaus_edge_evidence
for select
to authenticated
using (public.is_emmaus_admin());

create policy "Admins can create Emmaus edge evidence"
on public.emmaus_edge_evidence
for insert
to authenticated
with check (public.is_emmaus_admin());

create policy "Admins can update Emmaus edge evidence"
on public.emmaus_edge_evidence
for update
to authenticated
using (public.is_emmaus_admin())
with check (public.is_emmaus_admin());

create policy "Admins can delete Emmaus edge evidence"
on public.emmaus_edge_evidence
for delete
to authenticated
using (public.is_emmaus_admin());
