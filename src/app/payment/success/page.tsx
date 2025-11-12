'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircleIcon, TicketIcon, QrCodeIcon, CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface Ticket {
  id: string
  ticket_type: string
  qr_code: string
  qr_code_data: string
  buyer_name: string
  buyer_email: string
  event: {
    title: string
    date: string
    time: string
    location: string
    cover_image: string | null
  }
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [activeTab, setActiveTab] = useState<'qrcode' | 'info'>('qrcode')

  useEffect(() => {
    if (sessionId) {
      loadTickets()
    } else {
      setLoading(false)
    }
  }, [sessionId])

  const loadTickets = async () => {
    try {
      // Primeiro tenta buscar os bilhetes existentes
      let response = await fetch(`/api/get-tickets?session_id=${sessionId}`)
      let data = await response.json()
      
      // Se não houver bilhetes, cria automaticamente
      if (response.ok && (!data.tickets || data.tickets.length === 0)) {
        console.log('Nenhum bilhete encontrado, criando automaticamente...')
        
        // Criar bilhetes automaticamente
        const createResponse = await fetch('/api/create-tickets-from-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        })
        
        if (createResponse.ok) {
          // Buscar os bilhetes novamente
          response = await fetch(`/api/get-tickets?session_id=${sessionId}`)
          data = await response.json()
        }
      }
      
      if (response.ok) {
        setTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando seus bilhetes...</p>
        </div>
      </div>
    )
  }

  if (!sessionId || tickets.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Pagamento Confirmado!</h1>
          <p className="text-gray-600 mb-8">
            Seus bilhetes foram enviados por email. Verifique sua caixa de entrada.
          </p>
          <Link
            href="/events"
            className="inline-block bg-gradient-to-r from-blue-600 to-primary-700 text-white px-8 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-primary-800 transition-all duration-300 shadow-lg"
          >
            Ver Mais Eventos
          </Link>
        </div>
      </div>
    )
  }

  const firstTicket = tickets[0]

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-300 to-yellow-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Ticket Card - Design similar às imagens */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Event Cover/Header */}
          {firstTicket.event.cover_image ? (
            <div className="relative h-48 bg-gradient-to-br from-green-600 to-emerald-700">
              <Image
                src={firstTicket.event.cover_image}
                alt={firstTicket.event.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-4 left-4 bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-lg">
                {firstTicket.event.title}
              </div>
            </div>
          ) : (
            <div className="relative h-48 bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center">
              <h1 className="text-4xl font-bold text-yellow-300 tracking-wider">
                {firstTicket.event.title}
              </h1>
            </div>
          )}

          {/* Buyer Name */}
          <div className="px-8 py-6 text-center border-b-2 border-gray-100">
            <h2 className="text-3xl font-bold text-gray-800">
              {firstTicket.buyer_name}
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex border-b-2 border-gray-100">
            <button
              onClick={() => setActiveTab('qrcode')}
              className={`flex-1 py-4 px-6 font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'qrcode'
                  ? 'bg-purple-50 text-purple-600 border-b-4 border-purple-600'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <QrCodeIcon className="h-5 w-5" />
              QR Code
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-4 px-6 font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'info'
                  ? 'bg-purple-50 text-purple-600 border-b-4 border-purple-600'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <TicketIcon className="h-5 w-5" />
              Informações
            </button>
          </div>

          {/* Tab Content */}
          <div className="px-8 py-10">
            {activeTab === 'qrcode' ? (
              <div className="text-center">
                {/* QR Code Display */}
                {tickets.map((ticket, index) => (
                  <div key={ticket.id} className={index > 0 ? 'mt-8 pt-8 border-t-2 border-gray-100' : ''}>
                    <div className="bg-white p-6 rounded-2xl inline-block shadow-lg border-2 border-gray-200">
                      <Image
                        src={ticket.qr_code}
                        alt={`QR Code - ${ticket.ticket_type}`}
                        width={300}
                        height={300}
                        className="mx-auto"
                      />
                      <div className="mt-4 flex items-center justify-center gap-2">
                        <div className="bg-gray-100 rounded-full p-2">
                          <TicketIcon className="h-5 w-5 text-gray-600" />
                        </div>
                      </div>
                    </div>
                    {tickets.length > 1 && (
                      <p className="mt-4 text-gray-600 font-medium">
                        Bilhete {index + 1} de {tickets.length} - {ticket.ticket_type}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Event Information */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Informações Gerais</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPinIcon className="h-6 w-6 text-gray-400 flex-shrink-0 mt-1" />
                      <div>
                        <p className="font-semibold text-gray-900">{firstTicket.event.location}</p>
                        <button className="text-purple-600 hover:text-purple-700 text-sm font-medium mt-1 flex items-center gap-1">
                          Ver no mapa
                        </button>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <CalendarIcon className="h-6 w-6 text-gray-400 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-gray-600">Adicionar ao calendário</p>
                        <button className="text-purple-600 hover:text-purple-700 text-sm font-medium mt-1">
                          Adicionar ao calendário
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important Info */}
                <div className="bg-blue-50 rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-2 text-blue-800">
                    <span className="text-xl">🪪</span>
                    <p className="text-sm">
                      <strong>Obrigatório</strong> a apresentação de documento de identificação físico ou digital (aplicação GOV.pt)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-blue-800">
                    <span className="text-xl">👔</span>
                    <p className="text-sm">
                      <strong>Dress Code:</strong> Casual chic / Formal
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-blue-800">
                    <span className="text-xl">❌</span>
                    <p className="text-sm">
                      Não é permitido vestuário com rasgos ou desportivo
                    </p>
                  </div>
                </div>

                {/* Tickets List */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Bilhetes</h3>
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="bg-gray-50 rounded-xl p-4 mb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{ticket.ticket_type}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(firstTicket.event.date).toLocaleDateString('pt-PT', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'short'
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => setActiveTab('qrcode')}
                          className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                        >
                          Ver QR Code
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Link */}
                <div className="text-center pt-4">
                  <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                    Ver bilhetes enviados
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Google Wallet Button */}
          {activeTab === 'info' && (
            <div className="px-8 pb-8">
              <button className="w-full bg-black text-white py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 hover:bg-gray-800 transition-all">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                  <path d="M21 7H3C2.45 7 2 7.45 2 8V16C2 16.55 2.45 17 3 17H21C21.55 17 22 16.55 22 16V8C22 7.45 21.55 7 21 7Z" fill="white"/>
                </svg>
                Adicionar a Carteira do Google
              </button>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 text-center">
          <Link
            href="/events"
            className="inline-block bg-white text-gray-700 px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg"
          >
            Ver Mais Eventos
          </Link>
        </div>
      </div>
    </div>
  )
}
