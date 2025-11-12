'use client'

import { QRCodeSVG } from 'qrcode.react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TicketIcon, CalendarIcon, MapPinIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface TicketCardProps {
  ticket: {
    id: string
    qr_code: string
    ticket_type: string
    buyer_name: string
    buyer_email: string
    status: string
    price: number
    created_at: string
    used_at?: string | null
  }
  event: {
    id: string
    title: string
    slug: string
    event_date: string
    event_time: string
    location: string
    image_url: string | null
  }
  showQR?: boolean
}

export default function TicketCard({ ticket, event, showQR = true }: TicketCardProps) {
  const eventDate = new Date(event.event_date + 'T00:00:00')
  const isPastEvent = eventDate < new Date()
  const isValid = ticket.status === 'valid'
  const isUsed = ticket.status === 'used'

  const getStatusInfo = () => {
    switch (ticket.status) {
      case 'valid':
        return {
          icon: CheckCircleIcon,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Válido',
        }
      case 'used':
        return {
          icon: CheckCircleIcon,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Utilizado',
        }
      case 'cancelled':
        return {
          icon: XCircleIcon,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Cancelado',
        }
      case 'refunded':
        return {
          icon: XCircleIcon,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          label: 'Reembolsado',
        }
      default:
        return {
          icon: TicketIcon,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: ticket.status,
        }
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <div className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 ${statusInfo.borderColor} transition-all duration-300 hover:shadow-xl`}>
      <div className="relative">
        {/* Header com imagem ou cor gradiente */}
        <div className="h-32 relative overflow-hidden">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-500 via-blue-600 to-purple-600" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 ${statusInfo.bgColor} ${statusInfo.color} rounded-full font-semibold text-sm border-2 ${statusInfo.borderColor}`}>
              <StatusIcon className="w-4 h-4" />
              {statusInfo.label}
            </div>
          </div>

          {/* Título do Evento */}
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-white font-bold text-xl drop-shadow-lg line-clamp-2">
              {event.title}
            </h3>
          </div>
        </div>

        {/* Detalhes do Evento */}
        <div className="p-6">
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div className="flex items-center gap-3 text-gray-700">
              <div className="p-2 bg-primary-50 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Data</p>
                <p className="font-semibold">
                  {format(eventDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700">
              <div className="p-2 bg-primary-50 rounded-lg">
                <ClockIcon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Hora</p>
                <p className="font-semibold">{event.event_time.slice(0, 5)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700">
              <div className="p-2 bg-primary-50 rounded-lg">
                <MapPinIcon className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Local</p>
                <p className="font-semibold line-clamp-1">{event.location}</p>
              </div>
            </div>
          </div>

          {/* Separador */}
          <div className="border-t-2 border-dashed border-gray-200 my-4" />

          {/* Informações do Bilhete */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 font-medium">Tipo de Bilhete</p>
                <p className="font-bold text-gray-900 text-lg">{ticket.ticket_type}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-medium">Preço</p>
                <p className="font-bold text-primary-600 text-lg">€{Number(ticket.price).toFixed(2)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 font-medium">Titular</p>
              <p className="font-semibold text-gray-900">{ticket.buyer_name}</p>
              <p className="text-sm text-gray-600">{ticket.buyer_email}</p>
            </div>

            {ticket.used_at && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium mb-1">Bilhete Validado</p>
                <p className="text-sm text-blue-800">
                  {format(new Date(ticket.used_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>

          {/* QR Code */}
          {showQR && isValid && (
            <>
              <div className="border-t-2 border-dashed border-gray-200 my-4" />
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Código de Validação
                </p>
                <div className="bg-white p-4 rounded-xl inline-block shadow-md">
                  <QRCodeSVG
                    value={ticket.qr_code}
                    size={200}
                    level="H"
                    includeMargin={true}
                    fgColor="#1e40af"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-3 font-mono break-all">
                  {ticket.qr_code}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Apresente este QR code na entrada do evento
                </p>
              </div>
            </>
          )}

          {/* Aviso se já foi usado */}
          {isUsed && showQR && (
            <>
              <div className="border-t-2 border-dashed border-gray-200 my-4" />
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
                <CheckCircleIcon className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                <p className="font-semibold text-blue-900 mb-1">
                  Bilhete Já Utilizado
                </p>
                <p className="text-sm text-blue-700">
                  Este bilhete foi validado na entrada
                </p>
              </div>
            </>
          )}

          {/* Aviso se está cancelado */}
          {(ticket.status === 'cancelled' || ticket.status === 'refunded') && (
            <>
              <div className="border-t-2 border-dashed border-gray-200 my-4" />
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
                <XCircleIcon className="w-12 h-12 text-red-600 mx-auto mb-2" />
                <p className="font-semibold text-red-900 mb-1">
                  Bilhete {ticket.status === 'cancelled' ? 'Cancelado' : 'Reembolsado'}
                </p>
                <p className="text-sm text-red-700">
                  Este bilhete não é válido para entrada
                </p>
              </div>
            </>
          )}

          {/* Informação adicional */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">
              ID: {ticket.id.slice(0, 8)}... • Emitido em{' '}
              {format(new Date(ticket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
