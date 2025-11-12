'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TicketIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  slug: string
  description: string
  event_date: string
  event_time: string
  location: string
  category: string
  association_code: string
  organizer_id: string
}

interface Ticket {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  sold: number
}

interface Collaborator {
  id: string
  role: string
  unique_link: string
  joined_at: string
  user: {
    full_name: string
    email: string
  }
}

interface Stats {
  total_views: number
  total_sales: number
  total_revenue: number
  collaborators_count: number
}

export default function ManageEventPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [event, setEvent] = useState<Event | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [stats, setStats] = useState<Stats>({
    total_views: 0,
    total_sales: 0,
    total_revenue: 0,
    collaborators_count: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'tickets' | 'collaborators' | 'stats'>('tickets')
  
  // Ticket form state
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null)
  const [ticketForm, setTicketForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: ''
  })

  useEffect(() => {
    if (user) {
      loadEventData()
    }
  }, [user, params.slug])

  async function loadEventData() {
    try {
      setLoading(true)

      // Load event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('slug', params.slug)
        .single()

      if (eventError) throw eventError

      // Check if user is the organizer
      if (eventData.organizer_id !== user?.id) {
        toast.error('Você não tem permissão para gerenciar este evento')
        router.push(`/events/${params.slug}`)
        return
      }

      setEvent(eventData)

      // Load tickets
      await loadTickets(eventData.id)

      // Load collaborators
      await loadCollaborators(eventData.id)

      // Load stats
      await loadStats(eventData.id)
    } catch (error: any) {
      console.error('Error loading event:', error)
      toast.error('Erro ao carregar evento')
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  async function loadTickets(eventId: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('event_id', eventId)
      .order('price', { ascending: true })

    if (error) {
      console.error('Error loading tickets:', error)
      return
    }

    setTickets(data || [])
  }

  async function loadCollaborators(eventId: string) {
    const { data, error } = await supabase
      .from('event_users')
      .select(`
        *,
        user:users!event_users_user_id_fkey(full_name, email)
      `)
      .eq('event_id', eventId)
      .neq('role', 'organizer')

    if (error) {
      console.error('Error loading collaborators:', error)
      return
    }

    setCollaborators(data || [])
    setStats(prev => ({ ...prev, collaborators_count: data?.length || 0 }))
  }

  async function loadStats(eventId: string) {
    const { data, error } = await supabase
      .from('event_user_stats')
      .select('views, sales, revenue')
      .eq('event_id', eventId)

    if (error) {
      console.error('Error loading stats:', error)
      return
    }

    const totals = data?.reduce((acc, curr) => ({
      total_views: acc.total_views + curr.views,
      total_sales: acc.total_sales + curr.sales,
      total_revenue: acc.total_revenue + Number(curr.revenue)
    }), { total_views: 0, total_sales: 0, total_revenue: 0 })

    setStats(prev => ({ ...prev, ...totals }))
  }

  async function handleSaveTicket(e: React.FormEvent) {
    e.preventDefault()

    if (!event) return

    try {
      const ticketData = {
        event_id: event.id,
        name: ticketForm.name,
        description: ticketForm.description || null,
        price: parseFloat(ticketForm.price),
        stock: parseInt(ticketForm.stock),
      }

      if (editingTicket) {
        // Update existing ticket
        const { error } = await supabase
          .from('tickets')
          .update(ticketData)
          .eq('id', editingTicket.id)

        if (error) throw error
        toast.success('Bilhete atualizado com sucesso!')
      } else {
        // Create new ticket
        const { error } = await supabase
          .from('tickets')
          .insert(ticketData)

        if (error) throw error
        toast.success('Bilhete criado com sucesso!')
      }

      // Reset form
      setTicketForm({ name: '', description: '', price: '', stock: '' })
      setEditingTicket(null)
      setShowTicketForm(false)
      
      // Reload tickets
      await loadTickets(event.id)
    } catch (error: any) {
      console.error('Error saving ticket:', error)
      toast.error('Erro ao salvar bilhete')
    }
  }

  async function handleDeleteTicket(ticketId: string) {
    if (!confirm('Tem certeza que deseja excluir este bilhete?')) return

    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId)

      if (error) throw error

      toast.success('Bilhete excluído com sucesso!')
      await loadTickets(event!.id)
    } catch (error: any) {
      console.error('Error deleting ticket:', error)
      toast.error('Erro ao excluir bilhete')
    }
  }

  function handleEditTicket(ticket: Ticket) {
    setEditingTicket(ticket)
    setTicketForm({
      name: ticket.name,
      description: ticket.description || '',
      price: ticket.price.toString(),
      stock: ticket.stock.toString()
    })
    setShowTicketForm(true)
  }

  function cancelTicketForm() {
    setShowTicketForm(false)
    setEditingTicket(null)
    setTicketForm({ name: '', description: '', price: '', stock: '' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!event) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Link>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">{event.title}</h1>
              <p className="text-gray-600 mt-1">Gerenciar Evento</p>
            </div>
            <Link
              href={`/events/${event.slug}`}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-lg hover:shadow-lg hover:scale-105 font-medium transition-all duration-200"
            >
              Ver Página Pública
            </Link>
          </div>

          {/* Association Code */}
          <div className="mt-6 bg-primary-50 p-4 rounded-lg inline-flex items-center gap-4">
            <div>
              <p className="text-sm text-primary-600 font-medium">Código de Associação</p>
              <p className="text-2xl font-mono font-bold text-primary-900 tracking-wider">
                {event.association_code}
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(event.association_code)
                toast.success('Código copiado!')
              }}
              className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <ClipboardDocumentIcon className="w-6 h-6 text-primary-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Visualizações</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_views}</p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Bilhetes Vendidos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_sales}</p>
              </div>
              <TicketIcon className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  €{stats.total_revenue.toFixed(2)}
                </p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-primary-600" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Colaboradores</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.collaborators_count}</p>
              </div>
              <UserGroupIcon className="h-10 w-10 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('tickets')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tickets'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TicketIcon className="w-5 h-5 inline mr-2" />
                Bilhetes
              </button>
              <button
                onClick={() => setActiveTab('collaborators')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'collaborators'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserGroupIcon className="w-5 h-5 inline mr-2" />
                Colaboradores
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stats'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <ChartBarIcon className="w-5 h-5 inline mr-2" />
                Estatísticas
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Tickets Tab */}
            {activeTab === 'tickets' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Gestão de Bilhetes</h2>
                  {!showTicketForm && (
                    <button
                      onClick={() => setShowTicketForm(true)}
                      className="flex items-center gap-2 bg-gradient-to-r from-primary-600 to-blue-600 text-white px-4 py-2 rounded-lg hover:shadow-lg hover:scale-105 font-medium transition-all duration-200"
                    >
                      <PlusIcon className="w-5 h-5" />
                      Novo Bilhete
                    </button>
                  )}
                </div>

                {/* Ticket Form */}
                {showTicketForm && (
                  <div className="bg-gray-50 p-6 rounded-lg mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      {editingTicket ? 'Editar Bilhete' : 'Novo Bilhete'}
                    </h3>
                    <form onSubmit={handleSaveTicket} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Nome do Bilhete *
                          </label>
                          <input
                            type="text"
                            required
                            value={ticketForm.name}
                            onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Ex: VIP, Geral, Estudante"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preço (€) *
                          </label>
                          <input
                            type="number"
                            required
                            step="0.01"
                            min="0"
                            value={ticketForm.price}
                            onChange={(e) => setTicketForm({ ...ticketForm, price: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantidade *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={ticketForm.stock}
                            onChange={(e) => setTicketForm({ ...ticketForm, stock: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descrição
                          </label>
                          <input
                            type="text"
                            value={ticketForm.description}
                            onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Descrição opcional"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 font-medium"
                        >
                          {editingTicket ? 'Atualizar' : 'Criar'} Bilhete
                        </button>
                        <button
                          type="button"
                          onClick={cancelTicketForm}
                          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 font-medium"
                        >
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Tickets List */}
                {tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <TicketIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum bilhete criado ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="border border-gray-200 rounded-lg p-4 flex justify-between items-center hover:shadow-md transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">{ticket.name}</h3>
                            <span className="text-2xl font-bold text-primary-600">
                              €{ticket.price.toFixed(2)}
                            </span>
                          </div>
                          {ticket.description && (
                            <p className="text-gray-600 text-sm mt-1">{ticket.description}</p>
                          )}
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-gray-600">
                              Total: <span className="font-semibold">{ticket.stock}</span>
                            </span>
                            <span className="text-green-600">
                              Vendidos: <span className="font-semibold">{ticket.sold}</span>
                            </span>
                            <span className="text-blue-600">
                              Disponíveis: <span className="font-semibold">{ticket.stock - ticket.sold}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditTicket(ticket)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Editar"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTicket(ticket.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Excluir"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Collaborators Tab */}
            {activeTab === 'collaborators' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Colaboradores</h2>
                {collaborators.length === 0 ? (
                  <div className="text-center py-12">
                    <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum colaborador associado ainda</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Compartilhe o código de associação para adicionar colaboradores
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {collaborators.map((collab) => {
                      const uniqueLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/events/${event.slug}?ref=${collab.unique_link}`
                      
                      return (
                        <div
                          key={collab.id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold text-gray-900">{collab.user.full_name}</h3>
                                <p className="text-sm text-gray-600">{collab.user.email}</p>
                                <div className="flex gap-4 mt-2">
                                  <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                                    {collab.role}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Entrou em {new Date(collab.joined_at).toLocaleDateString('pt-PT')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Unique Link Display */}
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-gray-500 font-medium mb-1">Link Único</p>
                                  <p className="text-sm text-gray-700 font-mono truncate" title={uniqueLink}>
                                    {uniqueLink}
                                  </p>
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(uniqueLink)
                                    toast.success('Link copiado!')
                                  }}
                                  className="flex-shrink-0 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                  title="Copiar link"
                                >
                                  <ClipboardDocumentIcon className="w-5 h-5 text-gray-600" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-6">Estatísticas Detalhadas</h2>
                <div className="text-center py-12">
                  <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Estatísticas detalhadas em breve</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
