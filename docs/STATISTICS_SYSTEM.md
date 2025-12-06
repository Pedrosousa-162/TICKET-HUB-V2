# Sistema de Estatísticas do TicketHub

## 📊 Visão Geral

O sistema de estatísticas foi implementado para fornecer dados em tempo real sobre vendas de bilhetes, receitas e colaborações para os organizadores de eventos.

## 🎯 Funcionalidades

### Dashboard do Organizador

O dashboard exibe 4 métricas principais:

1. **Total de Eventos** - Número de eventos criados pelo organizador
2. **Bilhetes Vendidos** - Soma de todos os bilhetes vendidos em todos os eventos
3. **Receita Total** - Valor total arrecadado com as vendas (formatado em EUR)
4. **Colaborações** - Número de eventos onde o usuário é colaborador

### Atualização Automática

As estatísticas são atualizadas automaticamente em duas situações:

1. **Ao carregar a página** - Busca dados mais recentes do banco
2. **Ao voltar à aba** - Quando a janela ganha foco (útil após comprar bilhetes em outra aba)

## 🏗️ Arquitetura

### Tabelas Envolvidas

#### `transactions`
Tabela principal para rastreamento de vendas e cálculo de estatísticas.
```sql
- id: UUID (PK)
- event_id: UUID (FK → events)
- ticket_id: UUID (FK → tickets)
- buyer_email: TEXT
- buyer_name: TEXT
- quantity: INTEGER
- total_amount: DECIMAL(10,2)
- seller_id: UUID (FK → users)
- status: TEXT ('completed' | 'cancelled')
- created_at: TIMESTAMPTZ
```

#### `sales`
Registros de vendas do Stripe (sincronizados com transactions).
```sql
- id: UUID (PK)
- event_id: UUID (FK → events)
- ticket_type: TEXT
- quantity: INTEGER
- total_amount: DECIMAL(10,2)
- buyer_email: TEXT
- buyer_name: TEXT
- payment_status: TEXT
- stripe_session_id: TEXT
- collaborator_id: UUID (FK → collaborator_links)
```

## 🔄 Fluxo de Dados

### Quando um bilhete é comprado:

1. **Usuário finaliza checkout no Stripe**
   - Stripe redireciona para `/payment/success?session_id=...`

2. **API cria registros**
   - `POST /api/create-tickets-from-session`
   - Cria registro em `sales`
   - Cria registro em `transactions` (para estatísticas)
   - Cria bilhetes em `tickets_purchased` com QR codes
   - Decrementa stock em `tickets`

3. **Estatísticas atualizam**
   - Dashboard busca dados de `transactions` quando carregado
   - Filtra por `event_id IN (eventos do organizador)`
   - Filtra por `status = 'completed'`

## 📈 Consultas de Estatísticas

### Estatísticas do Dashboard

```typescript
// Buscar eventos do organizador
const { data: eventsData } = await supabase
  .from("events")
  .select("*")
  .eq("organizer_id", userId);

// Buscar transações dos eventos
const eventIds = eventsData.map(e => e.id);
const { data: transactionsData } = await supabase
  .from("transactions")
  .select("quantity, total_amount")
  .in("event_id", eventIds)
  .eq("status", "completed");

// Calcular totais
const totalTickets = transactionsData.reduce((acc, t) => acc + t.quantity, 0);
const totalRevenue = transactionsData.reduce((acc, t) => acc + Number(t.total_amount), 0);
```

## 🛠️ Funções SQL Disponíveis

### `decrement_ticket_stock(ticket_id, quantity_sold)`
Decrementa o stock de bilhetes de forma segura (com lock).

```sql
SELECT decrement_ticket_stock(
  '123e4567-e89b-12d3-a456-426614174000'::UUID,
  5
);
```

### `get_organizer_stats(organizer_id)`
Retorna estatísticas agregadas de um organizador.

```sql
SELECT * FROM get_organizer_stats('user-uuid');
-- Retorna: total_events, total_tickets_sold, total_revenue, total_buyers
```

### `recalculate_event_stats(event_id)`
Recalcula estatísticas de um evento específico.

```sql
SELECT * FROM recalculate_event_stats('event-uuid');
-- Retorna: total_tickets_sold, total_revenue, unique_buyers
```

### `refresh_event_statistics()`
Atualiza a view materializada de estatísticas.

```sql
SELECT refresh_event_statistics();
```

## 📊 View Materializada

### `event_statistics`
View pré-calculada para melhor performance.

```sql
SELECT * FROM event_statistics WHERE organizer_id = 'user-uuid';
```

**Campos:**
- `event_id` - ID do evento
- `title` - Título do evento
- `organizer_id` - ID do organizador
- `transaction_count` - Número de transações
- `tickets_sold` - Total de bilhetes vendidos
- `revenue` - Receita total
- `unique_buyers` - Número de compradores únicos
- `last_sale_date` - Data da última venda

**Nota:** Esta view deve ser atualizada periodicamente com `REFRESH MATERIALIZED VIEW event_statistics;`

## 🔧 Manutenção

### Atualizar Estatísticas Manualmente

Se as estatísticas ficarem desatualizadas, você pode:

1. **Atualizar view materializada:**
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY event_statistics;
```

2. **Recalcular stats de um evento:**
```sql
SELECT * FROM recalculate_event_stats('event-uuid');
```

3. **Ver estatísticas de um organizador:**
```sql
SELECT * FROM get_organizer_stats('organizer-uuid');
```

### Configurar Atualização Automática

Usando pg_cron (Supabase):

```sql
SELECT cron.schedule(
  'refresh-stats',
  '0 * * * *',  -- A cada hora
  'SELECT refresh_event_statistics();'
);
```

## 🐛 Troubleshooting

### Estatísticas não atualizam

1. **Verificar se transactions foram criadas:**
```sql
SELECT * FROM transactions 
WHERE event_id = 'event-uuid' 
ORDER BY created_at DESC;
```

2. **Verificar sales do Stripe:**
```sql
SELECT * FROM sales 
WHERE stripe_session_id = 'session-id';
```

3. **Verificar logs da API:**
```bash
# Verificar console do navegador
# Verificar Supabase Dashboard → API Logs
```

### Stock não decrementa

1. **Verificar se a função existe:**
```sql
SELECT proname FROM pg_proc WHERE proname = 'decrement_ticket_stock';
```

2. **Executar manualmente:**
```sql
SELECT decrement_ticket_stock('ticket-uuid', 1);
```

### Performance lenta

1. **Verificar índices:**
```sql
SELECT tablename, indexname FROM pg_indexes 
WHERE tablename IN ('transactions', 'sales', 'tickets');
```

2. **Usar view materializada:**
```sql
SELECT * FROM event_statistics 
WHERE organizer_id = 'user-uuid';
```

## 📝 Notas de Implementação

### API `/api/create-tickets-from-session`

Esta API é responsável por:
1. Verificar pagamento no Stripe
2. Criar registro em `sales`
3. Criar registro em `transactions` para estatísticas
4. Gerar bilhetes com QR codes
5. Decrementar stock
6. Atualizar estatísticas de colaboradores

### Dashboard React

O componente `DashboardContent` usa:
- `useEffect` para carregar dados inicialmente
- `useEffect` com event listener `focus` para atualizar ao voltar à aba
- Estado de loading com skeleton animado
- Formatação de números (português): `toLocaleString('pt-PT')`

## 🚀 Melhorias Futuras

- [ ] WebSockets para atualização em tempo real
- [ ] Cache de estatísticas com Redis
- [ ] Gráficos de vendas ao longo do tempo
- [ ] Comparação entre eventos
- [ ] Exportar relatórios em PDF/Excel
- [ ] Dashboard de analytics avançado
- [ ] Notificações push de novas vendas

## 📚 Referências

- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [PostgreSQL Materialized Views](https://www.postgresql.org/docs/current/rules-materializedviews.html)
- [pg_cron Extension](https://supabase.com/docs/guides/database/extensions/pg_cron)