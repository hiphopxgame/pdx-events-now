-- Fix the trigger conflict by dropping conflicting triggers and ensuring proper user creation

-- Drop all conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_created_user_role ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_por_eve ON auth.users;

-- Drop the conflicting functions
DROP FUNCTION IF EXISTS public.handle_new_user_role();
DROP FUNCTION IF EXISTS public.handle_new_por_eve_user_registration();

-- Ensure the correct trigger and function exist
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.por_eve_profiles (id, email, display_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'full_name', SPLIT_PART(NEW.email, '@', 1)), ' ', '_'))
  );
  
  -- Assign basic user role (all new users get 'user' role by default)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- If this is the admin email, also give admin role
  IF NEW.email = 'tyronenorris@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the single trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.on_auth_user_created();