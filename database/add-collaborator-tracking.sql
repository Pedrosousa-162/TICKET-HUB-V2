-- Add collaborator tracking to tickets_purchased table
-- This allows us to track which collaborator sold each ticket

-- Add collaborator_id column
ALTER TABLE public.tickets_purchased 
ADD COLUMN IF NOT EXISTS collaborator_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Add unique_link_used column to track which link was used for the purchase
ALTER TABLE public.tickets_purchased 
ADD COLUMN IF NOT EXISTS unique_link_used TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tickets_purchased_collaborator_id 
ON public.tickets_purchased(collaborator_id);

CREATE INDEX IF NOT EXISTS idx_tickets_purchased_unique_link 
ON public.tickets_purchased(unique_link_used);

-- Add comment
COMMENT ON COLUMN public.tickets_purchased.collaborator_id IS 'ID of the collaborator who sold this ticket';
COMMENT ON COLUMN public.tickets_purchased.unique_link_used IS 'Unique link that was used to access the event before purchasing';
