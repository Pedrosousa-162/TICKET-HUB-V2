# 🎨 Guia de Uso do Novo Design - Tickethub

## 📖 Índice
1. [Visão Geral](#visão-geral)
2. [Começando](#começando)
3. [Componentes Principais](#componentes-principais)
4. [Classes Utilitárias](#classes-utilitárias)
5. [Exemplos de Uso](#exemplos-de-uso)
6. [Paleta de Cores](#paleta-de-cores)
7. [Animações](#animações)
8. [Boas Práticas](#boas-práticas)

---

## 🎯 Visão Geral

O novo design do Tickethub utiliza um **tema dark moderno** com:
- Fundo escuro (#000000 - #1a1a1a)
- Acentos em vermelho/rosa (#dc2626)
- Destaques em dourado (#FFD700)
- Animações suaves e transições
- Componentes reutilizáveis e consistentes

---

## 🚀 Começando

### Instalação
```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build de produção
npm run build
npm start
```

### Estrutura de Pastas
```
src/
├── app/              # Páginas Next.js
│   ├── page.tsx      # Homepage
│   ├── events/       # Páginas de eventos
│   ├── login/        # Autenticação
│   ├── dashboard/    # Painel do organizador
│   └── ...
├── components/       # Componentes reutilizáveis
├── contexts/         # Context API (Auth)
└── lib/             # Utilidades (Supabase)
```

---

## 🧩 Componentes Principais

### 1. Navbar
**Uso:**
```tsx
<header className="navbar-dark fixed top-0 left-0 right-0 z-50">
  <nav className="container-custom py-4">
    <div className="flex justify-between items-center">
      {/* Logo */}
      <Link href="/" className="flex items-center space-x-3 group">
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl group-hover:shadow-glow transition-all duration-300">
          <TicketIcon className="h-7 w-7 text-white" />
        </div>
        <span className="text-2xl font-bold gradient-text">Tickethub</span>
      </Link>
      
      {/* Links de navegação */}
      {/* Menu de usuário */}
    </div>
  </nav>
</header>
```

### 2. Cards de Eventos
**Uso:**
```tsx
<div className="event-card group">
  {/* Imagem */}
  <div className="relative h-48 overflow-hidden">
    <img 
      src={event.image_url} 
      alt={event.title}
      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
    />
    <div className="image-overlay" />
    
    {/* Badge de data */}
    <div className="date-badge">
      <div className="text-2xl font-bold">{day}</div>
      <div className="text-xs uppercase">{month}</div>
    </div>
    
    {/* Badge de categoria */}
    <div className="event-category">{category}</div>
  </div>
  
  {/* Conteúdo */}
  <div className="p-6">
    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-400 transition-colors">
      {title}
    </h3>
    {/* Mais conteúdo... */}
  </div>
</div>
```

### 3. Botões
**Tipos disponíveis:**
```tsx
{/* Botão Principal */}
<button className="btn-primary">
  <PlusIcon className="h-5 w-5 mr-2" />
  Criar Evento
</button>

{/* Botão Secundário */}
<button className="btn-secondary">
  Cancelar
</button>

{/* Botão Outline */}
<button className="btn-outline">
  Ver Mais
</button>
```

### 4. Inputs
**Uso:**
```tsx
{/* Input Simples */}
<input 
  type="text"
  placeholder="Digite aqui..."
  className="input-dark w-full"
/>

{/* Input com Ícone */}
<div className="relative">
  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
    <EnvelopeIcon className="h-5 w-5 text-gray-500" />
  </div>
  <input 
    type="email"
    placeholder="teu@email.com"
    className="input-dark w-full pl-12"
  />
</div>
```

### 5. Barra de Pesquisa
**Uso:**
```tsx
<div className="search-bar">
  <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 mr-4" />
  <input
    type="text"
    placeholder="Procurar eventos..."
    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500"
  />
</div>
```

### 6. Cards de Estatísticas
**Uso:**
```tsx
<div className="stats-card group hover:scale-105 transition-all duration-300">
  <div className="flex items-center justify-between mb-4">
    <div className="bg-primary-600/20 p-3 rounded-xl group-hover:bg-primary-600/30 transition-colors">
      <CalendarIcon className="h-6 w-6 text-primary-400" />
    </div>
    <span className="text-xs text-gray-500 font-semibold uppercase">
      Eventos
    </span>
  </div>
  <div className="text-3xl font-bold text-white mb-1">
    {totalEvents}
  </div>
  <p className="text-gray-400 text-sm">Total de eventos</p>
</div>
```

### 7. Badges
**Uso:**
```tsx
{/* Badge de Sucesso */}
<span className="badge-success">Ativo</span>

{/* Badge de Aviso */}
<span className="badge-warning">Pendente</span>

{/* Badge Primário */}
<span className="badge-primary">Novo</span>
```

### 8. Modal
**Uso:**
```tsx
{showModal && (
  <div className="modal-backdrop fixed inset-0 flex items-center justify-center p-4 z-50">
    <div className="absolute inset-0" onClick={() => setShowModal(false)} />
    
    <div className="card-dark p-8 max-w-md w-full relative z-10 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Título do Modal</h2>
        <button onClick={() => setShowModal(false)}>
          <XMarkIcon className="h-6 w-6 text-gray-400 hover:text-white" />
        </button>
      </div>
      
      {/* Conteúdo do modal */}
    </div>
  </div>
)}
```

---

## 🎨 Classes Utilitárias

### Layout
- `container-custom` - Container centralizado responsivo
- `navbar-dark` - Navbar com tema dark
- `divider` - Linha divisória

### Cards
- `card-dark` - Card base com tema dark
- `card-dark-hover` - Card com animações de hover
- `event-card` - Card específico para eventos
- `stats-card` - Card de estatísticas

### Botões
- `btn-primary` - Botão principal (vermelho)
- `btn-secondary` - Botão secundário (glass effect)
- `btn-outline` - Botão com borda

### Inputs
- `input-dark` - Input com tema dark
- `search-bar` - Barra de pesquisa completa

### Badges
- `badge` - Badge base
- `badge-success` - Badge verde
- `badge-warning` - Badge amarelo
- `badge-primary` - Badge vermelho

### Efeitos Visuais
- `glass-dark` - Glass effect com tema dark
- `gradient-text` - Texto com gradiente
- `image-overlay` - Overlay escuro para imagens
- `glow-on-hover` - Efeito glow no hover
- `hover-lift` - Elevar elemento no hover

### Estados de Loading
- `skeleton` - Placeholder animado

---

## 📝 Exemplos de Uso

### Exemplo 1: Página de Lista de Eventos
```tsx
export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  return (
    <div className="min-h-screen bg-dark-950">
      <header className="navbar-dark">
        {/* Navbar */}
      </header>
      
      <main className="pt-24 pb-16">
        <div className="container-custom">
          <h1 className="text-4xl font-bold text-white mb-8">
            Eventos
          </h1>
          
          {loading ? (
            <div className="events-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-80 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="events-grid">
              {events.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
```

### Exemplo 2: Formulário de Login
```tsx
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="card-dark p-8 max-w-md w-full animate-slide-up">
        <h1 className="text-3xl font-bold text-white mb-6">
          Entrar
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-dark w-full"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Palavra-passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-dark w-full"
              required
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading ? 'A entrar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

---

## 🎨 Paleta de Cores

### Uso no Código
```tsx
// Texto
text-white           // Texto principal
text-gray-400        // Texto secundário
text-gray-500        // Texto terciário
text-primary-400     // Texto destaque

// Fundos
bg-dark-950          // Fundo principal
bg-dark-900          // Fundo secundário
bg-dark-800          // Fundo terciário
bg-primary-600       // Fundo destaque

// Bordas
border-white/10      // Borda sutil
border-white/20      // Borda média
border-primary-500   // Borda destaque

// Gradientes
from-primary-500 to-primary-700    // Gradiente vermelho
from-dark-800 to-dark-900          // Gradiente escuro
```

---

## ✨ Animações

### Animações Disponíveis
```tsx
// Fade in
<div className="animate-fade-in">...</div>

// Slide up
<div className="animate-slide-up">...</div>

// Slide from left
<div className="animate-slide-in-left">...</div>

// Slide from right
<div className="animate-slide-in-right">...</div>

// Pulse lento
<div className="animate-pulse-slow">...</div>
```

### Transições
```tsx
// Transição suave (300ms)
<div className="transition-smooth">...</div>

// Transição rápida (150ms)
<div className="transition-fast">...</div>

// Transição completa
<div className="transition-all duration-300">...</div>
```

---

## 💡 Boas Práticas

### 1. Consistência Visual
- Sempre use as classes utilitárias definidas
- Mantenha o espaçamento consistente (múltiplos de 4)
- Use a paleta de cores estabelecida

### 2. Responsividade
```tsx
// Mobile first
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* Conteúdo */}
</div>
```

### 3. Acessibilidade
- Use labels descritivos
- Adicione aria-labels quando necessário
- Mantenha contraste adequado
- Implemente estados de foco visíveis

### 4. Performance
- Use lazy loading para imagens
- Otimize animações (transform/opacity)
- Minimize re-renders desnecessários

### 5. Estados de Loading
```tsx
{loading ? (
  <div className="skeleton h-64 rounded-2xl" />
) : (
  <RealContent />
)}
```

### 6. Estados Vazios
```tsx
{items.length === 0 ? (
  <div className="card-dark p-12 text-center">
    <Icon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-white mb-2">
      Sem itens
    </h3>
    <p className="text-gray-400 mb-6">
      Descrição do estado vazio
    </p>
    <button className="btn-primary">
      Ação Principal
    </button>
  </div>
) : (
  <ItemsList />
)}
```

### 7. Feedback ao Usuário
```tsx
import { toast } from 'react-hot-toast';

// Sucesso
toast.success('Operação realizada com sucesso!');

// Erro
toast.error('Ocorreu um erro');

// Loading
toast.loading('A processar...', { id: 'loading' });
toast.success('Concluído!', { id: 'loading' });
```

---

## 🛠️ Troubleshooting

### Problema: Estilos não aplicados
**Solução:** Verifique se importou o globals.css no layout:
```tsx
import './globals.css'
```

### Problema: Animações não funcionam
**Solução:** Verifique a configuração do Tailwind (tailwind.config.ts)

### Problema: Cores personalizadas não aparecem
**Solução:** Execute `npm run dev` novamente após alterar o tailwind.config.ts

---

## 📚 Recursos Adicionais

- [Documentação Tailwind CSS](https://tailwindcss.com/docs)
- [Heroicons](https://heroicons.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)

---

## 🎉 Conclusão

O novo design do Tickethub oferece:
- ✅ Interface moderna e profissional
- ✅ Componentes reutilizáveis
- ✅ Animações suaves
- ✅ Totalmente responsivo
- ✅ Acessível e performático

Para mais informações, consulte o arquivo `REDESIGN_SUMMARY.md`.

---

**Desenvolvido com ❤️ para o Tickethub**