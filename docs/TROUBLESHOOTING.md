# 🔧 SOLUÇÃO: Dados não aparecem - Guia de Troubleshooting

## ❗ Problema: Compras não aparecem e dados não são salvos

### 🔍 PASSO 1: Verificar se as Tabelas Existem

**No Supabase SQL Editor, execute:**

```sql
-- Copie e cole este comando:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sales', 'tickets_purchased');
```

**✅ Resultado Esperado:** Deve mostrar 2 tabelas (`sales` e `tickets_purchased`)  
**❌ Se não aparecer:** Execute os scripts SQL na ordem correta (veja Passo 2)

---

### 🔍 PASSO 2: Executar Scripts SQL (SE NÃO EXECUTOU AINDA)

**No Supabase SQL Editor, execute NA ORDEM:**

#### 1️⃣ Primeiro: Tabela Sales
```sql
-- Copie TODO o conteúdo do arquivo: add-sales-table.sql
-- Cole no SQL Editor e clique em RUN
```

#### 2️⃣ Segundo: Tabela Tickets Purchased
```sql
-- Copie TODO o conteúdo do arquivo: create-tickets-purchased-table.sql
-- Cole no SQL Editor e clique em RUN
```

#### 3️⃣ Terceiro: Funções de Métricas
```sql
-- Copie TODO o conteúdo do arquivo: add-metrics-functions.sql
-- Cole no SQL Editor e clique em RUN
```

---

### 🔍 PASSO 3: Verificar Webhook do Stripe

O problema mais comum é que **o webhook não está configurado**.

#### Opção A: Usando Stripe CLI (RECOMENDADO)

```powershell
# 1. Abrir NOVO terminal PowerShell
# 2. Executar:
stripe listen --forward-to localhost:3000/api/webhook

# 3. Vai aparecer algo assim:
# > Ready! Your webhook signing secret is whsec_xxxxx (^C to quit)

# 4. COPIAR o webhook secret (whsec_xxxxx)
```

#### Adicionar ao `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

#### Reiniciar Next.js:
```powershell
# Parar: Ctrl+C
# Iniciar novamente:
npm run dev
```

---

### 🔍 PASSO 4: Testar Compra e Ver Logs

#### No terminal onde `npm run dev` está rodando, procure por:

```
✅ Sale created successfully
✅ X individual tickets created successfully
✅ Payment processed successfully
```

#### Se NÃO aparecer nada:
- Webhook não está configurado
- `STRIPE_WEBHOOK_SECRET` está errado ou faltando

#### Se aparecer ERROS:
- Tabelas não existem (voltar ao Passo 2)
- Problemas de permissão (ver Passo 5)

---

### 🔍 PASSO 5: Verificar Permissões RLS

Execute no Supabase SQL Editor:

```sql
-- Desabilitar RLS temporariamente para teste (apenas desenvolvimento!)
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets_purchased DISABLE ROW LEVEL SECURITY;

-- Tentar compra novamente
-- Depois de funcionar, reabilitar:
-- ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tickets_purchased ENABLE ROW LEVEL SECURITY;
```

---

### 🔍 PASSO 6: Verificar Service Role Key

No arquivo `.env.local`, certifique-se que tem:

```bash
# Chave service_role (NÃO é a anon key!)
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

**Onde encontrar:**
1. Supabase Dashboard → Settings → API
2. Procurar: **service_role key** (não confundir com anon key)
3. Copiar e colar no `.env.local`

---

### 🔍 PASSO 7: Teste Manual (Inserir Dados Direto no Banco)

Execute no Supabase SQL Editor para criar dados de teste:

```sql
-- 1. Pegar ID de um evento real
SELECT id, title FROM events LIMIT 1;

-- 2. Substitua 'SEU_EVENT_ID' abaixo com o ID copiado
DO $$
DECLARE
    test_event_id UUID := 'SEU_EVENT_ID_AQUI'; -- SUBSTITUA!
    test_sale_id UUID;
BEGIN
    -- Criar venda de teste
    INSERT INTO sales (
        event_id, ticket_type, quantity, total_amount,
        buyer_email, buyer_name, payment_status,
        stripe_session_id
    ) VALUES (
        test_event_id, 'VIP', 2, 50.00,
        'teste@example.com', 'João Teste', 'completed',
        'test_' || gen_random_uuid()
    ) RETURNING id INTO test_sale_id;

    -- Criar 2 bilhetes
    INSERT INTO tickets_purchased (
        sale_id, event_id, ticket_type,
        buyer_email, buyer_name, price, status
    ) 
    SELECT 
        test_sale_id, test_event_id, 'VIP',
        'teste@example.com', 'João Teste', 25.00, 'valid'
    FROM generate_series(1, 2);
    
    RAISE NOTICE 'Dados de teste criados!';
END $$;

-- 3. Verificar
SELECT * FROM sales WHERE buyer_email = 'teste@example.com';
SELECT * FROM tickets_purchased WHERE buyer_email = 'teste@example.com';
```

Depois acesse: `http://localhost:3000/my-tickets` e faça login com `teste@example.com`

---

### 🔍 PASSO 8: Verificar Logs Completos

#### No terminal Next.js:
- Procurar por erros do Supabase
- Procurar por "Error creating sale" ou "Error creating tickets"

#### No Supabase Dashboard:
1. Ir em: **Logs** → **API**
2. Procurar requisições com erro
3. Ver detalhes do erro

---

## 🎯 CHECKLIST RÁPIDO

Execute este checklist passo a passo:

- [ ] **Tabela `sales` existe?** 
  ```sql
  SELECT * FROM sales LIMIT 1;
  ```

- [ ] **Tabela `tickets_purchased` existe?**
  ```sql
  SELECT * FROM tickets_purchased LIMIT 1;
  ```

- [ ] **Webhook Stripe está rodando?**
  ```powershell
  stripe listen --forward-to localhost:3000/api/webhook
  ```

- [ ] **`.env.local` tem `STRIPE_WEBHOOK_SECRET`?**
  ```bash
  STRIPE_WEBHOOK_SECRET=whsec_xxxxx
  ```

- [ ] **`.env.local` tem `SUPABASE_SERVICE_ROLE_KEY`?**
  ```bash
  SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
  ```

- [ ] **Next.js foi reiniciado após mudar `.env.local`?**
  ```powershell
  # Ctrl+C e depois:
  npm run dev
  ```

- [ ] **Fez uma compra de teste com 4242 4242 4242 4242?**

- [ ] **Viu logs "Sale created successfully" no terminal?**

---

## 🚨 SOLUÇÃO RÁPIDA SE NADA FUNCIONAR

### Execute estes 3 comandos no Supabase SQL Editor:

```sql
-- 1. Criar tabelas se não existirem
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID NOT NULL,
  user_id UUID,
  ticket_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  stripe_session_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tickets_purchased (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID NOT NULL,
  event_id UUID NOT NULL,
  ticket_type TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  qr_code TEXT UNIQUE DEFAULT upper(substring(md5(random()::text || now()::text) from 1 for 24)),
  status TEXT DEFAULT 'valid',
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Desabilitar RLS para desenvolvimento
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE tickets_purchased DISABLE ROW LEVEL SECURITY;

-- 3. Verificar
SELECT 'Tabelas criadas!' as status;
```

**Depois:**
1. Configurar webhook: `stripe listen --forward-to localhost:3000/api/webhook`
2. Copiar `whsec_xxxxx` para `.env.local`
3. Reiniciar Next.js: `npm run dev`
4. Fazer compra de teste

---

## 📞 Ainda não funciona?

Execute o script de diagnóstico:

```sql
-- Copie TODO o conteúdo de: VERIFICAR_SISTEMA.sql
-- Cole no Supabase SQL Editor
-- Envie-me os resultados
```

---

## ✅ Quando Funcionar

Você verá:

1. **No terminal Next.js:**
   ```
   ✅ Sale created successfully
   2 individual tickets created successfully
   ✅ Payment processed successfully
   ```

2. **No Supabase (SQL Editor):**
   ```sql
   SELECT * FROM sales ORDER BY created_at DESC LIMIT 1;
   -- Deve mostrar a venda
   
   SELECT * FROM tickets_purchased ORDER BY created_at DESC LIMIT 2;
   -- Deve mostrar os bilhetes com QR codes
   ```

3. **Na aplicação:**
   - Ir para http://localhost:3000/my-tickets
   - Ver bilhetes com QR codes! 🎉
