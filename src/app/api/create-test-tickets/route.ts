import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Buscar um evento qualquer para teste
    const { data: event } = await supabase
      .from('events')
      .select('id, title')
      .limit(1)
      .single()

    if (!event) {
      return NextResponse.json(
        { error: 'No event found' },
        { status: 404 }
      )
    }

    // Criar 2 bilhetes de teste
    const ticketsToCreate = []

    for (let i = 0; i < 2; i++) {
      const uniqueCode = randomUUID()
      const qrCodeData = JSON.stringify({
        ticketId: uniqueCode,
        eventId: event.id,
        buyerEmail: 'teste@example.com',
        ticketType: 'Acesso Geral',
        purchaseDate: new Date().toISOString(),
      })

      // Gerar QR code como data URL
      const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      ticketsToCreate.push({
        event_id: event.id,
        ticket_type: 'Acesso Geral',
        qr_code: qrCodeImage,
        qr_code_data: qrCodeData,
        unique_code: uniqueCode,
        buyer_name: 'Pedro Sousa',
        buyer_email: 'teste@example.com',
        stripe_session_id: sessionId,
        is_used: false,
      })
    }

    // Inserir todos os bilhetes no banco
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets_purchased')
      .insert(ticketsToCreate)
      .select()

    if (ticketsError) {
      console.error('Error creating tickets:', ticketsError)
      return NextResponse.json(
        { error: 'Failed to create tickets', details: ticketsError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${tickets.length} test tickets created`,
      tickets,
    })
  } catch (error) {
    console.error('Error in create-test-tickets API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
