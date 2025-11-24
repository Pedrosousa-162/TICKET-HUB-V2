# 🔍 TROUBLESHOOTING - Webhook Falhando

## ❌ Problemas Identificados:

### 1. Webhook do Stripe retornando erro (2 malsucedidos)
### 2. API get-tickets com "Invalid API key"

---

## ✅ SOLUÇÕES

### Solução 1: Reiniciar o Servidor Next.js

O servidor Next.js precisa ser reiniciado para ler as variáveis `.env.local` atualizadas:

```powershell
# Pare o servidor (Ctrl+C no terminal)
# Depois inicie novamente:
npm run dev
```

### Solução 2: Verificar Logs do Webhook no Stripe

1. Acesse: https://dashboard.stripe.com/test/webhooks
2. Clique no seu webhook endpoint
3. Vá na aba "Eventos" ou "Event logs"
4. Clique nos eventos falhados (vermelhos)
5. Veja a resposta HTTP e erro detalhado

**Possíveis erros comuns:**

#### a) "Invalid signature" (401)
**Causa:** O webhook secret está errado ou a função não está validando corretamente

**Solução:**
- Verifique se o secret no Stripe é: `whsec_WcMPMeiuQjpnzZao1cxj7iiEjJAolP7z`
- Confirme que o secret foi configurado no Supabase:
  ```powershell
  npx supabase secrets list --project-ref vxjqpdgzzkfdcxflkbog
  ```

#### b) "Function crashed" (500/502)
**Causa:** Erro na execução da Edge Function

**Solução: Ver logs no Dashboard:**
1. https://supabase.com/dashboard/project/vxjqpdgzzkfdcxflkbog/functions
2. Clique em "stripe-webhook"
3. Vá na aba "Logs"
4. Veja os erros detalhados

#### c) "Timeout" (504)
**Causa:** Função demorou mais de 30s

**Solução:** Otimizar a função (já está otimizada)

---

## 🧪 TESTE PASSO A PASSO

### 1. Parar e Reiniciar o Servidor

```powershell
# No terminal do npm run dev, pressione Ctrl+C
# Depois:
npm run dev
```

### 2. Testar Manualmente o Webhook

Use o Stripe CLI para enviar um evento de teste diretamente:

```powershell
# Instalar Stripe CLI (se não tiver)
scoop install stripe

# Login
stripe login

# Enviar evento de teste para a função
stripe trigger checkout.session.completed --webhook-url https://vxjqpdgzzkfdcxflkbog.functions.supabase.co/stripe-webhook
```

### 3. Fazer Uma Compra Real de Teste

```powershell
# 1. Servidor rodando
npm run dev

# 2. Acesse no navegador
http://localhost:3000/events/[algum-slug]

# 3. Compre com:
# Cartão: 4242 4242 4242 4242
# Data: 12/34
# CVC: 123
```

### 4. Verificar Logs em Tempo Real

Abra outro terminal PowerShell e execute:

```powershell
# Ver o que está acontecendo no Supabase
# Acesse o dashboard e veja os logs:
# https://supabase.com/dashboard/project/vxjqpdgzzkfdcxflkbog/functions/stripe-webhook/logs
```

---

## 🔍 DIAGNÓSTICO RÁPIDO

Execute estes comandos para verificar a configuração:

```powershell
# 1. Ver se os segredos estão configurados
npx supabase secrets list --project-ref vxjqpdgzzkfdcxflkbog

# 2. Ver as funções deployadas
npx supabase functions list --project-ref vxjqpdgzzkfdcxflkbog

# 3. Testar a função manualmente
curl -X POST https://vxjqpdgzzkfdcxflkbog.functions.supabase.co/stripe-webhook -H "Content-Type: application/json" -d "{\"test\":true}"
```

---

## 📊 CHECKLIST DE VERIFICAÇÃO

- [ ] Servidor Next.js reiniciado após configurar `.env.local`
- [ ] Webhook configurado no Stripe com URL correta
- [ ] Webhook secret corresponde ao configurado
- [ ] Segredos configurados no Supabase Edge Function
- [ ] Edge Function deployada com sucesso
- [ ] Logs do Stripe mostram qual erro está acontecendo
- [ ] Logs do Supabase mostram se a função está sendo executada

---

## 🎯 PRÓXIMA AÇÃO RECOMENDADA

1. **PARE** o servidor Next.js (Ctrl+C)
2. **INICIE** novamente: `npm run dev`
3. **ACESSE** o Stripe Dashboard e veja os logs do webhook: https://dashboard.stripe.com/test/webhooks
4. **CLIQUE** no webhook que falhou e veja o erro detalhado
5. **COPIE** o erro e me mostre para eu ajudar a corrigir

---

## 📞 Links Úteis

- Webhook no Stripe: https://dashboard.stripe.com/test/webhooks
- Logs no Supabase: https://supabase.com/dashboard/project/vxjqpdgzzkfdcxflkbog/functions
- Edge Function URL: https://vxjqpdgzzkfdcxflkbog.functions.supabase.co/stripe-webhook
