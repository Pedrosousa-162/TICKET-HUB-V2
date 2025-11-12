# 📊 Scripts SQL - TicketHub

## 🎯 Ordem de Execução

Execute estes scripts no **Supabase SQL Editor** na seguinte ordem:

### 1️⃣ Schema Principal (OBRIGATÓRIO)
**Arquivo**: `supabase-schema.sql`

Cria toda a estrutura base:
- Tabelas: users, events, tickets, collaborators, associations
- Índices e constraints
- RLS Policies
- Triggers e funções

**Quando executar**: Primeira vez ao configurar o projeto

---

### 2️⃣ Sistema de Colaboradores (OBRIGATÓRIO)
**Arquivo**: `add-collaborator-links.sql`

Adiciona sistema de links únicos:
- Tabela: collaborator_links
- Tracking de cliques e vendas
- Códigos únicos gerados automaticamente

**Quando executar**: Após o schema principal

---

### 3️⃣ Sistema de Pagamentos (OBRIGATÓRIO)
**Arquivo**: `add-sales-table.sql`

Integração com Stripe:
- Tabela: sales
- Status de pagamento
- Associação com colaboradores
- Função para incrementar estatísticas

**Quando executar**: Antes de aceitar pagamentos

---

### 4️⃣ Bilhetes Comprados (OBRIGATÓRIO)
**Arquivo**: `create-tickets-purchased-table.sql`

Sistema de bilhetes com QR codes:
- Tabela: tickets_purchased
- QR codes únicos
- Status de validação
- Informações do comprador

**Quando executar**: Antes de enviar emails com bilhetes

---

### 5️⃣ Métricas Avançadas (OPCIONAL)
**Arquivo**: `add-metrics-functions.sql`

Funções extras para analytics:
- Cálculo de taxa de conversão
- Ranking de colaboradores
- Estatísticas agregadas

**Quando executar**: Para relatórios avançados

---

## 🚀 Executar Todos de Uma Vez

Se preferir executar tudo de uma vez, copie e cole no SQL Editor na seguinte ordem:

\`\`\`sql
-- 1. Schema principal
\`\`\`
(cole conteúdo de supabase-schema.sql)

\`\`\`sql
-- 2. Colaboradores
\`\`\`
(cole conteúdo de add-collaborator-links.sql)

\`\`\`sql
-- 3. Pagamentos
\`\`\`
(cole conteúdo de add-sales-table.sql)

\`\`\`sql
-- 4. Bilhetes
\`\`\`
(cole conteúdo de create-tickets-purchased-table.sql)

---

## ✅ Verificar Instalação

Após executar, verifique se as tabelas foram criadas:

\`\`\`sql
SELECT 
  schemaname,
  tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
\`\`\`

Você deve ver:
- ✓ users
- ✓ events
- ✓ tickets
- ✓ collaborators
- ✓ associations
- ✓ collaborator_links
- ✓ sales
- ✓ tickets_purchased

---

## 🔍 Verificar RLS Policies

\`\`\`sql
SELECT 
  schemaname,
  tablename,
  policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
\`\`\`

---

## 🆘 Problemas Comuns

### "relation already exists"
✅ Normal se executar script 2x. Use \`DROP TABLE IF EXISTS\` ou ignore o erro.

### "permission denied"
❌ Certifique-se que está usando o SQL Editor do Supabase (não psql local)

### "foreign key constraint"
❌ Execute os scripts na ordem correta (1→2→3→4)

---

## 📝 Notas

- Todos os scripts usam \`IF NOT EXISTS\` para serem idempotentes
- RLS está habilitado em todas as tabelas
- Políticas garantem que usuários só veem seus dados
- UUIDs são gerados automaticamente
- Timestamps (created_at, updated_at) são automáticos
