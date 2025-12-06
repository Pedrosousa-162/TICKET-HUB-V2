import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-09-30.clover",
});

export async function POST(req: NextRequest) {
  try {
    const {
      eventId,
      eventTitle,
      ticketType,
      quantity,
      price,
      userId,
      collaboratorId,
      uniqueLinkUsed,
    } = await req.json();

    // Validação
    if (!eventId || !ticketType || !quantity || !price) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const totalAmount = price * quantity;

    // Criar sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${eventTitle} - ${ticketType}`,
              description: `${quantity}x bilhete(s) para ${eventTitle}`,
            },
            unit_amount: Math.round(price * 100), // Stripe usa centavos
          },
          quantity: quantity,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/events/${eventId}?canceled=true`,
      metadata: {
        eventId,
        ticketType,
        quantity: quantity.toString(),
        userId: userId || "guest",
        collaboratorId: collaboratorId || "",
        uniqueLinkUsed: uniqueLinkUsed || "",
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao criar sessão de pagamento" },
      { status: 500 },
    );
  }
}
