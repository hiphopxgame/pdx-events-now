-- Fix the format_service_name function to have a secure search_path
CREATE OR REPLACE FUNCTION public.format_service_name(service_slug text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN CASE service_slug
    WHEN 'used-tires' THEN 'Used Tires'
    WHEN 'new-tires' THEN 'New Tires'
    WHEN 'tire-repair' THEN 'Tire Repair'
    WHEN 'tire-installation' THEN 'Tire Installation'
    WHEN 'tire-rotation' THEN 'Tire Rotation'
    WHEN 'tire-balancing' THEN 'Tire Balancing'
    WHEN 'flat-tire-repair' THEN 'Flat Tire Repair'
    WHEN 'wheel-alignment' THEN 'Wheel Alignment'
    WHEN 'mobile-service' THEN 'Mobile Service'
    ELSE INITCAP(REPLACE(service_slug, '-', ' '))
  END;
END;
$$;