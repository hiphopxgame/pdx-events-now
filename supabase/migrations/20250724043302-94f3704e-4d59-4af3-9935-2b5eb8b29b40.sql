-- Fix the upgrade_to_artist function search_path issue
CREATE OR REPLACE FUNCTION public.upgrade_to_artist()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
    -- Check if user is authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Must be authenticated to upgrade to artist role';
    END IF;
    
    -- Add artist role (keep existing roles too)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'artist'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$function$;