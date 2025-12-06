# 🎯 Filtros de Categoria - Implementação Completa

## ✅ Status: IMPLEMENTADO E FUNCIONAL

Os filtros de categoria agora estão **100% funcionais** em todo o site. Quando um utilizador cria um evento e seleciona uma categoria, o evento fica associado a essa categoria e pode ser filtrado.

---

## 📋 Categorias Disponíveis

### Lista Completa:
1. **Música** (slug: `musica`)
2. **Comida & Lifestyle** (slug: `comida-lifestyle`)
3. **Cultura & Arte** (slug: `cultura-arte`)
4. **Conferência & Negócios** (slug: `conferencia-negocios`)
5. **Universitário** (slug: `universitario`)
6. **Desporto** (slug: `desporto`)
7. **Teatro** (slug: `teatro`)
8. **Festa** (slug: `festa`)
9. **Festival** (slug: `festival`)
10. **Workshop** (slug: `workshop`)
11. **Outro** (slug: `outro`)

---

## 🎨 Filtros na Homepage

### Localização: `src/app/page.tsx`

Os 5 cards principais de categoria são **clicáveis** e redirecionam para a página de eventos com o filtro aplicado:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   🎵 Música     │  │   ✨ Comida &   │  │   🏆 Cultura &  │
│                 │  │    Lifestyle    │  │      Arte       │
└─────────────────┘  └─────────────────┘  └─────────────────┘

┌─────────────────┐  ┌─────────────────┐
│   💼 Conferência│  │   🎓 Universitá-│
│    & Negócios   │  │       rio       │
└─────────────────┘  └─────────────────┘
```

### Como Funciona:

```jsx
{categories.map((category) => (
  <Link
    key={category.slug}
    href={`/events?category=${category.slug}`}  // ← Redireciona com filtro
    className="category-pill"
  >
    <category.icon className="h-8 w-8 text-white" />
    <span>{category.name}</span>
  </Link>
))}
```

### URLs Gerados:
- Música: `/events?category=musica`
- Comida & Lifestyle: `/events?category=comida-lifestyle`
- Cultura & Arte: `/events?category=cultura-arte`
- Conferência & Negócios: `/events?category=conferencia-negocios`
- Universitário: `/events?category=universitario`

---

## 🔍 Filtros na Página de Eventos

### Localização: `src/app/events/page.tsx`

A página de eventos **lê o parâmetro da URL** e aplica o filtro automaticamente.

### Mapeamento de Slugs:

```typescript
const categoryMap: { [key: string]: string } = {
  musica: "Música",
  "comida-lifestyle": "Comida & Lifestyle",
  "cultura-arte": "Cultura & Arte",
  "conferencia-negocios": "Conferência & Negócios",
  universitario: "Universitário",
  desporto: "Desporto",
  teatro: "Teatro",
  festa: "Festa",
  festival: "Festival",
  workshop: "Workshop",
  outro: "Outro",
};
```

### Lógica de Filtro:

```typescript
// 1. Ler categoria da URL
useEffect(() => {
  const categoryFromUrl = searchParams.get("category");
  if (categoryFromUrl && categoryMap[categoryFromUrl]) {
    setCategoryFilter(categoryMap[categoryFromUrl]);
  }
}, [searchParams]);

// 2. Filtrar eventos
function filterEvents() {
  let filtered = [...events];

  if (categoryFilter !== "Todas") {
    filtered = filtered.filter((event) => event.category === categoryFilter);
  }

  setFilteredEvents(filtered);
}
```

### Botões de Filtro:

Os botões de categoria na página de eventos também funcionam:

```
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Todas  │ │ Música │ │Desporto│ │ Teatro │
└────────┘ └────────┘ └────────┘ └────────┘
```

Ao clicar, o estado `categoryFilter` é atualizado e os eventos são filtrados em tempo real.

---

## 📝 Criar Evento com Categoria

### Localização: `src/app/events/create/page.tsx`

O formulário de criação de eventos tem um **dropdown de categorias**:

```jsx
<select
  id="category"
  name="category"
  value={formData.category}
  onChange={handleChange}
  required
  className="input-dark"
>
  {categories.map((cat) => (
    <option key={cat} value={cat}>
      {cat}
    </option>
  ))}
</select>
```

### Categorias no Formulário:

```javascript
const categories = [
  "Música",
  "Comida & Lifestyle",
  "Cultura & Arte",
  "Conferência & Negócios",
  "Universitário",
  "Desporto",
  "Teatro",
  "Festa",
  "Festival",
  "Workshop",
  "Outro",
];
```

### Salvamento no Banco:

Quando o evento é criado, a categoria é salva no campo `category` da tabela `events`:

```typescript
await supabase.from("events").insert({
  title: formData.title,
  description: formData.description,
  category: formData.category,  // ← Categoria selecionada
  // ... outros campos
});
```

---

## 🔄 Fluxo Completo

### 1. Utilizador na Homepage
```
Utilizador vê: [🎵 Música]
↓ clica
Redireciona para: /events?category=musica
```

### 2. Página de Eventos
```
URL: /events?category=musica
↓
Lê parâmetro: searchParams.get("category") → "musica"
↓
Mapeia: categoryMap["musica"] → "Música"
↓
Aplica filtro: setCategoryFilter("Música")
↓
Filtra eventos: events.filter(e => e.category === "Música")
↓
Mostra apenas eventos de Música
```

### 3. Criar Novo Evento
```
Organizador acede: /events/create
↓
Seleciona categoria: "Música"
↓
Submete formulário
↓
Evento salvo com: { category: "Música" }
↓
Evento aparece no filtro "Música"
```

---

## 💾 Estrutura de Dados

### Tabela `events`:
```sql
events
├── id (UUID)
├── title (TEXT)
├── description (TEXT)
├── category (TEXT) ← Campo que armazena a categoria
├── event_date (DATE)
├── event_time (TIME)
├── location (TEXT)
└── ...
```

### Valores Possíveis em `category`:
- "Música"
- "Comida & Lifestyle"
- "Cultura & Arte"
- "Conferência & Negócios"
- "Universitário"
- "Desporto"
- "Teatro"
- "Festa"
- "Festival"
- "Workshop"
- "Outro"

**⚠️ IMPORTANTE:** Os valores no banco são os **nomes completos** (ex: "Música"), não os slugs (ex: "musica").

---

## 🎯 Exemplos de Uso

### Exemplo 1: Evento de Música

**Criação:**
```javascript
// Formulário
category: "Música"

// Salvo no banco
{ 
  title: "Festival Rock 2024",
  category: "Música",
  ...
}
```

**Filtro:**
```
Homepage → Clica em [🎵 Música]
         ↓
/events?category=musica
         ↓
Mostra: "Festival Rock 2024" (e outros eventos de música)
```

### Exemplo 2: Evento Universitário

**Criação:**
```javascript
// Formulário
category: "Universitário"

// Salvo no banco
{ 
  title: "Praxe Académica",
  category: "Universitário",
  ...
}
```

**Filtro:**
```
Homepage → Clica em [🎓 Universitário]
         ↓
/events?category=universitario
         ↓
Mostra: "Praxe Académica" (e outros eventos universitários)
```

---

## 🧪 Como Testar

### 1. Testar Filtros na Homepage:
```
✅ Ir para homepage (/)
✅ Clicar em qualquer card de categoria
✅ Verificar redirecionamento para /events?category=SLUG
✅ Verificar que apenas eventos dessa categoria aparecem
```

### 2. Testar Criação de Evento:
```
✅ Ir para /events/create
✅ Preencher formulário
✅ Selecionar categoria no dropdown
✅ Criar evento
✅ Verificar que evento aparece no filtro correto
```

### 3. Testar Filtros na Página de Eventos:
```
✅ Ir para /events
✅ Clicar nos botões de categoria
✅ Verificar filtragem em tempo real
✅ Clicar em "Todas" para ver todos os eventos
```

### 4. Verificar no Supabase:
```sql
-- Ver categorias usadas
SELECT DISTINCT category, COUNT(*) as total
FROM events
GROUP BY category
ORDER BY total DESC;

-- Ver eventos de uma categoria específica
SELECT title, category, event_date
FROM events
WHERE category = 'Música'
ORDER BY event_date;
```

---

## 🔧 Troubleshooting

### Problema: Filtro não funciona

**Possíveis causas:**

1. **Slug incorreto na URL**
   - Verificar: `/events?category=musica` (com acento é `musica`, não `música`)
   - Solução: Usar slugs do `categoryMap`

2. **Categoria no banco diferente do mapeamento**
   - Verificar no SQL: `SELECT DISTINCT category FROM events;`
   - Solução: Garantir que os nomes correspondem exatamente

3. **Evento sem categoria**
   - Verificar: `SELECT * FROM events WHERE category IS NULL;`
   - Solução: Definir categoria default no formulário

### Problema: Eventos não aparecem em nenhum filtro

**Causa:** Campo `category` vazio ou NULL

**Solução:**
```sql
-- Verificar eventos sem categoria
SELECT id, title, category
FROM events
WHERE category IS NULL OR category = '';

-- Atualizar (se necessário)
UPDATE events
SET category = 'Outro'
WHERE category IS NULL OR category = '';
```

---

## 📊 Estatísticas Úteis

### Query: Eventos por categoria
```sql
SELECT 
    category,
    COUNT(*) as total_eventos,
    COUNT(DISTINCT organizer_id) as organizadores
FROM events
GROUP BY category
ORDER BY total_eventos DESC;
```

### Query: Categorias mais populares (por vendas)
```sql
SELECT 
    e.category,
    COUNT(tp.id) as bilhetes_vendidos,
    SUM(tp.price) as receita_total
FROM events e
LEFT JOIN tickets t ON t.event_id = e.id
LEFT JOIN tickets_purchased tp ON tp.ticket_id = t.id
WHERE tp.status = 'valid'
GROUP BY e.category
ORDER BY bilhetes_vendidos DESC;
```

---

## ✨ Melhorias Futuras (Opcional)

1. **Adicionar ícones personalizados** para cada categoria
2. **Criar página dedicada** por categoria (ex: `/events/musica`)
3. **Sugestões inteligentes** de categoria baseadas no título/descrição
4. **Subcategorias** (ex: Música → Rock, Jazz, Pop)
5. **Tags adicionais** (além de categorias)
6. **Filtros múltiplos** (selecionar várias categorias ao mesmo tempo)

---

## 📚 Arquivos Modificados

### Frontend:
- ✅ `src/app/page.tsx` (cards de categoria clicáveis)
- ✅ `src/app/events/page.tsx` (leitura de URL params, mapeamento, filtro)
- ✅ `src/app/events/create/page.tsx` (dropdown atualizado com categorias)

### CSS:
- ✅ `src/app/globals.css` (estilos `.category-pill`)

### Database:
- Campo `category` na tabela `events` (já existente)

---

## 🎉 Resumo

✅ **5 categorias principais** na homepage com cards visuais  
✅ **11 categorias totais** disponíveis para criar eventos  
✅ **Filtros funcionais** via URL params (`/events?category=slug`)  
✅ **Mapeamento slug → nome** para conversão correta  
✅ **Botões de filtro** na página de eventos  
✅ **Dropdown no formulário** com todas as categorias  
✅ **Salvamento correto** no banco de dados  
✅ **Filtragem em tempo real** na listagem  

**Status:** ✅ 100% Funcional e Testado

---

**Versão:** 1.0  
**Data:** 2024  
**Última atualização:** Sistema de Filtros de Categoria Completo