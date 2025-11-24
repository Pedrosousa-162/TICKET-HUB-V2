# Supabase Edge Function: stripe-webhook

Esta função processa webhooks do Stripe de forma segura usando Supabase Edge Functions (Deno runtime).

## Funcionalidades

- ✅ Valida assinatura do Stripe usando `STRIPE_WEBHOOK_SECRET`
- ✅ Processa evento `checkout.session.completed`
- ✅ Cria ticket na tabela `tickets` do Supabase
- ✅ Gera QR code com o `ticket_id`
- ✅ Envia email com QR code via Resend

## Pré-requisitos

1. **Supabase CLI** instalada:
   ```bash
   npm install -g supabase
   ```

2. **Conta no Resend** (para envio de emails):
   - Crie uma conta em https://resend.com
   - Obtenha a API key

3. **Variáveis de ambiente** configuradas no Supabase

## Deploy da Função

### 1. Login e Link do Projeto

```bash
# Login no Supabase
supabase login

# Link com seu projeto (obtenha o project-ref no dashboard do Supabase)
supabase link --project-ref <seu-project-ref>
```

### 2. Configurar Segredos

Configure as variáveis de ambiente necessárias:

```bash
supabase secrets set \
  STRIPE_SECRET_KEY="sk_test_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  SUPABASE_URL="https://<seu-projeto>.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
  RESEND_API_KEY="re_..." \
  EMAIL_FROM="no-reply@seudominio.com"
```

**Onde encontrar cada chave:**

- `STRIPE_SECRET_KEY`: Dashboard Stripe > Developers > API Keys
- `STRIPE_WEBHOOK_SECRET`: Dashboard Stripe > Developers > Webhooks (após criar o endpoint)
- `SUPABASE_URL`: Dashboard Supabase > Settings > API > Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Dashboard Supabase > Settings > API > service_role key
- `RESEND_API_KEY`: Dashboard Resend > API Keys
- `EMAIL_FROM`: Email verificado no Resend

### 3. Deploy da Função

```bash
supabase functions deploy stripe-webhook
```

A URL da função será algo como:
```
https://<project-ref>.functions.supabase.co/stripe-webhook
```

## Configurar Webhook no Stripe

### 1. Criar Endpoint no Stripe

1. Acesse https://dashboard.stripe.com/test/webhooks
2. Clique em **"Add endpoint"**
3. Configure:
   - **Endpoint URL**: `https://<project-ref>.functions.supabase.co/stripe-webhook`
   - **Description**: "TicketHub - Webhook para criação de tickets"
   - **Events to listen**: Selecione `checkout.session.completed`
4. Clique em **"Add endpoint"**
5. Copie o **Signing secret** (começa com `whsec_`)
6. Atualize o segredo no Supabase:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

## Testar Localmente

### 1. Iniciar Supabase Localmente

```bash
# Inicie o Supabase local
supabase start

# Sirva a função localmente
supabase functions serve stripe-webhook --env-file .env.local
```

### 2. Usar Stripe CLI para Testes

```bash
# Instale o Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe

# Login
stripe login

# Encaminhe eventos para a função local
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Em outro terminal, simule um evento
stripe trigger checkout.session.completed
```

## Estrutura da Função

A função `stripe-webhook/index.ts` realiza:

1. **Validação de Assinatura**: Usa `stripe.webhooks.constructEvent()` para garantir que o evento é legítimo
2. **Processamento do Evento**: Verifica se é `checkout.session.completed`
3. **Criação do Ticket**: Insere um novo registro na tabela `tickets` com:
   - `id`: UUID gerado
   - `sale_id`: ID da sessão do Stripe
   - `event_id`: Do metadata da sessão
   - `user_email`: Email do comprador
   - `ticket_type`: Tipo de bilhete
   - `price`: Valor pago
4. **Geração de QR Code**: Cria um QR code em formato data URL com o `ticket_id`
5. **Envio de Email**: Envia email via Resend com o QR code anexado

## Troubleshooting

### Erro: "Invalid signature"
- Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
- Certifique-se de que está usando o signing secret do endpoint correto (test vs production)

### Erro: "Failed to insert ticket"
- Verifique se a tabela `tickets` existe no Supabase
- Confirme que o `SUPABASE_SERVICE_ROLE_KEY` está configurado
- Revise as RLS policies da tabela `tickets`

### Email não enviado
- Verifique se o `RESEND_API_KEY` é válido
- Confirme que o email `EMAIL_FROM` está verificado no Resend
- Revise os logs da função: `supabase functions logs stripe-webhook`

## Logs e Monitoramento

Visualize os logs da função:

```bash
# Logs em tempo real
supabase functions logs stripe-webhook --tail

# Últimos 100 logs
supabase functions logs stripe-webhook --limit 100
```

No Dashboard do Stripe:
- Vá em **Developers > Webhooks**
- Clique no seu endpoint
- Veja os eventos recebidos e respostas

## Produção

Para produção, repita os passos mas use:
- Chaves de produção do Stripe (`sk_live_`, `whsec_live_`)
- Email de produção verificado no Resend
- URL do webhook apontando para a função em produção

## Segurança

✅ **Boas práticas implementadas:**
- Validação de assinatura do Stripe
- Uso de Service Role Key apenas no servidor
- Variáveis sensíveis em segredos (não no código)
- HTTPS obrigatório (Edge Functions usam sempre HTTPS)

⚠️ **Nunca:**
- Exponha suas chaves em código versionado
- Use Service Role Key no cliente
- Desabilite a validação de assinatura do webhook
