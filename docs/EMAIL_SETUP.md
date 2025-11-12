# 📧 Configuração de Email com QR Codes

## ✅ O que foi implementado

Quando uma compra é concluída com sucesso através do Stripe, o sistema agora:
1. ✅ Cria registros individuais de bilhetes na tabela `tickets_purchased`
2. ✅ Gera QR codes únicos para cada bilhete (via trigger do banco de dados)
3. ✅ Converte os QR codes em imagens (data URLs)
4. ✅ Envia um email para o comprador com todos os QR codes embutidos

## 🔧 Configuração Necessária

### 1. Criar conta no Resend

1. Acesse [resend.com](https://resend.com)
2. Crie uma conta gratuita
3. Verifique seu domínio (ou use o domínio de teste fornecido)
4. Gere uma API Key

### 2. Adicionar variáveis de ambiente

Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```env
# Resend Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=TicketHub <tickets@seudominio.com>

# Certifique-se de que estas também estão configuradas:
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Importante:**
- `RESEND_API_KEY`: Obtenha em https://resend.com/api-keys
- `EMAIL_FROM`: Use o formato `Nome <email@dominio.com>` - o domínio deve estar verificado no Resend
- `SUPABASE_SERVICE_ROLE_KEY`: Necessária para inserir bilhetes (RLS bypass)

### 3. Verificar tabela tickets_purchased

Certifique-se de que a tabela `tickets_purchased` existe no Supabase:

```sql
-- Execute no SQL Editor do Supabase
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'tickets_purchased';
```

Se não existir, execute o arquivo `create-tickets-purchased-table.sql`.

## 🧪 Como Testar

### Teste Local com Stripe CLI

1. Instale o Stripe CLI se ainda não tiver:
```pwsh
# Windows (via Scoop)
scoop install stripe

# Ou baixe diretamente de https://stripe.com/docs/stripe-cli
```

2. Faça login no Stripe CLI:
```pwsh
stripe login
```

3. Inicie o servidor Next.js:
```pwsh
npm run dev
```

4. Em outro terminal, inicie o Stripe CLI para encaminhar webhooks:
```pwsh
stripe listen --forward-to localhost:3000/api/webhook
```

5. Copie o webhook signing secret que aparece (começa com `whsec_...`) e adicione ao `.env.local`:
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

6. Reinicie o servidor Next.js

7. Faça uma compra de teste ou dispare um evento manualmente:
```pwsh
# Disparar evento de teste
stripe trigger checkout.session.completed
```

### Verificar Logs

Após fazer uma compra, verifique os logs do terminal para mensagens como:

```
Sale created successfully: { id: '...', ... }
Ticket email sent to cliente@exemplo.com
```

### Verificar no Supabase

```sql
-- Ver bilhetes criados recentemente
SELECT * FROM tickets_purchased 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver QR codes gerados
SELECT id, buyer_email, qr_code, status 
FROM tickets_purchased 
ORDER BY created_at DESC;
```

### Verificar Email

1. Acesse [resend.com/emails](https://resend.com/emails)
2. Veja os emails enviados (limite de 100/dia no plano gratuito)
3. Verifique se os QR codes aparecem corretamente

## 📧 Formato do Email

O email enviado contém:
- Saudação personalizada com o nome do comprador
- Título do evento
- Cada bilhete com:
  - Número do bilhete (1, 2, 3...)
  - Código QR único (texto)
  - Imagem do QR code (260x260px)
- Assinatura da equipe TicketHub

## 🐛 Troubleshooting

### Email não é enviado

1. **Verifique a API Key do Resend:**
```pwsh
# No terminal do servidor, deve ver:
# RESEND_API_KEY=re_...
```

2. **Verifique se o domínio está verificado no Resend**
   - Plano gratuito: use `onboarding@resend.dev` como EMAIL_FROM para testes

3. **Verifique os logs do webhook:**
```
Error sending ticket email: [erro detalhado aqui]
```

### QR codes não aparecem

- Os QR codes são gerados como data URLs (base64)
- Alguns clientes de email podem bloquear imagens inline
- Solução: implementar anexos PDF (feature futura)

### Bilhetes não são criados

1. **Verifique se a tabela existe:**
```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'tickets_purchased';
```

2. **Verifique a Service Role Key:**
   - O webhook precisa da `SUPABASE_SERVICE_ROLE_KEY` para inserir dados

3. **Verifique os logs:**
```
Error inserting tickets: [erro detalhado aqui]
```

### Webhook não é chamado

1. **Em produção (Vercel/Railway/etc):**
   - Configure o webhook endpoint no Dashboard do Stripe
   - URL: `https://seudominio.com/api/webhook`
   - Eventos: `checkout.session.completed`

2. **Localmente:**
   - Use o Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhook`

## 🚀 Próximas Melhorias

- [ ] Templates React Email (mais bonitos e responsivos)
- [ ] Anexar bilhetes como PDF em vez de HTML
- [ ] Link para visualizar bilhetes online (página `/my-tickets`)
- [ ] Email de confirmação separado (imediato) e email com bilhetes (após validação)
- [ ] Reenvio de bilhetes perdidos
- [ ] QR codes com logo da empresa

## 📝 Referências

- [Resend Docs](https://resend.com/docs)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [QRCode.js](https://github.com/soldair/node-qrcode)
