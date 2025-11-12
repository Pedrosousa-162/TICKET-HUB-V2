-- TicketHub Database Schema
-- Execute este script no Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  organizer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  association_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  sold INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT stock_not_negative CHECK (stock >= 0),
  CONSTRAINT sold_not_negative CHECK (sold >= 0),
  CONSTRAINT sold_not_exceed_stock CHECK (sold <= stock)
);

-- Create event_users table (associations)
CREATE TABLE IF NOT EXISTS public.event_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('organizer', 'collaborator', 'team_member', 'volunteer')),
  unique_link TEXT UNIQUE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create event_user_stats table
CREATE TABLE IF NOT EXISTS public.event_user_stats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  sales INTEGER NOT NULL DEFAULT 0,
  revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  last_sale_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- Create collaborator_links table
CREATE TABLE IF NOT EXISTS public.collaborator_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  collaborator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  unique_code TEXT UNIQUE NOT NULL,
  clicks INTEGER NOT NULL DEFAULT 0,
  sales INTEGER NOT NULL DEFAULT 0,
  revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, collaborator_id)
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  seller_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  unique_link TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_slug ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_event_users_event ON public.event_users(event_id);
CREATE INDEX IF NOT EXISTS idx_event_users_user ON public.event_users(user_id);
CREATE INDEX IF NOT EXISTS idx_collaborator_links_code ON public.collaborator_links(unique_code);
CREATE INDEX IF NOT EXISTS idx_collaborator_links_event ON public.collaborator_links(event_id);
CREATE INDEX IF NOT EXISTS idx_collaborator_links_collaborator ON public.collaborator_links(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_transactions_event ON public.transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_transactions_event ON public.transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller ON public.transactions(seller_id);

-- Function to generate unique association code
CREATE OR REPLACE FUNCTION generate_association_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.events WHERE association_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique link
CREATE OR REPLACE FUNCTION generate_unique_link()
RETURNS TEXT AS $$
DECLARE
  link TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    link := lower(substring(md5(random()::text) from 1 for 12));
    SELECT EXISTS(SELECT 1 FROM public.event_users WHERE unique_link = link) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN link;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique collaborator code
CREATE OR REPLACE FUNCTION generate_collaborator_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    code := lower(substring(md5(random()::text) from 1 for 12));
    SELECT EXISTS(SELECT 1 FROM public.collaborator_links WHERE unique_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
  exists BOOLEAN;
BEGIN
  base_slug := lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;
  
  LOOP
    IF counter > 0 THEN
      final_slug := base_slug || '-' || counter;
    END IF;
    
    SELECT EXISTS(SELECT 1 FROM public.events WHERE events.slug = final_slug) INTO exists;
    EXIT WHEN NOT exists;
    
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate association code
CREATE OR REPLACE FUNCTION set_association_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.association_code IS NULL OR NEW.association_code = '' THEN
    NEW.association_code := generate_association_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_association_code ON public.events;

CREATE TRIGGER trigger_set_association_code
BEFORE INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION set_association_code();

-- Trigger to auto-generate slug
CREATE OR REPLACE FUNCTION set_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_slug ON public.events;

CREATE TRIGGER trigger_set_slug
BEFORE INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION set_slug();

-- Trigger to auto-generate unique link
CREATE OR REPLACE FUNCTION set_unique_link()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unique_link IS NULL AND NEW.role != 'organizer' THEN
    NEW.unique_link := generate_unique_link();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_unique_link ON public.event_users;

CREATE TRIGGER trigger_set_unique_link
BEFORE INSERT ON public.event_users
FOR EACH ROW
EXECUTE FUNCTION set_unique_link();

-- Trigger to update stock when transaction is created
CREATE OR REPLACE FUNCTION update_ticket_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    UPDATE public.tickets
    SET sold = sold + NEW.quantity
    WHERE id = NEW.ticket_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ticket_stock ON public.transactions;

CREATE TRIGGER trigger_update_ticket_stock
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION update_ticket_stock();

-- Trigger to update stats when transaction is created
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.seller_id IS NOT NULL THEN
    INSERT INTO public.event_user_stats (event_id, user_id, sales, revenue, last_sale_at)
    VALUES (NEW.event_id, NEW.seller_id, NEW.quantity, NEW.total_amount, NOW())
    ON CONFLICT (event_id, user_id)
    DO UPDATE SET
      sales = event_user_stats.sales + NEW.quantity,
      revenue = event_user_stats.revenue + NEW.total_amount,
      last_sale_at = NOW(),
      conversion_rate = CASE
        WHEN event_user_stats.views > 0 THEN
          ((event_user_stats.sales + NEW.quantity)::DECIMAL / event_user_stats.views * 100)
        ELSE 0
      END,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_stats ON public.transactions;

CREATE TRIGGER trigger_update_user_stats
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION update_user_stats();

-- Trigger to auto-create user profile
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    split_part(NEW.email, '@', 1),
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_profile();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborator_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles"
  ON public.users FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for events
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
CREATE POLICY "Anyone can view events"
  ON public.events FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
CREATE POLICY "Authenticated users can create events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Organizers can update their events" ON public.events;
CREATE POLICY "Organizers can update their events"
  ON public.events FOR UPDATE
  USING (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Organizers can delete their events" ON public.events;
CREATE POLICY "Organizers can delete their events"
  ON public.events FOR DELETE
  USING (auth.uid() = organizer_id);

-- RLS Policies for tickets
DROP POLICY IF EXISTS "Anyone can view tickets" ON public.tickets;
CREATE POLICY "Anyone can view tickets"
  ON public.tickets FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Event organizers can manage tickets" ON public.tickets;
CREATE POLICY "Event organizers can manage tickets"
  ON public.tickets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = tickets.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- RLS Policies for event_users
DROP POLICY IF EXISTS "Users can view event associations" ON public.event_users;
CREATE POLICY "Users can view event associations"
  ON public.event_users FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_users.event_id
      AND events.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can join events" ON public.event_users;
CREATE POLICY "Users can join events"
  ON public.event_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Organizers can manage event users" ON public.event_users;
CREATE POLICY "Organizers can manage event users"
  ON public.event_users FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_users.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- RLS Policies for event_user_stats
DROP POLICY IF EXISTS "Users can view their own stats" ON public.event_user_stats;
CREATE POLICY "Users can view their own stats"
  ON public.event_user_stats FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_user_stats.event_id
      AND events.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can manage stats" ON public.event_user_stats;
CREATE POLICY "System can manage stats"
  ON public.event_user_stats FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for collaborator_links
DROP POLICY IF EXISTS "Anyone can view active collaborator links" ON public.collaborator_links;
CREATE POLICY "Anyone can view active collaborator links"
  ON public.collaborator_links FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Event organizers can manage collaborator links" ON public.collaborator_links;
CREATE POLICY "Event organizers can manage collaborator links"
  ON public.collaborator_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = collaborator_links.event_id
      AND events.organizer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can update collaborator link stats" ON public.collaborator_links;
CREATE POLICY "System can update collaborator link stats"
  ON public.collaborator_links FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for transactions
DROP POLICY IF EXISTS "Anyone can create transactions" ON public.transactions;
CREATE POLICY "Anyone can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their transactions" ON public.transactions;
CREATE POLICY "Users can view their transactions"
  ON public.transactions FOR SELECT
  USING (
    seller_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = transactions.event_id
      AND events.organizer_id = auth.uid()
    )
  );

-- Storage bucket for event images
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;
CREATE POLICY "Anyone can view event images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-images');

DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
CREATE POLICY "Authenticated users can upload event images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'event-images' AND
    auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update their own event images" ON storage.objects;
CREATE POLICY "Users can update their own event images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'event-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own event images" ON storage.objects;
CREATE POLICY "Users can delete their own event images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'event-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
