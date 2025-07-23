-- Step 2: Update all existing 'user' roles to 'member' and update venues
UPDATE public.user_roles 
SET role = 'member'::app_role 
WHERE role = 'user'::app_role;

-- Update all venues in poreve_venues to be created by Mental Stamina user
-- Mental Stamina's user ID is: 50c27815-a68b-430a-b6ad-4a2c046d3497
UPDATE public.poreve_venues 
SET created_by = '50c27815-a68b-430a-b6ad-4a2c046d3497',
    updated_at = now()
WHERE created_by IS NULL OR created_by != '50c27815-a68b-430a-b6ad-4a2c046d3497';

-- Also update venues table if needed
UPDATE public.venues 
SET approved_by = '50c27815-a68b-430a-b6ad-4a2c046d3497',
    approved_at = now(),
    status = 'approved',
    updated_at = now()
WHERE status = 'pending' OR approved_by IS NULL;