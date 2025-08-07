-- Migrate 10 users from iwitty_profiles into por_eve_profiles and leave 2 in iwitty (Ty + DC)
-- This migration derives email/metadata from auth.users when available

BEGIN;

-- CTE to pick iwitty profiles to move (exclude Ty and DC, and any already moved)
WITH to_move AS (
  SELECT ip.user_id
  FROM public.iwitty_profiles ip
  LEFT JOIN public.por_eve_profiles p ON p.id = ip.user_id
  LEFT JOIN auth.users u ON u.id = ip.user_id
  WHERE p.id IS NULL
    AND ip.user_id <> '50c27815-a68b-430a-b6ad-4a2c046d3497'::uuid -- keep Ty in iwitty
    AND COALESCE(ip.email, u.email) IS NOT NULL
    AND COALESCE(ip.email, u.email) <> 'dcwebguru@gmail.com' -- keep DC in iwitty
)

-- Insert into por_eve_profiles (up to 10 expected) 
INSERT INTO public.por_eve_profiles (id, email, display_name, username, project_id, updated_at)
SELECT
  t.user_id AS id,
  COALESCE(u.email, ip.email) AS email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    NULLIF(TRIM(CONCAT(ip.first_name,' ',COALESCE(ip.last_name,''))), ''),
    COALESCE(u.email, ip.email)
  ) AS display_name,
  LOWER(REPLACE(
    COALESCE(
      u.raw_user_meta_data->>'full_name',
      split_part(COALESCE(u.email, ip.email),'@',1)
    ), ' ', '_'
  )) AS username,
  'portland-events'::text AS project_id,
  now()
FROM to_move t
JOIN public.iwitty_profiles ip ON ip.user_id = t.user_id
LEFT JOIN auth.users u ON u.id = t.user_id
ON CONFLICT (id) DO NOTHING;

-- Delete moved rows from iwitty_profiles so 2 remain
DELETE FROM public.iwitty_profiles ip
WHERE ip.user_id IN (SELECT user_id FROM to_move);

COMMIT;

-- Post-conditions (for visibility in logs):
-- SELECT 'por_eve_profiles' AS table, count(*) AS cnt FROM public.por_eve_profiles
-- UNION ALL
-- SELECT 'iwitty_profiles' AS table, count(*) AS cnt FROM public.iwitty_profiles;