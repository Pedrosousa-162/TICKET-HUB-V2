# 🔧 CORREÇÃO RÁPIDA: Eventos com "music"

## 🚨 Problema Identificado

Os eventos estão salvos com categoria `"music"` (inglês) mas o filtro procura por `"Música"` (português).

**Por isso não aparecem quando clica no filtro!**

---

## ✅ SOLUÇÃO RÁPIDA (2 minutos)

### Passo 1: Abrir Supabase

1. Vai para: https://app.supabase.com
2. Seleciona o teu projeto TicketHub
3. Clica em **SQL Editor** (menu lateral esquerdo)

### Passo 2: Executar Query de Correção

Cola e executa esta query:

```sql
-- Corrigir TODOS os eventos com categorias em inglês
UPDATE events
SET category = CASE
    WHEN LOWER(category) IN ('music', 'música', 'musica') THEN 'Música'
    WHEN LOWER(category) IN ('sport', 'sports', 'desporto') THEN 'Desporto'
    WHEN LOWER(category) IN ('theater', 'theatre', 'teatro') THEN 'Teatro'
    WHEN LOWER(category) IN ('conference', 'conferência', 'conferencia') THEN 'Conferência & Negócios'
    WHEN LOWER(category) IN ('party', 'festa') THEN 'Festa'
    WHEN LOWER(category) IN ('festival') THEN 'Festival'
    WHEN LOWER(category) IN ('workshop') THEN 'Workshop'
    WHEN LOWER(category) IN ('university', 'universitário', 'universitario') THEN 'Universitário'
    ELSE category
END;

-- Verificar resultado
SELECT title, category FROM events ORDER BY created_at DESC;
```

### Passo 3: Recarregar Página

1. Volta para `http://localhost:3000/events`
2. Pressiona **Ctrl+Shift+R** (hard refresh)
3. Clica no filtro **Música**
4. ✅ Os teus 4 eventos devem aparecer agora!

---

## 🔍 Verificar se Funcionou

Abre a consola do navegador (F12) e procura por:

```
🔍 Evento: "Nome do Evento" | Categoria: "Música" | Match: true
```

Se aparecer **Match: true** → ✅ **FUNCIONOU!**

---

## 🛡️ Prevenir Problema no Futuro

Para garantir que isto não aconteça novamente, executa também:

```sql
-- Adicionar validação (só aceita categorias em português)
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_category_check;

ALTER TABLE events
ADD CONSTRAINT events_category_check
CHECK (category IN (
    'Música',
    'Comida & Lifestyle',
    'Cultura & Arte',
    'Conferência & Negócios',
    'Universitário',
    'Desporto',
    'Teatro',
    'Festa',
    'Festival',
    'Workshop',
    'Outro'
));
```

Agora o banco **rejeita** automaticamente categorias em inglês! 🎉

---

## 📊 Ver Estado Atual das Categorias

```sql
SELECT category, COUNT(*) as total
FROM events
GROUP BY category
ORDER BY total DESC;
```

**Resultado esperado:**
```
Música    | 4
Desporto  | 2
Teatro    | 1
...
```

---

## ❓ Se Ainda Não Funcionar

1. **Limpa cache do navegador:** Ctrl+Shift+Delete
2. **Verifica no SQL:**
   ```sql
   SELECT title, category FROM events WHERE title LIKE '%teu evento%';
   ```
3. **Verifica consola do navegador** (F12) e envia os logs

---

## 🎯 Resumo

- ❌ **Antes:** `category = "music"` → Filtro não encontra
- ✅ **Depois:** `category = "Música"` → Filtro funciona!

**Tempo de correção:** ~2 minutos ⚡

---

**Arquivo criado em:** 2024  
**Script completo:** `database/add_category_validation.sql`
