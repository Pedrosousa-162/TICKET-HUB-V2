-- Script para adicionar tabela collaborator_links
-- Execute este script no Supabase SQL Editor

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_collaborator_links_code ON public.collaborator_links(unique_code);
CREATE INDEX IF NOT EXISTS idx_collaborator_links_event ON public.collaborator_links(event_id);
CREATE INDEX IF NOT EXISTS idx_collaborator_links_collaborator ON public.collaborator_links(collaborator_id);

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

-- Enable Row Level Security
ALTER TABLE public.collaborator_links ENABLE ROW LEVEL SECURITY;

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

-- Criar um link de exemplo para teste (substitua os IDs pelos seus)
-- Descomente e ajuste os IDs conforme necessário:
-- INSERT INTO public.collaborator_links (event_id, collaborator_id, unique_code)
-- SELECT 
--   (SELECT id FROM public.events LIMIT 1),
--   (SELECT id FROM public.users LIMIT 1),
--   '13644b1d5b13'
-- WHERE NOT EXISTS (SELECT 1 FROM public.collaborator_links WHERE unique_code = '13644b1d5b13');
