# 🎫 TicketHub - Plataforma de Gestão de Eventos# 🎫 TicketHub - Plataforma de Gestão de Eventos e Bilhetes



Sistema completo de gestão de eventos e venda de bilhetes com integração Stripe e envio automático de QR codes por email.![TicketHub](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)

![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)

## ✨ Funcionalidades![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)

![Supabase](https://img.shields.io/badge/Supabase-Latest-green?style=for-the-badge&logo=supabase)

- 🎟️ **Gestão de Eventos** - Criar, editar e publicar eventos![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)

- 💳 **Pagamentos Seguros** - Integração completa com Stripe

- 📧 **Email Automático** - Envio de bilhetes com QR codes únicos## 📋 Visão Geral

- 👥 **Sistema de Colaboradores** - Links únicos e tracking de vendas

- 📊 **Dashboard Analytics** - Estatísticas em tempo realTicketHub é uma plataforma completa e moderna para gestão, venda e rastreamento de bilhetes de eventos. Com autenticação segura, sistema de colaboradores, links únicos, estatísticas em tempo real e design responsivo.

- 🔐 **Autenticação** - Sistema seguro com Supabase Auth

- 🎨 **Design Premium** - Interface moderna com animações 3D### ✨ Funcionalidades Principais



## 🚀 Tecnologias#### 🔐 Autenticação e Utilizadores

- Registo de conta com validação completa

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS- Login seguro com sessão persistente

- **Backend**: Supabase (PostgreSQL + Auth + RLS)- Gestão de perfil e avatar

- **Pagamentos**: Stripe Checkout- Proteção de rotas privadas

- **Email**: Resend + React Email

- **QR Codes**: qrcode library#### 🎪 Gestão de Eventos

- Criar eventos com todos os detalhes

## 📦 Instalação Rápida- Geração automática de código de associação único

- Dashboard do organizador com estatísticas

### 1. Instalar Dependências- Upload de imagens via Supabase Storage

\`\`\`bash- Edição e eliminação de eventos

npm install

\`\`\`#### 🎟️ Sistema de Bilhetes

- Criar tipos de bilhetes personalizados

### 2. Configurar Variáveis de Ambiente- Controlo automático de stock

- Vendas por organizador e colaboradores

Crie/edite o arquivo \`.env.local\`:- Página pública de compra

- Gestão completa de bilhetes

\`\`\`env

# Supabase#### 👥 Sistema de Colaboradores

NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui- Associação por código único

NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui- Diferentes roles (organizador, colaborador, team member, voluntário)

- Geração automática de links únicos

# Stripe- Dashboard de associações

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave- Tracking individual de performance

STRIPE_SECRET_KEY=sk_test_sua_chave

#### 📊 Estatísticas e Analytics

# Resend (Email)- Visualizações de link

RESEND_API_KEY=re_sua_chave- Taxa de conversão

\`\`\`- Vendas e receita por colaborador

- Ranking de performance

### 3. Configurar Banco de Dados- Métricas em tempo real



Execute os scripts SQL no Supabase (SQL Editor), na ordem:#### 🔒 Segurança (RLS)

- Row Level Security no Supabase

\`\`\`bash- Políticas de acesso granulares

1. database/supabase-schema.sql          # Schema principal- Proteção de dados sensíveis

2. database/add-sales-table.sql          # Sistema de pagamentos- Permissões por role

3. database/create-tickets-purchased-table.sql  # Bilhetes comprados

\`\`\`## 🚀 Instalação



### 4. Iniciar### Pré-requisitos

\`\`\`bash

npm run dev- Node.js 18+ instalado

\`\`\`- Conta no Supabase

- Git (opcional)

Acesse: **http://localhost:3000**

### Passo 1: Clonar ou Descarregar

## 📚 Documentação

```bash

- **[START_HERE.md](docs/START_HERE.md)** - Guia de início# Se estiver usando Git

- **[STRIPE_SETUP.md](docs/STRIPE_SETUP.md)** - Configurar pagamentosgit clone <repository-url>

- **[EMAIL_SETUP.md](docs/EMAIL_SETUP.md)** - Configurar emailscd tickethub

- **[PAYMENT_GUIDE.md](docs/PAYMENT_GUIDE.md)** - Sistema de pagamentos

- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** - Resolver problemas# Ou descarregue e extraia o ZIP

```

## 🎯 Como Usar

### Passo 2: Instalar Dependências

### Organizador:

1. Criar conta → Criar evento → Definir bilhetes```bash

2. Adicionar colaboradores com links únicosnpm install

3. Acompanhar vendas no dashboard```



### Comprador:### Passo 3: Configurar Supabase

1. Ver eventos → Selecionar bilhetes → Pagar com cartão

2. Receber email com QR codes1. **Criar Projeto no Supabase**

3. Apresentar QR code no evento   - Acesse https://supabase.com

   - Crie um novo projeto

## 💳 Testar Pagamentos   - Aguarde a configuração (2-3 minutos)



Cartões de teste (modo test do Stripe):2. **Executar o Schema SQL**

   - No Supabase Dashboard, vá para SQL Editor

\`\`\`   - Copie todo o conteúdo de `supabase-schema.sql`

✅ Sucesso: 4242 4242 4242 4242   - Cole e execute no SQL Editor

❌ Falha:   4000 0000 0000 0002   - Confirme que todas as tabelas foram criadas



Data: Qualquer futura | CVC: 123 | CEP: 123453. **Configurar Storage**

\`\`\`   - O schema já cria o bucket `event-images`

   - Confirme na seção Storage

## 🗂️ Estrutura

4. **Obter Credenciais**

\`\`\`   - No Dashboard, vá em Settings > API

tickethub/   - Copie:

├── src/     - Project URL

│   ├── app/              # Páginas Next.js     - anon/public key

│   │   ├── api/         # API Routes (checkout, webhook, email)

│   │   ├── events/      # Páginas de eventos### Passo 4: Configurar Variáveis de Ambiente

│   │   └── dashboard/   # Dashboard

│   ├── components/      # Componentes React```bash

│   ├── contexts/        # Auth Context# Copie o arquivo de exemplo

│   └── lib/            # Supabase & Stripecp .env.example .env.local

├── database/           # Scripts SQL

├── docs/              # Documentação# Edite .env.local e adicione suas credenciais:

└── .env.local        # Configuração (não commitado)NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co

\`\`\`NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon

```

## 🔐 Segurança

### Passo 5: Executar o Projeto

✅ Row Level Security (Supabase)  

✅ Chaves secretas server-side  ```bash

✅ Webhook signature validation  # Modo de desenvolvimento

✅ PCI Compliance (Stripe)  npm run dev

✅ JWT Authentication  

# O servidor irá iniciar em http://localhost:3000

## 🚀 Deploy (Vercel)```



\`\`\`bash## 📁 Estrutura do Projeto

npm i -g vercel

vercel```

\`\`\`tickethub/

├── src/

**Para produção:**│   ├── app/                    # Páginas Next.js 15 (App Router)

- Trocar chaves Stripe para live (\`pk_live_\`, \`sk_live_\`)│   │   ├── dashboard/          # Dashboard do utilizador

- Configurar webhook em produção│   │   ├── events/             # Gestão de eventos

- Adicionar variáveis de ambiente no Vercel│   │   │   ├── create/         # Criar evento

│   │   │   └── [slug]/         # Detalhes do evento

## 👨‍💻 Desenvolvedor│   │   ├── login/              # Página de login

│   │   ├── register/           # Página de registo

**Pedro Sousa**  │   │   ├── associations/       # Minhas associações

GitHub: [@Pedrosousa-162](https://github.com/Pedrosousa-162)│   │   ├── layout.tsx          # Layout principal

│   │   ├── page.tsx            # Homepage

## 📝 Licença│   │   └── globals.css         # Estilos globais

│   ├── components/             # Componentes React

Projeto educacional.│   │   └── ProtectedRoute.tsx  # Proteção de rotas

│   ├── contexts/               # Contextos React

---│   │   └── AuthContext.tsx     # Contexto de autenticação

│   └── lib/                    # Utilitários

**Feito com ❤️ para simplificar a gestão de eventos**│       ├── supabase.ts         # Cliente Supabase

│       └── database.types.ts   # Tipos TypeScript
├── supabase-schema.sql         # Schema do banco de dados
├── package.json                # Dependências
├── tsconfig.json               # Configuração TypeScript
├── tailwind.config.ts          # Configuração Tailwind
└── next.config.js              # Configuração Next.js
```

## 🎯 Como Usar

### Para Organizadores

1. **Criar Conta**
   - Registe-se em `/register`
   - Confirme o email (opcional se configurado)

2. **Criar Evento**
   - Acesse o Dashboard
   - Clique em "Criar Novo Evento"
   - Preencha todos os campos
   - Faça upload de uma imagem
   - Clique em "Criar Evento"

3. **Adicionar Bilhetes**
   - Entre no evento criado
   - Vá para a seção de bilhetes
   - Crie tipos de bilhetes com preços e stock

4. **Adicionar Colaboradores**
   - Partilhe o código de associação do evento
   - Colaboradores usam o código para se associar
   - Cada colaborador recebe um link único

5. **Acompanhar Vendas**
   - Veja estatísticas no dashboard do evento
   - Acompanhe performance de cada colaborador
   - Veja ranking de vendas

### Para Colaboradores

1. **Associar-se ao Evento**
   - Receba o código de associação
   - Entre na plataforma
   - Use o código para se associar

2. **Receber Link Único**
   - Link é gerado automaticamente
   - Copie e partilhe

3. **Vender Bilhetes**
   - Partilhe seu link único
   - Compradores usam seu link
   - Vendas são atribuídas a você

4. **Acompanhar Performance**
   - Veja suas estatísticas
   - Visualizações do link
   - Taxa de conversão
   - Receita gerada

### Para Compradores

1. **Descobrir Eventos**
   - Navegue pela página de eventos
   - Use filtros de pesquisa

2. **Comprar Bilhetes**
   - Acesse o evento ou link do colaborador
   - Escolha tipo de bilhete
   - Preencha dados
   - Confirme a compra

## 🗄️ Banco de Dados

### Tabelas Principais

- **users** - Perfis de utilizadores
- **events** - Eventos criados
- **tickets** - Tipos de bilhetes
- **event_users** - Associações (roles)
- **event_user_stats** - Estatísticas por colaborador
- **transactions** - Vendas de bilhetes

### Triggers Automáticos

- Geração de código de associação único
- Geração de slug para SEO
- Geração de link único por colaborador
- Atualização automática de stock
- Atualização automática de estatísticas

## 🎨 Tecnologias

### Frontend
- **Next.js 15** - Framework React com App Router
- **React 19** - Biblioteca UI
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilização
- **Heroicons** - Ícones
- **date-fns** - Manipulação de datas
- **react-hot-toast** - Notificações

### Backend
- **Supabase** - BaaS (Backend as a Service)
  - PostgreSQL Database
  - Authentication
  - Storage
  - Row Level Security (RLS)
  - Real-time subscriptions

## 🔐 Segurança

### Row Level Security (RLS)

Todas as tabelas têm políticas RLS configuradas:

- Users só veem seus próprios dados
- Eventos públicos para visualização
- Apenas organizadores podem editar seus eventos
- Colaboradores veem apenas suas associações
- Transações protegidas por seller_id

### Autenticação

- JWT tokens gerenciados pelo Supabase
- Sessões persistentes
- Auto-refresh de tokens
- Proteção de rotas no lado do cliente

## 📊 Funcionalidades Especiais

### Proteção de Emojis
```css
.emoji-fix {
  -webkit-text-fill-color: initial;
  background-clip: initial;
  -webkit-background-clip: initial;
}
```

### Slugs Automáticos
- SEO-friendly URLs
- Gerados automaticamente a partir do título
- Sem conflitos (numeração automática)

### Links Únicos
- 12 caracteres aleatórios
- Únicos e imutáveis
- Tracking completo de vendas

### Estatísticas em Tempo Real
- Cálculo automático via triggers
- Views, sales, revenue, conversion
- Atualização instantânea

## 🚢 Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Ou conecte seu repositório Git no dashboard da Vercel
```

### Outras Plataformas
- Netlify
- AWS Amplify
- Railway
- Render

## 🐛 Troubleshooting

### Erro: "Cannot find module"
```bash
# Reinstale as dependências
rm -rf node_modules package-lock.json
npm install
```

### Erro: "Supabase connection failed"
- Verifique as variáveis de ambiente em `.env.local`
- Confirme que o projeto Supabase está ativo
- Verifique se as credenciais estão corretas

### Erro: "RLS policy violation"
- Execute o schema SQL completo
- Verifique se as políticas RLS foram criadas
- Confira se o utilizador está autenticado

## 📝 Licença

Este projeto é de código aberto e está disponível sob a licença MIT.

## 🤝 Contribuir

Contribuições são bem-vindas! Sinta-se livre para:
- Reportar bugs
- Sugerir funcionalidades
- Criar pull requests
- Melhorar a documentação

## 📧 Suporte

Para questões e suporte:
- Crie uma issue no repositório
- Consulte a documentação do Supabase
- Consulte a documentação do Next.js

---

**Desenvolvido com ❤️ usando Next.js 15, React 19 e Supabase**

🎫 TicketHub - Gestão de Eventos Simplificada
