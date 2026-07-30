-- The admin-only policy must not run for anonymous visitors. Its profile lookup
-- otherwise requires anon to read profiles before the separate published-week
-- policy can allow the public devotion page.
alter policy "Admins can view all devotion weeks"
on public.devotion_weeks
to authenticated;
