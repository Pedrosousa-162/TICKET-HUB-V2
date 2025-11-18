/*
Supabase Edge Function: stripe-webhook
- Validates Stripe signature
- Handles checkout.session.completed
- Inserts ticket into `tickets` table (uses service role key)
- Generates a QR code (base64 data URL)
- Sends email with QR code using Resend

Environment variables required:
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- RESEND_API_KEY
- EMAIL_FROM

Notes:
- This code is written as a Deno-compatible Edge Function (Supabase Functions). Depending on your Supabase CLI/runtime you may need to adjust imports for Stripe/Resend/qrcode if using npm compatibility.
- Test locally with the Stripe CLI: `stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook` (adjust port/path per your setup)
*/

import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import Resend from 'resend'

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || ''
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'no-reply@example.com'

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-09-30' })
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const resend = new Resend(RESEND_API_KEY)

function secureCompare(a: string, b: string) {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return result === 0
}

export default async (req: Request) => {
  try {
    const signature = req.headers.get('stripe-signature') || ''
    const rawBody = await req.text()

    // Validate the webhook using Stripe SDK helper
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Invalid signature', { status: 400 })
    }

    // Only process checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      // Build ticket payload
      const ticketId = crypto.randomUUID()
      const ticketPayload: any = {
        id: ticketId,
        sale_id: session.id,
        event_id: session.metadata?.event_id ?? null,
        user_email: session.customer_details?.email ?? session.customer_email ?? null,
        ticket_type: session.metadata?.ticket_type ?? null,
        price: (session.amount_total ?? 0) / 100,
        created_at: new Date().toISOString(),
      }

      // Insert ticket into Supabase
      const { data: insertData, error: insertError } = await supabase.from('tickets').insert(ticketPayload).select()
      if (insertError) {
        console.error('Failed to insert ticket:', insertError)
        // continue but log
      }

      // Generate QR code as data URL
      let qrDataUrl = ''
      try {
        qrDataUrl = await QRCode.toDataURL(ticketId)
      } catch (qrErr) {
        console.error('Failed to generate QR code:', qrErr)
      }

      // Send email with QR code via Resend
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: ticketPayload.user_email,
          subject: `Seu bilhete: ${ticketPayload.event_id ?? 'Evento'}`,
          html: `<p>Obrigado pela compra! Seu bilhete foi gerado abaixo:</p><img src="${qrDataUrl}" alt="QR code" />`,
        })
      } catch (mailErr) {
        console.error('Failed to send email:', mailErr)
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error('Unexpected error in webhook function:', err)
    return new Response('Internal error', { status: 500 })
  }
}
