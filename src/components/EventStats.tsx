'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { TicketIcon, ChartBarIcon, CurrencyEuroIcon, UsersIcon } from '@heroicons/react/24/outline'
import SalesHistory from './SalesHistory'

interface TicketStats {
  id: string
  name: string
  price: number
  stock: number
  sold: number
  revenue: number
}

interface EventStatsData {
  totalTickets: number
  ticketsSold: number
  ticketsAvailable: number
  totalRevenue: number
  averageTicketPrice: number
}

export default function EventStats({ eventId }: { eventId: string }) {
  const [tickets, setTickets] = useState<TicketStats[]>([])
  const [stats, setStats] = useState<EventStatsData>({
    totalTickets: 0,
    ticketsSold: 0,
    ticketsAvailable: 0,
    totalRevenue: 0,
    averageTicketPrice: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [eventId])

  async function loadStats() {
    try {
      setLoading(true)

      // Load tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId)
        .order('price', { ascending: true })

      if (ticketsError) throw ticketsError

      // Load purchases from tickets_purchased table (each row is 1 ticket)
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('tickets_purchased')
        .select('ticket_type')
        .eq('event_id', eventId)
        .eq('status', 'valid')

      if (purchasesError) {
        console.error('Error loading purchases:', purchasesError)
      }

      // Calculate sales per ticket type from tickets_purchased (count rows)
      const salesMap = new Map<string, number>()
      
      purchasesData?.forEach((purchase: any) => {
        const existing = salesMap.get(purchase.ticket_type) || 0
        salesMap.set(purchase.ticket_type, existing + 1)
      })

      const ticketStats: TicketStats[] = (ticketsData || []).map((ticket: any) => {
        const sold = salesMap.get(ticket.name) || 0
        return {
          id: ticket.id,
          name: ticket.name,
          price: ticket.price,
          stock: ticket.stock,
          sold: sold,
          revenue: ticket.price * sold
        }
      })

      setTickets(ticketStats)

      // Calculate total stats
      const totalTickets = ticketStats.reduce((sum, t) => sum + t.stock, 0)
      const ticketsSold = ticketStats.reduce((sum, t) => sum + t.sold, 0)
      const totalRevenue = ticketStats.reduce((sum, t) => sum + t.revenue, 0)
      const averageTicketPrice = ticketsSold > 0 ? totalRevenue / ticketsSold : 0

      setStats({
        totalTickets,
        ticketsSold,
        ticketsAvailable: totalTickets - ticketsSold,
        totalRevenue,
        averageTicketPrice
      })

    } catch (error: any) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Estatísticas do Evento</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border-2 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Bilhetes</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalTickets}</p>
            </div>
            <TicketIcon className="w-10 h-10 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 font-medium">Bilhetes Vendidos</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{stats.ticketsSold}</p>
            </div>
            <ChartBarIcon className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Receita Total</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">€{stats.totalRevenue.toFixed(2)}</p>
            </div>
            <CurrencyEuroIcon className="w-10 h-10 text-purple-600 opacity-50" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border-2 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">Preço Médio</p>
              <p className="text-2xl font-bold text-orange-900 mt-1">€{stats.averageTicketPrice.toFixed(2)}</p>
            </div>
            <CurrencyEuroIcon className="w-10 h-10 text-orange-600 opacity-50" />
          </div>
        </div>
      </div>

      {/* Tickets Breakdown */}
      {tickets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <TicketIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum bilhete criado ainda</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Detalhamento por Tipo de Bilhete</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Bilhete
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendidos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Disponíveis
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receita
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taxa de Venda
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => {
                  const salesRate = ticket.stock > 0 ? (ticket.sold / ticket.stock) * 100 : 0
                  const available = ticket.stock - ticket.sold

                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ticket.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">€{ticket.price.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-green-600">{ticket.sold}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${available > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          {available}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-purple-600">€{ticket.revenue.toFixed(2)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                salesRate >= 75 ? 'bg-green-500' :
                                salesRate >= 50 ? 'bg-yellow-500' :
                                salesRate >= 25 ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${salesRate}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{salesRate.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales History */}
      <div className="mt-8">
        <SalesHistory eventId={eventId} />
      </div>
    </div>
  )
}
