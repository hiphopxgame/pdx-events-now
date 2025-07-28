-- Add project isolation to por_eve_profiles table
ALTER TABLE public.por_eve_profiles 
ADD COLUMN project_id text NOT NULL DEFAULT 'portland-events';

-- Update RLS policies to isolate by project
DROP POLICY IF EXISTS "Public can view all profiles" ON public.por_eve_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.por_eve_profiles;

-- New RLS policies with project isolation
CREATE POLICY "Public can view portland-events profiles" 
ON public.por_eve_profiles 
FOR SELECT 
USING (project_id = 'portland-events');

CREATE POLICY "Users can view their own profile" 
ON public.por_eve_profiles 
FOR SELECT 
USING (auth.uid() = id AND project_id = 'portland-events');

CREATE POLICY "Users can create their own portland-events profile" 
ON public.por_eve_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id AND project_id = 'portland-events');

CREATE POLICY "Users can update their own portland-events profile" 
ON public.por_eve_profiles 
FOR UPDATE 
USING (auth.uid() = id AND project_id = 'portland-events');

-- Super admin can manage all profiles
CREATE POLICY "Super admin can manage all por_eve_profiles" 
ON public.por_eve_profiles 
FOR ALL 
USING (auth.email() = 'tyronenorris@gmail.com');

-- Update the user creation trigger to set correct project_id
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only create profile for Portland Events project or super admin
  IF NEW.email = 'tyronenorris@gmail.com' THEN
    -- Super admin gets profile for this project
    INSERT INTO public.por_eve_profiles (id, email, display_name, username, project_id)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
      LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'full_name', SPLIT_PART(NEW.email, '@', 1)), ' ', '_')),
      'portland-events'
    );
    
    -- Assign admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Regular users only get profile if they're signing up for Portland Events
    -- This assumes this trigger only runs for Portland Events signups
    INSERT INTO public.por_eve_profiles (id, email, display_name, username, project_id)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
      LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'full_name', SPLIT_PART(NEW.email, '@', 1)), ' ', '_')),
      'portland-events'
    );
    
    -- Assign basic user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update existing profiles to have the correct project_id
UPDATE public.por_eve_profiles 
SET project_id = 'portland-events' 
WHERE project_id IS NULL OR project_id = '';

-- Clean up any profiles that shouldn't be in this project (except super admin)
DELETE FROM public.por_eve_profiles 
WHERE email != 'tyronenorris@gmail.com' 
AND id IN (
  SELECT DISTINCT user_id FROM public.iwitty_profiles
  UNION 
  SELECT DISTINCT user_id FROM public.braiding_profiles WHERE project_id = 'iwitty-hair'
  UNION
  SELECT DISTINCT id FROM public.oretir_profiles WHERE project_id = 'oregon-tires'
);