"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TicketIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowLeftIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyEuroIcon,
  ShoppingCartIcon,
  UsersIcon,
  LinkIcon,
  EyeIcon,
  UserCircleIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  XMarkIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
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
  association_code: string;
  organizer_id: string;
  image_url: string | null;
}

interface Ticket {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  sold: number;
}

interface Collaborator {
  id: string;
  role: string;
  unique_link: string;
  joined_at: string;
  user: {
    full_name: string;
    email: string;
  };
}

interface Stats {
  total_sales: number;
  total_revenue: number;
  collaborators_count: number;
  available_tickets: number;
}

export default function ManageEventPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [stats, setStats] = useState<Stats>({
    total_sales: 0,
    total_revenue: 0,
    collaborators_count: 0,
    available_tickets: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "tickets" | "collaborators"
  >("overview");

  // Ticket form state
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [ticketForm, setTicketForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
  });

  const loadEventData = useCallback(async () => {
    try {
      setLoading(true);
      const slug = params.slug as string;

      // Load event
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();

      if (eventError) throw eventError;
      if (!eventData) throw new Error("Evento não encontrado");

      // Check if user is organizer
      // @ts-expect-error - Supabase types
      if (eventData.organizer_id !== user?.id) {
        toast.error("Não tens permissão para gerir este evento");
        router.push("/dashboard");
        return;
      }

      // @ts-expect-error - Supabase types
      setEvent(eventData);

      // Load tickets
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("tickets")
        .select("*")
        // @ts-expect-error - Supabase types
        .eq("event_id", eventData.id)
        .order("price", { ascending: true });

      if (ticketsError) throw ticketsError;

      // Calculate sold tickets for each ticket type
      const ticketsWithSales = await Promise.all(
        (ticketsData || []).map(async (ticket) => {
          // Contar bilhetes vendidos pela tabela tickets_purchased
          const { count } = await supabase
            .from("tickets_purchased")
            .select("*", { count: "exact", head: true })
            // @ts-expect-error - Supabase types
            .eq("event_id", eventData.id)
            // @ts-expect-error - Supabase types
            .eq("ticket_type", ticket.name);

          return {
            // @ts-expect-error - Supabase types
            ...ticket,
            sold: count || 0,
          };
        }),
      );

      setTickets(ticketsWithSales);

      // Load collaborators
      const { data: collabData, error: collabError } = await supabase
        .from("event_users")
        .select(
          `
          id,
          role,
          joined_at,
          unique_link,
          user:users(full_name, email)
        `,
        )
        // @ts-expect-error - Supabase types
        .eq("event_id", eventData.id)
        .neq("role", "organizer");

      if (collabError) throw collabError;
      setCollaborators(collabData || []);

      // Calculate stats
      // @ts-expect-error - Supabase types
      const totalSales = ticketsWithSales.reduce(
        (sum: number, ticket: any) => sum + ticket.sold,
        0,
      );
      // @ts-expect-error - Supabase types
      const totalRevenue = ticketsWithSales.reduce(
        (sum: number, ticket: any) => sum + ticket.sold * Number(ticket.price),
        0,
      );
      // @ts-expect-error - Supabase types
      const availableTickets = ticketsWithSales.reduce(
        (sum: number, ticket: any) => sum + (ticket.stock - ticket.sold),
        0,
      );

      setStats({
        total_sales: totalSales,
        total_revenue: totalRevenue,
        collaborators_count: collabData?.length || 0,
        available_tickets: availableTickets,
      });
    } catch (error) {
      console.error("Error loading event data:", error);
      toast.error("Erro ao carregar dados do evento");
    } finally {
      setLoading(false);
    }
  }, [params.slug, user, router]);

  useEffect(() => {
    if (user) {
      loadEventData();
    }
  }, [user, loadEventData]);

  // Refresh data when window gains focus (para atualizar após vendas)
  useEffect(() => {
    const handleFocus = () => {
      if (user && !loading && event) {
        loadEventData();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user, loading, event, loadEventData]);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!event) return;

    try {
      // @ts-expect-error - Supabase types
      const ticketData: any = {
        // @ts-expect-error - Supabase types
        event_id: event!.id,
        name: ticketForm.name,
        description: ticketForm.description || null,
        price: parseFloat(ticketForm.price),
        stock: parseInt(ticketForm.stock),
      };

      if (editingTicket) {
        // @ts-expect-error - Supabase types
        const { error } = await supabase
          .from("tickets")
          // @ts-expect-error - Supabase types
          .update(ticketData)
          .eq("id", editingTicket.id);

        if (error) throw error;
        toast.success("Bilhete atualizado com sucesso!");
      } else {
        // @ts-expect-error - Supabase types
        const { error } = await supabase.from("tickets").insert([ticketData]);

        if (error) throw error;
        toast.success("Bilhete criado com sucesso!");
      }

      setShowTicketForm(false);
      setEditingTicket(null);
      setTicketForm({ name: "", description: "", price: "", stock: "" });
      loadEventData();
    } catch (error) {
      console.error("Error saving ticket:", error);
      toast.error("Erro ao salvar bilhete");
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm("Tens certeza que desejas eliminar este bilhete?")) return;

    try {
      const { error } = await supabase
        .from("tickets")
        .delete()
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("Bilhete eliminado com sucesso!");
      loadEventData();
    } catch (error) {
      console.error("Error deleting ticket:", error);
      toast.error("Erro ao eliminar bilhete");
    }
  };

  const handleEditTicket = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setTicketForm({
      name: ticket.name,
      description: ticket.description || "",
      price: ticket.price.toString(),
      stock: ticket.stock.toString(),
    });
    setShowTicketForm(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent mb-4"></div>
          <p className="text-gray-400">A carregar dados do evento...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="card-dark p-12 text-center max-w-md">
          <CalendarIcon className="h-20 w-20 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Evento não encontrado
          </h1>
          <p className="text-gray-400 mb-6">
            O evento que procuras não existe ou foi removido
          </p>
          <Link href="/dashboard" className="btn-primary inline-flex">
            Voltar ao Dashboard
          </Link>
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
                Procurar eventos
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-300 hover:text-white font-medium transition-colors duration-200"
              >
                Dashboard
              </Link>
            </div>

            <div className="flex items-center space-x-4">
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
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="container-custom">
          {/* Back Button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-8 group"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar ao Dashboard</span>
          </Link>

          {/* Event Header */}
          <div className="card-dark p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-start space-x-4">
                  {event.image_url && (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-24 h-24 rounded-xl object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-white mb-3">
                      {event.title}
                    </h1>
                    <div className="flex flex-wrap gap-4 text-gray-400 text-sm">
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatEventDate(event.event_date)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4" />
                        <span>{event.event_time}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPinIcon className="h-4 w-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/events/${event.slug}`}
                  className="btn-secondary text-center"
                >
                  <EyeIcon className="h-5 w-5 inline mr-2" />
                  Ver Evento
                </Link>
              </div>
            </div>

            {/* Association Code */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <label className="block text-sm text-gray-400 mb-2">
                Código de Associação
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-dark-800/50 rounded-xl p-4 overflow-hidden">
                  <p className="text-white text-lg font-mono font-bold tracking-wider">
                    {event.association_code}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(event.association_code)}
                  className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-xl transition-colors"
                  title="Copiar código"
                >
                  <ClipboardDocumentIcon className="h-5 w-5" />
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-2">
                Partilha este código com colaboradores para que se possam
                associar ao evento
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="stats-card group hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-600/20 p-3 rounded-xl group-hover:bg-green-600/30 transition-colors">
                  <ShoppingCartIcon className="h-6 w-6 text-green-400" />
                </div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Vendas
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {loading ? (
                  <div className="h-9 w-16 bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  stats.total_sales.toLocaleString("pt-PT")
                )}
              </div>
              <p className="text-gray-400 text-sm">Bilhetes vendidos</p>
            </div>

            <div className="stats-card group hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-yellow-600/20 p-3 rounded-xl group-hover:bg-yellow-600/30 transition-colors">
                  <CurrencyEuroIcon className="h-6 w-6 text-yellow-400" />
                </div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Receita
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                €
                {stats.total_revenue.toLocaleString("pt-PT", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="text-gray-400 text-sm">Receita total</p>
            </div>

            <div className="stats-card group hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-600/20 p-3 rounded-xl group-hover:bg-blue-600/30 transition-colors">
                  <TicketIcon className="h-6 w-6 text-blue-400" />
                </div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Disponíveis
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {loading ? (
                  <div className="h-9 w-16 bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  stats.available_tickets.toLocaleString("pt-PT")
                )}
              </div>
              <p className="text-gray-400 text-sm">Bilhetes disponíveis</p>
            </div>

            <div className="stats-card group hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-600/20 p-3 rounded-xl group-hover:bg-purple-600/30 transition-colors">
                  <UsersIcon className="h-6 w-6 text-purple-400" />
                </div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Colaboradores
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {loading ? (
                  <div className="h-9 w-16 bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  stats.collaborators_count
                )}
              </div>
              <p className="text-gray-400 text-sm">Colaboradores ativos</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex space-x-2 bg-dark-800/50 p-2 rounded-xl">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === "overview"
                    ? "bg-primary-600 text-white shadow-glow"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <ChartBarIcon className="h-5 w-5 inline mr-2" />
                Visão Geral
              </button>
              <button
                onClick={() => setActiveTab("tickets")}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === "tickets"
                    ? "bg-primary-600 text-white shadow-glow"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <TicketIcon className="h-5 w-5 inline mr-2" />
                Bilhetes
              </button>
              <button
                onClick={() => setActiveTab("collaborators")}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === "collaborators"
                    ? "bg-primary-600 text-white shadow-glow"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <UserGroupIcon className="h-5 w-5 inline mr-2" />
                Colaboradores
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="card-dark p-6">
                <h3 className="text-xl font-bold text-white mb-6">
                  Resumo do Evento
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Descrição
                    </label>
                    <p className="text-white">{event.description}</p>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Categoria
                    </label>
                    <span className="badge-primary">{event.category}</span>
                  </div>
                </div>
              </div>

              <div className="card-dark p-6">
                <h3 className="text-xl font-bold text-white mb-6">
                  Link Público do Evento
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-dark-800/50 rounded-xl p-4 overflow-hidden">
                    <p className="text-white text-sm font-mono truncate">
                      {`${window.location.origin}/events/${event.slug}`}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/events/${event.slug}`,
                      )
                    }
                    className="bg-primary-600 hover:bg-primary-700 text-white p-4 rounded-xl transition-colors"
                  >
                    <ClipboardDocumentIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tickets" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">
                  Gerir Bilhetes
                </h3>
                <button
                  onClick={() => {
                    setEditingTicket(null);
                    setTicketForm({
                      name: "",
                      description: "",
                      price: "",
                      stock: "",
                    });
                    setShowTicketForm(true);
                  }}
                  className="btn-primary"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Criar Bilhete
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="card-dark p-6 animate-pulse">
                      <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                      <div className="h-4 bg-gray-700 rounded w-full mb-6"></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-20 bg-gray-700 rounded"></div>
                        <div className="h-20 bg-gray-700 rounded"></div>
                        <div className="h-20 bg-gray-700 rounded"></div>
                        <div className="h-20 bg-gray-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div className="card-dark p-16 text-center">
                  <div className="max-w-md mx-auto">
                    <div className="bg-gray-800/50 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                      <TicketIcon className="h-12 w-12 text-gray-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      Nenhum bilhete criado
                    </h3>
                    <p className="text-gray-400 mb-8 text-lg">
                      Cria o primeiro tipo de bilhete para este evento
                    </p>
                    <button
                      onClick={() => setShowTicketForm(true)}
                      className="btn-primary inline-flex items-center text-lg px-8 py-4"
                    >
                      <PlusIcon className="h-6 w-6 mr-2" />
                      Criar Primeiro Bilhete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="card-dark-hover p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-white mb-2">
                            {ticket.name}
                          </h4>
                          {ticket.description && (
                            <p className="text-gray-400 text-sm mb-3">
                              {ticket.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-dark-800/50 rounded-xl p-4">
                          <div className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">
                            Preço
                          </div>
                          <div className="text-2xl font-bold text-primary-400">
                            €
                            {Number(ticket.price).toLocaleString("pt-PT", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                        </div>
                        <div className="bg-dark-800/50 rounded-xl p-4">
                          <div className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">
                            Stock Total
                          </div>
                          <div className="text-2xl font-bold text-white">
                            {ticket.stock.toLocaleString("pt-PT")}
                          </div>
                        </div>
                        <div className="bg-dark-800/50 rounded-xl p-4">
                          <div className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">
                            Vendidos
                          </div>
                          <div className="text-2xl font-bold text-green-400">
                            {ticket.sold.toLocaleString("pt-PT")}
                          </div>
                        </div>
                        <div className="bg-dark-800/50 rounded-xl p-4">
                          <div className="text-xs text-gray-400 mb-1 font-semibold uppercase tracking-wider">
                            Disponíveis
                          </div>
                          <div className="text-2xl font-bold text-blue-400">
                            {(ticket.stock - ticket.sold).toLocaleString(
                              "pt-PT",
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-4 border-t border-white/10">
                        <button
                          onClick={() => handleEditTicket(ticket)}
                          className="flex-1 btn-secondary text-center text-sm py-2"
                        >
                          <PencilIcon className="h-4 w-4 inline mr-1" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteTicket(ticket.id)}
                          className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "collaborators" && (
            <div className="space-y-6">
              <div className="card-dark p-6">
                <h3 className="text-2xl font-bold text-white mb-6">
                  Colaboradores do Evento
                </h3>

                {collaborators.length === 0 ? (
                  <div className="text-center py-12">
                    <UserGroupIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Sem colaboradores
                    </h3>
                    <p className="text-gray-400 mb-6">
                      Partilha o código de associação para adicionar
                      colaboradores
                    </p>
                    <div className="inline-flex items-center space-x-2 bg-dark-800/50 px-6 py-3 rounded-xl">
                      <span className="text-gray-400">Código:</span>
                      <span className="text-white font-mono font-bold">
                        {event.association_code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(event.association_code)}
                        className="text-primary-400 hover:text-primary-300"
                      >
                        <ClipboardDocumentIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {collaborators.map((collab) => (
                      <div
                        key={collab.id}
                        className="bg-dark-800/50 border border-white/10 rounded-2xl p-6 hover:border-primary-500/50 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="avatar avatar-lg">
                              {collab.user.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div>
                              <h4 className="text-white font-semibold">
                                {collab.user.full_name}
                              </h4>
                              <p className="text-gray-400 text-sm">
                                {collab.user.email}
                              </p>
                              {collab.unique_link && (
                                <div className="flex items-center space-x-2 mt-2">
                                  <LinkIcon className="h-4 w-4 text-gray-500" />
                                  <span className="text-xs text-gray-500 font-mono">
                                    {collab.unique_link}
                                  </span>
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        `${window.location.origin}/events/${event.slug}?ref=${collab.unique_link}`,
                                      )
                                    }
                                    className="text-primary-400 hover:text-primary-300"
                                  >
                                    <ClipboardDocumentIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="badge-success">
                              {collab.role === "organizer"
                                ? "Organizador"
                                : "Colaborador"}
                            </span>
                            <p className="text-gray-500 text-xs mt-2">
                              Desde{" "}
                              {format(new Date(collab.joined_at), "dd/MM/yyyy")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Ticket Form Modal */}
      {showTicketForm && (
        <div className="modal-backdrop fixed inset-0 flex items-center justify-center p-4 z-50">
          <div
            className="absolute inset-0"
            onClick={() => setShowTicketForm(false)}
          />
          <div className="card-dark p-8 max-w-md w-full relative z-10 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {editingTicket ? "Editar Bilhete" : "Criar Bilhete"}
              </h2>
              <button
                onClick={() => setShowTicketForm(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleTicketSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome do Bilhete
                </label>
                <input
                  type="text"
                  value={ticketForm.name}
                  onChange={(e) =>
                    setTicketForm({ ...ticketForm, name: e.target.value })
                  }
                  required
                  placeholder="Ex: VIP, Normal, Early Bird"
                  className="input-dark w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={ticketForm.description}
                  onChange={(e) =>
                    setTicketForm({
                      ...ticketForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Descrição do bilhete..."
                  rows={3}
                  className="input-dark w-full resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preço (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={ticketForm.price}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, price: e.target.value })
                    }
                    required
                    placeholder="0.00"
                    className="input-dark w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stock
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={ticketForm.stock}
                    onChange={(e) =>
                      setTicketForm({ ...ticketForm, stock: e.target.value })
                    }
                    required
                    placeholder="100"
                    className="input-dark w-full"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTicketForm(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  {editingTicket ? "Atualizar" : "Criar"} Bilhete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
