-- Update the upgrade_to_artist function to allow both members and admins
CREATE OR REPLACE FUNCTION public.upgrade_to_artist()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is currently a member OR admin
    IF NOT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('member'::app_role, 'admin'::app_role)
    ) THEN
        RAISE EXCEPTION 'Only members and admins can upgrade to artist role';
    END IF;
    
    -- Add artist role (keep existing roles too)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'artist'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;