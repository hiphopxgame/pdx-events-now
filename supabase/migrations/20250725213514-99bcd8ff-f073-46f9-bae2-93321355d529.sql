-- Remove sample events added by sync function
DELETE FROM user_events 
WHERE api_source = 'sample';

-- Remove duplicate test events (keeping only the most recent one if needed)
DELETE FROM user_events 
WHERE title = 'Open Mic' 
AND created_at < (
  SELECT MAX(created_at) 
  FROM user_events 
  WHERE title = 'Open Mic'
);

-- Remove any other obvious test events
DELETE FROM user_events 
WHERE title IN ('Test', 'test', 'TEST');