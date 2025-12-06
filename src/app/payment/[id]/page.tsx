"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  ShoppingCartIcon,
  TicketIcon,
  CreditCardIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  ArrowLeftIcon,
  ShieldCheckIcon,
  UserCircleIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { loadStripe } from "@stripe/stripe-js";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "react-hot-toast";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

interface Event {
  id: string;
  title: string;
  event_date: string;
  event_time: string;
  location: string;
  image_url: string | null;
  category: string;
}

interface Ticket {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  sold: number;
}

interface SelectedTickets {
  [ticketId: string]: number;
}

export default function PaymentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const eventId = params.id as string;
  const ticketsParam = searchParams.get("tickets");
  const refParam = searchParams.get("ref");

  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<SelectedTickets>({});
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError) throw eventError;

      if (eventData) {
        setEvent(eventData);
      }

      const { data: ticketsData, error: ticketsError } = await supabase
        .from("tickets")
        .select("*")
        .eq("event_id", eventId);

      if (ticketsError) throw ticketsError;

      if (ticketsData) {
        setTickets(ticketsData);
      }

      if (ticketsParam) {
        try {
          const parsed = JSON.parse(ticketsParam);
          setSelectedTickets(parsed);
        } catch (e) {
          console.error("Failed to parse tickets:", e);
          toast.error("Erro ao processar bilhetes selecionados");
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar informações");
    } finally {
      setLoading(false);
    }
  }, [eventId, ticketsParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCheckout = async () => {
    if (!user) {
      toast.error("É necessário fazer login para continuar");
      router.push("/login");
      return;
    }

    setProcessing(true);

    try {
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error("Stripe não foi carregado");
      }

      const lineItems = Object.entries(selectedTickets).map(
        ([ticketId, quantity]) => {
          const ticket = tickets.find((t) => t.id === ticketId);
          if (!ticket) throw new Error("Ticket não encontrado");

          return {
            ticketId,
            ticketType: ticket.name,
            quantity,
            price: ticket.price,
          };
        },
      );

      const firstItem = lineItems[0];
      const ticket = tickets.find((t) => t.id === firstItem.ticketId);

      if (!ticket) throw new Error("Ticket não encontrado");

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: event?.id,
          eventTitle: event?.title,
          ticketType: ticket.name,
          quantity: firstItem.quantity,
          price: ticket.price,
          userId: user.id,
          collaboratorId: refParam || null,
          uniqueLinkUsed: refParam || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao criar sessão de pagamento");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Checkout error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao processar pagamento";
      toast.error(errorMessage);
      setProcessing(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const formatName = (name?: string | null) => {
    if (!name) return "";
    return name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const initials = (() => {
    const raw = profile?.full_name || user?.email || "";
    if (!raw) return "";
    const parts = raw.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  const formatEventDate = (date: string) => {
    try {
      return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  const totalAmount = Object.entries(selectedTickets).reduce(
    (sum, [ticketId, quantity]) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      return sum + (ticket?.price || 0) * quantity;
    },
    0,
  );

  const totalTickets = Object.values(selectedTickets).reduce(
    (sum, qty) => sum + qty,
    0,
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4"></div>
          <p className="text-gray-400">
            A carregar informações de pagamento...
          </p>
        </div>
      </div>
    );
  }

  if (!event || Object.keys(selectedTickets).length === 0) {
    return (
      <div className="min-h-screen bg-dark-950">
        <header className="navbar-dark fixed top-0 left-0 right-0 z-50">
          <nav className="container-custom py-4">
            <div className="flex justify-between items-center">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl group-hover:shadow-glow transition-all duration-300">
                  <TicketIcon className="h-7 w-7 text-white" />
                </div>
                <span className="text-2xl font-bold gradient-text">
                  Tickethub
                </span>
              </Link>
            </div>
          </nav>
        </header>

        <div className="pt-24 pb-16 flex items-center justify-center min-h-screen">
          <div className="container-custom">
            <div className="card-dark p-12 text-center max-w-md mx-auto">
              <ShoppingCartIcon className="h-20 w-20 text-gray-600 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-4">
                Carrinho Vazio
              </h1>
              <p className="text-gray-400 mb-8">
                Nenhum bilhete foi selecionado. Por favor, volte e selecione os
                bilhetes.
              </p>
              <button onClick={() => router.back()} className="btn-primary">
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Voltar ao Evento
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header/Navbar */}
      <header className="navbar-dark fixed top-0 left-0 right-0 z-50">
        <nav className="container-custom py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl group-hover:shadow-glow transition-all duration-300">
                <TicketIcon className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">
                Tickethub
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/events"
                className="text-gray-300 hover:text-white font-medium transition-colors duration-200"
              >
                Ver eventos
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="relative group">
                  <button className="avatar hover:ring-2 hover:ring-primary-500 transition-all duration-300">
                    {initials || <UserCircleIcon className="h-6 w-6" />}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 dropdown-menu opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link
                      href="/dashboard"
                      className="dropdown-item flex items-center space-x-2"
                    >
                      <BriefcaseIcon className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="dropdown-item flex items-center space-x-2 w-full text-left text-primary-400 hover:text-primary-300"
                    >
                      <ArrowRightIcon className="h-4 w-4" />
                      <span>Sair</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="btn-primary">
                  Entrar
                </Link>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="container-custom">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar ao evento</span>
          </button>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary-600/20 mb-4">
              <CreditCardIcon className="h-10 w-10 text-primary-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Finalizar Compra
            </h1>
            <p className="text-gray-400 text-lg">
              Revê o teu pedido antes de prosseguir para o pagamento
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Info Card */}
              <div className="card-dark overflow-hidden">
                <div className="relative h-64 overflow-hidden">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-900 to-dark-800 flex items-center justify-center">
                      <CalendarIcon className="h-32 w-32 text-white/20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />

                  {event.category && (
                    <div className="absolute top-4 left-4 bg-dark-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-semibold border border-white/20">
                      {event.category}
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h2 className="text-3xl font-bold text-white mb-3">
                      {event.title}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-white/90">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-5 w-5" />
                        <span>{formatEventDate(event.event_date)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-5 w-5" />
                        <span>{event.event_time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPinIcon className="h-5 w-5" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tickets List */}
              <div className="card-dark p-6">
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
                  <TicketIcon className="h-6 w-6 text-primary-400" />
                  <span>Bilhetes Selecionados</span>
                </h3>

                <div className="space-y-4">
                  {Object.entries(selectedTickets).map(
                    ([ticketId, quantity]) => {
                      const ticket = tickets.find((t) => t.id === ticketId);
                      if (!ticket) return null;

                      return (
                        <div
                          key={ticketId}
                          className="bg-dark-800/50 border border-white/10 rounded-2xl p-6 hover:border-primary-500/50 transition-all duration-300"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-white mb-2">
                                {ticket.name}
                              </h4>
                              {ticket.description && (
                                <p className="text-gray-400 text-sm mb-3">
                                  {ticket.description}
                                </p>
                              )}
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>
                                  Quantidade:{" "}
                                  <span className="text-white font-semibold">
                                    {quantity}
                                  </span>
                                </span>
                                <span>×</span>
                                <span>
                                  Preço:{" "}
                                  <span className="text-white font-semibold">
                                    €{ticket.price.toFixed(2)}
                                  </span>
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-3xl font-bold text-primary-400">
                                €{(ticket.price * quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Security Info */}
              <div className="card-dark p-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-green-600/20 p-3 rounded-xl">
                    <ShieldCheckIcon className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-2">
                      Pagamento Seguro
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Os teus dados de pagamento estão protegidos com
                      encriptação SSL. Processado de forma segura através do
                      Stripe.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="card-dark p-6 sticky top-24">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Resumo do Pedido
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-400">
                    <span>Bilhetes ({totalTickets})</span>
                    <span className="text-white font-semibold">
                      €{totalAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Taxa de serviço</span>
                    <span className="text-white font-semibold">€0.00</span>
                  </div>

                  <div className="divider" />

                  <div className="flex justify-between text-xl font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-primary-400">
                      €{totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={processing}
                  className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      <span>A processar...</span>
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="h-5 w-5" />
                      <span>Prosseguir para Pagamento</span>
                    </>
                  )}
                </button>

                <div className="divider" />

                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    <span>Confirmação instantânea</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    <span>Bilhetes enviados por email</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <CheckCircleIcon className="h-5 w-5 text-green-400" />
                    <span>Suporte ao cliente 24/7</span>
                  </div>
                </div>

                <div className="divider" />

                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Pagamento seguro com Stripe</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark-900 border-t border-white/10 py-12 mt-16">
        <div className="container-custom">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl">
                <TicketIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Tickethub</span>
            </Link>
            <p className="text-gray-400 text-sm">
              Copyright © 2022. Powered by Tickethub
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
