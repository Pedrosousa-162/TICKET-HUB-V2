# 🧪 TESTE AGORA - Verificar se Eventos Aparecem

## ✅ O QUE FOI CORRIGIDO

**FIX 1: Seção "Vamos sair?"**
- ✅ Corrigida para usar `featuredEvents` (primeiros 3 eventos)
- ✅ Agora mostra os eventos "Ronaldo" e "ISTEC Via Rápida"

**FIX 2: Seção "Esta semana"**
- ✅ Agora filtra eventos POR DATA (não por posição)
- ✅ Mostra APENAS eventos que acontecem entre domingo e sábado DESTA SEMANA
- ✅ Se "Ronaldo" e "ISTEC Via Rápida" forem desta semana → aparecem aqui também

**FIX 3: Logs de Debug**
- ✅ Logs detalhados para facilitar diagnóstico

---

## 🚀 TESTE RÁPIDO (3 passos)

### PASSO 1: Recarregar a Homepage

1. Abra: `http://localhost:3000`
2. Pressione **Ctrl+Shift+R** (hard refresh)

### PASSO 2: Abrir Console

1. Pressione **F12** (DevTools)
2. Clique na aba **Console**
3. Procure por estas linhas:

```
🔍 [HOMEPAGE] Total eventos no banco: X
🔍 [HOMEPAGE] Eventos ativos (após filtro): X
📍 [HOMEPAGE] featuredEvents (Vamos sair?): X [...]
📍 [HOMEPAGE] weekEvents (Esta semana - filtrado por data): X [...]
```

### PASSO 3: Verificar na Página

#### A) Seção "Vamos sair?"
✅ **DEVE APARECER:** Eventos "Ronaldo" e "ISTEC Via Rápida" (primeiros eventos)

#### B) Seção "Esta semana"
✅ **DEVE APARECER:** "Ronaldo" e "ISTEC Via Rápida" **SE** as datas forem desta semana
❌ **NÃO APARECE:** Se os eventos forem de outra semana (e está correto!)

**Como saber se é "esta semana"?**
- Semana vai de Domingo 00:00 até Sábado 23:59
- Se hoje é Terça, 21/Jan: eventos entre 19/Jan (dom) e 25/Jan (sáb) aparecem

---

## 🔍 O QUE ESPERAR NO CONSOLE

### ✅ SE ESTÁ FUNCIONANDO:

```javascript
```
🔍 [HOMEPAGE] Total eventos no banco: 2
🔍 [HOMEPAGE] Eventos carregados: [
  { title: "Ronaldo", date: "2025-01-22", ... },
  { title: "ISTEC Via Rápida", date: "2025-01-24", ... }
]
✅ [filterActiveEvents] Evento ATIVO mantido: {...}
✅ [filterActiveEvents] Evento ATIVO mantido: {...}
🔍 [HOMEPAGE] Eventos ativos (após filtro): 2
📍 [HOMEPAGE] featuredEvents (Vamos sair?): 2 ["Ronaldo", "ISTEC Via Rápida"]
📍 [HOMEPAGE] weekEvents (Esta semana - filtrado por data): 2 [
  { title: "Ronaldo", date: "2025-01-22", isThisWeek: true },
  { title: "ISTEC Via Rápida", date: "2025-01-24", isThisWeek: true }
]
```

**Interpretação:**
- ✅ 2 eventos no banco
- ✅ 2 eventos ativos (não expiraram)
- ✅ Aparecem em "Vamos sair?" (primeiros 3)
- ✅ Aparecem em "Esta semana" (datas são desta semana)

### ❌ SE OS EVENTOS ESTÃO EXPIRADOS:

```javascript
🔍 [HOMEPAGE] Total eventos no banco: 2
❌ [filterActiveEvents] Evento EXPIRADO removido: {
  title: "Ronaldo",
  status: "expired",
  ...
}
🔍 [HOMEPAGE] Eventos ativos (após filtro): 0
📍 [HOMEPAGE] featuredEvents (Vamos sair?): 0 []
```

**SOLUÇÃO:** Ver arquivo `QUICK_FIX.md` para atualizar datas dos eventos

---

## 📊 COMO OS EVENTOS SÃO DISTRIBUÍDOS

### Nova Lógica (CORRIGIDA!)

```
Todos os Eventos Ativos (ordenados por data):
┌────────────────────────────────────────────────┐
│ [1] [2] [3] [4] [5] [6] [7] [8] [9] [10] ...   │
└────────────────────────────────────────────────┘
   └────┬────┘                    │
        │                         │
   VAMOS SAIR?              ESTA SEMANA
  (3 primeiros)         (filtrados por data)
   Eventos 0-2            Se data entre
                          dom-sáb desta
                          semana
```

### Exemplos Práticos

**Cenário 1: Eventos esta semana (hoje = Terça, 21/Jan)**
```
Eventos:
1. Ronaldo - 22/Jan (Quarta) ✅ Esta semana
2. ISTEC - 24/Jan (Sexta) ✅ Esta semana
3. Outro - 30/Jan ❌ Não é esta semana

Resultado:
- Vamos sair? → [Ronaldo, ISTEC, Outro]
- Esta semana → [Ronaldo, ISTEC] ← Filtrado por data!
```

**Cenário 2: Nenhum evento esta semana**
```
Eventos:
1. Evento A - 10/Fev ❌
2. Evento B - 15/Fev ❌

Resultado:
- Vamos sair? → [Evento A, Evento B]
- Esta semana → [] (vazio - correto!)
```

---

## ❓ TROUBLESHOOTING

### Problema: Eventos não aparecem

**1. Verificar no console:**
- `Eventos ativos (após filtro): 0` → Eventos expiraram
  - **Solução:** Execute SQL em `QUICK_FIX.md` ou crie eventos novos

**2. Verificar via API:**
```
http://localhost:3000/api/debug/events
```
Procure por:
```json
{
  "stats": {
    "active": 2,    ← DEVE SER > 0
    "expired": 0
  }
}
```

### Problema: Console não mostra logs

**Recarregue com hard refresh:**
- Windows/Linux: **Ctrl+Shift+R**
- Mac: **Cmd+Shift+R**

### Problema: Erro no console

**Veja o erro e:**
1. Copie a mensagem completa
2. Verifique se é erro de data/hora
3. Se for erro de parsing, ver `SOLUCAO_HOMEPAGE_SEM_EVENTOS.md`

---

## ✅ CHECKLIST DE SUCESSO

Marque cada item após testar:

- [ ] Recarreguei a página (Ctrl+Shift+R)
- [ ] Abri o console (F12)
- [ ] Vejo logs `🔍 [HOMEPAGE]` no console
- [ ] Console mostra: `Eventos ativos (após filtro): 2` (ou mais)
- [ ] Console mostra: `featuredEvents (Vamos sair?): 2 [...]`
- [ ] Console mostra: `weekEvents (Esta semana - filtrado por data): X [...]`
- [ ] Seção "Vamos sair?" mostra "Ronaldo" e "ISTEC Via Rápida"
- [ ] Seção "Esta semana" mostra os eventos (se forem desta semana)
- [ ] Verifiquei as datas: eventos em "Esta semana" são realmente desta semana
- [ ] Posso clicar nos eventos e ver detalhes

**Se todos os itens estão ✅ → TUDO FUNCIONANDO! 🎉**

---

## 🆘 SE AINDA NÃO FUNCIONAR

1. **Tire print do console** (toda a saída)
2. **Verifique API debug:** `http://localhost:3000/api/debug/events`
3. **Execute SQL de verificação:** `database/debug/check_events_homepage.sql`
4. **Consulte:** `SOLUCAO_HOMEPAGE_SEM_EVENTOS.md` para guia completo

---

---

## 📅 Entendendo "Esta Semana"

A semana é calculada assim:
- **Início:** Domingo 00:00:00
- **Fim:** Sábado 23:59:59

**Exemplo (hoje é Terça, 21/Jan/2025):**
```
     ESTA SEMANA
┌─────────────────────┐
│ Dom Seg Ter Qua Qui Sex Sáb │
│ 19  20  21★ 22  23  24  25  │
└─────────────────────┘
★ = Hoje
```

Eventos que aparecem em "Esta semana":
- ✅ Qualquer dia entre 19/Jan e 25/Jan
- ❌ Dia 26/Jan (próxima semana)

---

**NOTA:** Se os eventos "Ronaldo" e "ISTEC Via Rápida" estiverem com datas passadas (expirados), você precisa atualizar as datas primeiro. Ver `QUICK_FIX.md`.