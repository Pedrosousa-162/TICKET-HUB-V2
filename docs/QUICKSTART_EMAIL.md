# 🚀 Início Rápido - Sistema de Email com QR Codes

## ✅ Sistema Implementado

O TicketHub agora envia automaticamente um email com QR codes únicos para cada bilhete quando uma compra é bem-sucedida!

## 📋 Checklist de Configuração (3 minutos)

### 1️⃣ Configurar Resend (Serviço de Email)

```pwsh
# 1. Acesse https://resend.com e crie uma conta gratuita
# 2. Vá em API Keys e crie uma nova chave
# 3. Copie a chave (começa com re_...)
```

### 2️⃣ Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:
```pwsh
Copy-Item .env.example .env.local
```

Edite `.env.local` e adicione suas chaves:
```env
# ⚠️ OBRIGATÓRIO para enviar emails
RESEND_API_KEY=re_sua_chave_aqui

# Para testes, use o email de onboarding do Resend:
EMAIL_FROM=onboarding@resend.dev

# ⚠️ OBRIGATÓRIO para criar bilhetes
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Suas chaves Stripe (já deve ter configurado)
STRIPE_WEBHOOK_SECRET=whsec_sua_chave
```

### 3️⃣ Verificar Tabela no Supabase

Acesse o SQL Editor do Supabase e execute:
```sql
-- Verificar se a tabela existe
SELECT * FROM tickets_purchased LIMIT 1;

-- Se der erro "relation does not exist", execute:
-- O conteúdo completo do arquivo: create-tickets-purchased-table.sql
```

### 4️⃣ Testar Localmente

```pwsh
# Terminal 1: Iniciar o servidor
npm run dev

# Terminal 2: Encaminhar webhooks do Stripe (requer Stripe CLI)
stripe listen --forward-to localhost:3000/api/webhook

# Faça uma compra de teste ou dispare um evento:
stripe trigger checkout.session.completed
```

## 🎯 O que acontece quando alguém compra?

1. ✅ Stripe processa o pagamento
2. ✅ Webhook recebe evento `checkout.session.completed`
3. ✅ Sistema cria registro na tabela `sales`
4. ✅ Sistema gera N bilhetes individuais em `tickets_purchased` (N = quantidade comprada)
5. ✅ Cada bilhete recebe um QR code único (via trigger do banco)
6. ✅ Sistema converte QR codes em imagens
7. ✅ Email é enviado para o comprador com todos os QR codes
8. ✅ Logs confirmam: `Ticket email sent to email@exemplo.com`

## 📧 Exemplo de Email Enviado

```
Assunto: Os seus bilhetes para [Nome do Evento]

Olá João Silva,

Obrigado pela compra! Abaixo estão os seus bilhetes com QR code único — 
apresente-os na entrada.

Evento X

Bilhete 1
Código: A1B2C3D4E5F6G7H8I9J0K1L2
[Imagem QR Code 260x260px]
─────────────────────────────

Bilhete 2
Código: X9Y8Z7W6V5U4T3S2R1Q0P9O8
[Imagem QR Code 260x260px]

Até breve,
Equipa TicketHub
```

## 🔍 Como Verificar se Está Funcionando

### Verificar Logs do Servidor
Procure por estas mensagens no terminal:
```
Sale created successfully: { id: '...', ... }
Ticket email sent to cliente@exemplo.com
```

### Verificar no Supabase
```sql
-- Ver bilhetes criados
SELECT 
  buyer_email, 
  buyer_name, 
  qr_code, 
  status, 
  created_at 
FROM tickets_purchased 
ORDER BY created_at DESC 
LIMIT 10;
```

### Verificar no Resend
1. Acesse https://resend.com/emails
2. Veja todos os emails enviados (até 100/dia grátis)
3. Clique em um email para ver o preview

## ❌ Problemas Comuns

### "Could not send email"
- ✅ Verifique se `RESEND_API_KEY` está no `.env.local`
- ✅ Use `onboarding@resend.dev` como `EMAIL_FROM` para testes
- ✅ Reinicie o servidor depois de alterar `.env.local`

### "relation 'tickets_purchased' does not exist"
- ✅ Execute o arquivo `create-tickets-purchased-table.sql` no Supabase

### Webhook não dispara
- ✅ Em local: use `stripe listen --forward-to localhost:3000/api/webhook`
- ✅ Copie o `whsec_...` que aparece e adicione ao `.env.local`
- ✅ Em produção: configure no Dashboard do Stripe (Developers > Webhooks)

### Email não tem QR codes
- ✅ Verifique os logs: pode haver erro na geração do QR
- ✅ Biblioteca `qrcode` instalada: `npm install qrcode @types/qrcode`

## 🎉 Pronto!

O sistema está configurado. Quando fizer uma compra de teste:
1. O pagamento será processado
2. Os bilhetes serão gerados
3. O email será enviado automaticamente
4. O comprador recebe QR codes únicos

## 📚 Documentação Completa

- `EMAIL_SETUP.md` - Guia detalhado de configuração
- `.env.example` - Todas as variáveis de ambiente necessárias
- `create-tickets-purchased-table.sql` - Schema da tabela de bilhetes

## 🆘 Precisa de Ajuda?

1. Verifique os logs do terminal
2. Consulte `EMAIL_SETUP.md` para troubleshooting detalhado
3. Verifique os logs do Resend: https://resend.com/logs
4. Verifique os logs do Stripe: https://dashboard.stripe.com/test/logs
