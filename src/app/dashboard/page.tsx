'use client'

import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  PlusIcon, 
  TicketIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  CalendarIcon,
  ClipboardDocumentIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { toast } from 'react-hot-toast'

interface Event {
  id: string
  title: string
  slug: string
  event_date: string
  event_time: string
  location: string
  category: string
  image_url: string | null
  association_code: string
}

interface Stats {
  totalEvents: number
  totalTicketsSold: number
  totalRevenue: number
  collaborations: number
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}

function DashboardContent() {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<Stats>({
    totalEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    collaborations: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  async function loadDashboardData() {
    try {
      // Load user's events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user?.id)
        .order('created_at', { ascending: false })

      if (eventsData) {
        setEvents(eventsData)
        setStats(prev => ({ ...prev, totalEvents: eventsData.length }))
      }

      // Load collaborations
      const { data: collabData } = await supabase
        .from('event_users')
        .select('*')
        .eq('user_id', user?.id)
        .neq('role', 'organizer')

      if (collabData) {
        setStats(prev => ({ ...prev, collaborations: collabData.length }))
      }

      // Load tickets stats
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('quantity, total_amount')
        .eq('seller_id', user?.id)
        .eq('status', 'completed')

      if (transactionsData) {
        const totalTickets = transactionsData.reduce((acc, t) => acc + t.quantity, 0)
        const totalRevenue = transactionsData.reduce((acc, t) => acc + Number(t.total_amount), 0)
        setStats(prev => ({
          ...prev,
          totalTicketsSold: totalTickets,
          totalRevenue,
        }))
      }
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success('Logout realizado com sucesso')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Header - Glass Effect */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <TicketIcon className="h-8 w-8 text-primary-600 group-hover:text-primary-700 transition-colors" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">TicketHub</span>
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700 font-medium">Olá, {profile?.full_name}</span>
              <button
                onClick={handleSignOut}
                className="text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Bem-vindo de volta, {profile?.full_name}!</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Meus Eventos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalEvents}</p>
              </div>
              <CalendarIcon className="h-10 w-10 text-primary-600" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Bilhetes Vendidos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalTicketsSold}</p>
              </div>
              <TicketIcon className="h-10 w-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  €{stats.totalRevenue.toFixed(2)}
                </p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Colaborações</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.collaborations}</p>
              </div>
              <UserGroupIcon className="h-10 w-10 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/events/create"
              className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition-all duration-200"
            >
              <PlusIcon className="h-6 w-6 text-primary-600" />
              <span className="font-medium text-gray-900">Criar Novo Evento</span>
            </Link>

            <Link
              href="/associations"
              className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition-all duration-200"
            >
              <UserGroupIcon className="h-6 w-6 text-primary-600" />
              <span className="font-medium text-gray-900">Minhas Associações</span>
            </Link>

            <Link
              href="/events"
              className="flex items-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition-all duration-200"
            >
              <TicketIcon className="h-6 w-6 text-primary-600" />
              <span className="font-medium text-gray-900">Ver Todos Eventos</span>
            </Link>
          </div>
        </div>

        {/* My Events */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Meus Eventos</h2>
          </div>
          <div className="p-6">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Ainda não criou nenhum evento</p>
                <Link
                  href="/events/create"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:scale-105 font-medium transition-all duration-200"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Criar Primeiro Evento</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                  >
                    <Link href={`/events/${event.slug}`}>
                      <div className="aspect-video bg-gray-200 relative">
                        {event.image_url && (
                          <img
                            src={event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded text-xs font-medium">
                          {event.category}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary-600">
                          {event.title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <CalendarIcon className="h-4 w-4 mr-1" />
                          {new Date(event.event_date).toLocaleDateString('pt-PT')} às {event.event_time}
                        </div>
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          📍 {event.location}
                        </div>
                      </div>
                    </Link>
                    
                    {/* Association Code */}
                    <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
                      {/* Manage Button */}
                      <Link
                        href={`/events/${event.slug}/manage`}
                        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-primary-600 to-blue-600 text-white py-2 rounded-lg hover:shadow-lg hover:scale-105 font-medium transition-all duration-200 mb-2"
                      >
                        <Cog6ToothIcon className="w-5 h-5" />
                        Gerenciar Evento
                      </Link>
                      
                      {/* Association Code */}
                      <div className="flex items-center justify-between bg-primary-50 p-3 rounded-lg">
                        <div className="flex-1">
                          <p className="text-xs text-primary-600 font-medium mb-1">
                            Código de Associação
                          </p>
                          <p className="font-mono font-bold text-primary-900 text-lg tracking-wider">
                            {event.association_code}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(event.association_code)
                            toast.success('Código copiado!')
                          }}
                          className="ml-2 p-2 hover:bg-primary-100 rounded-lg transition-colors"
                          title="Copiar código"
                        >
                          <ClipboardDocumentIcon className="h-5 w-5 text-primary-600" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 text-center">
                        Compartilhe este código com colaboradores
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
