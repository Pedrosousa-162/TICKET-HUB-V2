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
- This code is written as a Deno-compatible Edge Function (Supabase Functions)
- Uses npm: imports for Deno compatibility
- Test locally with: supabase functions serve stripe-webhook
*/

import Stripe from "npm:stripe@^14.0.0";
import { createClient } from "npm:@supabase/supabase-js@^2.0.0";
import { Resend } from "npm:resend@^3.0.0";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") || "no-reply@example.com";

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-09-30" });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(RESEND_API_KEY);

function secureCompare(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++)
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

// Função pode ser chamada sem autenticação (webhook público do Stripe)
Deno.serve(async (req: Request) => {
  // Permitir CORS para requisições do Stripe
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No stripe-signature header found");
      return new Response("No signature provided", { status: 400 });
    }

    // Read the raw body as text
    const body = await req.text();

    console.log("Webhook received:", {
      hasSignature: !!signature,
      bodyLength: body.length,
      webhookSecretConfigured: !!STRIPE_WEBHOOK_SECRET,
    });

    // Validate the webhook using Stripe SDK helper (async version for Deno)
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET,
      );
      console.log("Webhook signature validated successfully:", event.type);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", errorMessage);
      return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
    }

    // Only process checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log('Processing checkout.session.completed:', {
        sessionId: session.id,
        customerEmail: session.customer_details?.email,
        metadata: session.metadata
      })

      // Build ticket payload for tickets_purchased table
      const ticketId = crypto.randomUUID();
      const qrCode = crypto.randomUUID(); // Unique QR code for this ticket

      const ticketPayload: any = {
        id: ticketId,
        sale_id: null, // TODO: Create sale record first if needed
        stripe_session_id: session.id, // Store Stripe session ID
        event_id: session.metadata?.eventId ?? null,
        user_id: session.metadata?.userId ?? null,
        ticket_type: session.metadata?.ticketType ?? "General",
        buyer_email: session.customer_details?.email ?? "",
        buyer_name: session.customer_details?.name ?? "",
        qr_code: qrCode,
        status: "valid",
        price: (session.amount_total ?? 0) / 100,
        collaborator_id: session.metadata?.collaboratorId || null,
        unique_link_used: session.metadata?.uniqueLinkUsed || null,
      };

      console.log('Ticket payload to insert:', ticketPayload)

      // Insert ticket into Supabase tickets_purchased table
      const { data: insertData, error: insertError } = await supabase
        .from("tickets_purchased")
        .insert(ticketPayload)
        .select();
      if (insertError) {
        console.error('Failed to insert ticket:', insertError)
        console.error('Insert error details:', JSON.stringify(insertError, null, 2))
        return new Response(JSON.stringify({ error: 'Failed to create ticket', details: insertError }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        })
      }

      console.log('Ticket inserted successfully:', insertData)

      // Generate QR code URL (usando serviço público ou gerar localmente)
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCode)}`;

      // Send email with QR code via Resend
      const buyerEmail = ticketPayload.buyer_email;
      console.log("Attempting to send email to:", buyerEmail);
      console.log("Using EMAIL_FROM:", EMAIL_FROM);
      console.log("RESEND_API_KEY configured:", !!RESEND_API_KEY);

      if (!buyerEmail) {
        console.error("No buyer email found, skipping email send");
      } else {
        try {
          const emailResult = await resend.emails.send({
            from: EMAIL_FROM,
            to: buyerEmail,
            subject: `🎫 Seu Bilhete - ${session.metadata?.ticketType || "TicketHub"}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin-bottom: 10px;">🎉 Obrigado pela sua compra!</h1>
                <p style="color: #666; font-size: 16px;">Seu bilhete foi gerado com sucesso.</p>
              </div>

              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <div style="background: white; padding: 20px; border-radius: 8px; display: inline-block;">
                  <img src="${qrCodeUrl}" alt="QR Code do bilhete" style="width: 250px; height: 250px; display: block;" />
                </div>
                <p style="color: white; margin-top: 15px; font-size: 14px; font-weight: bold;">Código do Bilhete:</p>
                <p style="color: white; font-size: 12px; word-break: break-all; background: rgba(255,255,255,0.2); padding: 10px; border-radius: 6px; margin: 10px 20px;">${qrCode}</p>
              </div>

              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #475569;"><strong>🎟️ Tipo de Bilhete:</strong> ${ticketPayload.ticket_type}</p>
                <p style="margin: 10px 0 0 0; color: #475569;"><strong>💰 Valor:</strong> €${ticketPayload.price.toFixed(2)}</p>
              </div>

              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  ⚠️ <strong>Importante:</strong> Apresente este QR code na entrada do evento. Guarde este email ou tire um screenshot.
                </p>
              </div>

              <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
                Este é um email automático. Por favor não responda.<br/>
                TicketHub - Sistema de Gestão de Bilhetes
              </p>
            </div>
          `,
          });
          console.log("Email sent successfully:", emailResult);
        } catch (mailErr) {
          console.error("Failed to send email:", mailErr);
          console.error("Error details:", JSON.stringify(mailErr, null, 2));
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error in webhook function:", err);
    return new Response("Internal error", { status: 500 });
  }
});
