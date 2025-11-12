'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { 
  CalendarIcon, 
  MapPinIcon, 
  UserIcon,
  TicketIcon,
  ShareIcon,
  HeartIcon,
  ClockIcon,
  SparklesIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import toast from 'react-hot-toast'

interface Event {
  id: string
  title: string
  slug: string
  description: string
  event_date: string
  event_time: string
  location: string
  category: string
  base_price: number
  image_url: string | null
  association_code: string
  organizer: {
    full_name: string
    username: string
  }
}

interface Ticket {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  sold: number
}

interface ReferralInfo {
  collaborator_name: string
  unique_code: string
}

export default function EventPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({})
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null)

  useEffect(() => {
    loadEvent()
    loadReferralInfo()
  }, [params.slug, searchParams])

  async function loadEvent() {
    try {
      setLoading(true)

      const slug = params.slug as string

      // Buscar evento pelo slug
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          organizer:users!events_organizer_id_fkey(full_name, username)
        `)
        .eq('slug', slug)
        .single()

      if (eventError) throw eventError

      if (!eventData) {
        throw new Error('Evento não encontrado')
      }

      const event = eventData as any
      setEvent(event)

      // Buscar tickets do evento
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', event.id)
        .order('price', { ascending: true })

      if (ticketsError) throw ticketsError

      setTickets(ticketsData || [])
    } catch (error: any) {
      console.error('Error loading event:', error)
      toast.error('Erro ao carregar evento')
      router.push('/events')
    } finally {
      setLoading(false)
    }
  }

  async function loadReferralInfo() {
    const refCode = searchParams.get('ref')
    if (!refCode) return

    try {
      // Primeiro, buscar o link do colaborador
      const { data: linkData, error: linkError } = await supabase
        .from('collaborator_links')
        .select('unique_code, collaborator_id')
        .eq('unique_code', refCode)
        .single()

      console.log('Link data:', linkData)
      console.log('Link error:', linkError)

      if (linkError || !linkData) {
        console.error('Error loading link:', linkError)
        return
      }

      const link = linkData as { unique_code: string; collaborator_id: string }

      // Depois, buscar o nome do colaborador
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', link.collaborator_id)
        .single()

      console.log('User data:', userData)
      console.log('User error:', userError)

      if (userError || !userData) {
        console.error('Error loading user:', userError)
        // Mesmo assim mostra o banner, mas sem o nome
        setReferralInfo({
          collaborator_name: 'Um colaborador',
          unique_code: link.unique_code
        })
        return
      }

      const user = userData as { full_name: string }

      setReferralInfo({
        collaborator_name: user.full_name || 'Um colaborador',
        unique_code: link.unique_code
      })
    } catch (error) {
      console.error('Error loading referral info:', error)
    }
  }

  function handleTicketQuantityChange(ticketId: string, quantity: number) {
    setSelectedTickets(prev => {
      if (quantity <= 0) {
        const newState = { ...prev }
        delete newState[ticketId]
        return newState
      }
      return { ...prev, [ticketId]: quantity }
    })
  }

  function calculateTotal() {
    return Object.entries(selectedTickets).reduce((total, [ticketId, quantity]) => {
      const ticket = tickets.find(t => t.id === ticketId)
      return total + (ticket ? ticket.price * quantity : 0)
    }, 0)
  }

  async function handlePurchase() {
    if (!user) {
      toast.error('Faça login para comprar bilhetes')
      router.push('/login')
      return
    }

    const selectedCount = Object.keys(selectedTickets).length
    if (selectedCount === 0) {
      toast.error('Selecione pelo menos um bilhete')
      return
    }

    try {
      toast.loading('Processando pagamento...', { id: 'checkout' })

      // Pegar o ID do colaborador do referral (se houver)
      const refParam = searchParams.get('ref')
      let collaboratorId = null
      
      if (refParam && referralInfo) {
        // Buscar o collaborator_id do link de referência
        const { data: linkData } = await supabase
          .from('collaborator_links')
          .select('id')
          .eq('unique_code', refParam)
          .single()
        
        if (linkData) {
          const link = linkData as { id: string }
          collaboratorId = link.id
        }
      }

      // Para cada tipo de bilhete selecionado, criar uma sessão de checkout
      const firstTicketEntry = Object.entries(selectedTickets)[0]
      const [ticketId, quantity] = firstTicketEntry
      const ticket = tickets.find(t => t.id === ticketId)!

      // Criar sessão de checkout do Stripe
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event!.id,
          eventTitle: event!.title,
          ticketType: ticket.name,
          quantity,
          price: ticket.price,
          userId: user.id,
          collaboratorId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar sessão de pagamento')
      }

      toast.success('Redirecionando para pagamento...', { id: 'checkout' })

      // Redirecionar para o Stripe Checkout
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error: any) {
      console.error('Error purchasing tickets:', error)
      toast.error(error.message || 'Erro ao processar compra', { id: 'checkout' })
    }
  }

  function handleShare() {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    toast.success('Link copiado para a área de transferência!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Evento não encontrado</h1>
          <button
            onClick={() => router.push('/events')}
            className="mt-4 text-primary-600 hover:text-primary-700 transition-colors"
          >
            Voltar para eventos
          </button>
        </div>
      </div>
    )
  }

  const eventDate = new Date(event.event_date + 'T00:00:00')
  const availableTickets = tickets.filter(t => t.stock - t.sold > 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Header - glass effect to match site */}
      <header className="glass-effect sticky top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition-colors font-medium"
            >
              <ArrowLeftIcon className="w-5 h-5" />
              Voltar
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={handleShare}
                className="p-2.5 hover:bg-white/60 rounded-full transition-colors"
                title="Compartilhar"
              >
                <ShareIcon className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className="p-2.5 hover:bg-white/60 rounded-full transition-colors"
                title="Favoritar"
              >
                {isFavorite ? (
                  <HeartSolidIcon className="w-5 h-5 text-red-500" />
                ) : (
                  <HeartIcon className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="pt-20">
        {/* Container com imagem centralizada (menor) */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Imagem do Evento - Card flutuante (smaller) */}
          <div className="max-w-sm mx-auto mb-10">
            <div className="relative group">
              <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-xl border border-gray-100 bg-white">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <TicketIcon className="w-24 h-24 text-gray-400" />
                  </div>
                )}
              </div>
              {/* Botão de compartilhar flutuante na imagem */}
              <button
                onClick={handleShare}
                className="absolute bottom-4 right-4 w-11 h-11 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
              >
                <ShareIcon className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>

        {/* Container Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Coluna Esquerda - Informações do Evento */}
            <div className="lg:col-span-2">
              {/* Card de Info Principal */}
              <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 mb-6">
                {/* Categoria */}
                <span className="inline-block px-4 py-1.5 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full mb-4">
                  {event.category}
                </span>
                
                {/* Título */}
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                  {event.title}
                </h1>

                {/* Organizador */}
                <div className="flex items-center gap-2 text-gray-600 mb-8">
                  <UserIcon className="w-5 h-5" />
                  <span className="font-medium">Por {event.organizer.full_name}</span>
                </div>

                {/* Banner de Referência */}
                {referralInfo && (
                  <div className="mb-8 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                      <SparklesIcon className="w-6 h-6 text-primary-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          Recomendado por <span className="text-primary-600">{referralInfo.collaborator_name}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Grid de Informações */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 pb-8 border-b border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <CalendarIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Data</p>
                      <p className="font-semibold text-gray-900">
                        {format(eventDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <ClockIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Horário</p>
                      <p className="font-semibold text-gray-900">{event.event_time}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary-50 rounded-lg">
                      <MapPinIcon className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Local</p>
                      <p className="font-semibold text-gray-900">{event.location}</p>
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Sobre o evento</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {event.description}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Coluna Direita - Bilhetes (Sticky) */}
            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8 border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Selecione seus bilhetes</h2>

                  {availableTickets.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                        <TicketIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">Bilhetes esgotados</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tickets.map((ticket) => {
                        const available = ticket.stock - ticket.sold
                        const isAvailable = available > 0
                        const quantity = selectedTickets[ticket.id] || 0

                        return (
                          <div
                            key={ticket.id}
                            className={`border-2 rounded-2xl p-5 transition-all ${
                              isAvailable
                                ? 'border-gray-200 hover:border-primary-400 bg-white'
                                : 'border-gray-100 bg-gray-50 opacity-50'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="font-bold text-gray-900 text-lg mb-1">{ticket.name}</h3>
                                {ticket.description && (
                                  <p className="text-sm text-gray-500">{ticket.description}</p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-2xl font-bold text-gray-900">
                                  €{ticket.price.toFixed(2)}
                                </p>
                                <p className={`text-xs font-medium mt-1 ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                                  {isAvailable ? `${available} disponíveis` : 'Esgotado'}
                                </p>
                              </div>

                              {isAvailable && (
                                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1.5">
                                  <button
                                    onClick={() => handleTicketQuantityChange(ticket.id, quantity - 1)}
                                    disabled={quantity === 0}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:border-primary-500 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-gray-700 transition-all"
                                  >
                                    −
                                  </button>
                                  <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
                                  <button
                                    onClick={() => handleTicketQuantityChange(ticket.id, quantity + 1)}
                                    disabled={quantity >= available}
                                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:border-primary-500 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-gray-700 transition-all"
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}

                      {/* Total e Botão de Compra */}
                      {Object.keys(selectedTickets).length > 0 && (
                        <div className="pt-6 mt-6 border-t-2 border-gray-100 space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-semibold text-gray-700">Total</span>
                            <span className="text-3xl font-bold text-gray-900">
                              €{calculateTotal().toFixed(2)}
                            </span>
                          </div>
                          <button
                            onClick={handlePurchase}
                            className="btn-gradient w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
                          >
                            <TicketIcon className="w-5 h-5" />
                            Continuar para pagamento
                          </button>
                          <p className="text-xs text-center text-gray-500">
                            Pagamento seguro via Stripe
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
