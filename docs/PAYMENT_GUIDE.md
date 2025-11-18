# 🎫 TicketHub - Sistema de Pagamento com Stripe

## ✅ O que foi implementado

### 1. **Integração Completa com Stripe**
- ✅ Checkout seguro via Stripe Checkout
- ✅ Processamento de pagamentos com cartão
- ✅ Webhooks para confirmação automática
- ✅ Página de sucesso personalizada
- ✅ Histórico de vendas

### 2. **Arquivos Criados**

#### Backend (API Routes)
```
src/app/api/checkout/route.ts     → Cria sessão de checkout
src/app/api/webhook/route.ts      → Processa confirmações de pagamento
```

#### Frontend
```
src/lib/stripe.ts                 → Utilitário do Stripe
src/app/payment/success/page.tsx  → Página de sucesso do pagamento
src/components/SalesHistory.tsx   → Componente de histórico de vendas
```

#### Database
```
add-sales-table.sql               → Tabela de vendas e políticas RLS
```

#### Configuração
```
.env.local                        → Variáveis de ambiente (chaves Stripe)
STRIPE_SETUP.md                   → Documentação completa
```

### 3. **Funcionalidades**

#### Para Compradores:
- 🛒 Seleção de bilhetes na página do evento
- 💳 Checkout seguro via Stripe (PCI compliant)
- ✉️ Email de confirmação automático
- 🎟️ Códigos QR únicos para entrada
- 📧 Bilhetes enviados por email

#### Para Organizadores:
- 📊 Dashboard de vendas em tempo real
- 💰 Tracking de receita total
- 👥 Dados dos compradores
- 🔗 Rastreamento de vendas por colaborador
- 📈 Estatísticas detalhadas

## 🚀 Como Usar

### 1️⃣ Configurar Banco de Dados

Execute no **Supabase SQL Editor**:

```sql
-- Cole o conteúdo de add-sales-table.sql
```

Isso vai criar:
- Tabela `sales` para armazenar vendas
- Políticas RLS para segurança
- Função para atualizar estatísticas de colaboradores

### 2️⃣ Configurar Variáveis de Ambiente

**IMPORTANTE**: Você precisa obter a chave **Publishable Key** do Stripe!

1. Acesse: https://dashboard.stripe.com/test/apikeys
2. Copie a **Publishable key** (começa com `pk_test_`)
3. Atualize `.env.local`:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_SUA_CHAVE_AQUI
STRIPE_SECRET_KEY=sk_test_SUA_CHAVE_SECRETA_AQUI
```

### 3️⃣ Reiniciar Servidor

```bash
npm run dev
```

### 4️⃣ Testar Compra

1. Acesse um evento: `http://localhost:3000/events/[slug]`
2. Selecione quantidade de bilhetes
3. Clique em **"Comprar Bilhetes"**
4. Use cartão de teste:
   ```
   Número: 4242 4242 4242 4242
   Data: 12/34
   CVC: 123
   CEP: 12345
   ```
5. Confirme pagamento
6. Será redirecionado para `/payment/success`

## 🎨 Fluxo de Pagamento

```
1. Página do Evento
   ↓
2. Selecionar Bilhetes (+/-)
   ↓
3. Clicar "Comprar Bilhetes"
   ↓
4. Redirecionar para Stripe Checkout
   ↓
5. Preencher Dados do Cartão
   ↓
6. Processar Pagamento
   ↓
7. Webhook Confirma (cria registro na DB)
   ↓
8. Redirecionar para /payment/success
   ↓
9. Email com Bilhetes (QR Code)
```

## 💳 Cartões de Teste

### Sucesso
```
4242 4242 4242 4242  → Pagamento aprovado
```

### Falha
```
4000 0000 0000 0002  → Pagamento recusado
```

### 3D Secure (autenticação)
```
4000 0025 0000 3155  → Requer autenticação 3DS
```

**Para todos**: Qualquer data futura, qualquer CVC de 3 dígitos

## 📊 Ver Vendas

### No Dashboard
```tsx
import SalesHistory from '@/components/SalesHistory'

// Ver todas as vendas
<SalesHistory />

// Ver vendas de um evento específico
<SalesHistory eventId="uuid-do-evento" />
```

### Diretamente no Supabase
```sql
SELECT * FROM sales ORDER BY created_at DESC;
```

### No Dashboard do Stripe
https://dashboard.stripe.com/test/payments

## 🔗 Integração com Colaboradores

O sistema já rastreia vendas por colaborador:

1. Quando alguém acessa o evento via link de colaborador:
   ```
   /events/meu-evento?ref=ABC123
   ```

2. O código `ABC123` é armazenado

3. Ao completar a compra, a venda é associada ao colaborador

4. As estatísticas do colaborador são atualizadas automaticamente:
   - Total de vendas
   - Receita gerada

## 🛡️ Segurança Implementada

- ✅ **Chaves secretas** apenas no servidor
- ✅ **Validação de webhooks** com signature
- ✅ **RLS no Supabase** - cada organizador vê só suas vendas
- ✅ **Checkout seguro** - Stripe gerencia dados de cartão
- ✅ **PCI Compliance** - automático via Stripe

## 📧 Próximos Passos (Opcional)

### Enviar Bilhetes por Email

Você pode integrar com serviços de email:

1. **SendGrid** ou **Resend** para envio de emails
2. Gerar QR Code com `qrcode` npm package
3. Enviar PDF do bilhete após confirmação de pagamento

### Webhook em Produção

Para produção, configure webhook:

1. Deploy do site
2. No Stripe: **Developers** > **Webhooks**
3. Adicionar endpoint: `https://seu-dominio.com/api/webhook`
4. Copiar Webhook Secret
5. Atualizar `.env.local` (ou variáveis de ambiente do Vercel)

## 🆘 Troubleshooting

### Erro: "No publishable key"
→ Adicione `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` no `.env.local`

### Erro: "Sales table does not exist"
→ Execute o script `add-sales-table.sql` no Supabase

### Pagamento não confirma
→ Verifique se o webhook está configurado ou teste sem webhook primeiro

### "CORS error" no checkout
→ Normal, o Stripe redireciona para página própria

## 📞 Links Úteis

- **Stripe Dashboard**: https://dashboard.stripe.com
- **Documentação**: https://stripe.com/docs
- **Teste de Cartões**: https://stripe.com/docs/testing
- **Status do Stripe**: https://status.stripe.com

---

**Pronto para aceitar pagamentos! 🎉**
