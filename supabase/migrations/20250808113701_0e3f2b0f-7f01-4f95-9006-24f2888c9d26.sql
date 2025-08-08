-- Security hardening migration
BEGIN;

-- 1) pormar_consultation_requests: tighten RLS
DROP POLICY IF EXISTS "Anyone can update consultation requests" ON public.pormar_consultation_requests;
DROP POLICY IF EXISTS "Users can view their own consultation requests" ON public.pormar_consultation_requests;
DROP POLICY IF EXISTS "Users can insert consultation requests" ON public.pormar_consultation_requests;

-- Recreate clear, strict policies
CREATE POLICY "Consultations: anyone can create"
ON public.pormar_consultation_requests
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Consultations: user or admin can view"
ON public.pormar_consultation_requests
FOR SELECT
USING ((email = auth.email()) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Consultations: only admin can update"
ON public.pormar_consultation_requests
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Consultations: only admin can delete"
ON public.pormar_consultation_requests
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));


-- 2) donations: remove overly permissive update/insert
DROP POLICY IF EXISTS "insert_donations" ON public.donations;
DROP POLICY IF EXISTS "update_donations" ON public.donations;
-- Keep existing SELECT policy (view_own_donations)


-- 3) payments: restrict to admins only for reads, no direct writes
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;

CREATE POLICY "Payments: only admin can view"
ON public.payments
FOR SELECT
USING (is_admin() OR is_super_admin());

-- No INSERT/UPDATE/DELETE policies -> only service role can write via edge functions


-- 4) oretir_email_logs: drop permissive read, keep strict admin read + system insert
DROP POLICY IF EXISTS "Admin can view all email logs" ON public.oretir_email_logs;
-- Existing policies kept:
--  - "Admin can view email logs" (SELECT USING is_admin() OR is_super_admin())
--  - "System can insert email logs" (INSERT WITH CHECK true)


-- 5) Create a safe public view for por_eve_profiles (non-sensitive columns only)
CREATE OR REPLACE VIEW public.public_por_eve_profiles AS
SELECT 
  id,
  username,
  display_name,
  avatar_url,
  city,
  state,
  website_url,
  facebook_url,
  instagram_url,
  twitter_url,
  youtube_url,
  spotify_url,
  bandcamp_url,
  soundcloud_url
FROM public.por_eve_profiles
WHERE project_id = 'portland-events';

-- Expose the view for public/clients; underlying table policies remain unchanged for now
GRANT SELECT ON public.public_por_eve_profiles TO anon, authenticated;

COMMIT;