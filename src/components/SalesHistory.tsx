'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface Sale {
  id: string
  event_id: string
  ticket_type: string
  quantity: number
  total_amount: number
  buyer_email: string
  buyer_name: string
  payment_status: string
  created_at: string
  event: {
    title: string
  }
}

export default function SalesHistory({ eventId }: { eventId?: string }) {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSales()
  }, [eventId])

  async function loadSales() {
    try {
      // Load from tickets_purchased and group by sale_id
      let query = supabase
        .from('tickets_purchased')
        .select(`
          id,
          sale_id,
          event_id,
          ticket_type,
          buyer_email,
          buyer_name,
          price,
          status,
          created_at,
          event:events(title)
        `)
        .eq('status', 'valid')
        .order('created_at', { ascending: false })

      if (eventId) {
        query = query.eq('event_id', eventId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading purchases:', error)
        throw error
      }

      // Group tickets by sale_id to create sales
      const salesMap = new Map<string, Sale>()
      
      data?.forEach((ticket: any) => {
        const saleId = ticket.sale_id || ticket.id
        
        if (salesMap.has(saleId)) {
          const existing = salesMap.get(saleId)!
          existing.quantity += 1
          existing.total_amount += Number(ticket.price)
        } else {
          salesMap.set(saleId, {
            id: saleId,
            event_id: ticket.event_id,
            ticket_type: ticket.ticket_type,
            quantity: 1,
            total_amount: Number(ticket.price),
            buyer_email: ticket.buyer_email,
            buyer_name: ticket.buyer_name,
            payment_status: 'completed',
            created_at: ticket.created_at,
            event: ticket.event
          })
        }
      })

      const salesArray = Array.from(salesMap.values())
      setSales(salesArray)
    } catch (error) {
      console.error('Error loading sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />
      case 'failed':
      case 'refunded':
        return <XCircleIcon className="w-5 h-5 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído'
      case 'pending':
        return 'Pendente'
      case 'failed':
        return 'Falhou'
      case 'refunded':
        return 'Reembolsado'
      default:
        return status
    }
  }

  const totalRevenue = sales
    .filter(s => s.payment_status === 'completed')
    .reduce((sum, sale) => sum + Number(sale.total_amount), 0)

  const totalSales = sales.filter(s => s.payment_status === 'completed').length

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-2 border-green-200">
          <p className="text-sm text-green-700 font-medium mb-1">Total de Vendas</p>
          <p className="text-3xl font-bold text-green-900">{totalSales}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-primary-50 p-6 rounded-xl border-2 border-blue-200">
          <p className="text-sm text-blue-700 font-medium mb-1">Receita Total</p>
          <p className="text-3xl font-bold text-blue-900">€{totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Histórico de Vendas</h3>
        </div>
        
        {sales.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Nenhuma venda registrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  {!eventId && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Evento
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comprador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bilhete
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qtd
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </td>
                    {!eventId && (
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {sale.event.title}
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="text-gray-900 font-medium">{sale.buyer_name}</p>
                        <p className="text-gray-500 text-xs">{sale.buyer_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {sale.ticket_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {sale.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      €{Number(sale.total_amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(sale.payment_status)}
                        <span className={`font-medium ${
                          sale.payment_status === 'completed' ? 'text-green-700' :
                          sale.payment_status === 'pending' ? 'text-yellow-700' :
                          'text-red-700'
                        }`}>
                          {getStatusText(sale.payment_status)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
