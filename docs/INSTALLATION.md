# 🚀 Guia de Instalação Rápida - TicketHub

## ⚡ Instalação em 5 Minutos

### 1️⃣ Instalar Dependências

```bash
npm install
```

### 2️⃣ Configurar Supabase

1. **Criar conta e projeto:**
   - Acesse https://supabase.com
   - Crie um novo projeto
   - Aguarde 2-3 minutos

2. **Executar o Schema SQL:**
   - No Supabase Dashboard → SQL Editor
   - Copie o conteúdo de `supabase-schema.sql`
   - Cole e execute (clique em RUN)
   - ✅ Confirme que todas as tabelas foram criadas

3. **Obter credenciais:**
   - Settings → API
   - Copie: **Project URL** e **anon public key**

### 3️⃣ Configurar Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env.local

# Edite .env.local com suas credenciais:
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 4️⃣ Iniciar o Projeto

```bash
npm run dev
```

**Acesse:** http://localhost:3000

---

## 🎯 Testando a Aplicação

### Criar Primeira Conta

1. Acesse: http://localhost:3000/register
2. Preencha os dados
3. Faça login

### Criar Primeiro Evento

1. Vá para o Dashboard
2. Clique em "Criar Novo Evento"
3. Preencha todos os campos
4. Faça upload de uma imagem
5. Clique em "Criar Evento"

### Testar Sistema de Colaboradores

1. **Como Organizador:**
   - No evento criado, copie o código de associação
   - Partilhe com um colaborador

2. **Como Colaborador:**
   - Crie outra conta (ou use navegador anônimo)
   - Vá para "Minhas Associações"
   - Use o código de associação
   - Copie seu link único

---

## 📋 Checklist Pós-Instalação

- [ ] Dependências instaladas
- [ ] Supabase configurado
- [ ] Schema SQL executado
- [ ] Variáveis de ambiente configuradas
- [ ] Servidor iniciado com sucesso
- [ ] Conta de teste criada
- [ ] Evento de teste criado
- [ ] Sistema de colaboradores testado

---

## 🐛 Problemas Comuns

### Erro: "Cannot find module"
```bash
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Supabase connection failed"
- Verifique `.env.local`
- Confirme credenciais no Supabase
- Certifique-se que o projeto está ativo

### Erro: "RLS policy violation"
- Execute o schema SQL completo
- Verifique se as políticas RLS foram criadas

### Imagens não aparecem
- Verifique se o bucket `event-images` existe
- Confirme políticas de storage no schema SQL

---

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar produção
npm start

# Lint
npm run lint
```

---

## 📚 Próximos Passos

1. **Personalizar Design:**
   - Edite cores em `tailwind.config.ts`
   - Modifique componentes em `src/components/`

2. **Adicionar Funcionalidades:**
   - Sistema de pagamentos (Stripe)
   - Envio de emails (Resend)
   - QR codes para bilhetes

3. **Deploy:**
   - Vercel (recomendado)
   - Netlify
   - Railway

---

## 🎫 Pronto para Usar!

Sua plataforma TicketHub está configurada e pronta para uso.

**Documentação completa:** README.md
**Schema do banco:** supabase-schema.sql
**Suporte:** Crie uma issue no repositório
