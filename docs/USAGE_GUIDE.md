# 🎯 Guia de Uso - TicketHub

## 📖 Índice

1. [Para Organizadores](#-para-organizadores)
2. [Para Colaboradores](#-para-colaboradores)
3. [Para Compradores](#-para-compradores)
4. [Casos de Uso Reais](#-casos-de-uso-reais)
5. [Dicas e Truques](#-dicas-e-truques)

---

## 🎪 Para Organizadores

### 1. Criar uma Conta

```
1. Acesse /register
2. Preencha:
   - Nome completo
   - Username (único)
   - Email
   - Password (mínimo 6 caracteres)
3. Confirme email (se configurado)
4. Faça login
```

### 2. Criar um Evento

```
Dashboard → Criar Novo Evento

Campos obrigatórios:
✓ Título do evento
✓ Descrição
✓ Data e hora
✓ Localização
✓ Categoria
✓ Preço base

Opcional:
○ Imagem (recomendado)
```

**Exemplo:**
```
Título: Festival de Música de Verão 2025
Descrição: O maior festival de música do ano com artistas internacionais
Data: 15/07/2025
Hora: 18:00
Localização: Parque das Nações, Lisboa
Categoria: Festival
Preço Base: €45.00
```

### 3. Criar Tipos de Bilhetes

```
Evento → Gestão de Bilhetes → Criar Bilhete

Tipos comuns:
- Early Bird (stock limitado, preço mais baixo)
- Normal
- VIP
- Backstage Pass
```

**Exemplo:**
```
Nome: Early Bird
Descrição: Primeiros 100 bilhetes com desconto
Preço: €35.00
Stock: 100

Nome: Normal
Descrição: Entrada geral
Preço: €45.00
Stock: 1000

Nome: VIP
Descrição: Acesso VIP + Meet & Greet
Preço: €120.00
Stock: 50
```

### 4. Adicionar Colaboradores

```
1. No evento, copie o código de associação
   Exemplo: ABC12345

2. Partilhe com colaboradores via:
   - WhatsApp
   - Email
   - Redes sociais

3. Colaboradores usam o código em:
   Dashboard → Minhas Associações → Associar-se
```

### 5. Acompanhar Vendas

```
Dashboard → Seu Evento

Métricas disponíveis:
📊 Total de bilhetes vendidos
💰 Receita total
👥 Número de colaboradores
📈 Ranking de vendas por colaborador

Por colaborador:
- Visualizações do link
- Vendas realizadas
- Receita gerada
- Taxa de conversão
```

---

## 👥 Para Colaboradores

### 1. Associar-se a um Evento

```
1. Receba o código do organizador
2. Acesse: Dashboard → Minhas Associações
3. Clique em "Associar-se a Evento"
4. Digite o código (ex: ABC12345)
5. Confirme

✅ Link único gerado automaticamente!
```

### 2. Obter e Partilhar Link Único

```
Minhas Associações → Seu Evento

Seu link será algo como:
https://tickethub.com/c/abc123def456

Botões disponíveis:
🔗 Copiar Link
📱 Partilhar (WhatsApp, Facebook, Instagram)
📊 Ver Estatísticas
```

### 3. Estratégias de Venda

**Onde partilhar:**
- ✅ Redes sociais (Instagram, Facebook, TikTok)
- ✅ WhatsApp Status
- ✅ Stories do Instagram
- ✅ Email para amigos
- ✅ Grupos do Facebook
- ✅ Bio do Instagram

**Dicas de copywriting:**
```
❌ Não: "Comprem bilhetes aqui"
✅ Sim: "🎉 Últimos dias! Festival imperdível! Use meu link para garantir entrada! 🎟️"

❌ Não: Link sem contexto
✅ Sim: "Estou a ajudar a organizar este evento incrível! Comprem pelo meu link e me ajudem ❤️"
```

### 4. Acompanhar Performance

```
Minhas Associações → Evento → Estatísticas

Métricas:
📈 Visualizações: Quantas pessoas clicaram
🎫 Vendas: Bilhetes vendidos por você
💰 Receita: Quanto você gerou
🎯 Conversão: % de visitantes que compraram

Objetivo: Aumentar a taxa de conversão!
```

---

## 🛒 Para Compradores

### 1. Descobrir Eventos

```
Homepage → Ver Eventos
ou
Acesse diretamente /events

Filtros disponíveis:
🔍 Pesquisa por palavra-chave
📁 Categoria
📍 Localização
📅 Data
```

### 2. Ver Detalhes do Evento

```
Clique no evento para ver:
- Descrição completa
- Data, hora e local
- Imagem do evento
- Tipos de bilhetes disponíveis
- Preços
- Stock disponível
```

### 3. Comprar Bilhetes

```
Método 1: Diretamente
Evento → Escolher Bilhete → Comprar

Método 2: Via Link de Colaborador
Link do colaborador → Escolher Bilhete → Comprar

Informações necessárias:
- Nome completo
- Email
- Quantidade
- Tipo de bilhete

✅ Confirmação por email
```

---

## 🎯 Casos de Uso Reais

### Caso 1: Festival de Música

**Organizador: João Silva**

```
1. Cria evento "Rock in Rio Lisboa 2025"
2. Define 4 tipos de bilhetes:
   - Early Bird: €80 (500 unidades)
   - Pista: €100 (5000 unidades)
   - Camarote: €200 (200 unidades)
   - VIP: €350 (50 unidades)

3. Adiciona 20 colaboradores (promoters)
4. Cada colaborador recebe link único
5. Acompanha vendas em tempo real
```

**Colaborador: Maria Costa**

```
1. Usa código ABC12345 para se associar
2. Recebe link: /c/maria123
3. Partilha no Instagram (5000 seguidores)
4. Resultados após 1 semana:
   - 250 visualizações
   - 15 vendas (bilhetes Pista)
   - €1,500 em receita
   - 6% taxa de conversão
```

### Caso 2: Conferência Empresarial

**Organizador: TechConf Portugal**

```
1. Evento: "Web Summit Lisbon 2025"
2. Tipos de bilhete:
   - Estudante: €150
   - Profissional: €350
   - Empresarial: €800
   - Startup Package: €1200

3. Colaboradores:
   - Universidades parceiras
   - Empresas de tecnologia
   - Influencers tech
```

**Resultado:**
- 50 colaboradores
- 3,000 bilhetes vendidos
- €850,000 em receita
- Tracking completo de cada fonte

### Caso 3: Evento Beneficente

**Organizador: ONG Solidária**

```
1. Evento: "Jantar de Gala Beneficente"
2. Objetivo: Arrecadar fundos
3. Bilhetes:
   - Individual: €100
   - Casal: €180
   - Mesa (10 pessoas): €900

4. Estratégia:
   - Voluntários como colaboradores
   - Links personalizados
   - Competição entre equipas
   - Prémio para melhor vendedor
```

---

## 💡 Dicas e Truques

### Para Organizadores

**1. Otimize as Imagens**
```
✅ Formato: JPG ou PNG
✅ Dimensão: 1920x1080px
✅ Peso: Máximo 2MB
✅ Qualidade: Alta resolução
```

**2. Preços Estratégicos**
```
Early Bird: -20% do preço normal
Normal: Preço padrão
Last Minute: +10% (criar urgência)
```

**3. Descrição Eficaz**
```
✓ O que é o evento
✓ Quem são os artistas/palestrantes
✓ O que está incluído
✓ Horários importantes
✓ Regras e condições
```

### Para Colaboradores

**1. Crie Senso de Urgência**
```
✅ "Últimos 50 bilhetes!"
✅ "Promoção termina em 24h!"
✅ "Early Bird acabando!"
```

**2. Use Emojis Estrategicamente**
```
🎉 🎊 🎈 - Festas
🎵 🎸 🎤 - Música
🏆 🥇 ⭐ - Prémios
🔥 💥 ⚡ - Urgência
```

**3. Teste Diferentes Abordagens**
```
Semana 1: Posts em horários de pico
Semana 2: Stories com countdown
Semana 3: Vídeos curtos
Semana 4: Depoimentos de quem já comprou
```

### Para Todos

**1. Segurança**
```
✓ Nunca partilhe sua password
✓ Use password forte
✓ Verifique URLs antes de clicar
✓ Mantenha email atualizado
```

**2. Suporte**
```
Problemas técnicos?
1. Verifique a documentação
2. Procure no FAQ
3. Contacte o organizador
4. Crie issue no GitHub
```

**3. Melhores Práticas**
```
✓ Responda dúvidas rapidamente
✓ Mantenha informações atualizadas
✓ Seja transparente sobre regras
✓ Acompanhe métricas regularmente
```

---

## 📱 Recursos Adicionais

### Códigos de Associação
- 8 caracteres alfanuméricos
- MAIÚSCULAS
- Únicos por evento
- Não expiram

### Links Únicos
- 12 caracteres aleatórios
- Formato: /c/{link}
- Tracking automático
- Permanentes

### Estatísticas
- Atualização em tempo real
- Histórico completo
- Exportação (futuro)
- Comparação entre períodos (futuro)

---

## 🚀 Próximos Passos

Depois de dominar o básico:

1. **Explore recursos avançados**
   - Cupões de desconto (futuro)
   - Email marketing integrado (futuro)
   - QR Codes para check-in (futuro)

2. **Otimize suas vendas**
   - Analise as métricas
   - Teste diferentes estratégias
   - Aprenda com outros colaboradores

3. **Expanda seu alcance**
   - Parcerias com influencers
   - Publicidade paga
   - Marketing de conteúdo

---

**💬 Tem dúvidas?** Consulte o README.md ou crie uma issue no repositório!

🎫 **TicketHub** - Simplifique a gestão dos seus eventos!
