-- Add stripe_session_id column to tickets_purchased table
-- This allows us to track which Stripe checkout session created each ticket

-- Add the column if it doesn't exist
ALTER TABLE public.tickets_purchased 
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- Make sale_id nullable (since we're using Stripe session instead)
ALTER TABLE public.tickets_purchased 
ALTER COLUMN sale_id DROP NOT NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tickets_purchased_stripe_session 
ON public.tickets_purchased(stripe_session_id);

-- Add comment
COMMENT ON COLUMN public.tickets_purchased.stripe_session_id IS 'Stripe checkout session ID that created this ticket';
