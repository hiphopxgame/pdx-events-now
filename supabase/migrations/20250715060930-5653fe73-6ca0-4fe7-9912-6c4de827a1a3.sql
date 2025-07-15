-- Add featured field to poreve_events table
ALTER TABLE poreve_events ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

-- Add featured field to user_events table  
ALTER TABLE user_events ADD COLUMN is_featured boolean NOT NULL DEFAULT false;

-- Create policy to allow admins to update featured status on poreve_events
CREATE POLICY "Admins can update featured status on poreve events" 
ON poreve_events 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policy to allow admins to update featured status on user_events
CREATE POLICY "Admins can update featured status on user events" 
ON user_events 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = created_by);