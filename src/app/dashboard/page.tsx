"use client";

import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  PlusIcon,
  TicketIcon,
  UserGroupIcon,
  ChartBarIcon,
  CalendarIcon,
  ArrowRightOnRectangleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  CurrencyEuroIcon,
  UsersIcon,
  ChartPieIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Event {
  id: string;
  title: string;
  slug: string;
  event_date: string;
  event_time: string;
  location: string;
  category: string;
  image_url: string | null;
  association_code: string;
}

interface Ticket {
  id: string;
  event_id: string;
  name: string;
  price: number;
  stock: number;
}

interface TicketPurchased {
  price: number;
  ticket_id: string;
  status: string;
}

interface Stats {
  totalEvents: number;
  totalTicketsSold: number;
  totalRevenue: number;
  collaborations: number;
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalEvents: 0,
    totalTicketsSold: 0,
    totalRevenue: 0,
    collaborations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  // Refresh data when window gains focus (para atualizar após compras)
  useEffect(() => {
    const handleFocus = () => {
      if (user && !loading) {
        loadDashboardData();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user, loading]);

  async function loadDashboardData() {
    try {
      // 1. Buscar TODOS os eventos do organizador
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_id", user?.id || "")
        .order("created_at", { ascending: false });

      if (!eventsData || eventsData.length === 0) {
        setEvents([]);
        setStats({
          totalEvents: 0,
          totalTicketsSold: 0,
          totalRevenue: 0,
          collaborations: 0,
        });
        setLoading(false);
        return;
      }

      setEvents(eventsData as Event[]);

      // 2. Para cada evento, buscar tickets e calcular vendas (mesma lógica do manage)
      let totalSalesAllEvents = 0;
      let totalRevenueAllEvents = 0;

      for (const event of eventsData as Event[]) {
        // Buscar tipos de bilhete deste evento
        const { data: ticketsData } = await supabase
          .from("tickets")
          .select("*")
          .eq("event_id", event.id)
          .order("price", { ascending: true });

        if (ticketsData && ticketsData.length > 0) {
          // Para cada tipo de bilhete, contar vendas (igual à página de gestão)
          for (const ticket of ticketsData as Ticket[]) {
            // Contar bilhetes vendidos pela tabela tickets_purchased
            const { count } = await supabase
              .from("tickets_purchased")
              .select("*", { count: "exact", head: true })
              .eq("event_id", event.id)
              .eq("ticket_type", ticket.name);

            const sold = count || 0;
            totalSalesAllEvents += sold;
            totalRevenueAllEvents += sold * Number(ticket.price || 0);
          }
        }
      }

      // 3. Buscar TODOS os colaboradores dos MEUS eventos (eventos que EU organizei)
      const eventIds = eventsData.map((e: Event) => e.id);
      const { data: collabData } = await supabase
        .from("event_users")
        .select("*")
        .in("event_id", eventIds)
        .neq("role", "organizer");

      // 4. Atualizar estatísticas totais
      setStats({
        totalEvents: eventsData.length,
        totalTicketsSold: totalSalesAllEvents,
        totalRevenue: totalRevenueAllEvents,
        collaborations: collabData?.length || 0,
      });

      console.log("📊 Estatísticas agregadas de todos os eventos:", {
        totalEventos: eventsData.length,
        totalBilhetesVendidos: totalSalesAllEvents,
        receitaTotal: totalRevenueAllEvents,
        colaboradoresNosMeusEventos: collabData?.length || 0,
      });
    } catch (error) {
      console.error("❌ Erro ao carregar dashboard:", error);
      toast.error("Erro ao carregar dados do dashboard");
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      toast.success("Evento excluído com sucesso!");
      loadDashboardData();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Erro ao excluir evento");
    }
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
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Olá, {formatName(profile?.full_name) || "Organizador"}! 👋
            </h1>
            <p className="text-gray-400 text-lg">
              Bem-vindo ao teu painel de organizador
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {/* Total Events */}
            <div className="stats-card group hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-primary-600/20 p-3 rounded-xl group-hover:bg-primary-600/30 transition-colors">
                  <CalendarIcon className="h-6 w-6 text-primary-400" />
                </div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Eventos
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {loading ? (
                  <div className="h-9 w-16 bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  stats.totalEvents
                )}
              </div>
              <p className="text-gray-400 text-sm">Total de eventos criados</p>
            </div>

            {/* Total Tickets Sold */}
            <div className="stats-card group hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-600/20 p-3 rounded-xl group-hover:bg-green-600/30 transition-colors">
                  <TicketIcon className="h-6 w-6 text-green-400" />
                </div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Bilhetes
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {loading ? (
                  <div className="h-9 w-16 bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  stats.totalTicketsSold.toLocaleString("pt-PT")
                )}
              </div>
              <p className="text-gray-400 text-sm">Bilhetes vendidos</p>
            </div>

            {/* Total Revenue */}
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
                {loading ? (
                  <div className="h-9 w-24 bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  `€${stats.totalRevenue.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                )}
              </div>
              <p className="text-gray-400 text-sm">Receita total</p>
            </div>

            {/* Collaborations */}
            <div className="stats-card group hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-600/20 p-3 rounded-xl group-hover:bg-blue-600/30 transition-colors">
                  <UsersIcon className="h-6 w-6 text-blue-400" />
                </div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                  Colaboradores
                </span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">
                {loading ? (
                  <div className="h-9 w-16 bg-gray-700 animate-pulse rounded"></div>
                ) : (
                  stats.collaborations
                )}
              </div>
              <p className="text-gray-400 text-sm">Nos meus eventos</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6">
              Ações Rápidas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/events/create"
                className="card-dark-hover p-6 flex items-center space-x-4"
              >
                <div className="bg-primary-600 p-3 rounded-xl">
                  <PlusIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">
                    Criar Evento
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Cria um novo evento e começa a vender bilhetes
                  </p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/associations"
                className="card-dark-hover p-6 flex items-center space-x-4"
              >
                <div className="bg-blue-600 p-3 rounded-xl">
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">Associações</h3>
                  <p className="text-gray-400 text-sm">
                    Gerir as tuas associações e colaboradores
                  </p>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </div>

          {/* Events Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Meus Eventos</h2>
              <Link href="/events/create" className="btn-primary">
                <PlusIcon className="h-5 w-5 mr-2" />
                Criar Evento
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton h-80 rounded-2xl" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="card-dark p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dark-800 mb-4">
                  <CalendarIcon className="h-10 w-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Nenhum evento criado
                </h3>
                <p className="text-gray-400 mb-6">
                  Começa a criar o teu primeiro evento e a vender bilhetes
                </p>
                <Link href="/events/create" className="btn-primary">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Criar Primeiro Evento
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                  <div key={event.id} className="event-card">
                    <div className="relative h-48 overflow-hidden">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-900 to-dark-800 flex items-center justify-center">
                          <CalendarIcon className="h-16 w-16 text-white/20" />
                        </div>
                      )}
                      <div className="image-overlay" />
                      {event.category && (
                        <div className="event-category">{event.category}</div>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-400 transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center space-x-2 text-gray-400 text-sm">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{formatEventDate(event.event_date)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-400 text-sm">
                          <TicketIcon className="h-4 w-4" />
                          <span>Código: {event.association_code}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 pt-4 border-t border-white/10">
                        <Link
                          href={`/events/${event.slug}`}
                          className="flex-1 btn-secondary text-center text-sm py-2"
                        >
                          <EyeIcon className="h-4 w-4 inline mr-1" />
                          Ver
                        </Link>
                        <Link
                          href={`/events/${event.slug}/manage`}
                          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-center text-sm py-2 px-4 rounded-lg transition-colors"
                        >
                          <PencilIcon className="h-4 w-4 inline mr-1" />
                          Gerir
                        </Link>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white p-2 rounded-lg transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
