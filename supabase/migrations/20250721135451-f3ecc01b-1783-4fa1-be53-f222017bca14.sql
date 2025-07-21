-- Fix search_path issues for database functions

-- Fix has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix is_current_user_admin function
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
$$;

-- Fix setup_admin_user function
CREATE OR REPLACE FUNCTION public.setup_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Find the admin user by email
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'tyronenorris@gmail.com';
    
    -- If admin user exists, give them admin role
    IF admin_user_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (admin_user_id, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
END;
$$;

-- Fix handle_new_hiphopworld_user function
CREATE OR REPLACE FUNCTION public.handle_new_hiphopworld_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Insert user profile
  INSERT INTO public.hiphopworld_profiles (user_id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'full_name', SPLIT_PART(NEW.email, '@', 1)), ' ', '_'))
  );
  
  -- Create default Social Card for new user
  INSERT INTO public.hiphopworld_cards (user_id, card_type, title, description, is_public)
  VALUES (
    NEW.id,
    'social',
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email) || '''s Social Card',
    'Official Social Card containing profile information',
    true
  );
  
  RETURN NEW;
END;
$$;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix handle_new_user_role function
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Fix handle_community_purchase function
CREATE OR REPLACE FUNCTION public.handle_community_purchase(p_user_id uuid, p_cash_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update user profile - deduct cash and increment communities owned
  UPDATE public.hiphopworld_profiles 
  SET 
    hip_hop_cash_balance = hip_hop_cash_balance + p_cash_amount,
    communities_owned = communities_owned + 1,
    updated_at = now()
  WHERE user_id = p_user_id;
END;
$$;

-- Fix handle_new_por_eve_user_registration function
CREATE OR REPLACE FUNCTION public.handle_new_por_eve_user_registration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create user profile
  INSERT INTO public.por_eve_profiles (id, email, full_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data ->> 'full_name', SPLIT_PART(NEW.email, '@', 1)), ' ', '_'))
  );
  
  -- Assign basic user role (all new users get 'user' role by default)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::app_role);
  
  RETURN NEW;
END;
$$;