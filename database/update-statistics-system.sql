-- =====================================================
-- ATUALIZAÇÃO DO SISTEMA DE ESTATÍSTICAS
-- =====================================================
-- Este script garante que as estatísticas do dashboard
-- sejam atualizadas automaticamente quando bilhetes são vendidos

-- 1. Criar função para decrementar stock de bilhetes
-- =====================================================
CREATE OR REPLACE FUNCTION public.decrement_ticket_stock(
  ticket_id UUID,
  quantity_sold INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Obter o stock atual com lock para evitar race conditions
  SELECT stock INTO current_stock
  FROM public.tickets
  WHERE id = ticket_id
  FOR UPDATE;

  -- Verificar se há stock suficiente
  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Ticket not found';
  END IF;

  IF current_stock < quantity_sold THEN
    RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', current_stock, quantity_sold;
  END IF;

  -- Decrementar o stock
  UPDATE public.tickets
  SET
    stock = stock - quantity_sold,
    updated_at = NOW()
  WHERE id = ticket_id;

END;
$$;

COMMENT ON FUNCTION public.decrement_ticket_stock(UUID, INTEGER) IS
'Decrementa o stock de um tipo de bilhete de forma segura quando uma venda é completada. Usa locks para evitar overselling.';


-- 2. Adicionar índices para melhor performance nas estatísticas
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_transactions_event_id ON public.transactions(event_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON public.sales(created_at);


-- 3. Criar trigger para sincronizar sales -> transactions (opcional)
-- =====================================================
-- Esta função cria automaticamente um registro em transactions quando uma sale é completada
CREATE OR REPLACE FUNCTION public.sync_sale_to_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  event_organizer_id UUID;
  ticket_record_id UUID;
BEGIN
  -- Só processar se o status for 'completed'
  IF NEW.payment_status = 'completed' THEN

    -- Buscar o organizer_id do evento
    SELECT organizer_id INTO event_organizer_id
    FROM public.events
    WHERE id = NEW.event_id;

    -- Buscar o ticket_id baseado no nome do tipo de bilhete
    SELECT id INTO ticket_record_id
    FROM public.tickets
    WHERE event_id = NEW.event_id
      AND name = NEW.ticket_type
    LIMIT 1;

    -- Se encontrar o ticket, criar o registro em transactions
    IF ticket_record_id IS NOT NULL THEN
      INSERT INTO public.transactions (
        event_id,
        ticket_id,
        buyer_email,
        buyer_name,
        quantity,
        total_amount,
        seller_id,
        unique_link,
        status
      ) VALUES (
        NEW.event_id,
        ticket_record_id,
        NEW.buyer_email,
        NEW.buyer_name,
        NEW.quantity,
        NEW.total_amount,
        event_organizer_id,
        NULL,
        'completed'
      )
      ON CONFLICT DO NOTHING; -- Evitar duplicatas
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_sale_to_transaction() IS
'Sincroniza automaticamente vendas (sales) para transactions para manter as estatísticas atualizadas';

-- Criar trigger (desabilitado por padrão - ativar se necessário)
-- DROP TRIGGER IF EXISTS sync_sale_to_transaction_trigger ON public.sales;
-- CREATE TRIGGER sync_sale_to_transaction_trigger
--   AFTER INSERT OR UPDATE ON public.sales
--   FOR EACH ROW
--   EXECUTE FUNCTION public.sync_sale_to_transaction();


-- 4. Função helper para recalcular estatísticas de um evento
-- =====================================================
CREATE OR REPLACE FUNCTION public.recalculate_event_stats(
  p_event_id UUID
)
RETURNS TABLE(
  total_tickets_sold BIGINT,
  total_revenue NUMERIC,
  unique_buyers BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(t.quantity), 0)::BIGINT as total_tickets_sold,
    COALESCE(SUM(t.total_amount), 0) as total_revenue,
    COUNT(DISTINCT t.buyer_email)::BIGINT as unique_buyers
  FROM public.transactions t
  WHERE t.event_id = p_event_id
    AND t.status = 'completed';
END;
$$;

COMMENT ON FUNCTION public.recalculate_event_stats(UUID) IS
'Recalcula as estatísticas de vendas de um evento específico';


-- 5. Função para obter estatísticas de um organizador
-- =====================================================
CREATE OR REPLACE FUNCTION public.get_organizer_stats(
  p_organizer_id UUID
)
RETURNS TABLE(
  total_events BIGINT,
  total_tickets_sold BIGINT,
  total_revenue NUMERIC,
  total_buyers BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT e.id)::BIGINT as total_events,
    COALESCE(SUM(t.quantity), 0)::BIGINT as total_tickets_sold,
    COALESCE(SUM(t.total_amount), 0) as total_revenue,
    COUNT(DISTINCT t.buyer_email)::BIGINT as total_buyers
  FROM public.events e
  LEFT JOIN public.transactions t ON t.event_id = e.id AND t.status = 'completed'
  WHERE e.organizer_id = p_organizer_id;
END;
$$;

COMMENT ON FUNCTION public.get_organizer_stats(UUID) IS
'Retorna estatísticas agregadas de todos os eventos de um organizador';


-- 6. View materializada para estatísticas (melhor performance)
-- =====================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS public.event_statistics AS
SELECT
  e.id as event_id,
  e.title,
  e.organizer_id,
  COUNT(DISTINCT t.id) as transaction_count,
  COALESCE(SUM(t.quantity), 0) as tickets_sold,
  COALESCE(SUM(t.total_amount), 0) as revenue,
  COUNT(DISTINCT t.buyer_email) as unique_buyers,
  MAX(t.created_at) as last_sale_date
FROM public.events e
LEFT JOIN public.transactions t ON t.event_id = e.id AND t.status = 'completed'
GROUP BY e.id, e.title, e.organizer_id;

-- Criar índice na view materializada
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_statistics_event_id
  ON public.event_statistics(event_id);
CREATE INDEX IF NOT EXISTS idx_event_statistics_organizer_id
  ON public.event_statistics(organizer_id);

COMMENT ON MATERIALIZED VIEW public.event_statistics IS
'View materializada com estatísticas pré-calculadas dos eventos. Atualizar periodicamente com REFRESH MATERIALIZED VIEW';

-- Função para atualizar a view materializada
CREATE OR REPLACE FUNCTION public.refresh_event_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.event_statistics;
END;
$$;

COMMENT ON FUNCTION public.refresh_event_statistics() IS
'Atualiza a view materializada de estatísticas dos eventos';


-- 7. Adicionar updated_at em tickets se não existir
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.tickets ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

    CREATE OR REPLACE FUNCTION update_tickets_updated_at()
    RETURNS TRIGGER AS $trigger$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;

    CREATE TRIGGER tickets_updated_at_trigger
      BEFORE UPDATE ON public.tickets
      FOR EACH ROW
      EXECUTE FUNCTION update_tickets_updated_at();
  END IF;
END $$;


-- 8. RLS Policies para event_statistics
-- =====================================================
ALTER MATERIALIZED VIEW public.event_statistics OWNER TO postgres;

-- Permitir que organizadores vejam suas próprias estatísticas
CREATE POLICY IF NOT EXISTS "Organizers can view their event statistics"
  ON public.events
  FOR SELECT
  USING (organizer_id = auth.uid());


-- 9. Comentários finais e instruções
-- =====================================================
COMMENT ON TABLE public.transactions IS
'Tabela principal para rastreamento de vendas e cálculo de estatísticas. Cada registro representa uma transação completada.';

COMMENT ON TABLE public.sales IS
'Tabela de vendas do Stripe. Os dados aqui são sincronizados para transactions para cálculo de estatísticas.';

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================

-- Para usar este sistema:
-- 1. Execute este script no Supabase SQL Editor
-- 2. Para atualizar estatísticas manualmente: SELECT refresh_event_statistics();
-- 3. Para ver estatísticas de um organizador: SELECT * FROM get_organizer_stats('uuid-do-organizador');
-- 4. Para recalcular stats de um evento: SELECT * FROM recalculate_event_stats('uuid-do-evento');

-- Nota: A view materializada deve ser atualizada periodicamente (ex: a cada hora)
-- Configure um cron job ou use pg_cron extension do Supabase:
-- SELECT cron.schedule('refresh-stats', '0 * * * *', 'SELECT refresh_event_statistics();');
