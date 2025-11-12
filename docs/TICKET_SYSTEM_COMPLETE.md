# 🎫 Guia de Configuração do Sistema de Bilhetes com QR Code

## 📋 Ordem de Execução dos Scripts SQL

Execute os scripts SQL na seguinte ordem no **Supabase SQL Editor**:

### 1️⃣ Schema Principal
```sql
-- Arquivo: supabase-schema.sql
-- Este é o schema principal da base de dados
```
Execute todo o conteúdo de `supabase-schema.sql` primeiro.

### 2️⃣ Tabela de Vendas (Sales)
```sql
-- Arquivo: add-sales-table.sql
-- Adiciona a tabela de vendas com integração Stripe
```
Execute `add-sales-table.sql` para criar a tabela `sales`.

### 3️⃣ Tabela de Bilhetes Individuais (Tickets Purchased)
```sql
-- Arquivo: create-tickets-purchased-table.sql
-- Cria a tabela de bilhetes individuais com QR codes únicos
```
Execute `create-tickets-purchased-table.sql` para criar a tabela `tickets_purchased`.

### 4️⃣ Funções de Métricas
```sql
-- Arquivo: add-metrics-functions.sql
-- Adiciona funções para atualização de métricas
```
Execute `add-metrics-functions.sql` para criar as funções auxiliares.

---

## 🔄 Fluxo Completo do Sistema

### 1. **Checkout (Frontend)**
O utilizador seleciona bilhetes e clica em "Comprar"
- Frontend chama `/api/checkout` com:
  - `eventId`, `eventTitle`, `ticketType`, `quantity`, `price`, `userId`, `eventSlug`
- API cria sessão do Stripe e redireciona para pagamento

### 2. **Pagamento no Stripe**
- Utilizador preenche dados do cartão
- Stripe processa o pagamento (modo teste com cartão `4242 4242 4242 4242`)

### 3. **Webhook do Stripe** (Automático)
Quando o pagamento é confirmado (`checkout.session.completed`):
- Cria/atualiza registro na tabela `sales` com `payment_status = 'completed'`
- **Cria bilhetes individuais** na tabela `tickets_purchased`:
  - Um bilhete para cada unidade comprada
  - Cada bilhete recebe um **QR code único** (gerado automaticamente)
  - Status inicial: `valid`
- **Atualiza métricas do evento**:
  - Incrementa `tickets_sold`
  - Incrementa `total_revenue`
- **Atualiza métricas do utilizador** (se não for guest):
  - Incrementa `tickets_purchased`
  - Incrementa `total_spent`
- Se houver colaborador, atualiza estatísticas do colaborador

### 4. **Página "Meus Bilhetes"**
- Utilizador acede a `/my-tickets`
- Sistema busca todos os bilhetes em `tickets_purchased` onde `buyer_email = user.email`
- **Exibe cada bilhete individual** com:
  - Dados do evento (título, data, hora, local)
  - Tipo de bilhete e preço
  - Nome e email do comprador
  - **QR Code único** para validação
  - Status (válido, usado, cancelado)
  - Data de compra e validação (se aplicável)

### 5. **Validação na Entrada** (Opcional - futuro)
- Staff/Organizador escaneia QR code
- Sistema verifica na base de dados:
  - Bilhete existe?
  - Status é `valid`?
  - Evento corresponde?
- Se válido:
  - Marca `status = 'used'`
  - Regista `used_at` e `validated_by`
  - Permite entrada
- Se inválido/já usado:
  - Rejeita entrada

---

## 🎨 Funcionalidades Implementadas

### ✅ Sistema de Compra
- [x] Integração completa com Stripe (modo teste)
- [x] Checkout com validação de dados
- [x] Suporte para múltiplos bilhetes por compra
- [x] Metadados completos na sessão Stripe

### ✅ Webhook do Stripe
- [x] Verificação de assinatura
- [x] Criação/atualização de vendas
- [x] **Criação automática de bilhetes individuais**
- [x] **Geração automática de QR codes únicos**
- [x] **Atualização de métricas de evento e utilizador**
- [x] Suporte para vendas via colaborador

### ✅ Tabela de Bilhetes
- [x] `tickets_purchased` com QR code único por bilhete
- [x] Status: valid, used, cancelled, refunded
- [x] Relação com `sales` (compra original)
- [x] Relação com `events` e `users`
- [x] Timestamps de criação e utilização
- [x] RLS policies configuradas

### ✅ Página "Meus Bilhetes"
- [x] Lista todos os bilhetes do utilizador
- [x] **Display individual de cada bilhete**
- [x] **QR Code visível em cada bilhete**
- [x] Filtros: Todos, Válidos, Usados, Próximos, Passados
- [x] Pesquisa por evento, tipo de bilhete, local
- [x] Estatísticas: Total, Válidos, Usados, Gasto Total
- [x] Design responsivo e profissional

### ✅ Componente TicketCard
- [x] Display bonito e profissional
- [x] QR Code grande e legível
- [x] Informações completas do evento
- [x] Status visual (cores e ícones)
- [x] Informações do titular
- [x] Data de compra e validação
- [x] Avisos para bilhetes usados/cancelados

### ✅ Métricas e Estatísticas
- [x] Função `increment_event_sales()` - atualiza vendas do evento
- [x] Função `increment_user_purchase_stats()` - atualiza estatísticas do utilizador
- [x] Função `get_event_stats()` - retorna estatísticas do evento
- [x] Função `get_user_stats()` - retorna estatísticas do utilizador
- [x] Triggers automáticos para atualização

---

## 🧪 Testar o Sistema

### 1. Testar Compra
```
1. Aceder a um evento: http://localhost:3000/events/[slug]
2. Selecionar tipo de bilhete e quantidade (1-10)
3. Clicar em "Comprar Bilhetes"
4. Preencher dados no Stripe:
   - Email: teste@example.com
   - Cartão: 4242 4242 4242 4242
   - Data: qualquer data futura (ex: 12/25)
   - CVC: qualquer 3 dígitos (ex: 123)
   - Nome: João Silva
5. Confirmar pagamento
```

### 2. Verificar Webhook
```
1. Ver logs no terminal onde o Next.js está a correr
2. Procurar por:
   - "Sale created successfully" ou "Sale updated to completed"
   - "X individual tickets created successfully"
   - "✅ Payment processed successfully"
```

### 3. Ver Bilhetes
```
1. Aceder a: http://localhost:3000/my-tickets
2. Verificar que os bilhetes aparecem
3. Confirmar que cada bilhete tem:
   - Dados do evento
   - QR Code único
   - Status "Válido" (verde)
   - Informações do comprador
```

### 4. Verificar na Base de Dados
```sql
-- Ver vendas
SELECT * FROM sales ORDER BY created_at DESC LIMIT 5;

-- Ver bilhetes criados
SELECT * FROM tickets_purchased ORDER BY created_at DESC LIMIT 10;

-- Ver métricas do evento
SELECT id, title, tickets_sold, total_revenue FROM events;

-- Ver métricas do utilizador
SELECT id, email, tickets_purchased, total_spent FROM users;
```

---

## 🔧 Configuração do Stripe Webhook

### Desenvolvimento Local (usando Stripe CLI)
```bash
# 1. Instalar Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# 2. Login no Stripe
stripe login

# 3. Encaminhar webhooks para local
stripe listen --forward-to localhost:3000/api/webhook

# 4. Copiar o webhook secret que aparece e adicionar ao .env.local
# STRIPE_WEBHOOK_SECRET=whsec_...
```

### Produção (Supabase/Vercel)
```
1. Aceder ao Dashboard do Stripe
2. Developers > Webhooks
3. Add endpoint
4. URL: https://seu-dominio.com/api/webhook
5. Events: checkout.session.completed
6. Copiar Signing Secret e adicionar às variáveis de ambiente
```

---

## 📊 Estrutura das Tabelas

### `sales` (Vendas/Compras)
```
- id: UUID (PK)
- event_id: UUID (FK events)
- user_id: UUID (FK users, nullable)
- ticket_type: TEXT
- quantity: INTEGER
- total_amount: DECIMAL
- buyer_email: TEXT
- buyer_name: TEXT
- payment_status: TEXT (pending, completed, failed, refunded)
- stripe_session_id: TEXT (unique)
- collaborator_id: UUID (FK collaborator_links, nullable)
- created_at, updated_at: TIMESTAMPTZ
```

### `tickets_purchased` (Bilhetes Individuais)
```
- id: UUID (PK)
- sale_id: UUID (FK sales)
- event_id: UUID (FK events)
- user_id: UUID (FK users, nullable)
- ticket_type: TEXT
- buyer_email: TEXT
- buyer_name: TEXT
- qr_code: TEXT (unique) ← GERADO AUTOMATICAMENTE
- status: TEXT (valid, used, cancelled, refunded)
- used_at: TIMESTAMPTZ (nullable)
- validated_by: UUID (FK users, nullable)
- price: DECIMAL
- created_at, updated_at: TIMESTAMPTZ
```

### `events` (Eventos) - Novas Colunas
```
... colunas existentes ...
+ tickets_sold: INTEGER (total de bilhetes vendidos)
+ total_revenue: DECIMAL (receita total)
```

### `users` (Utilizadores) - Novas Colunas
```
... colunas existentes ...
+ tickets_purchased: INTEGER (total de bilhetes comprados)
+ total_spent: DECIMAL (total gasto)
```

---

## 🎯 Próximos Passos (Opcional)

### Funcionalidades Futuras
- [ ] **Scanner de QR Code** para validação na entrada
- [ ] **Email automático** com bilhetes PDF após compra
- [ ] **Impressão de bilhetes** em formato PDF
- [ ] **Transferência de bilhetes** entre utilizadores
- [ ] **Reembolsos** via Stripe
- [ ] **Notificações push** antes do evento
- [ ] **Dashboard de validação** para organizadores
- [ ] **Estatísticas em tempo real** de entradas

---

## 🐛 Troubleshooting

### Bilhetes não aparecem após pagamento
1. Verificar se o webhook do Stripe está configurado
2. Ver logs do webhook: `/api/webhook`
3. Confirmar que `STRIPE_WEBHOOK_SECRET` está correto
4. Verificar tabela `sales` e `tickets_purchased` na base de dados

### QR Code não aparece
1. Confirmar que `qrcode.react` está instalado: `npm list qrcode.react`
2. Verificar se `qr_code` foi gerado na tabela `tickets_purchased`
3. Ver erros no console do browser (F12)

### Métricas não atualizam
1. Verificar se as funções SQL foram criadas: `\df` no psql
2. Executar `add-metrics-functions.sql` novamente
3. Ver logs do webhook para erros nas RPC calls

---

## 📞 Suporte

Se encontrar problemas:
1. Verificar logs do Next.js terminal
2. Verificar logs do Supabase
3. Verificar logs do Stripe Dashboard
4. Testar queries SQL manualmente no Supabase

---

## ✨ Conclusão

O sistema agora está **completamente funcional**:
- ✅ Pagamentos via Stripe (teste e produção)
- ✅ Criação automática de bilhetes após confirmação
- ✅ QR codes únicos para cada bilhete
- ✅ Atualização automática de métricas
- ✅ Página de "Meus Bilhetes" com visualização de QR codes
- ✅ Sistema pronto para validação na entrada

**Os bilhetes só aparecem após a confirmação do pagamento via webhook!**
