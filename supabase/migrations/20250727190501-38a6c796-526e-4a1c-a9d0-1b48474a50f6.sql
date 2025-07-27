-- Fix function search_path for security functions
CREATE OR REPLACE FUNCTION public.set_admin_by_email(user_email text, admin_status boolean DEFAULT true, target_project_id text DEFAULT 'oregon-tires'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_id UUID;
    affected_rows INTEGER;
BEGIN
    -- Get user ID from auth.users
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', user_email;
    END IF;
    
    -- Special handling for super admin
    IF user_email = 'tyronenorris@gmail.com' THEN
        -- Ensure super admin has profiles for all projects they need access to
        INSERT INTO public.oretir_profiles (id, is_admin, project_id, updated_at)
        VALUES (user_id, true, target_project_id, NOW())
        ON CONFLICT (id) 
        DO UPDATE SET 
            is_admin = true,  -- Always admin for super admin
            updated_at = NOW();
    ELSE
        -- Regular project admin handling
        INSERT INTO public.oretir_profiles (id, is_admin, project_id, updated_at)
        VALUES (user_id, admin_status, target_project_id, NOW())
        ON CONFLICT (id) 
        DO UPDATE SET 
            is_admin = admin_status,
            project_id = target_project_id,
            updated_at = NOW();
    END IF;
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    RETURN affected_rows > 0;
END;
$function$;

-- Fix the other set_admin_by_email function variant
CREATE OR REPLACE FUNCTION public.set_admin_by_email(user_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.oretir_profiles 
  SET is_admin = true 
  WHERE id = (
    SELECT id FROM auth.users 
    WHERE email = user_email
  );
END;
$function$;