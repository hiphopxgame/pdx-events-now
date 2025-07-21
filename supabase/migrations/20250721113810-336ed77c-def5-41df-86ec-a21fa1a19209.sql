-- Add ages field to venues table
ALTER TABLE public.venues 
ADD COLUMN ages text DEFAULT '21+';

-- Update existing venues to have the default 21+ value
UPDATE public.venues 
SET ages = '21+' 
WHERE ages IS NULL;