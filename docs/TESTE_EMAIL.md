# 🧪 TESTE RÁPIDO: Sistema de Email

## ✅ O QUE FOI IMPLEMENTADO

Email de confirmação de compra com design moderno e dark, matching com o site TicketHub.

---

## 🚀 TESTE AGORA (5 minutos)

### PASSO 1: Verificar Variáveis de Ambiente

Abra `.env.local` e verifique se tem:

```env
# Resend (OBRIGATÓRIO)
RESEND_API_KEY=re_sua_chave_aqui
EMAIL_FROM=TicketHub <onboarding@resend.dev>

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Se não tiver a RESEND_API_KEY:**
1. Acesse: https://resend.com
2. Crie conta grátis (100 emails/dia)
3. Vá em **API Keys** → Create API Key
4. Copie a chave e adicione ao `.env.local`

### PASSO 2: Reiniciar o Servidor

```bash
# Parar o servidor (Ctrl+C)
# Iniciar novamente para carregar as novas variáveis
npm run dev
```

### PASSO 3: Fazer uma Compra de Teste

1. Vá para: `http://localhost:3000/events`
2. Escolha um evento
3. Clique em **"Comprar Bilhetes"**
4. Preencha o checkout do Stripe
5. Use cartão de teste: `4242 4242 4242 4242`
   - Qualquer data futura
   - Qualquer CVV (ex: 123)
   - Qualquer nome

### PASSO 4: Verificar os Logs

No terminal, deve aparecer:

```
✅ Sale created successfully
✅ 3 tickets created successfully
✅ Email enviado com sucesso para: seuemail@example.com
📧 Resend ID: 550e8400-e29b-41d4-a716-446655440000
```

### PASSO 5: Verificar o Email

1. **Abra seu email** (o que você usou no checkout)
2. Procure por: **"🎉 Seus Bilhetes - [Nome do Evento]"**
3. **Verifique:**
   - ✅ Design dark moderno
   - ✅ Header com gradiente vermelho
   - ✅ Informações do evento corretas
   - ✅ QR codes aparecem
   - ✅ Códigos únicos de cada bilhete

---

## 📧 O QUE ESPERAR NO EMAIL

### Visual
- **Background:** Dark (#0f172a)
- **Header:** Gradiente vermelho/laranja com logo TicketHub
- **Cards:** Dark com bordas arredondadas
- **QR Codes:** Grandes, centralizados, com fundo branco
- **Botões:** Sem botões (email apenas informativo)

### Conteúdo
1. Saudação personalizada com nome
2. Card com detalhes do evento (data, hora, local)
3. Resumo da compra (tipo, quantidade, total)
4. Seção de bilhetes individuais:
   - Um card para cada bilhete
   - QR code único
   - Código alfanumérico
5. Instruções de uso
6. Seção de ajuda
7. Footer profissional

---

## 🔍 VERIFICAR NO RESEND DASHBOARD

1. Acesse: https://resend.com/emails
2. Login com sua conta
3. Veja a lista de emails enviados
4. Clique no email para ver:
   - Status: `delivered` ✅
   - Preview do HTML
   - Logs de entrega

---

## ❌ TROUBLESHOOTING

### Problema: Email não enviado

**Verificar logs no terminal:**

```
❌ Erro ao enviar email: { message: 'Invalid API key' }
```

**Solução:**
- Verifique `RESEND_API_KEY` no `.env.local`
- Certifique-se de que copiou a chave completa
- Reinicie o servidor

---

### Problema: Erro "Invalid from address"

```
❌ Erro ao enviar email: { message: 'Invalid from address' }
```

**Solução:**
Use o email de teste do Resend:
```env
EMAIL_FROM=TicketHub <onboarding@resend.dev>
```

---

### Problema: Nenhum log aparece

**Causas possíveis:**
- Webhook do Stripe não está configurado
- Servidor não está rodando
- Checkout não foi concluído

**Solução:**
1. Verifique se o servidor está rodando (`npm run dev`)
2. Complete o checkout até o final
3. Aguarde 10-30 segundos

---

### Problema: Email vai para spam

**Soluções:**
- Use `onboarding@resend.dev` para testes
- Verifique a pasta de spam
- Em produção, configure domínio próprio

---

## 📱 TE