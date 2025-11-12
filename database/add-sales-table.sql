-- Adicionar tabela de vendas (sales) para integração com Stripe

CREATE TABLE IF NOT EXISTS public.sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  ticket_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  stripe_session_id TEXT UNIQUE,
  collaborator_id UUID REFERENCES public.collaborator_links(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_sales_event_id ON public.sales(event_id);
CREATE INDEX IF NOT EXISTS idx_sales_stripe_session_id ON public.sales(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_sales_collaborator_id ON public.sales(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON public.sales(payment_status);

-- RLS Policies para sales
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Organizers podem ver vendas dos seus eventos
CREATE POLICY "Organizers can view sales of their events"
  ON public.sales
  FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE organizer_id = auth.uid()
    )
  );

-- Todos podem criar vendas (checkout público)
CREATE POLICY "Anyone can create sales"
  ON public.sales
  FOR INSERT
  WITH CHECK (true);

-- Função para incrementar vendas de colaboradores
CREATE OR REPLACE FUNCTION increment_collaborator_sales(
  collab_id UUID,
  sale_amount DECIMAL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.collaborator_links
  SET 
    sales = sales + 1,
    revenue = revenue + sale_amount,
    updated_at = NOW()
  WHERE id = collab_id;
END;
$$;

-- Comentários
COMMENT ON TABLE public.sales IS 'Armazena todas as vendas de bilhetes processadas via Stripe';
COMMENT ON COLUMN public.sales.stripe_session_id IS 'ID da sessão de checkout do Stripe';
COMMENT ON COLUMN public.sales.payment_status IS 'Status do pagamento: pending, completed, failed, refunded';
COMMENT ON COLUMN public.sales.collaborator_id IS 'ID do link de colaborador que gerou a venda (se aplicável)';
