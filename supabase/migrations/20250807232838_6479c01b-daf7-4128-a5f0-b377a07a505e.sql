BEGIN;

-- Capture DC from iwitty (by email) and Kandiyams from por_eve (by email)
CREATE TEMP TABLE tmp_dc AS
SELECT ip.user_id,
       COALESCE(u.email, ip.email) AS email,
       COALESCE(
         u.raw_user_meta_data->>'full_name',
         NULLIF(TRIM(CONCAT(ip.first_name,' ',COALESCE(ip.last_name,''))), ''),
         COALESCE(u.email, ip.email)
       ) AS full_name
FROM public.iwitty_profiles ip
LEFT JOIN auth.users u ON u.id = ip.user_id
WHERE LOWER(COALESCE(ip.email, u.email)) = LOWER('dcwebguru@gmail.com');

CREATE TEMP TABLE tmp_kandi AS
SELECT p.id AS user_id,
       p.email,
       p.display_name
FROM public.por_eve_profiles p
WHERE LOWER(p.email) = LOWER('Kandiyams_2000@yahoo.com');

-- 1) Move DC -> por_eve_profiles
INSERT INTO public.por_eve_profiles (id, email, display_name, username, project_id, updated_at)
SELECT user_id,
       email,
       COALESCE(full_name, email) AS display_name,
       LOWER(REPLACE(COALESCE(full_name, split_part(email,'@',1)), ' ', '_')) AS username,
       'portland-events',
       now()
FROM tmp_dc
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  display_name = EXCLUDED.display_name,
  username = EXCLUDED.username,
  updated_at = now();

DELETE FROM public.iwitty_profiles ip
WHERE ip.user_id IN (SELECT user_id FROM tmp_dc);

-- 2) Move Kandiyams -> iwitty_profiles
-- Remove any existing iwitty row for this user (safety)
DELETE FROM public.iwitty_profiles ip
WHERE ip.user_id IN (SELECT user_id FROM tmp_kandi);

INSERT INTO public.iwitty_profiles (user_id, first_name, last_name, email)
SELECT user_id,
       COALESCE(NULLIF(split_part(display_name, ' ', 1), ''), split_part(email,'@',1)) AS first_name,
       COALESCE(NULLIF(regexp_replace(display_name, '^[^\s]+\s*', ''), ''), '') AS last_name,
       email
FROM tmp_kandi;

DELETE FROM public.por_eve_profiles p
WHERE p.id IN (SELECT user_id FROM tmp_kandi);

DROP TABLE IF EXISTS tmp_dc;
DROP TABLE IF EXISTS tmp_kandi;

COMMIT;