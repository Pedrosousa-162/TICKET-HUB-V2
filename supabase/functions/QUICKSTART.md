# 🚀 Guia Rápido: Edge Function stripe-webhook

## ✅ Suas Credenciais Configuradas

Todas as suas credenciais já estão no arquivo `.env.local`:

- ✅ Supabase URL e Keys
- ✅ Stripe Publishable Key e Secret Key
- ✅ Resend API Key

## 📋 Checklist de Deploy

### 1. Instalar Supabase CLI

```powershell
npm install -g supabase
```

### 2. Fazer Login

```powershell
supabase login
```

### 3. Deploy Automático (Recomendado)

Execute o script de deploy que criamos:

```powershell
cd supabase/functions
.\deploy-webhook.ps1
```

O script irá:
- ✅ Verificar se você está logado
- ✅ Linkar o projeto automaticamente
- ✅ Configurar todos os segredos
- ✅ Fazer deploy da função
- ✅ Mostrar os próximos passos

### 4. OU Deploy Manual

Se preferir fazer manualmente:

```powershell
# Link do projeto
supabase link --project-ref vxjqpdgzzkfdcxflkbog

# Configurar segredos (todos de uma vez)
supabase secrets set `
  STRIPE_SECRET_KEY="sk_test_51SLiRqCbHzj3iuuOuw444q6ozel5A4QgQysU6FwSZE33npEaNserBiFnRZcPu35jNFpqsNpmkZsMPGPql3N6uScu00LvlqcowF" `
  STRIPE_WEBHOOK_SECRET="placeholder" `
  SUPABASE_URL="https://vxjqpdgzzkfdcxflkbog.supabase.co" `
  SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ4anFwZGd6emtmZGN4ZmxrYm9nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDA5Njg2NiwiZXhwIjoyMDc1NjcyODY2fQ.W0xCPLMj0N-vI5xEQzuW6DYnR6tK5i_F8QDLUdZPl_w" `
  RESEND_API_KEY="re_Bvk4EaW1_3XVdTHay55uyno88zb17CXQi" `
  EMAIL_FROM="no-reply@tickethub.com" `
  --project-ref vxjqpdgzzkfdcxflkbog

# Deploy
supabase functions deploy stripe-webhook --project-ref vxjqpdgzzkfdcxflkbog
```

### 5. Configurar Webhook no Stripe

Após o deploy, você receberá a URL da função:
```
https://vxjqpdgzzkfdcxflkbog.functions.supabase.co/stripe-webhook
```

**Passos no Stripe:**

1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique em **"Add endpoint"**
3. Preencha:
   - **Endpoint URL**: `https://vxjqpdgzzkfdcxflkbog.functions.supabase.co/stripe-webhook`
   - **Description**: "TicketHub - Criação de tickets"
   - **Events**: Selecione `checkout.session.completed`
4. Clique em **"Add endpoint"**
5. Na página do endpoint, clique em **"Reveal"** no Signing Secret
6. Copie o secret (começa com `whsec_`)

### 6. Atualizar Webhook Secret

```powershell
supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_SEU_SECRET_AQUI" --project-ref vxjqpdgzzkfdcxflkbog
```

**E também atualize no `.env.local`:**
```env
STRIPE_WEBHOOK_SECRET=whsec_SEU_SECRET_AQUI
```

## 🧪 Testar

### Teste Local (Opcional)

```powershell
# Instalar Stripe CLI
scoop install stripe

# Login no Stripe
stripe login

# Encaminhar webhooks
stripe listen --forward-to https://vxjqpdgzzkfdcxflkbog.functions.supabase.co/stripe-webhook

# Em outro terminal, simular evento
stripe trigger checkout.session.completed
```

### Teste Real

1. Inicie o projeto: `npm run dev`
2. Acesse um evento: http://localhost:3000/events/[slug]
3. Compre um ticket com cartão de teste: `4242 4242 4242 4242`
4. Verifique:
   - ✅ Email recebido com QR code
   - ✅ Ticket criado na tabela `tickets` do Supabase
   - ✅ Logs no Stripe Dashboard

## 📊 Monitorar

### Ver logs da função:

```powershell
supabase functions logs stripe-webhook --project-ref vxjqpdgzzkfdcxflkbog
```

### Logs em tempo real:

```powershell
supabase functions logs stripe-webhook --tail --project-ref vxjqpdgzzkfdcxflkbog
```

### Dashboard do Stripe:

- Webhooks: https://dashboard.stripe.com/test/webhooks
- Eventos: https://dashboard.stripe.com/test/events

## 🔧 Troubleshooting

### "Invalid signature"
- Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
- Certifique-se de usar o secret do endpoint correto (test mode)

### "Failed to insert ticket"
- Verifique se a tabela `tickets` existe no Supabase
- Confirme que o `SUPABASE_SERVICE_ROLE_KEY` está correto
- Revise as RLS policies

### Email não enviado
- Verifique o `RESEND_API_KEY`
- Confirme que o email `EMAIL_FROM` está verificado no Resend
- Veja os logs: `supabase functions logs stripe-webhook`

## 📁 Arquivos Criados

- ✅ `supabase/functions/stripe-webhook/index.ts` - Edge Function
- ✅ `supabase/functions/stripe-webhook/README.md` - Documentação completa
- ✅ `supabase/functions/.env.example` - Variáveis de referência
- ✅ `supabase/functions/deploy-webhook.ps1` - Script de deploy automático
- ✅ `.env.local` - Suas credenciais (NÃO commite isso!)

## 🎉 Está Pronto!

Seu projeto agora tem:
- ✅ Edge Function para webhooks do Stripe
- ✅ Criação automática de tickets
- ✅ Geração de QR codes
- ✅ Envio de emails via Resend
- ✅ Todas as credenciais configuradas

Execute o script de deploy e comece a testar! 🚀
