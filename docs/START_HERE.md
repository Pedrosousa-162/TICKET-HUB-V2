# 🚀 INSTRUÇÕES PARA EXECUÇÃO - TicketHub

## ⚡ INÍCIO RÁPIDO (3 Passos)

### 1️⃣ INSTALAR DEPENDÊNCIAS

Abra o PowerShell nesta pasta e execute:

```powershell
npm install
```

⏱️ Tempo estimado: 2-3 minutos

---

### 2️⃣ CONFIGURAR SUPABASE

#### A) Criar Projeto Supabase

1. Acesse: https://supabase.com
2. Crie uma conta (se não tiver)
3. Clique em "New Project"
4. Preencha:
   - Nome: tickethub (ou qualquer nome)
   - Database Password: (crie uma senha forte)
   - Region: Europe West (London) - mais próximo de Portugal
5. Clique em "Create new project"
6. ⏱️ Aguarde 2-3 minutos

#### B) Executar o Schema SQL

1. No Supabase Dashboard, clique em **SQL Editor** (menu lateral)
2. Clique em **"New query"**
3. Abra o arquivo `supabase-schema.sql` deste projeto
4. Copie TODO o conteúdo
5. Cole no SQL Editor do Supabase
6. Clique em **RUN** (ou pressione Ctrl+Enter)
7. ✅ Aguarde a confirmação: "Success. No rows returned"

#### C) Obter Credenciais

1. No Supabase Dashboard, clique em **Settings** (ícone de engrenagem)
2. Clique em **API**
3. Copie os valores:
   - **Project URL** (exemplo: https://xxxxxxxxxxx.supabase.co)
   - **anon public** key (debaixo de "Project API keys")

#### D) Configurar Variáveis de Ambiente

1. Abra o arquivo `.env.example` nesta pasta
2. Copie o conteúdo
3. Crie um novo arquivo chamado `.env.local`
4. Cole o conteúdo e substitua os valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA-CHAVE-ANON-AQUI
```

💾 **IMPORTANTE:** Salve o arquivo `.env.local`

---

### 3️⃣ EXECUTAR O PROJETO

No PowerShell, execute:

```powershell
npm run dev
```

🎉 **Pronto!** Acesse: http://localhost:3000

Para parar o servidor: Pressione **Ctrl+C**

---

## 🎯 TESTANDO A APLICAÇÃO

### 1. Criar Primeira Conta

1. Acesse: http://localhost:3000/register
2. Preencha:
   ```
   Nome Completo: João Silva
   Username: joaosilva
   Email: joao@exemplo.com
   Password: senha123
   Confirmar Password: senha123
   ```
3. Clique em "Criar Conta"
4. Faça login com o email e senha

### 2. Criar Primeiro Evento

1. No Dashboard, clique em "Criar Novo Evento"
2. Preencha:
   ```
   Título: Festival de Música de Verão
   Descrição: O maior festival do ano
   Data: 2025-07-15
   Hora: 18:00
   Localização: Lisboa, Portugal
   Categoria: Festival
   Preço Base: 45.00
   ```
3. (Opcional) Faça upload de uma imagem
4. Clique em "Criar Evento"

### 3. Criar Tipos de Bilhetes

1. No evento criado, vá para "Gestão de Bilhetes"
2. Crie bilhetes:
   ```
   Nome: Early Bird
   Descrição: Primeiros 100 bilhetes
   Preço: 35.00
   Stock: 100
   ```

### 4. Testar Sistema de Colaboradores

#### Como Organizador:
1. No evento, copie o **código de associação**
   (exemplo: ABC12345)

#### Como Colaborador:
1. Abra uma aba anônima (Ctrl+Shift+N no Chrome)
2. Crie outra conta:
   ```
   Nome: Maria Costa
   Username: mariacosta
   Email: maria@exemplo.com
   Password: senha123
   ```
3. Vá para "Minhas Associações"
4. Clique em "Associar-se a Evento"
5. Cole o código de associação
6. ✅ Link único gerado!

---

## 📦 ARQUIVOS DO PROJETO

### Principais Arquivos:

```
📄 README.md              → Documentação completa
📄 INSTALLATION.md        → Guia de instalação detalhado
📄 DATABASE.md            → Estrutura do banco de dados
📄 USAGE_GUIDE.md         → Como usar a plataforma
📄 PROJECT_SUMMARY.md     → Resumo do projeto
📄 supabase-schema.sql    → Schema do banco (IMPORTANTE!)
📄 .env.example           → Exemplo de variáveis de ambiente
📄 package.json           → Dependências do projeto
```

### Estrutura de Código:

```
src/
├── app/              → Páginas Next.js
├── components/       → Componentes React
├── contexts/         → Contexts (Auth)
└── lib/              → Utilitários (Supabase)
```

---

## 🔧 COMANDOS ÚTEIS

```powershell
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Criar build de produção
npm run build

# Executar build de produção
npm start

# Verificar erros de código
npm run lint

# Limpar cache e reinstalar
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

---

## ❓ PROBLEMAS COMUNS

### Erro: "Cannot find module"
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Erro: "Supabase connection failed"
- ✅ Verifique se o arquivo `.env.local` existe
- ✅ Confirme se as credenciais estão corretas
- ✅ Verifique se não há espaços extras
- ✅ Reinicie o servidor (Ctrl+C e depois `npm run dev`)

### Erro: "RLS policy violation"
- ✅ Confirme que executou TODO o `supabase-schema.sql`
- ✅ Verifique no Supabase: Database → Tables
- ✅ Deve ter 6 tabelas: users, events, tickets, event_users, event_user_stats, transactions

### Página em branco
- ✅ Abra o Console do navegador (F12)
- ✅ Verifique erros na aba Console
- ✅ Verifique erros na aba Network

### Imagens não aparecem
- ✅ Verifique no Supabase: Storage
- ✅ Deve ter um bucket chamado `event-images`
- ✅ O bucket deve ser público

---

## 📞 PRECISA DE AJUDA?

1. **Leia a documentação:**
   - README.md
   - INSTALLATION.md
   - DATABASE.md
   - USAGE_GUIDE.md

2. **Verifique o console:**
   - Erros no terminal
   - Erros no navegador (F12)

3. **Verifique o Supabase:**
   - Projeto ativo?
   - Schema executado?
   - Credenciais corretas?

---

## ✅ CHECKLIST

Antes de começar, confirme:

- [ ] Node.js instalado (versão 18+)
- [ ] npm funcionando
- [ ] Conta no Supabase criada
- [ ] Projeto Supabase criado
- [ ] Schema SQL executado
- [ ] Arquivo .env.local criado e configurado
- [ ] Dependências instaladas (`npm install`)
- [ ] Servidor iniciado (`npm run dev`)
- [ ] Acesso ao http://localhost:3000 funcionando

---

## 🎊 TUDO PRONTO!

Se chegou até aqui e tudo funcionou:

✅ Projeto instalado com sucesso  
✅ Banco de dados configurado  
✅ Aplicação rodando localmente  
✅ Pronto para criar eventos!  

**Próximos passos:**
1. Explore a aplicação
2. Crie eventos de teste
3. Teste o sistema de colaboradores
4. Personalize conforme necessário
5. Deploy para produção (Vercel)

---

## 🚀 DEPLOY (OPCIONAL)

### Opção 1: Vercel (Recomendado)

1. Crie conta em: https://vercel.com
2. Instale Vercel CLI:
   ```powershell
   npm i -g vercel
   ```
3. Deploy:
   ```powershell
   vercel
   ```
4. Adicione as variáveis de ambiente no dashboard da Vercel

### Opção 2: Netlify

1. Crie conta em: https://netlify.com
2. Conecte seu repositório Git
3. Configure build command: `npm run build`
4. Configure output directory: `.next`
5. Adicione variáveis de ambiente

---

## 📞 SUPORTE

- 📖 **Documentação:** Arquivos .md neste projeto
- 💻 **Código:** Comentários no código-fonte
- 🌐 **Supabase:** https://supabase.com/docs
- 🌐 **Next.js:** https://nextjs.org/docs

---

**🎫 Boa sorte com o TicketHub!**

*Qualquer dúvida, consulte a documentação ou crie uma issue.*

---

**Desenvolvido com ❤️**  
**Data:** 14 de Outubro de 2025  
**Versão:** 1.0.0
