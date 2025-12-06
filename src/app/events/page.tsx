"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { filterActiveEvents, getEventStatus } from "@/lib/eventStatus";
import EventCountdown from "@/components/EventCountdown";
import {
  MagnifyingGlassIcon,
  TicketIcon,
  CalendarIcon,
  MapPinIcon,
  UserCircleIcon,
  ArrowRightIcon,
  FunnelIcon,
  ClockIcon,
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  association_code: string;
  category: string;
  image_url: string | null;
}

// Mapeamento de slugs para nomes de categorias
const categoryMap: { [key: string]: string } = {
  musica: "Música",
  "comida-lifestyle": "Comida & Lifestyle",
  "cultura-arte": "Cultura & Arte",
  "conferencia-negocios": "Conferência & Negócios",
  universitario: "Universitário",
  desporto: "Desporto",
  teatro: "Teatro",
  festa: "Festa",
  festival: "Festival",
  workshop: "Workshop",
  outro: "Outro",
};

function EventsContent() {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Todas");
  const [locationFilter, setLocationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    "Todas",
    "Música",
    "Comida & Lifestyle",
    "Cultura & Arte",
    "Conferência & Negócios",
    "Universitário",
    "Desporto",
    "Teatro",
    "Festa",
    "Festival",
    "Workshop",
    "Outro",
  ];

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    // Ler categoria da URL
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl && categoryMap[categoryFromUrl]) {
      setCategoryFilter(categoryMap[categoryFromUrl]);
    }
  }, [searchParams]);

  useEffect(() => {
    filterEvents();
  }, [searchTerm, categoryFilter, locationFilter, events]);

  async function loadEvents() {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  }

  function filterEvents() {
    let filtered = [...events];

    // PRIMEIRO: Remover eventos expirados (data + hora + 2h já passou)
    filtered = filterActiveEvents(filtered);

    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (categoryFilter !== "Todas") {
      filtered = filtered.filter((event) => event.category === categoryFilter);
    }

    if (locationFilter) {
      filtered = filtered.filter((event) =>
        event.location.toLowerCase().includes(locationFilter.toLowerCase()),
      );
    }

    setFilteredEvents(filtered);
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const formatEventDate = (date: string, time: string) => {
    try {
      const eventDate = new Date(date);
      const day = format(eventDate, "dd", { locale: ptBR });
      const month = format(eventDate, "MMMM", { locale: ptBR })
        .toUpperCase()
        .slice(0, 3);
      return { day, month };
    } catch {
      return { day: "--", month: "---" };
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

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Header/Navbar */}
      <header className="navbar-dark fixed top-0 left-0 right-0 z-50">
        <nav className="container-custom py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl group-hover:shadow-glow transition-all duration-300">
                <TicketIcon className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">
                Tickethub
              </span>
            </Link>

            {/* Navigation Links - Desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/events"
                className="text-primary-400 font-medium transition-colors duration-200"
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

            {/* User Menu */}
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

      {/* Page Content */}
      <main className="pt-24 pb-16">
        <div className="container-custom">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Descobre Eventos
            </h1>
            <p className="text-gray-400 text-lg">
              Encontra os melhores eventos perto de ti
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="search-bar">
              <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 mr-4" />
              <input
                type="text"
                placeholder="Procurar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500"
              />
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-colors"
              >
                <FunnelIcon className="h-5 w-5 text-gray-300" />
                <span className="text-gray-300 text-sm">Filtros</span>
              </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="glass-dark rounded-2xl p-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-white font-semibold mb-3">
                      Categoria
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                            categoryFilter === cat
                              ? "bg-primary-600 text-white shadow-glow"
                              : "bg-white/10 text-gray-300 hover:bg-white/20"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location Filter */}
                  <div>
                    <label className="block text-white font-semibold mb-3">
                      Localização
                    </label>
                    <input
                      type="text"
                      placeholder="Filtrar por localização..."
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="input-dark w-full"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-400">
              {loading
                ? "A carregar eventos..."
                : `${filteredEvents.length} ${
                    filteredEvents.length === 1
                      ? "evento encontrado"
                      : "eventos encontrados"
                  }`}
            </p>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="events-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-80 rounded-2xl" />
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="events-grid">
              {filteredEvents.map((event) => {
                const { day, month } = formatEventDate(
                  event.event_date,
                  event.event_time,
                );
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="event-card"
                  >
                    <div className="relative h-48 overflow-hidden">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary-900 to-dark-800" />
                      )}
                      <div className="image-overlay" />
                      <div className="date-badge">
                        <div className="text-center">
                          <div className="text-2xl font-bold leading-none">
                            {day}
                          </div>
                          <div className="text-xs uppercase">{month}</div>
                        </div>
                      </div>
                      {event.category && (
                        <div className="event-category">{event.category}</div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-primary-400 transition-colors line-clamp-2">
                        {event.title}
                      </h3>

                      {/* Countdown se evento estiver fechando */}
                      <EventCountdown
                        eventDate={event.event_date}
                        eventTime={event.event_time}
                        className="mb-3"
                      />

                      <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
                        <ClockIcon className="h-4 w-4" />
                        <span>{event.event_time}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-400 text-sm">
                        <MapPinIcon className="h-4 w-4" />
                        <span className="line-clamp-1">{event.location}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dark-800 mb-4">
                <TicketIcon className="h-10 w-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Nenhum evento encontrado
              </h3>
              <p className="text-gray-400 mb-6">
                Tenta ajustar os teus filtros de pesquisa
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setCategoryFilter("Todas");
                  setLocationFilter("");
                }}
                className="btn-primary"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark-900 border-t border-white/10 py-12 mt-16">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Description */}
            <div className="col-span-1">
              <Link href="/" className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-2 rounded-xl">
                  <TicketIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold gradient-text">
                  Tickethub
                </span>
              </Link>
              <p className="text-gray-400 text-sm">
                A melhor plataforma para descobrir e comprar bilhetes para
                eventos em Portugal.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">
                Procurar eventos
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/events"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Todos os eventos
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events?category=musica"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Música
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events?category=cultura"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Cultura & Arte
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Tipo de eventos</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/associations"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Coleções
                  </Link>
                </li>
                <li>
                  <Link
                    href="/associations"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Próximos eventos
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">
                Ajuda ao participante
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/dashboard"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Sou organizador
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    Criar conta
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="divider" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              Copyright © 2022. Powered by Tickethub
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dark-900 flex items-center justify-center">
          <div className="text-white">A carregar...</div>
        </div>
      }
    >
      <EventsContent />
    </Suspense>
  );
}
