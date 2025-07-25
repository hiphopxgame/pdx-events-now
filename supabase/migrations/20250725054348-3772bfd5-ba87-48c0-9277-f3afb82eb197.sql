-- Remove the 5 specified fields from user_events table
ALTER TABLE public.user_events 
DROP COLUMN IF EXISTS price_min,
DROP COLUMN IF EXISTS price_max,
DROP COLUMN IF EXISTS organizer_name,
DROP COLUMN IF EXISTS organizer_email,
DROP COLUMN IF EXISTS organizer_phone;