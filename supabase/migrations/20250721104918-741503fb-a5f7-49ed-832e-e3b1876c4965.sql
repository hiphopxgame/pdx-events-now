-- Create trigger for new user registration to auto-create profile and assign basic role
CREATE OR REPLACE FUNCTION public.handle_new_por_eve_user_registration()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_por_eve ON auth.users;
CREATE TRIGGER on_auth_user_created_por_eve
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_por_eve_user_registration();

-- Update RLS policies for user_events to ensure users can only manage their own events
DROP POLICY IF EXISTS "Users can update their own events" ON public.user_events;
CREATE POLICY "Users can update their own events" 
ON public.user_events 
FOR UPDATE 
USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own events" ON public.user_events;
CREATE POLICY "Users can delete their own events" 
ON public.user_events 
FOR DELETE 
USING (auth.uid() = created_by);

-- Ensure admins can manage all events (approve, feature, etc.)
DROP POLICY IF EXISTS "Admins can manage all events" ON public.user_events;
CREATE POLICY "Admins can manage all events" 
ON public.user_events 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Update venues policies to allow user suggestions but require admin approval
DROP POLICY IF EXISTS "Users can suggest venue changes" ON public.venues;
CREATE POLICY "Users can suggest venue changes" 
ON public.venues 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND status = 'pending');

-- Ensure only admins can approve venues
DROP POLICY IF EXISTS "Admins can approve venues" ON public.venues;
CREATE POLICY "Admins can approve venues" 
ON public.venues 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Make sure new user events default to pending status and require approval
ALTER TABLE public.user_events ALTER COLUMN status SET DEFAULT 'pending';

-- Allow users to view their own pending events
DROP POLICY IF EXISTS "Users can view approved events and their own events" ON public.user_events;
CREATE POLICY "Users can view approved events and their own events" 
ON public.user_events 
FOR SELECT 
USING (status = 'approved' OR auth.uid() = created_by);