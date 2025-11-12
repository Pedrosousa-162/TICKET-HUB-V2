'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { MagnifyingGlassIcon, TicketIcon, CalendarIcon, MapPinIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'

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
}

export default function EventsPage() {
  const { user, profile, loading: authLoading, signOut } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todas')
  const [locationFilter, setLocationFilter] = useState('')

  const categories = ['Todas', 'Música', 'Desporto', 'Teatro', 'Conferência', 'Festa', 'Festival', 'Workshop', 'Outro']

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    filterEvents()
  }, [searchTerm, categoryFilter, locationFilter, events])

  async function loadEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false })

      if (error) throw error
      setEvents(data || [])
      setFilteredEvents(data || [])
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  function filterEvents() {
    let filtered = events

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== 'Todas') {
      filtered = filtered.filter(event => event.category === categoryFilter)
    }

    if (locationFilter) {
      filtered = filtered.filter(event =>
        event.location.toLowerCase().includes(locationFilter.toLowerCase())
      )
    }

    setFilteredEvents(filtered)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  // Format the user's full name into Title Case
  function formatName(name?: string | null) {
    if (!name) return ''
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }

  // Compute initials for the avatar fallback
  const initials = (() => {
    const raw = profile?.full_name || user?.email || ''
    if (!raw) return ''
    const parts = raw.split(' ').filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  })()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Header - Glass Effect */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <TicketIcon className="h-8 w-8 text-primary-600 group-hover:text-primary-700 transition-colors" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-blue-600 bg-clip-text text-transparent">TicketHub</span>
            </Link>
            <div className="flex items-center space-x-4">
              {authLoading ? (
                <div className="w-20 h-8 animate-pulse rounded bg-gray-200"></div>
              ) : user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-700 hover:text-primary-600 font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 px-2 py-1 rounded-full bg-primary-50">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 to-blue-600 flex items-center justify-center text-white font-semibold text-sm select-none">
                        {initials}
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm font-medium text-gray-900">
                          {formatName(profile?.full_name) || (user?.email ? user.email.split('@')[0] : '')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      aria-label="Sair"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Sair</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                    Entrar
                  </Link>
                  <Link
                    href="/register"
                    className="bg-gradient-to-r from-primary-600 to-blue-600 text-white px-5 py-2 rounded-lg hover:shadow-lg hover:scale-105 font-medium transition-all duration-200"
                  >
                    Registar
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Eventos</h1>
          <p className="text-gray-600">Descubra os melhores eventos perto de si</p>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Pesquisar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Location Filter */}
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Localização..."
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
            <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum evento encontrado</h3>
            <p className="text-gray-600">Tente ajustar os filtros ou criar um novo evento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.slug}`}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 border border-gray-100"
              >
                <div className="aspect-video bg-gray-200 relative">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <TicketIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-white px-3 py-1 rounded-full text-sm font-medium">
                    {event.category}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition line-clamp-2">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>
                        {format(new Date(event.event_date), "d 'de' MMMM, yyyy", { locale: pt })}
                        {' às '} {event.event_time}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">A partir de</span>
                      <span className="text-xl font-bold text-primary-600">
                        €{event.base_price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
