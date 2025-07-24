-- Consolidate display_name and full_name into a single field
-- Step 1: Update display_name with full_name data where display_name is empty but full_name exists
UPDATE por_eve_profiles 
SET display_name = full_name 
WHERE (display_name IS NULL OR display_name = '') 
AND full_name IS NOT NULL 
AND full_name != '';

-- Step 2: Drop the full_name column since we're consolidating to display_name
ALTER TABLE por_eve_profiles DROP COLUMN full_name;