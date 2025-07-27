-- Fix the missing search_path for the set_admin_by_email(text, boolean) function
CREATE OR REPLACE FUNCTION public.set_admin_by_email(user_email text, admin_status boolean DEFAULT true)
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
    
    -- Update or insert profile
    INSERT INTO public.oretir_profiles (id, is_admin, updated_at)
    VALUES (user_id, admin_status, NOW())
    ON CONFLICT (id) 
    DO UPDATE SET 
        is_admin = admin_status,
        updated_at = NOW();
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    
    RETURN affected_rows > 0;
END;
$function$;