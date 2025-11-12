-- Tabela para armazenar bilhetes individuais gerados após compra confirmada
-- Cada bilhete tem um QR code único para validação na entrada

CREATE TABLE IF NOT EXISTS public.tickets_purchased (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ticket_type TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  
  -- QR Code único para este bilhete específico
  qr_code TEXT UNIQUE NOT NULL,
  
  -- Status do bilhete
  status TEXT NOT NULL DEFAULT 'valid', -- valid, used, cancelled, refunded
  used_at TIMESTAMPTZ,
  validated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  
  -- Metadados
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tickets_purchased_sale_id ON public.tickets_purchased(sale_id);
CREATE INDEX IF NOT EXISTS idx_tickets_purchased_event_id ON public.tickets_purchased(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_purchased_user_id ON public.tickets_purchased(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_purchased_qr_code ON public.tickets_purchased(qr_code);
CREATE INDEX IF NOT EXISTS idx_tickets_purchased_buyer_email ON public.tickets_purchased(buyer_email);
CREATE INDEX IF NOT EXISTS idx_tickets_purchased_status ON public.tickets_purchased(status);

-- RLS Policies para tickets_purchased
ALTER TABLE public.tickets_purchased ENABLE ROW LEVEL SECURITY;

-- Organizadores podem ver todos os bilhetes dos seus eventos
DROP POLICY IF EXISTS "Organizers can view tickets of their events" ON public.tickets_purchased;
CREATE POLICY "Organizers can view tickets of their events"
  ON public.tickets_purchased
  FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE organizer_id = auth.uid()
    )
  );

-- Usuários podem ver seus próprios bilhetes
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets_purchased;
CREATE POLICY "Users can view their own tickets"
  ON public.tickets_purchased
  FOR SELECT
  USING (
    user_id = auth.uid() OR buyer_email = auth.email()
  );

-- Apenas o sistema pode criar bilhetes (via webhook)
DROP POLICY IF EXISTS "System can create tickets" ON public.tickets_purchased;
CREATE POLICY "System can create tickets"
  ON public.tickets_purchased
  FOR INSERT
  WITH CHECK (true);

-- Organizadores podem atualizar status dos bilhetes (validação)
DROP POLICY IF EXISTS "Organizers can update ticket status" ON public.tickets_purchased;
CREATE POLICY "Organizers can update ticket status"
  ON public.tickets_purchased
  FOR UPDATE
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE organizer_id = auth.uid()
    )
  );

-- Função para gerar QR code único
CREATE OR REPLACE FUNCTION generate_unique_qr_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Gera um código único usando UUID + timestamp
    code := encode(digest(uuid_generate_v4()::text || now()::text, 'sha256'), 'hex');
    code := upper(substring(code from 1 for 24)); -- 24 caracteres hexadecimais
    
    SELECT EXISTS(SELECT 1 FROM public.tickets_purchased WHERE qr_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar QR code automaticamente
CREATE OR REPLACE FUNCTION set_qr_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.qr_code IS NULL OR NEW.qr_code = '' THEN
    NEW.qr_code := generate_unique_qr_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_qr_code ON public.tickets_purchased;

CREATE TRIGGER trigger_set_qr_code
BEFORE INSERT ON public.tickets_purchased
FOR EACH ROW
EXECUTE FUNCTION set_qr_code();

-- Função para validar um bilhete (marcar como usado)
CREATE OR REPLACE FUNCTION validate_ticket(
  ticket_qr_code TEXT,
  validator_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ticket_record RECORD;
  result JSONB;
BEGIN
  -- Buscar o bilhete
  SELECT * INTO ticket_record
  FROM public.tickets_purchased
  WHERE qr_code = ticket_qr_code;
  
  -- Verificar se o bilhete existe
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bilhete não encontrado'
    );
  END IF;
  
  -- Verificar se já foi usado
  IF ticket_record.status = 'used' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bilhete já foi utilizado',
      'used_at', ticket_record.used_at
    );
  END IF;
  
  -- Verificar se foi cancelado
  IF ticket_record.status = 'cancelled' OR ticket_record.status = 'refunded' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bilhete ' || ticket_record.status
    );
  END IF;
  
  -- Marcar como usado
  UPDATE public.tickets_purchased
  SET 
    status = 'used',
    used_at = NOW(),
    validated_by = validator_user_id,
    updated_at = NOW()
  WHERE qr_code = ticket_qr_code;
  
  RETURN jsonb_build_object(
    'success', true,
    'ticket', jsonb_build_object(
      'id', ticket_record.id,
      'event_id', ticket_record.event_id,
      'buyer_name', ticket_record.buyer_name,
      'ticket_type', ticket_record.ticket_type
    )
  );
END;
$$;

-- View para estatísticas de bilhetes por evento
CREATE OR REPLACE VIEW event_ticket_stats AS
SELECT 
  event_id,
  COUNT(*) as total_tickets,
  COUNT(*) FILTER (WHERE status = 'valid') as valid_tickets,
  COUNT(*) FILTER (WHERE status = 'used') as used_tickets,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_tickets,
  SUM(price) as total_revenue
FROM public.tickets_purchased
GROUP BY event_id;

-- Comentários
COMMENT ON TABLE public.tickets_purchased IS 'Bilhetes individuais gerados após confirmação de pagamento, cada um com QR code único';
COMMENT ON COLUMN public.tickets_purchased.qr_code IS 'Código QR único para validação do bilhete na entrada do evento';
COMMENT ON COLUMN public.tickets_purchased.status IS 'Status do bilhete: valid (não usado), used (já validado), cancelled, refunded';
COMMENT ON COLUMN public.tickets_purchased.used_at IS 'Data/hora em que o bilhete foi validado na entrada';
COMMENT ON COLUMN public.tickets_purchased.validated_by IS 'ID do usuário (staff/organizador) que validou o bilhete';
