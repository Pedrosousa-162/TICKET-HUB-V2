import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Buscar os bilhetes associados a esta sessão de pagamento
    const { data: tickets, error } = await supabase
      .from('tickets_purchased')
      .select(`
        id,
        ticket_type,
        qr_code,
        qr_code_data,
        buyer_name,
        buyer_email,
        events (
          title,
          date,
          time,
          location,
          cover_image
        )
      `)
      .eq('stripe_session_id', sessionId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching tickets:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tickets' },
        { status: 500 }
      )
    }

    // Transformar os dados para o formato esperado pelo frontend
    const formattedTickets = tickets?.map(ticket => ({
      id: ticket.id,
      ticket_type: ticket.ticket_type,
      qr_code: ticket.qr_code,
      qr_code_data: ticket.qr_code_data,
      buyer_name: ticket.buyer_name,
      buyer_email: ticket.buyer_email,
      event: Array.isArray(ticket.events) ? ticket.events[0] : ticket.events
    })) || []

    return NextResponse.json({ tickets: formattedTickets })
  } catch (error) {
    console.error('Error in get-tickets API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
