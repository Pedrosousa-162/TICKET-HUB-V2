-- Função para decrementar o stock de bilhetes de forma segura
-- Esta função é usada quando uma compra é finalizada

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

-- Comentário na função
COMMENT ON FUNCTION public.decrement_ticket_stock(UUID, INTEGER) IS
'Decrementa o stock de um tipo de bilhete de forma segura quando uma venda é completada. Usa locks para evitar overselling.';
