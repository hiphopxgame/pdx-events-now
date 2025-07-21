-- Add Bear Paw Inn to venues table
INSERT INTO venues (name, city, state, status, approved_at, created_at, updated_at)
VALUES (
  'Bear Paw Inn',
  'Portland', 
  'Oregon',
  'approved',
  now(),
  now(),
  now()
)
ON CONFLICT (name) DO UPDATE SET
  status = 'approved',
  approved_at = COALESCE(venues.approved_at, now()),
  updated_at = now();