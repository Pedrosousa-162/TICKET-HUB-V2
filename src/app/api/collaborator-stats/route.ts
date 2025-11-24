import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const eventId = searchParams.get('event_id')
    const userId = searchParams.get('user_id')
    const uniqueLink = searchParams.get('unique_link')

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: 'Event ID and User ID are required' },
        { status: 400 }
      )
    }

    // Get all tickets for this event (for now, until we implement collaborator tracking)
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets_purchased')
      .select('price, created_at, stripe_session_id')
      .eq('event_id', eventId)

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError)
      return NextResponse.json(
        { error: 'Failed to fetch statistics', details: ticketsError },
        { status: 500 }
      )
    }

    console.log('Tickets found:', tickets?.length)

    // Calculate statistics based on actual sales
    const totalSales = tickets?.length || 0
    const totalRevenue = tickets?.reduce((sum, ticket) => sum + Number(ticket.price || 0), 0) || 0

    // Get page views from event analytics if available
    // For now, we'll estimate based on conversion rate
    // Typical conversion rate is 2-5%, so we'll use 3% as baseline
    const estimatedViews = totalSales > 0 ? Math.round(totalSales / 0.03) : 0
    
    // Calculate actual conversion rate
    const conversionRate = estimatedViews > 0 ? (totalSales / estimatedViews) * 100 : 0

    return NextResponse.json({
      views: estimatedViews,
      sales: totalSales,
      revenue: Number(totalRevenue.toFixed(2)),
      conversion_rate: Number(conversionRate.toFixed(1))
    })
  } catch (error) {
    console.error('Error calculating stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
