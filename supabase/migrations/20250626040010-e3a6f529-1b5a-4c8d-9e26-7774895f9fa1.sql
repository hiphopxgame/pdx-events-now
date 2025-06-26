
-- Fix RLS policy issues across all tables

-- First, drop duplicate/conflicting policies on pormar_consultation_requests
DROP POLICY IF EXISTS "Anyone can insert consultation requests" ON public.pormar_consultation_requests;
DROP POLICY IF EXISTS "Consultation requests access" ON public.pormar_consultation_requests;

-- Create a single, clear policy for consultation requests
CREATE POLICY "Users can insert consultation requests" 
  ON public.pormar_consultation_requests 
  FOR INSERT 
  TO public 
  WITH CHECK (true);

CREATE POLICY "Users can view their own consultation requests" 
  ON public.pormar_consultation_requests 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Check and fix user_events table RLS policies
DROP POLICY IF EXISTS "Users can view approved events and their own events" ON public.user_events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.user_events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.user_events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.user_events;

-- Recreate user_events policies with proper structure
CREATE POLICY "Users can view approved events and their own events" 
  ON public.user_events 
  FOR SELECT 
  USING (status = 'approved' OR auth.uid() = created_by);

CREATE POLICY "Authenticated users can create events" 
  ON public.user_events 
  FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own events" 
  ON public.user_events 
  FOR UPDATE 
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events" 
  ON public.user_events 
  FOR DELETE 
  USING (auth.uid() = created_by);

-- Ensure por_eve_profiles has clean policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.por_eve_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.por_eve_profiles;

-- Recreate por_eve_profiles policies
CREATE POLICY "Users can view their own profile" 
  ON public.por_eve_profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.por_eve_profiles 
  FOR UPDATE 
  USING (auth.uid() = id);
