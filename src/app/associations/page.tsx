'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import { 
  PlusIcon, 
  LinkIcon, 
  TicketIcon,
  ChartBarIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline'

interface Association {
  id: string
  role: string
  unique_link: string | null
  joined_at: string
  event: {
    id: string
    title: string
    slug: string
    event_date: string
    association_code: string
  }
  stats: {
    views: number
    sales: number
    revenue: number
    conversion_rate: number
  } | null
}

export default function AssociationsPage() {
  return (
    <ProtectedRoute>
      <AssociationsContent />
    </ProtectedRoute>
  )
}

function AssociationsContent() {
  const { user, signOut } = useAuth()
  const [associations, setAssociations] = useState<Association[]>([])
  const [loading, setLoading] = useState(true)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [associationCode, setAssociationCode] = useState('')
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    loadAssociations()
  }, [user])

  async function loadAssociations() {
    try {
      const { data, error } = await supabase
        .from('event_users')
        .select(`
          id,
          role,
          unique_link,
          joined_at,
          event:events (
            id,
            title,
            slug,
            event_date,
            association_code
          )
        `)
        .eq('user_id', user?.id)
        .neq('role', 'organizer')

      if (error) throw error

      // Load stats for each association
      const associationsWithStats = await Promise.all(
        (data || []).map(async (assoc: any) => {
          const { data: stats } = await supabase
            .from('event_user_stats')
            .select('views, sales, revenue, conversion_rate')
            .eq('event_id', assoc.event.id)
            .eq('user_id', user?.id)
            .single()

          return {
            ...assoc,
            stats: stats || { views: 0, sales: 0, revenue: 0, conversion_rate: 0 }
          }
        })
      )

      setAssociations(associationsWithStats)
    } catch (error) {
      console.error('Error loading associations:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleJoin() {
    if (!associationCode.trim()) {
      toast.error('Digite o código de associação')
      return
    }

    setJoining(true)

    try {
      // Find event by association code
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('association_code', associationCode.toUpperCase())
        .single()

      if (eventError || !event) {
        toast.error('Código de associação inválido')
        return
      }

      // Check if already associated
      const { data: existing } = await supabase
        .from('event_users')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_id', user?.id)
        .single()

      if (existing) {
        toast.error('Você já está associado a este evento')
        return
      }

      // Create association
      const { error: insertError } = await supabase
        .from('event_users')
        .insert({
          event_id: event.id,
          user_id: user?.id!,
          role: 'collaborator',
        })

      if (insertError) throw insertError

      toast.success('Associação realizada com sucesso!')
      setShowJoinModal(false)
      setAssociationCode('')
      loadAssociations()
    } catch (error: any) {
      console.error('Error joining event:', error)
      toast.error(error.message || 'Erro ao associar-se ao evento')
    } finally {
      setJoining(false)
    }
  }

  function copyLink(link: string) {
    const fullLink = `${window.location.origin}/c/${link}`
    navigator.clipboard.writeText(fullLink)
    toast.success('Link copiado!')
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
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <TicketIcon className="h-8 w-8 text-primary-600 group-hover:text-primary-700 transition-colors" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">TicketHub</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                Dashboard
              </Link>
              <button
                onClick={() => signOut()}
                className="text-gray-700 hover:text-red-600 font-medium transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Minhas Associações</h1>
            <p className="text-gray-600 mt-2">Eventos dos quais você é colaborador</p>
          </div>
          <button
            onClick={() => setShowJoinModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:scale-105 font-medium transition-all duration-200"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Associar-se a Evento</span>
          </button>
        </div>

        {/* Associations List */}
        {associations.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <LinkIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma associação</h3>
            <p className="text-gray-600 mb-6">
              Associe-se a um evento usando o código de associação
            </p>
            <button
              onClick={() => setShowJoinModal(true)}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:scale-105 font-medium transition-all duration-200"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Associar-se a Evento</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {associations.map((assoc) => (
              <div key={assoc.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      {assoc.event.title}
                    </h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                      {assoc.role}
                    </span>
                  </div>
                  <Link
                    href={`/events/${assoc.event.slug}`}
                    className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                  >
                    Ver Evento →
                  </Link>
                </div>

                {assoc.unique_link && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 mr-2">
                        <p className="text-xs text-gray-500 mb-1">Seu Link Único</p>
                        <p className="text-sm font-mono text-gray-900 truncate">
                          /c/{assoc.unique_link}
                        </p>
                      </div>
                      <button
                        onClick={() => copyLink(assoc.unique_link!)}
                        className="flex-shrink-0 p-2 text-primary-600 hover:bg-primary-50 rounded"
                      >
                        <ClipboardDocumentIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600 mb-1">Visualizações</p>
                    <p className="text-2xl font-bold text-blue-900">{assoc.stats?.views || 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-600 mb-1">Vendas</p>
                    <p className="text-2xl font-bold text-green-900">{assoc.stats?.sales || 0}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-purple-600 mb-1">Receita</p>
                    <p className="text-2xl font-bold text-purple-900">
                      €{(assoc.stats?.revenue || 0).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <p className="text-xs text-orange-600 mb-1">Conversão</p>
                    <p className="text-2xl font-bold text-orange-900">
                      {(assoc.stats?.conversion_rate || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Associar-se a Evento</h2>
            <p className="text-gray-600 mb-6">
              Digite o código de associação fornecido pelo organizador do evento
            </p>
            <input
              type="text"
              value={associationCode}
              onChange={(e) => setAssociationCode(e.target.value.toUpperCase())}
              placeholder="Ex: ABC12345"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-6 uppercase font-mono"
              maxLength={8}
            />
            <div className="flex space-x-4">
              <button
                onClick={handleJoin}
                disabled={joining}
                className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
              >
                {joining ? 'A associar...' : 'Associar'}
              </button>
              <button
                onClick={() => {
                  setShowJoinModal(false)
                  setAssociationCode('')
                }}
                className="px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
