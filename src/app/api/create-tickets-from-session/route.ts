import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import { randomUUID } from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-09-30.clover",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    // Verificar se já existem bilhetes para esta sessão
    const { data: existingTickets } = await supabase
      .from("tickets_purchased")
      .select("id")
      .eq("stripe_session_id", sessionId);

    if (existingTickets && existingTickets.length > 0) {
      return NextResponse.json({
        message: "Tickets already exist for this session",
        count: existingTickets.length,
      });
    }

    // Buscar detalhes da sessão do Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 },
      );
    }

    const metadata = session.metadata;

    if (!metadata || !metadata.eventId) {
      return NextResponse.json(
        { error: "Invalid session metadata" },
        { status: 400 },
      );
    }

    // Buscar o evento para pegar o organizer_id
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("organizer_id")
      .eq("id", metadata.eventId)
      .single();

    if (eventError || !eventData) {
      console.error("Error fetching event:", eventError);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Buscar o ticket_id baseado no tipo de bilhete
    const { data: ticketData, error: ticketError } = await supabase
      .from("tickets")
      .select("id")
      .eq("event_id", metadata.eventId)
      .eq("name", metadata.ticketType)
      .single();

    if (ticketError || !ticketData) {
      console.error("Error fetching ticket:", ticketError);
      // Se não encontrar o tipo de bilhete exato, continua sem falhar
    }

    // Criar registro de venda
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
      return NextResponse.json(
        { error: "Failed to create sale", details: saleError },
        { status: 500 },
      );
    }

    // Criar registro na tabela transactions para as estatísticas
    if (ticketData) {
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          event_id: metadata.eventId,
          ticket_id: ticketData.id,
          buyer_email: session.customer_details?.email || "",
          buyer_name: session.customer_details?.name || "",
          quantity: parseInt(metadata.quantity),
          total_amount: session.amount_total ? session.amount_total / 100 : 0,
          seller_id: eventData.organizer_id,
          unique_link: metadata.uniqueLinkUsed || null,
          status: "completed",
        });

      if (transactionError) {
        console.error("Error creating transaction:", transactionError);
        // Não falhamos a operação se a transação não for criada
      }
    }

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

    // Decrementar stock do tipo de bilhete
    if (ticketData) {
      const { error: stockError } = await supabase.rpc(
        "decrement_ticket_stock",
        {
          ticket_id: ticketData.id,
          quantity_sold: quantity,
        },
      );

      if (stockError) {
        console.error("Error decrementing stock:", stockError);
        // Tenta fazer manualmente se a função RPC não existir
        const { data: currentTicket } = await supabase
          .from("tickets")
          .select("stock")
          .eq("id", ticketData.id)
          .single();

        if (currentTicket) {
          await supabase
            .from("tickets")
            .update({ stock: currentTicket.stock - quantity })
            .eq("id", ticketData.id);
        }
      }
    }

    // Inserir todos os bilhetes no banco
    const { data: tickets, error: ticketsError } = await supabase
      .from("tickets_purchased")
      .insert(ticketsToCreate)
      .select();

    if (ticketsError) {
      console.error("Error creating tickets:", ticketsError);
      return NextResponse.json(
        { error: "Failed to create tickets", details: ticketsError },
        { status: 500 },
      );
    }

    // Se houver colaborador, atualizar suas estatísticas
    if (metadata.collaboratorId) {
      const { error: updateError } = await supabase.rpc(
        "increment_collaborator_sales",
        {
          collab_id: metadata.collaboratorId,
          sale_amount: session.amount_total ? session.amount_total / 100 : 0,
        },
      );

      if (updateError) {
        console.error("Error updating collaborator stats:", updateError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `${tickets.length} tickets created successfully`,
      tickets,
    });
  } catch (error: any) {
    console.error("Error in create-tickets-from-session:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 },
    );
  }
}
