'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { MagnifyingGlassIcon, TicketIcon, CalendarIcon, MapPinIcon, ArrowRightIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import AnimatedHero from '@/components/AnimatedHero'
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin as MapPinIcon2, Users, LineChart } from 'lucide-react'

interface Event {
  id: string
  title: string
  slug: string
  description: string
  event_date: string
  event_time: string
  location: string
  category: string
  image_url: string | null
}

export default function HomePage() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)

  useEffect(() => {
    loadFeaturedEvents()
  }, [])

  async function loadFeaturedEvents() {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, title, slug, description, event_date, event_time, location, category, image_url')
        .order('created_at', { ascending: false })
        .limit(3)

      if (error) throw error
      setFeaturedEvents(data || [])
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoadingEvents(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  // Format the user's full name into Title Case for a more professional appearance
  function formatName(name?: string | null) {
    if (!name) return ''
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }

  // Compute initials for the avatar fallback (e.g., 'PS')
  const initials = (() => {
    const raw = profile?.full_name || user?.email || ''
    if (!raw) return ''
    const parts = raw.split(' ').filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  })()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Hero Section com Navbar integrada */}
      <div className="relative">
        {/* Header - Glass Effect apenas no hero */}
        <header className="absolute top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <TicketIcon className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white drop-shadow-lg">
                TicketHub
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link
                href="/events"
                className="font-medium text-white/90 hover:text-white drop-shadow transition-colors"
              >
                Eventos
              </Link>
              
              {loading ? (
                <div className="w-20 h-8 animate-pulse rounded bg-white/20"></div>
              ) : user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="font-medium text-white/90 hover:text-white drop-shadow transition-colors"
                  >
                    Dashboard
                  </Link>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 px-2 py-1 rounded-full bg-white/5">
                      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold text-sm select-none">
                        {initials}
                      </div>
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm font-medium text-white drop-shadow">
                          Olá, {formatName(profile?.full_name) || (user?.email ? user.email.split('@')[0] : '')}
                        </span>
                        <span className="text-xs text-white/70">Bem-vindo</span>
                      </div>
                    </div>
                    <button
                      onClick={handleSignOut}
                      aria-label="Sair"
                      className="ml-2 inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">Sair</span>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="font-medium text-white/90 hover:text-white drop-shadow transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 rounded-lg font-medium transition-all bg-white/20 backdrop-blur-sm text-white border border-white/30 hover:bg-white/30"
                  >
                    Registar
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Animated Hero Section */}
      <AnimatedHero />
      </div>

      {/* Features Section - Visible on Scroll */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades Premium
            </h2>
            <p className="text-lg text-gray-600">
              Tudo o que precisa para gerir os seus eventos
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <PremiumFeatureCard
              icon={<TicketIcon className="h-6 w-6" />}
              title="Gestão de Bilhetes"
              description="Crie tipos de bilhetes, controle stock automaticamente e acompanhe vendas em tempo real."
            />
            <PremiumFeatureCard
              icon={<CalendarIcon className="h-6 w-6" />}
              title="Sistema de Colaboradores"
              description="Adicione colaboradores com links únicos e acompanhe suas vendas individuais."
            />
            <PremiumFeatureCard
              icon={<MagnifyingGlassIcon className="h-6 w-6" />}
              title="Estatísticas Detalhadas"
              description="Analytics completo com visualizações, conversões, receita e ranking de vendas."
            />
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Eventos em Destaque
            </h2>
            <p className="text-lg text-gray-600">
              Descubra os próximos eventos incríveis
            </p>
          </div>

          {loadingEvents ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[400px] bg-gray-200 animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TicketIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-6">Nenhum evento disponível no momento</p>
              <Link
                href="/events/create"
                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 font-medium"
              >
                Criar Primeiro Evento
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How it works - Modern Design */}
      <section className="relative bg-white py-32 overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/30 via-white to-blue-50/30"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Como Funciona
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Gerir eventos nunca foi tão simples. Siga estes passos e comece já.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connecting line - hidden on mobile */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-blue-200 via-primary-400 to-blue-600" style={{ width: 'calc(100% - 8rem)', marginLeft: '4rem' }}></div>
            
            {/* Step 1 */}
            <div className="relative group">
              <div className="text-center relative z-10">
                {/* Number Circle */}
                <div className="relative mx-auto mb-8 w-24 h-24 transition-all duration-500 group-hover:scale-110">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Main circle */}
                  <div className="relative w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50 group-hover:shadow-blue-500/80 transition-all duration-500">
                    <span className="text-4xl font-bold text-white">1</span>
                  </div>
                  
                  {/* Ring decoration */}
                  <div className="absolute inset-0 rounded-full border-4 border-blue-300/30 scale-110 group-hover:scale-125 transition-transform duration-500"></div>
                </div>

                {/* Content */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-blue-200 h-[160px] flex flex-col justify-center">
                  <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                    Crie seu Evento
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    Adicione informações, imagem e tipos de bilhetes
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="text-center relative z-10">
                <div className="relative mx-auto mb-8 w-24 h-24 transition-all duration-500 group-hover:scale-110">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center shadow-2xl shadow-blue-600/50 group-hover:shadow-blue-600/80 transition-all duration-500">
                    <span className="text-4xl font-bold text-white">2</span>
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 scale-110 group-hover:scale-125 transition-transform duration-500"></div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-blue-300 h-[160px] flex flex-col justify-center">
                  <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
                    Adicione Colaboradores
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    Partilhe código e gere links únicos
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="text-center relative z-10">
                <div className="relative mx-auto mb-8 w-24 h-24 transition-all duration-500 group-hover:scale-110">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-primary-700 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-blue-700 to-primary-800 rounded-full flex items-center justify-center shadow-2xl shadow-blue-700/50 group-hover:shadow-blue-700/80 transition-all duration-500">
                    <span className="text-4xl font-bold text-white">3</span>
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500/30 scale-110 group-hover:scale-125 transition-transform duration-500"></div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-blue-400 h-[160px] flex flex-col justify-center">
                  <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-800 transition-colors">
                    Venda Bilhetes
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    Use página pública ou links personalizados
                  </p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative group">
              <div className="text-center relative z-10">
                <div className="relative mx-auto mb-8 w-24 h-24 transition-all duration-500 group-hover:scale-110">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-blue-800 rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative w-full h-full bg-gradient-to-br from-primary-700 to-blue-900 rounded-full flex items-center justify-center shadow-2xl shadow-primary-600/50 group-hover:shadow-primary-600/80 transition-all duration-500">
                    <span className="text-4xl font-bold text-white">4</span>
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-primary-400/30 scale-110 group-hover:scale-125 transition-transform duration-500"></div>
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group-hover:border-primary-300 h-[160px] flex flex-col justify-center">
                  <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors">
                    Acompanhe Resultados
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-sm">
                    Veja estatísticas e performance em tempo real
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="text-center mt-16">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-primary-700 text-white font-semibold rounded-full shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:from-blue-700 hover:to-primary-800"
            >
              <span>Começar Agora</span>
              <ArrowRightIcon className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-white mt-24 rounded-t-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-6">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-primary-600 rounded-xl shadow-lg">
                  <TicketIcon className="h-7 w-7 text-white" />
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-primary-400 bg-clip-text text-transparent">
                  TicketHub
                </span>
              </div>

              <p className="text-gray-400 leading-relaxed max-w-sm mb-8">
                Plataforma completa de gestão de eventos e venda de bilhetes. 
                Controle, acompanhe e maximize os resultados dos seus eventos.
              </p>

              {/* Social Links */}
              <div className="flex gap-4">
                <a
                  href="https://facebook.com/tickethub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-800 hover:bg-blue-600 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/50 group"
                >
                  <Facebook className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </a>
                <a
                  href="https://instagram.com/tickethub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-800 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-pink-500/50 group"
                >
                  <Instagram className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </a>
                <a
                  href="https://twitter.com/tickethub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-gray-800 hover:bg-blue-500 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-blue-400/50 group"
                >
                  <Twitter className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </a>
              </div>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-2 gap-8 lg:col-span-2 lg:grid-cols-3">
              {/* Plataforma */}
              <div>
                <h3 className="text-lg font-semibold mb-6 text-white">Plataforma</h3>
                <ul className="space-y-4">
                  <li>
                    <Link
                      href="/events"
                      className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      Eventos
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/dashboard"
                      className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/associations"
                      className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      Associações
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/register"
                      className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
                      Criar Conta
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Recursos */}
              <div>
                <h3 className="text-lg font-semibold mb-6 text-white">Recursos</h3>
                <ul className="space-y-4">
                  <li>
                    <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group">
                      <Users className="w-4 h-4 text-blue-500" />
                      Colaboradores
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group">
                      <LineChart className="w-4 h-4 text-blue-500" />
                      Analytics
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group">
                      <TicketIcon className="w-4 h-4 text-blue-500" />
                      Gestão de Bilhetes
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group">
                      <CalendarIcon className="w-4 h-4 text-blue-500" />
                      Criar Eventos
                    </a>
                  </li>
                </ul>
              </div>

              {/* Contacto */}
              <div>
                <h3 className="text-lg font-semibold mb-6 text-white">Contacto</h3>
                <ul className="space-y-4">
                  <li>
                    <a
                      href="mailto:suporte@tickethub.pt"
                      className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-3"
                    >
                      <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span className="text-sm">suporte@tickethub.pt</span>
                    </a>
                  </li>
                  <li>
                    <a
                      href="tel:+351912345678"
                      className="text-gray-400 hover:text-blue-400 transition-colors duration-200 flex items-center gap-3"
                    >
                      <Phone className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span className="text-sm">+351 912 345 678</span>
                    </a>
                  </li>
                  <li>
                    <div className="text-gray-400 flex items-start gap-3">
                      <MapPinIcon2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <address className="text-sm not-italic leading-relaxed">
                        Lisboa, Portugal
                      </address>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm">
                © 2025 TicketHub. Todos os direitos reservados.
              </p>
              <div className="flex gap-6 text-sm">
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Privacidade
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Termos
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-400 transition-colors">
                  Cookies
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Premium Feature Card Component with 3D Effect
function PremiumFeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  const [isHovered, setIsHovered] = useState(false)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      const rotateX = -(y / rect.height) * 5
      const rotateY = (x / rect.width) * 5
      setRotation({ x: rotateX, y: rotateY })
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    setRotation({ x: 0, y: 0 })
  }

  return (
    <div
      ref={cardRef}
      className="relative rounded-[32px] overflow-hidden transition-all duration-300 border-2"
      style={{
        height: "320px",
        transformStyle: "preserve-3d",
        backgroundColor: "#ffffff",
        borderColor: isHovered ? "rgba(59, 130, 246, 0.5)" : "rgba(229, 231, 235, 0.8)",
        boxShadow: isHovered
          ? "0 20px 60px -10px rgba(59, 130, 246, 0.4), 0 10px 30px -5px rgba(59, 130, 246, 0.3)"
          : "0 10px 30px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateY(${isHovered ? '-8px' : '0'})`,
        perspective: "1000px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Glass reflection overlay */}
      <div
        className="absolute inset-0 z-35 pointer-events-none transition-opacity duration-400"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0) 80%, rgba(255,255,255,0.5) 100%)",
          backdropFilter: "blur(1px)",
          opacity: isHovered ? 0.8 : 0.6,
        }}
      />

      {/* White to light blue background gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #f0f9ff 50%, #e0f2fe 100%)",
        }}
      />

      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03] mix-blend-overlay z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Blue glow effect on hover */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/2 z-20 transition-all duration-400"
        style={{
          background: `
            radial-gradient(ellipse at bottom right, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0) 60%),
            radial-gradient(ellipse at bottom left, rgba(96, 165, 250, 0.15) 0%, rgba(37, 99, 235, 0) 60%)
          `,
          filter: "blur(30px)",
          opacity: isHovered ? 1 : 0.3,
        }}
      />

      {/* Central subtle glow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3 z-21 transition-all duration-400"
        style={{
          background: `radial-gradient(circle at bottom center, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0) 70%)`,
          filter: "blur(25px)",
          opacity: isHovered ? 1 : 0.4,
        }}
      />

      {/* Bottom border accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px] z-25 transition-all duration-400"
        style={{
          background: "linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.8) 50%, rgba(59, 130, 246, 0.1) 100%)",
          boxShadow: isHovered
            ? "0 0 30px 4px rgba(59, 130, 246, 0.6), 0 0 40px 6px rgba(37, 99, 235, 0.4)"
            : "0 0 20px 2px rgba(59, 130, 246, 0.3), 0 0 30px 4px rgba(37, 99, 235, 0.2)",
          opacity: isHovered ? 1 : 0.7,
        }}
      />

      {/* Card content */}
      <div className="relative flex flex-col h-full p-8 z-40">
        {/* Icon circle */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-6 transition-all duration-400"
          style={{
            background: isHovered 
              ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
              : "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
            boxShadow: isHovered
              ? "0 10px 20px -5px rgba(59, 130, 246, 0.4), 0 5px 10px -3px rgba(59, 130, 246, 0.3), inset 2px 2px 8px rgba(255, 255, 255, 0.3), inset -2px -2px 8px rgba(0, 0, 0, 0.1)"
              : "0 4px 12px -2px rgba(59, 130, 246, 0.15), 0 2px 6px -1px rgba(59, 130, 246, 0.1), inset 2px 2px 5px rgba(255, 255, 255, 0.5), inset -2px -2px 5px rgba(0, 0, 0, 0.05)",
            transform: isHovered ? "scale(1.05)" : "scale(1)",
          }}
        >
          <div className="flex items-center justify-center w-full h-full relative z-10" style={{ color: isHovered ? '#ffffff' : '#3b82f6' }}>
            {icon}
          </div>
        </div>

        {/* Content */}
        <div className="mb-auto">
          <h3
            className="text-2xl font-bold mb-3 transition-all duration-400"
            style={{
              letterSpacing: "-0.01em",
              lineHeight: 1.2,
              color: isHovered ? "#1e40af" : "#1e3a8a",
              textShadow: isHovered ? "0 2px 4px rgba(59, 130, 246, 0.1)" : "none",
            }}
          >
            {title}
          </h3>

          <p
            className="text-sm transition-all duration-400"
            style={{
              lineHeight: 1.6,
              fontWeight: 400,
              color: isHovered ? "#475569" : "#64748b",
              textShadow: "none",
            }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

// Event Card Component with Flip Effect
function EventCard({ event }: { event: Event }) {
  const [isFlipped, setIsFlipped] = useState(false)
  const router = useRouter()

  const eventDate = new Date(event.event_date + 'T00:00:00')
  const formattedDate = format(eventDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
  const formattedTime = event.event_time.slice(0, 5)

  const handleClick = () => {
    router.push(`/events/${event.slug}`)
  }

  return (
    <div
      className="group relative h-[400px] w-full [perspective:2000px]"
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className={`relative h-full w-full transition-all duration-700 [transform-style:preserve-3d] ${
          isFlipped ? '[transform:rotateY(180deg)]' : '[transform:rotateY(0deg)]'
        }`}
      >
        {/* Front of card */}
        <div
          className={`absolute inset-0 h-full w-full [backface-visibility:hidden] overflow-hidden rounded-2xl bg-white border border-gray-200 shadow-lg transition-all duration-700 group-hover:shadow-xl group-hover:border-primary-200 ${
            isFlipped ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-blue-50/50" />

          {/* Event Image or Placeholder */}
          <div className="relative h-48 overflow-hidden">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center">
                <TicketIcon className="w-20 h-20 text-white opacity-30" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            
            {/* Category Badge */}
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full shadow-lg">
                {event.category}
              </span>
            </div>

            {/* Animated icon */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-600 via-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/25 animate-pulse">
                <CalendarIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          {/* Bottom content */}
          <div className="absolute right-0 bottom-0 left-0 p-5">
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900 transition-all duration-500 ease-out group-hover:translate-y-[-4px] line-clamp-2">
                {event.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 transition-all delay-[50ms] duration-500 ease-out group-hover:translate-y-[-4px]">
                <MapPinIcon className="w-4 h-4 text-primary-600" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div
          className={`absolute inset-0 h-full w-full [transform:rotateY(180deg)] [backface-visibility:hidden] rounded-2xl p-6 bg-white border border-gray-200 shadow-lg flex flex-col transition-all duration-700 group-hover:shadow-xl group-hover:border-primary-200 ${
            !isFlipped ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-50/50 via-transparent to-blue-50/50" />

          <div className="relative z-10 flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 via-primary-500 to-primary-600">
                  <TicketIcon className="h-4 w-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                  {event.title}
                </h3>
              </div>
              <p className="text-sm text-gray-600 line-clamp-3">
                {event.description}
              </p>
            </div>

            <div className="space-y-3">
              <div
                className="flex items-center gap-3 text-sm text-gray-700 transition-all duration-500"
                style={{
                  transform: isFlipped ? 'translateX(0)' : 'translateX(-10px)',
                  opacity: isFlipped ? 1 : 0,
                  transitionDelay: '200ms',
                }}
              >
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-primary-100">
                  <CalendarIcon className="h-3 w-3 text-primary-600" />
                </div>
                <span className="font-medium">{formattedDate}</span>
              </div>

              <div
                className="flex items-center gap-3 text-sm text-gray-700 transition-all duration-500"
                style={{
                  transform: isFlipped ? 'translateX(0)' : 'translateX(-10px)',
                  opacity: isFlipped ? 1 : 0,
                  transitionDelay: '300ms',
                }}
              >
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-primary-100">
                  <MapPinIcon className="h-3 w-3 text-primary-600" />
                </div>
                <span className="font-medium line-clamp-1">{event.location}</span>
              </div>

              <div
                className="flex items-center gap-3 text-sm text-gray-700 transition-all duration-500"
                style={{
                  transform: isFlipped ? 'translateX(0)' : 'translateX(-10px)',
                  opacity: isFlipped ? 1 : 0,
                  transitionDelay: '400ms',
                }}
              >
                <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-primary-100">
                  <TicketIcon className="h-3 w-3 text-primary-600" />
                </div>
                <span className="font-medium">{formattedTime}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-auto border-t border-gray-200 pt-4">
            <button
              onClick={handleClick}
              className="group/btn relative flex items-center justify-between w-full rounded-lg p-3 transition-all duration-300 bg-gradient-to-r from-gray-50 to-gray-50 hover:from-primary-50 hover:to-blue-50 hover:scale-[1.02] border border-transparent hover:border-primary-200"
            >
              <span className="text-sm font-semibold text-gray-900 group-hover/btn:text-primary-600 transition-colors duration-300">
                Ver Detalhes
              </span>
              <ArrowRightIcon className="h-4 w-4 text-primary-600 transition-all duration-300 group-hover/btn:translate-x-1 group-hover/btn:scale-110" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
