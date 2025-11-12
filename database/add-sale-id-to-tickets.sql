-- Add sale_id column to tickets_purchased table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tickets_purchased' 
        AND column_name = 'sale_id'
    ) THEN
        ALTER TABLE tickets_purchased
        ADD COLUMN sale_id UUID REFERENCES sales(id) ON DELETE CASCADE;
        
        -- Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_tickets_purchased_sale_id 
        ON tickets_purchased(sale_id);
        
        RAISE NOTICE 'Column sale_id added to tickets_purchased table';
    ELSE
        RAISE NOTICE 'Column sale_id already exists in tickets_purchased table';
    END IF;
END $$;

-- Also ensure stripe_session_id column exists and has an index
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tickets_purchased' 
        AND column_name = 'stripe_session_id'
    ) THEN
        ALTER TABLE tickets_purchased
        ADD COLUMN stripe_session_id TEXT;
        
        -- Create index for better query performance
        CREATE INDEX IF NOT EXISTS idx_tickets_purchased_stripe_session_id 
        ON tickets_purchased(stripe_session_id);
        
        RAISE NOTICE 'Column stripe_session_id added to tickets_purchased table';
    ELSE
        RAISE NOTICE 'Column stripe_session_id already exists in tickets_purchased table';
    END IF;
END $$;
