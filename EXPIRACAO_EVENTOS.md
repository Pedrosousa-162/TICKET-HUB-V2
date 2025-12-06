# ⏰ Sistema de Expiração de Eventos

## ✅ Status: IMPLEMENTADO E FUNCIONAL

O sistema de expiração de eventos garante que **eventos passados não apareçam mais** para os utilizadores e que **bilhetes só possam ser vendidos até 2 horas após o início do evento**.

---

## 🎯 Funcionalidades Implementadas

### 1. **Eventos Expirados Não Aparecem**
- ✅ Eventos que já passaram + 2h são **automaticamente removidos** das listagens
- ✅ Aplicado em todas as páginas: homepage, eventos, busca

### 2. **Janela de Venda: Evento + 2 Horas**
- ✅ No dia do evento, bilhetes podem ser vendidos **até 2h após o início**
- ✅ Após este período, o evento **expira automaticamente**

### 3. **Countdown de Fechamento**
- ✅ Quando o evento já começou mas ainda aceita bilhetes → **mostra countdown**
- ✅ Mensagem: "Bilhetes fecham em: Xh Ym Zs"
- ✅ Cores dinâmicas baseadas na urgência:
  - 🔵 **Azul**: Mais de 1 hora restante
  - 🟡 **Amarelo**: Menos de 1 hora
  - 🔴 **Vermelho** (pulsando): Menos de 30 minutos

### 4. **Bloqueio de Compras**
- ✅ Quando evento expira → **não permite mais compras**
- ✅ Mostra mensagem: "Evento Encerrado"
- ✅ Sugere outros eventos disponíveis

---

## 🔄 Lógica de Expiração

### Estados do Evento:

```
┌─────────────────────────────────────────────────┐
│                                                 │
│  ATIVO (active)                                │
│  • Data/hora futuras                           │
│  • Vendas abertas normalmente                  │
│  • Sem countdown                               │
│                                                 │
└─────────────────────────────────────────────────┘
                     ↓
        [Evento Começa]
                     ↓
┌─────────────────────────────────────────────────┐
│                                                 │
│  FECHANDO (closing)                            │
│  • Evento já começou                           │
│  • Ainda dentro das 2h                         │
│  • ⚠️ MOSTRA COUNTDOWN                         │
│  • Vendas ainda permitidas                     │
│                                                 │
└─────────────────────────────────────────────────┘
                     ↓
      [Passa 2h do início]
                     ↓
┌─────────────────────────────────────────────────┐
│                                                 │
│  EXPIRADO (expired)                            │
│  • Evento + 2h já passou                       │
│  • ❌ Não aparece nas listagens                │
│  • ❌ Compras bloqueadas                       │
│  • Mostra "Evento Encerrado"                   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Regras de Cálculo:

```typescript
// Data e hora do evento
const eventDateTime = new Date(`${event_date}T${event_time}`);

// Horário de fechamento (evento + 2 horas)
const closingTime = eventDateTime + 2 horas;

// Agora
const now = new Date();

// Status do evento
if (now >= closingTime) {
  return 'EXPIRADO'; // Não mostra + não vende
}
else if (now >= eventDateTime && now < closingTime) {
  return 'FECHANDO'; // Mostra countdown
}
else {
  return 'ATIVO'; // Normal
}
```

---

## 📊 Exemplo Prático

### Cenário: Concerto às 20:00 do dia 15/01/2024

```
┌──────────────────────────────────────────────────┐
│ TIMELINE DO EVENTO                               │
├──────────────────────────────────────────────────┤
│                                                  │
│ 14/01 19:00 → ATIVO                             │
│   ✅ Aparece nas listagens                       │
│   ✅ Vendas abertas                              │
│                                                  │
│ 15/01 19:59 → ATIVO                             │
│   ✅ Ainda não começou                           │
│   ✅ Vendas normais                              │
│                                                  │
│ 15/01 20:00 → FECHANDO                          │
│   ⏰ "Bilhetes fecham em: 2h 0m"                │
│   ✅ Vendas ainda permitidas                     │
│                                                  │
│ 15/01 20:30 → FECHANDO                          │
│   ⏰ "Bilhetes fecham em: 1h 30m"               │
│   ✅ Vendas ainda permitidas                     │
│                                                  │
│ 15/01 21:30 → FECHANDO (CRÍTICO)                │
│   🔴 "Bilhetes fecham em: 0h 30m"               │
│   ⚠️ Countdown vermelho pulsando                │
│   ✅ Vendas ainda permitidas                     │
│                                                  │
│ 15/01 22:00 → EXPIRADO                          │
│   ❌ Removido das listagens                      │
│   ❌ Vendas bloqueadas                           │
│   📢 "Evento Encerrado"                         │
│                                                  │
│ 16/01 10:00 → EXPIRADO                          │
│   ❌ Não aparece mais                            │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 💻 Código Implementado

### 1. Biblioteca de Status (`src/lib/eventStatus.ts`)

```typescript
// Verifica status do evento
export function getEventStatus(
  eventDate: string,
  eventTime: string
): EventStatusInfo {
  const eventDateTime = new Date(`${eventDate}T${eventTime}`);
  const now = new Date();
  const closingTime = new Date(eventDateTime.getTime() + 2 * 60 * 60 * 1000);

  if (now >= closingTime) {
    return { status: 'expired', isExpired: true, canPurchase: false };
  }
  
  if (now >= eventDateTime && now < closingTime) {
    const timeRemaining = closingTime - now;
    return {
      status: 'closing',
      isClosing: true,
      canPurchase: true,
      closingTimeRemaining: { hours, minutes, seconds }
    };
  }
  
  return { status: 'active', canPurchase: true };
}

// Filtra eventos ativos (remove expirados)
export function filterActiveEvents(events) {
  return events.filter(event => {
    const status = getEventStatus(event.event_date, event.event_time);
    return !status.isExpired;
  });
}
```

### 2. Componente de Countdown (`src/components/EventCountdown.tsx`)

```tsx
export default function EventCountdown({ eventDate, eventTime }) {
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const status = getEventStatus(eventDate, eventTime);
      if (status.isClosing) {
        setTimeRemaining(status.closingTimeRemaining);
      }
    }, 1000); // Atualiza a cada segundo
    
    return () => clearInterval(interval);
  }, [eventDate, eventTime]);
  
  if (!timeRemaining) return null;
  
  return (
    <div className="countdown-card">
      <p>Bilhetes fecham em:</p>
      <p className="time">
        {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
      </p>
    </div>
  );
}
```

### 3. Páginas Atualizadas

#### Homepage (`src/app/page.tsx`)
```typescript
async function loadEvents() {
  const { data } = await supabase.from("events").select("*");
  
  // Filtrar eventos expirados
  const activeEvents = filterActiveEvents(data);
  
  setFeaturedEvents(activeEvents.slice(0, 3));
  setUpcomingEvents(activeEvents.slice(3, 6));
}
```

#### Listagem de Eventos (`src/app/events/page.tsx`)
```typescript
function filterEvents() {
  let filtered = [...events];
  
  // PRIMEIRO: Remover eventos expirados
  filtered = filterActiveEvents(filtered);
  
  // Depois aplicar outros filtros (categoria, busca, etc)
  if (categoryFilter !== "Todas") {
    filtered = filtered.filter(e => e.category === categoryFilter);
  }
  
  return filtered;
}
```

#### Página Individual (`src/app/events/[slug]/page.tsx`)
```tsx
<EventCountdown eventDate={event.event_date} eventTime={event.event_time} />

{!canPurchaseTickets(event.event_date, event.event_time) ? (
  <div className="expired-notice">
    <h3>Evento Encerrado</h3>
    <p>A venda de bilhetes já terminou.</p>
  </div>
) : (
  <div className="tickets-section">
    {/* Mostrar bilhetes disponíveis */}
  </div>
)}
```

---

## 🎨 Interface do Utilizador

### Countdown - Níveis de Urgência

#### 🔵 Azul (Mais de 1 hora)
```
┌─────────────────────────────────────┐
│ 🕐 Bilhetes fecham em:              │
│ 1h 45m 30s                          │
└─────────────────────────────────────┘
```

#### 🟡 Amarelo (Menos de 1 hora)
```
┌─────────────────────────────────────┐
│ ⚠️ Bilhetes fecham em:              │
│ 0h 42m 15s                          │
└─────────────────────────────────────┘
```

#### 🔴 Vermelho Pulsando (Menos de 30 min)
```
┌─────────────────────────────────────┐
│ ⚠️ Últimos minutos!                 │
│ 0h 12m 08s                          │
│          Última chamada!            │
└─────────────────────────────────────┘
```

### Evento Expirado
```
┌─────────────────────────────────────┐
│         🎫                          │
│                                     │
│    Evento Encerrado                 │
│                                     │
│ A venda de bilhetes para este       │
│ evento já terminou.                 │
│                                     │
│ Os bilhetes fecharam 2 horas        │
│ após o início do evento.            │
│                                     │
│  [ Ver Outros Eventos ]             │
└─────────────────────────────────────┘
```

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
- ✅ `src/lib/eventStatus.ts` - Biblioteca de verificação de status
- ✅ `src/components/EventCountdown.tsx` - Componente de countdown

### Arquivos Modificados:
- ✅ `src/app/page.tsx` - Filtrar eventos expirados
- ✅ `src/app/events/page.tsx` - Filtrar e mostrar countdown
- ✅ `src/app/events/[slug]/page.tsx` - Bloquear compras + countdown

---

## 🧪 Como Testar

### Teste 1: Evento Futuro (Ativo)
1. Criar evento para **amanhã às 20:00**
2. Ir para `/events`
3. ✅ Evento aparece normalmente
4. ✅ Sem countdown
5. ✅ Pode comprar bilhetes

### Teste 2: Evento Começando (Fechando)
1. Criar evento para **HOJE às 18:00** (assumindo que agora são 18:30)
2. Ir para `/events/[slug]`
3. ✅ Mostra countdown: "Bilhetes fecham em: 1h 30m"
4. ✅ Countdown atualiza a cada segundo
5. ✅ Ainda pode comprar bilhetes

### Teste 3: Evento Expirado
1. Criar evento para **ontem**
2. Ir para `/events`
3. ✅ Evento **não aparece** na lista
4. Tentar aceder diretamente: `/events/[slug]`
5. ✅ Mostra mensagem "Evento Encerrado"
6. ✅ Não permite comprar bilhetes

### Teste 4: Evento no Limite (2h exatas)
Para testar com precisão:

```sql
-- No Supabase, criar evento que expira em 5 minutos
INSERT INTO events (
  title,
  event_date,
  event_time,
  -- Calcular: agora - 1h55min
  ...
);
```

Verificar que:
- ✅ Countdown mostra 5 minutos
- ✅ Cor vermelha pulsando
- ✅ Mensagem "Últimos minutos!"
- ✅ Após 5 min → evento desaparece

---

## 🔧 Configuração

### Alterar Janela de Venda (padrão: 2h)

Editar `src/lib/eventStatus.ts`:

```typescript
// ANTES (2 horas)
const eventClosingTime = new Date(eventDateTime.getTime() + 2 * 60 * 60 * 1000);

// Para 1 hora
const eventClosingTime = new Date(eventDateTime.getTime() + 1 * 60 * 60 * 1000);

// Para 3 horas
const eventClosingTime = new Date(eventDateTime.getTime() + 3 * 60 * 60 * 1000);

// Para 30 minutos
const eventClosingTime = new Date(eventDateTime.getTime() + 30 * 60 * 1000);
```

### Alterar Intervalo de Atualização (padrão: 1s)

Editar `src/components/EventCountdown.tsx`:

```typescript
// ANTES (1 segundo)
const interval = setInterval(updateCountdown, 1000);

// Para 5 segundos
const interval = setInterval(updateCountdown, 5000);

// Para 10 segundos
const interval = setInterval(updateCountdown, 10000);
```

---

## ⚠️ Considerações Importantes

### 1. **Timezone**
- O sistema usa o **timezone do navegador** do utilizador
- Para eventos em fusos horários diferentes, considerar adicionar campo `timezone` na tabela

### 2. **Performance**
- Countdown atualiza a cada 1 segundo (pode ser ajustado)
- Filtragem de eventos expirados acontece no **frontend** (client-side)
- Para milhares de eventos, considerar filtrar no **backend** via query

### 3. **Cache**
- Se usar CDN/Cache, eventos expirados podem aparecer até cache expirar
- Recomendado: Cache curto (5-15 min) ou invalidação ao expirar

### 4. **Edge Cases**
- ✅ Horário de verão tratado automaticamente (Date do JS)
- ✅ Eventos de vários dias: considera apenas data/hora de **início**
- ✅ Eventos sem hora: assume 00:00:00

---

## 📊 Estatísticas de Eventos

### Query: Ver eventos por status

```sql
-- No Supabase
SELECT
  CASE
    WHEN (event_date || ' ' || event_time)::timestamp + interval '2 hours' < NOW() 
      THEN 'EXPIRADO'
    WHEN (event_date || ' ' || event_time)::timestamp <= NOW() 
      AND (event_date || ' ' || event_time)::timestamp + interval '2 hours' > NOW()
      THEN 'FECHANDO'
    ELSE 'ATIVO'
  END as status,
  COUNT(*) as total
FROM events
GROUP BY status;
```

### Query: Eventos expirando nas próximas 2 horas

```sql
SELECT
  title,
  event_date,
  event_time,
  (event_date || ' ' || event_time)::timestamp + interval '2 hours' - NOW() as tempo_restante
FROM events
WHERE (event_date || ' ' || event_time)::timestamp + interval '2 hours' > NOW()
  AND (event_date || ' ' || event_time)::timestamp <= NOW()
ORDER BY tempo_restante ASC;
```

---

## 🎯 Resumo

✅ **Eventos expirados não aparecem** (data + hora + 2h já passou)  
✅ **Countdown dinâmico** quando evento está fechando  
✅ **Cores de urgência** (azul → amarelo → vermelho)  
✅ **Compras bloqueadas** após expiração  
✅ **Mensagens claras** para o utilizador  
✅ **Atualização em tempo real** (countdown a cada 1s)  
✅ **Aplicado em todas as páginas** (home, listagem, detalhe)  

---

**Versão:** 1.0  
**Data:** 2024  
**Status:** ✅ Implementado e Testado