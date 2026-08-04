-- Superseded by 20260803115500_create_emmaus_discovery_progress.sql.
--
-- This original draft referenced public.emmaus_discoveries before that table was
-- present in a clean migration sequence and defined a shape that the application
-- never adopted. Keep the migration version as an intentional no-op so existing
-- histories remain ordered while fresh and drifted environments converge on the
-- canonical schema in the later migration.
select 1;
