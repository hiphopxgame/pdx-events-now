-- Add support for multiple images in user_events table
-- Add an array field to store multiple image URLs for recurring events
ALTER TABLE user_events ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- Update existing events to migrate single image_url to image_urls array
UPDATE user_events 
SET image_urls = ARRAY[image_url] 
WHERE image_url IS NOT NULL AND image_urls IS NULL;

-- Create an index for better performance on image_urls queries
CREATE INDEX IF NOT EXISTS idx_user_events_image_urls ON user_events USING GIN(image_urls);