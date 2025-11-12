-- Funções auxiliares para atualização de métricas após compra confirmada

-- Adicionar colunas de métricas nas tabelas events e users (se não existirem)

-- Adicionar colunas na tabela events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS tickets_sold INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0;

-- Adicionar colunas na tabela users
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS tickets_purchased INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0;

-- Função para incrementar vendas de um evento
CREATE OR REPLACE FUNCTION increment_event_sales(
  p_event_id UUID,
  p_quantity INTEGER,
  p_revenue DECIMAL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.events
  SET 
    tickets_sold = COALESCE(tickets_sold, 0) + p_quantity,
    total_revenue = COALESCE(total_revenue, 0) + p_revenue,
    updated_at = NOW()
  WHERE id = p_event_id;
END;
$$;

-- Função para incrementar estatísticas de compras de um usuário
CREATE OR REPLACE FUNCTION increment_user_purchase_stats(
  p_user_id UUID,
  p_amount DECIMAL,
  p_tickets INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET 
    tickets_purchased = COALESCE(tickets_purchased, 0) + p_tickets,
    total_spent = COALESCE(total_spent, 0) + p_amount,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- Função para obter estatísticas de um evento
CREATE OR REPLACE FUNCTION get_event_stats(p_event_id UUID)
RETURNS TABLE(
  total_tickets_sold INTEGER,
  total_revenue DECIMAL,
  total_valid_tickets INTEGER,
  total_used_tickets INTEGER,
  total_sales INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(e.tickets_sold, 0)::INTEGER as total_tickets_sold,
    COALESCE(e.total_revenue, 0)::DECIMAL as total_revenue,
    COUNT(tp.*) FILTER (WHERE tp.status = 'valid')::INTEGER as total_valid_tickets,
    COUNT(tp.*) FILTER (WHERE tp.status = 'used')::INTEGER as total_used_tickets,
    COUNT(DISTINCT s.id)::INTEGER as total_sales
  FROM public.events e
  LEFT JOIN public.sales s ON s.event_id = e.id AND s.payment_status = 'completed'
  LEFT JOIN public.tickets_purchased tp ON tp.event_id = e.id
  WHERE e.id = p_event_id
  GROUP BY e.id, e.tickets_sold, e.total_revenue;
END;
$$;

-- Função para obter estatísticas de um usuário
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE(
  total_tickets INTEGER,
  total_spent DECIMAL,
  valid_tickets INTEGER,
  used_tickets INTEGER,
  total_purchases INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(tp.*)::INTEGER as total_tickets,
    COALESCE(SUM(tp.price), 0)::DECIMAL as total_spent,
    COUNT(tp.*) FILTER (WHERE tp.status = 'valid')::INTEGER as valid_tickets,
    COUNT(tp.*) FILTER (WHERE tp.status = 'used')::INTEGER as used_tickets,
    COUNT(DISTINCT s.id)::INTEGER as total_purchases
  FROM public.tickets_purchased tp
  LEFT JOIN public.sales s ON s.id = tp.sale_id
  WHERE tp.user_id = p_user_id OR s.user_id = p_user_id;
END;
$$;

-- Trigger para atualizar métricas do evento quando bilhetes são criados
CREATE OR REPLACE FUNCTION update_event_metrics_on_ticket_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Só atualiza se o bilhete for válido
  IF NEW.status = 'valid' THEN
    UPDATE public.events
    SET 
      tickets_sold = COALESCE(tickets_sold, 0) + 1,
      updated_at = NOW()
    WHERE id = NEW.event_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_event_metrics ON public.tickets_purchased;

CREATE TRIGGER trigger_update_event_metrics
AFTER INSERT ON public.tickets_purchased
FOR EACH ROW
EXECUTE FUNCTION update_event_metrics_on_ticket_created();

-- Índices adicionais para performance
CREATE INDEX IF NOT EXISTS idx_events_tickets_sold ON public.events(tickets_sold);
CREATE INDEX IF NOT EXISTS idx_events_total_revenue ON public.events(total_revenue);
CREATE INDEX IF NOT EXISTS idx_users_tickets_purchased ON public.users(tickets_purchased);
CREATE INDEX IF NOT EXISTS idx_users_total_spent ON public.users(total_spent);

-- Comentários
COMMENT ON FUNCTION increment_event_sales IS 'Incrementa o número de bilhetes vendidos e receita total de um evento';
COMMENT ON FUNCTION increment_user_purchase_stats IS 'Incrementa estatísticas de compras de um usuário';
COMMENT ON FUNCTION get_event_stats IS 'Retorna estatísticas completas de um evento';
COMMENT ON FUNCTION get_user_stats IS 'Retorna estatísticas completas de um usuário';
COMMENT ON COLUMN public.events.tickets_sold IS 'Total de bilhetes vendidos para este evento';
COMMENT ON COLUMN public.events.total_revenue IS 'Receita total gerada por este evento';
COMMENT ON COLUMN public.users.tickets_purchased IS 'Total de bilhetes comprados pelo usuário';
COMMENT ON COLUMN public.users.total_spent IS 'Total gasto pelo usuário em bilhetes';
