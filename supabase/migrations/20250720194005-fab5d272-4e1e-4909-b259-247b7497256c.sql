-- Create Open Mic category
INSERT INTO public.poreve_categories (name, slug, description, color, icon, is_active)
VALUES (
  'Open Mic',
  'open-mic',
  'Open microphone events and performances',
  '#9333EA',
  'Mic',
  true
);

-- Update recurring Open Mic events from Music category to Open Mic category
UPDATE public.user_events 
SET category = 'Open Mic'
WHERE category = 'Music' 
  AND is_recurring = true 
  AND title ILIKE '%open mic%';