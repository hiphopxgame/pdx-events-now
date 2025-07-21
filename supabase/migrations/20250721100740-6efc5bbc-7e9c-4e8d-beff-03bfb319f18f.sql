-- Update the existing trigger to properly handle new users
-- First drop the existing trigger and function if they exist
DROP TRIGGER IF EXISTS on_auth_user_created_user_role ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_role();

-- Create the updated function
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Give default user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::app_role);
    
    -- If this is the admin email, also give admin role
    IF NEW.email = 'tyronenorris@gmail.com' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'admin'::app_role);
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created_user_role
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();