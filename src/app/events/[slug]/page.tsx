"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { getEventStatus, canPurchaseTickets } from "@/lib/eventStatus";
import EventCountdown from "@/components/EventCountdown";
import Link from "next/link";
import {
  CalendarIcon,
  MapPinIcon,
  UserIcon,
  TicketIcon,
  ShareIcon,
  HeartIcon,
  ClockIcon,
  ArrowLeftIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  UserCircleIcon,
  ArrowRightIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import toast from "react-hot-toast";

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  category: string;
  base_price: number;
  image_url: string | null;
  association_code: string;
  organizer_id: string;
}

interface Ticket {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  sold: number;
}

interface ReferralInfo {
  collaborator_name: string;
  unique_code: string;
}

export default function EventPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<
    Record<string, number>
  >({});
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [collaboratorId, setCollaboratorId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadEvent();
    loadReferralInfo();
  }, [params.slug, searchParams]);

  async function loadEvent() {
    try {
      setLoading(true);
      const slug = params.slug as string;

      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();

      if (eventError) throw eventError;

      setEvent(eventData);

      const { data: ticketsData, error: ticketsError } = await supabase
        .from("tickets")
        .select("*")
        .eq("event_id", eventData.id)
        .gt("stock", 0);

      if (ticketsError) throw ticketsError;

      setTickets(ticketsData || []);
    } catch (error) {
      console.error("Error loading event:", error);
      toast.error("Erro ao carregar evento");
    } finally {
      setLoading(false);
    }
  }

  async function loadReferralInfo() {
    const ref = searchParams.get("ref");
    if (!ref) return;

    try {
      const { data, error } = await supabase
        .from("event_users")
        .select("id, unique_link, users!inner(full_name)")
        .eq("unique_link", ref)
        .maybeSingle();

      if (error) throw error;

      if (data && data.id) {
        setCollaboratorId(data.id);
        setReferralInfo({
          collaborator_name: data.users?.full_name || "Colaborador",
          unique_code: data.unique_link,
        });
        toast.success("Link de colaborador aplicado!");
      }
    } catch (error) {
      console.error("Error loading referral info:", error);
    }
  }

  const handleTicketQuantityChange = (ticketId: string, delta: number) => {
    setSelectedTickets((prev) => {
      const current = prev[ticketId] || 0;
      const newValue = Math.max(0, current + delta);

      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket && newValue > ticket.stock - ticket.sold) {
        toast.error("Quantidade indisponível");
        return prev;
      }

      if (newValue === 0) {
        const { [ticketId]: _, ...rest } = prev;
        return rest;
      }

      return { ...prev, [ticketId]: newValue };
    });
  };

  const handlePurchase = () => {
    if (!user) {
      toast.error("Você precisa fazer login para comprar bilhetes");
      router.push("/login");
      return;
    }

    const ref = searchParams.get("ref");
    const queryString = new URLSearchParams({
      tickets: JSON.stringify(selectedTickets),
      ...(ref && { ref }),
    }).toString();

    router.push(`/payment/${event?.id}?${queryString}`);
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event?.title,
          text: event?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado para a área de transferência!");
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
      const eventDate = new Date(date);
      return format(eventDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch {
      return "Data inválida";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4"></div>
          <p className="text-gray-400">A carregar evento...</p>
        </div>
      </div>
    );
  }

  if (!event) {
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
        <div className="pt-24 pb-16">
          <div className="container-custom text-center py-16">
            <TicketIcon className="h-20 w-20 text-gray-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Evento não encontrado
            </h1>
            <p className="text-gray-400 mb-6">
              O evento que procuras não existe ou foi removido
            </p>
            <Link href="/events" className="btn-primary">
              Ver Todos os Eventos
            </Link>
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
              <Link
                href="/events/create"
                className="text-gray-300 hover:text-white font-medium transition-colors duration-200"
              >
                Criar evento
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              {authLoading ? (
                <div className="w-10 h-10 rounded-full bg-dark-800 animate-pulse" />
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/dashboard"
                    className="hidden md:block text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    Organizador
                  </Link>
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
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    href="/login"
                    className="text-gray-300 hover:text-white font-medium transition-colors"
                  >
                    Entrar
                  </Link>
                  <Link href="/register" className="btn-primary">
                    Registrar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="container-custom">
          {/* Back Button */}
          <Link
            href="/events"
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar aos eventos</span>
          </Link>

          {/* Referral Info Banner */}
          {referralInfo && (
            <div className="bg-gradient-to-r from-primary-600/20 to-primary-700/20 border border-primary-500/30 rounded-2xl p-4 mb-8 animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-600 p-2 rounded-lg">
                  <UserIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-semibold">
                    Recomendado por {referralInfo.collaborator_name}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Código de referência: {referralInfo.unique_code}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Event Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Image */}
              <div className="relative h-96 rounded-3xl overflow-hidden group">
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-900 to-dark-800 flex items-center justify-center">
                    <TicketIcon className="h-32 w-32 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Category Badge */}
                {event.category && (
                  <div className="absolute top-6 left-6 bg-dark-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-semibold border border-white/20">
                    {event.category}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="absolute top-6 right-6 flex items-center space-x-3">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className="bg-dark-900/90 backdrop-blur-sm p-3 rounded-xl hover:bg-primary-600 transition-all duration-300 group/fav"
                  >
                    {isFavorite ? (
                      <HeartSolidIcon className="h-6 w-6 text-primary-500 group-hover/fav:text-white" />
                    ) : (
                      <HeartIcon className="h-6 w-6 text-white" />
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    className="bg-dark-900/90 backdrop-blur-sm p-3 rounded-xl hover:bg-primary-600 transition-all duration-300"
                  >
                    <ShareIcon className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>

              {/* Event Info */}
              <div className="card-dark p-8">
                <h1 className="text-4xl font-bold text-white mb-6">
                  {event.title}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="bg-primary-600/20 p-3 rounded-xl">
                      <CalendarIcon className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Data</p>
                      <p className="text-white font-semibold">
                        {formatEventDate(event.event_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="bg-primary-600/20 p-3 rounded-xl">
                      <ClockIcon className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Hora</p>
                      <p className="text-white font-semibold">
                        {event.event_time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 md:col-span-2">
                    <div className="bg-primary-600/20 p-3 rounded-xl">
                      <MapPinIcon className="h-6 w-6 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Local</p>
                      <p className="text-white font-semibold">
                        {event.location}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divider" />

                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Sobre o Evento
                  </h2>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              </div>

              {/* Available Tickets */}
              <div className="card-dark p-8">
                <h2 className="text-2xl font-bold text-white mb-6">
                  Bilhetes Disponíveis
                </h2>

                {/* Countdown de Fechamento */}
                <EventCountdown
                  eventDate={event.event_date}
                  eventTime={event.event_time}
                  className="mb-6"
                />

                {/* Verificar se evento expirou */}
                {!canPurchaseTickets(event.event_date, event.event_time) ? (
                  <div className="text-center py-12">
                    <div className="bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-8 mb-4">
                      <TicketIcon className="h-16 w-16 text-red-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-red-400 mb-2">
                        Evento Encerrado
                      </h3>
                      <p className="text-gray-400">
                        A venda de bilhetes para este evento já terminou.
                      </p>
                      <p className="text-gray-500 text-sm mt-2">
                        Os bilhetes fecharam 2 horas após o início do evento.
                      </p>
                    </div>
                    <Link href="/events" className="btn-secondary">
                      Ver Outros Eventos
                    </Link>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <TicketIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">
                      Nenhum bilhete disponível no momento
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => {
                      const available = ticket.stock - ticket.sold;
                      const selectedQty = selectedTickets[ticket.id] || 0;

                      return (
                        <div
                          key={ticket.id}
                          className="bg-dark-800/50 border border-white/10 rounded-2xl p-6 hover:border-primary-500/50 transition-all duration-300"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-white mb-2">
                                {ticket.name}
                              </h3>
                              {ticket.description && (
                                <p className="text-gray-400 text-sm">
                                  {ticket.description}
                                </p>
                              )}
                              <p className="text-gray-500 text-sm mt-2">
                                {available} disponíveis
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-3xl font-bold text-primary-400">
                                €{ticket.price.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() =>
                                  handleTicketQuantityChange(ticket.id, -1)
                                }
                                disabled={selectedQty === 0}
                                className="bg-dark-700 hover:bg-primary-600 disabled:bg-dark-800 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
                              >
                                <MinusIcon className="h-5 w-5 text-white" />
                              </button>
                              <span className="text-white font-bold text-lg min-w-[3rem] text-center">
                                {selectedQty}
                              </span>
                              <button
                                onClick={() =>
                                  handleTicketQuantityChange(ticket.id, 1)
                                }
                                disabled={selectedQty >= available}
                                className="bg-dark-700 hover:bg-primary-600 disabled:bg-dark-800 disabled:cursor-not-allowed p-2 rounded-lg transition-colors"
                              >
                                <PlusIcon className="h-5 w-5 text-white" />
                              </button>
                            </div>

                            {selectedQty > 0 && (
                              <div className="text-white font-semibold">
                                Subtotal: €
                                {(ticket.price * selectedQty).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Purchase Summary */}
            <div className="lg:col-span-1">
              <div className="card-dark p-6 sticky top-24">
                <h3 className="text-xl font-bold text-white mb-6">
                  Resumo da Compra
                </h3>

                {totalTickets === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCartIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">
                      Seleciona os bilhetes para continuar
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      {Object.entries(selectedTickets).map(
                        ([ticketId, quantity]) => {
                          const ticket = tickets.find((t) => t.id === ticketId);
                          if (!ticket) return null;

                          return (
                            <div
                              key={ticketId}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex-1">
                                <p className="text-white font-medium">
                                  {ticket.name}
                                </p>
                                <p className="text-gray-400">
                                  {quantity} x €{ticket.price.toFixed(2)}
                                </p>
                              </div>
                              <p className="text-white font-semibold">
                                €{(ticket.price * quantity).toFixed(2)}
                              </p>
                            </div>
                          );
                        },
                      )}
                    </div>

                    <div className="divider" />

                    <div className="flex items-center justify-between mb-6">
                      <span className="text-gray-400">Total de Bilhetes</span>
                      <span className="text-white font-semibold">
                        {totalTickets}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <span className="text-xl font-bold text-white">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-primary-400">
                        €{totalAmount.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={handlePurchase}
                      className="w-full btn-primary flex items-center justify-center space-x-2"
                    >
                      <ShoppingCartIcon className="h-5 w-5" />
                      <span>Comprar Bilhetes</span>
                    </button>

                    <p className="text-gray-400 text-xs text-center mt-4">
                      Pagamento seguro • Confirmação instantânea
                    </p>
                  </>
                )}
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
