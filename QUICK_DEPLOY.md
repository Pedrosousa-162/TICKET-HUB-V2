# ⚡ DEPLOY RÁPIDO - COMANDOS PRONTOS (NPX)

## 🎯 Opção Mais Rápida: Copie e Cole

Certifique-se de estar na pasta do projeto:
```powershell
cd C:\Users\Rs130\Desktop\tickethub
```

Depois execute estes comandos **UM POR VEZ**:

### 1. Login
```powershell
npx supabase login
```
*(Abrirá o navegador para você fazer login)*

### 2. Link do Projeto
```powershell
npx supabase link --project-ref vxjqpdgzzkfdcxflkbog
```

### 3. Configurar Segredos (COPIE TODO O BLOCO)
```powershell
npx supabase secrets set STRIPE_SECRET_KEY="your_stripe_secret_key" STRIPE_WEBHOOK_SECRET="your_webhook_secret" SUPABASE_URL="your_supabase_url" SUPABASE_SERVICE_ROLE_KEY="your_service_role_key" RESEND_API_KEY="your_resend_api_key" EMAIL_FROM="no-reply@yourdomain.com" --project-ref your_project_ref
```

### 4. Deploy
```powershell
npx supabase functions deploy stripe-webhook --project-ref vxjqpdgzzkfdcxflkbog
```

---

## 🚀 Ou Use o Script Automático

```powershell
cd supabase\functions
.\deploy-npx.ps1
```

---

## ✅ Após o Deploy

### URL da Função:
```
https://vxjqpdgzzkfdcxflkbog.functions.supabase.co/stripe-webhook
```

### Webhook já Configurado no Stripe ✅
- Endpoint: URL acima
- Evento: `checkout.session.completed`
- Secret: `whsec_WcMPMeiuQjpnzZao1cxj7iiEjJAolP7z`

---

## 🧪 Testar

```powershell
# 1. Iniciar projeto
npm run dev

# 2. Acessar evento no navegador
# http://localhost:3000/events/[algum-slug]

# 3. Comprar com cartão de teste
# Número: 4242 4242 4242 4242
# Data: 12/34
# CVC: 123

# 4. Verificar email com QR code
```

---

## 📊 Ver Logs

```powershell
# Logs em tempo real
npx supabase functions logs stripe-webhook --tail --project-ref vxjqpdgzzkfdcxflkbog

# Últimos logs
npx supabase functions logs stripe-webhook --project-ref vxjqpdgzzkfdcxflkbog
```

---

## 🔧 Comandos Úteis

```powershell
# Listar funções
npx supabase functions list --project-ref vxjqpdgzzkfdcxflkbog

# Ver segredos configurados
npx supabase secrets list --project-ref vxjqpdgzzkfdcxflkbog

# Status do projeto
npx supabase status

# Atualizar apenas um segredo
npx supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_novo_secret" --project-ref vxjqpdgzzkfdcxflkbog
```

---

## ⚠️ Troubleshooting

### "Function not found" após deploy
Aguarde 1-2 minutos - pode levar um tempo para propagar

### "Invalid signature" nos logs
Verifique se o webhook secret está correto no Stripe Dashboard

### Email não enviado
- Verifique se o email `no-reply@tickethub.com` está verificado no Resend
- Veja os logs da função para detalhes do erro

### Ticket não criado
- Verifique se a tabela `tickets` existe no Supabase
- Confirme as RLS policies
- Veja os logs para erros de inserção

---

## 📁 Arquivos de Referência

- **Documentação completa:** `INSTALL_SUPABASE_CLI.md`
- **Resumo:** `DEPLOY_READY.md`
- **Código da função:** `supabase/functions/stripe-webhook/index.ts`
- **Configurações:** `.env.local`

---

## 🎉 Está Tudo Pronto!

Execute os 4 comandos acima e sua Edge Function estará deployada e funcionando! 🚀
