# 📊 Estrutura do Banco de Dados - TicketHub

## 📐 Diagrama Relacional

```
users (Supabase Auth + Profile)
  └── events (1:N)
       ├── tickets (1:N)
       ├── event_users (M:N)
       │    └── event_user_stats (1:1 por user/event)
       └── transactions (1:N)
```

---

## 🗄️ Tabelas

### 1. `users` (Perfis de Utilizadores)

Estende a tabela `auth.users` do Supabase.

| Coluna       | Tipo         | Descrição                          |
|--------------|--------------|-------------------------------------|
| id           | UUID (PK)    | Referência para auth.users(id)     |
| email        | TEXT         | Email único                         |
| username     | TEXT         | Username único                      |
| full_name    | TEXT         | Nome completo                       |
| avatar_url   | TEXT         | URL do avatar (opcional)            |
| created_at   | TIMESTAMPTZ  | Data de criação                     |
| updated_at   | TIMESTAMPTZ  | Data de atualização                 |

**Índices:** username, email

---

### 2. `events` (Eventos)

| Coluna            | Tipo         | Descrição                          |
|-------------------|--------------|-------------------------------------|
| id                | UUID (PK)    | ID único do evento                 |
| title             | TEXT         | Título do evento                   |
| slug              | TEXT         | URL-friendly (auto-gerado)         |
| description       | TEXT         | Descrição completa                 |
| event_date        | DATE         | Data do evento                     |
| event_time        | TIME         | Hora do evento                     |
| location          | TEXT         | Localização                        |
| category          | TEXT         | Categoria                          |
| base_price        | DECIMAL      | Preço base                         |
| image_url         | TEXT         | URL da imagem                      |
| organizer_id      | UUID (FK)    | Referência para users(id)          |
| association_code  | TEXT         | Código único de associação         |
| created_at        | TIMESTAMPTZ  | Data de criação                    |
| updated_at        | TIMESTAMPTZ  | Data de atualização                |

**Índices:** slug, organizer_id, category, event_date  
**Unique:** slug, association_code

**Triggers:**
- `set_slug()` - Gera slug automaticamente
- `set_association_code()` - Gera código único

---

### 3. `tickets` (Tipos de Bilhetes)

| Coluna       | Tipo         | Descrição                          |
|--------------|--------------|-------------------------------------|
| id           | UUID (PK)    | ID único do bilhete                |
| event_id     | UUID (FK)    | Referência para events(id)         |
| name         | TEXT         | Nome do tipo de bilhete            |
| description  | TEXT         | Descrição (opcional)               |
| price        | DECIMAL      | Preço                              |
| stock        | INTEGER      | Quantidade disponível              |
| sold         | INTEGER      | Quantidade vendida                 |
| created_at   | TIMESTAMPTZ  | Data de criação                    |
| updated_at   | TIMESTAMPTZ  | Data de atualização                |

**Índices:** event_id  
**Constraints:**
- `stock >= 0`
- `sold >= 0`
- `sold <= stock`

---

### 4. `event_users` (Associações)

Relaciona utilizadores com eventos e define seus roles.

| Coluna       | Tipo         | Descrição                          |
|--------------|--------------|-------------------------------------|
| id           | UUID (PK)    | ID único da associação             |
| event_id     | UUID (FK)    | Referência para events(id)         |
| user_id      | UUID (FK)    | Referência para users(id)          |
| role         | TEXT         | Role do utilizador no evento       |
| unique_link  | TEXT         | Link único do colaborador          |
| joined_at    | TIMESTAMPTZ  | Data de associação                 |

**Roles Válidos:**
- `organizer` - Organizador do evento
- `collaborator` - Colaborador
- `team_member` - Membro da equipa
- `volunteer` - Voluntário

**Índices:** event_id, user_id, unique_link  
**Unique:** (event_id, user_id), unique_link

**Triggers:**
- `set_unique_link()` - Gera link único para não-organizadores

---

### 5. `event_user_stats` (Estatísticas por Colaborador)

| Coluna          | Tipo         | Descrição                          |
|-----------------|--------------|-------------------------------------|
| id              | UUID (PK)    | ID único                           |
| event_id        | UUID (FK)    | Referência para events(id)         |
| user_id         | UUID (FK)    | Referência para users(id)          |
| views           | INTEGER      | Visualizações do link              |
| sales           | INTEGER      | Vendas realizadas                  |
| revenue         | DECIMAL      | Receita gerada                     |
| conversion_rate | DECIMAL      | Taxa de conversão (%)              |
| last_sale_at    | TIMESTAMPTZ  | Data da última venda               |
| created_at      | TIMESTAMPTZ  | Data de criação                    |
| updated_at      | TIMESTAMPTZ  | Data de atualização                |

**Índices:** event_id, user_id  
**Unique:** (event_id, user_id)

**Triggers:**
- `update_user_stats()` - Atualiza automaticamente após vendas

---

### 6. `transactions` (Vendas de Bilhetes)

| Coluna        | Tipo         | Descrição                          |
|---------------|--------------|-------------------------------------|
| id            | UUID (PK)    | ID único da transação              |
| event_id      | UUID (FK)    | Referência para events(id)         |
| ticket_id     | UUID (FK)    | Referência para tickets(id)        |
| buyer_email   | TEXT         | Email do comprador                 |
| buyer_name    | TEXT         | Nome do comprador                  |
| quantity      | INTEGER      | Quantidade comprada                |
| total_amount  | DECIMAL      | Valor total                        |
| seller_id     | UUID (FK)    | Referência para users(id)          |
| unique_link   | TEXT         | Link usado na compra (opcional)    |
| status        | TEXT         | Status da transação                |
| created_at    | TIMESTAMPTZ  | Data da compra                     |

**Status Válidos:**
- `completed` - Compra concluída
- `cancelled` - Compra cancelada

**Índices:** event_id, seller_id, ticket_id

**Triggers:**
- `update_ticket_stock()` - Atualiza stock automaticamente
- `update_user_stats()` - Atualiza estatísticas do vendedor

---

## 🔐 Row Level Security (RLS)

### Políticas Globais

Todas as tabelas têm RLS habilitado e políticas específicas:

#### `users`
- ✅ Todos podem visualizar perfis
- ✅ Users podem atualizar próprio perfil

#### `events`
- ✅ Todos podem visualizar eventos
- ✅ Autenticados podem criar eventos
- ✅ Organizadores podem editar/deletar seus eventos

#### `tickets`
- ✅ Todos podem visualizar bilhetes
- ✅ Organizadores podem gerenciar bilhetes dos seus eventos

#### `event_users`
- ✅ Users veem suas associações + organizadores veem do seu evento
- ✅ Users podem se associar
- ✅ Organizadores podem gerenciar associações

#### `event_user_stats`
- ✅ Users veem suas stats + organizadores veem do seu evento
- ✅ Sistema pode atualizar automaticamente

#### `transactions`
- ✅ Qualquer um pode criar transação (compra pública)
- ✅ Vendedores e organizadores veem suas transações

---

## 🎯 Triggers e Funções

### 1. `generate_association_code()`
Gera código único de 8 caracteres para associação ao evento.

### 2. `generate_unique_link()`
Gera link único de 12 caracteres para colaboradores.

### 3. `generate_slug(title)`
Gera slug SEO-friendly a partir do título, evitando duplicatas.

### 4. `set_association_code()`
Trigger que gera código automaticamente na criação do evento.

### 5. `set_slug()`
Trigger que gera slug automaticamente na criação do evento.

### 6. `set_unique_link()`
Trigger que gera link único para colaboradores (não organizadores).

### 7. `update_ticket_stock()`
Trigger que atualiza o campo `sold` em `tickets` após transação.

### 8. `update_user_stats()`
Trigger que atualiza estatísticas em `event_user_stats` após venda.

### 9. `create_user_profile()`
Trigger que cria perfil em `users` automaticamente quando user é criado em `auth.users`.

---

## 📦 Storage

### Bucket: `event-images`

**Políticas:**
- ✅ Leitura pública
- ✅ Upload por usuários autenticados
- ✅ Update/Delete apenas pelo owner (user_id na path)

**Estrutura de pastas:**
```
event-images/
  └── {user_id}/
       ├── {timestamp1}.jpg
       ├── {timestamp2}.png
       └── ...
```

---

## 🔄 Fluxos de Dados

### Criação de Evento
1. User cria evento → `events`
2. Trigger gera `slug` e `association_code`
3. Automaticamente cria entrada em `event_users` (role: organizer)

### Associação de Colaborador
1. User usa código de associação
2. Sistema valida código e cria entrada em `event_users`
3. Trigger gera `unique_link` automaticamente
4. Sistema cria entrada em `event_user_stats` (valores zerados)

### Venda de Bilhete
1. Compra é registrada em `transactions`
2. Trigger `update_ticket_stock()` incrementa `sold` em `tickets`
3. Trigger `update_user_stats()` atualiza stats do vendedor
4. Calcula automaticamente a taxa de conversão

---

## 📈 Queries Comuns

### Eventos de um User
```sql
SELECT * FROM events WHERE organizer_id = 'user-id';
```

### Associações de um User
```sql
SELECT eu.*, e.title, e.slug, eus.views, eus.sales
FROM event_users eu
JOIN events e ON eu.event_id = e.id
LEFT JOIN event_user_stats eus ON eus.event_id = eu.event_id AND eus.user_id = eu.user_id
WHERE eu.user_id = 'user-id';
```

### Estatísticas de Vendas por Evento
```sql
SELECT 
  u.full_name,
  eus.views,
  eus.sales,
  eus.revenue,
  eus.conversion_rate
FROM event_user_stats eus
JOIN users u ON eus.user_id = u.id
WHERE eus.event_id = 'event-id'
ORDER BY eus.revenue DESC;
```

### Bilhetes Disponíveis
```sql
SELECT * FROM tickets 
WHERE event_id = 'event-id' 
AND (stock - sold) > 0;
```

---

Este schema foi projetado para ser escalável, seguro e eficiente, com automação máxima através de triggers e políticas RLS granulares.
