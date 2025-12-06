import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import QRCode from 'qrcode'
import { randomUUID } from 'crypto'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-09-30.clover",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || "",
    );
  } catch (error: any) {
    console.error("Webhook signature verification failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Processar evento de pagamento bem-sucedido
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (metadata) {
      try {
        // Criar registro de venda no banco de dados
        const { data: sale, error: saleError } = await supabase
          .from("sales")
          .insert({
            event_id: metadata.eventId,
            ticket_type: metadata.ticketType,
            quantity: parseInt(metadata.quantity),
            total_amount: session.amount_total ? session.amount_total / 100 : 0,
            buyer_email: session.customer_details?.email || "",
            buyer_name: session.customer_details?.name || "",
            payment_status: "completed",
            stripe_session_id: session.id,
            collaborator_id: metadata.collaboratorId || null,
          })
          .select()
          .single();

        if (saleError) {
          console.error("Error creating sale:", saleError);
        } else {
          console.log("Sale created successfully:", sale);

          // Criar bilhetes individuais com QR codes únicos
          const quantity = parseInt(metadata.quantity);
          const ticketsToCreate = [];

          for (let i = 0; i < quantity; i++) {
            const uniqueCode = randomUUID();
            const qrCodeData = JSON.stringify({
              ticketId: uniqueCode,
              eventId: metadata.eventId,
              buyerEmail: session.customer_details?.email || "",
              ticketType: metadata.ticketType,
              purchaseDate: new Date().toISOString(),
            });

            // Gerar QR code como data URL
            const qrCodeImage = await QRCode.toDataURL(qrCodeData, {
              width: 400,
              margin: 2,
              color: {
                dark: "#000000",
                light: "#FFFFFF",
              },
            });

            ticketsToCreate.push({
              event_id: metadata.eventId,
              sale_id: sale.id,
              ticket_type: metadata.ticketType,
              qr_code: qrCodeImage,
              qr_code_data: qrCodeData,
              unique_code: uniqueCode,
              buyer_name: session.customer_details?.name || "",
              buyer_email: session.customer_details?.email || "",
              stripe_session_id: session.id,
              is_used: false,
            });
          }

          // Inserir todos os bilhetes no banco
          const { error: ticketsError } = await supabase
            .from("tickets_purchased")
            .insert(ticketsToCreate);

          if (ticketsError) {
            console.error("Error creating tickets:", ticketsError);
          } else {
            console.log(`${quantity} tickets created successfully`);
          }

          // Se houver colaborador, atualizar suas estatísticas
          if (metadata.collaboratorId) {
            const { error: updateError } = await supabase.rpc(
              "increment_collaborator_sales",
              {
                collab_id: metadata.collaboratorId,
                sale_amount: session.amount_total
                  ? session.amount_total / 100
                  : 0,
              },
            );

            if (updateError) {
              console.error("Error updating collaborator stats:", updateError);
            }
          }
        }
      } catch (error) {
        console.error("Error processing webhook:", error);
      }
    }
  }

  return NextResponse.json({ received: true });
}
