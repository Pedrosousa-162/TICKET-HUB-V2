"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { filterActiveEvents } from "@/lib/eventStatus";
import EventCountdown from "@/components/EventCountdown";
import {
  MagnifyingGlassIcon,
  TicketIcon,
  CalendarIcon,
  MapPinIcon,
  UserCircleIcon,
  ArrowRightIcon,
  MusicalNoteIcon,
  AcademicCapIcon,
  TrophyIcon,
  BriefcaseIcon,
  SparklesIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
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
  category: string;
  image_url: string | null;
}

const categories = [
  { name: "Música", icon: MusicalNoteIcon, slug: "musica" },
  { name: "Comida & Lifestyle", icon: SparklesIcon, slug: "comida-lifestyle" },
  { name: "Cultura & Arte", icon: TrophyIcon, slug: "cultura-arte" },
  {
    name: "Conferência & Negócios",
    icon: BriefcaseIcon,
    slug: "conferencia-negocios",
  },
  { name: "Universitário", icon: AcademicCapIcon, slug: "universitario" },
];

export default function HomePage() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [weekEvents, setWeekEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Onde?");
  const [selectedDate, setSelectedDate] = useState("Quando?");

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(
        (prev) => (prev + 1) % Math.max(1, featuredEvents.length),
      );
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredEvents.length]);

  async function loadEvents() {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id, title, slug, description, event_date, event_time, location, category, image_url",
        )
        .order("event_date", { ascending: true });

      if (error) {
        console.error("❌ [HOMEPAGE] Error loading events:", error);
      } else {
        // Filtrar eventos expirados (não mostrar eventos que já passaram + 2h)
        const allEvents = data || [];
        console.log("🔍 [HOMEPAGE] Total eventos no banco:", allEvents.length);
        console.log(
          "🔍 [HOMEPAGE] Eventos carregados:",
          allEvents.map((e) => ({
            title: e.title,
            date: e.event_date,
            time: e.event_time,
            datetime: `${e.event_date}T${e.event_time}`,
          })),
        );

        const now = new Date();
        console.log("🔍 [HOMEPAGE] Data/hora atual:", now.toISOString());

        const activeEvents = filterActiveEvents(allEvents);
        console.log(
          "🔍 [HOMEPAGE] Eventos ativos (após filtro):",
          activeEvents.length,
        );
        console.log(
          "🔍 [HOMEPAGE] Eventos ativos:",
          activeEvents.map((e) => e.title),
        );

        // Featured: primeiros 3 eventos para "Vamos sair?"
        const featured = activeEvents.slice(0, 3);

        // Week events: eventos que acontecem NESTA SEMANA (filtrados por data)
        const week = activeEvents.filter((event) =>
          isEventThisWeek(event.event_date),
        );

        // Upcoming: não usado atualmente, mas mantemos para compatibilidade
        const upcoming = activeEvents.slice(3, 6);

        console.log(
          "📍 [HOMEPAGE] featuredEvents (Vamos sair?):",
          featured.length,
          featured.map((e) => e.title),
        );
        console.log(
          "📍 [HOMEPAGE] weekEvents (Esta semana - filtrado por data):",
          week.length,
          week.map((e) => ({
            title: e.title,
            date: e.event_date,
            isThisWeek: isEventThisWeek(e.event_date),
          })),
        );
        console.log(
          "📍 [HOMEPAGE] upcomingEvents (não usado):",
          upcoming.length,
          upcoming.map((e) => e.title),
        );

        setFeaturedEvents(featured);
        setUpcomingEvents(upcoming);
        setWeekEvents(week);
      }
    } catch (error) {
      console.error("❌ [HOMEPAGE] Error loading events:", error);
    } finally {
      setLoadingEvents(false);
    }
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Verifica se um evento acontece nesta semana
  const isEventThisWeek = (eventDate: string) => {
    try {
      const event = new Date(eventDate);
      const now = new Date();

      // Início da semana (domingo)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Fim da semana (sábado)
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return event >= startOfWeek && event <= endOfWeek;
    } catch {
      return false;
    }
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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length,
    );
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

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {loading ? (
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

      {/* Hero Carousel */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-b from-dark-900 via-dark-950 to-dark-950">
        {/* Animated Grid Background */}
        <div className="absolute inset-0 opacity-40">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              linear-gradient(rgba(239, 68, 68, 0.4) 2px, transparent 2px),
              linear-gradient(90deg, rgba(239, 68, 68, 0.4) 2px, transparent 2px)
            `,
              backgroundSize: "60px 60px",
              animation: "gridMove 20s linear infinite",
            }}
          />
        </div>

        {/* Animated Dots Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(239, 68, 68, 0.6) 2px, transparent 2px)",
              backgroundSize: "40px 40px",
              animation: "gridMove 15s linear infinite reverse",
            }}
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent" />

        {loadingEvents ? (
          <div className="container-custom relative z-10">
            <div className="skeleton h-[400px] rounded-3xl" />
          </div>
        ) : featuredEvents.length > 0 ? (
          <div className="container-custom relative z-10 w-full">
            <div className="relative h-[400px] rounded-3xl overflow-hidden group shadow-2xl">
              {featuredEvents.map((event, index) => (
                <div
                  key={event.id}
                  className={`absolute inset-0 transition-opacity duration-700 ${
                    index === currentSlide ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-900 to-dark-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

                  <div className="absolute inset-0 flex items-center">
                    <div className="container-custom">
                      <div className="max-w-2xl">
                        <div className="inline-block bg-primary-600 text-white px-4 py-2 rounded-xl text-sm font-bold mb-4 animate-fade-in">
                          {
                            formatEventDate(event.event_date, event.event_time)
                              .day
                          }
                          -
                          {formatEventDate(
                            event.event_date,
                            event.event_time,
                          ).month.toUpperCase()}
                          -{new Date(event.event_date).getFullYear()}
                        </div>
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 text-shadow-lg animate-slide-up">
                          {event.title}
                        </h1>
                        <div className="flex items-center space-x-6 text-gray-200 mb-6 animate-slide-up">
                          <div className="flex items-center space-x-2">
                            <ClockIcon className="h-5 w-5" />
                            <span>{event.event_time}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPinIcon className="h-5 w-5" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                        <Link
                          href={`/events/${event.slug}`}
                          className="inline-flex items-center space-x-2 btn-primary animate-slide-up"
                        >
                          <span>Ver Evento</span>
                          <ArrowRightIcon className="h-5 w-5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
              >
                <ChevronLeftIcon className="h-6 w-6" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
              >
                <ChevronRightIcon className="h-6 w-6" />
              </button>

              {/* Indicators */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-2">
                {featuredEvents.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`transition-all duration-300 ${
                      index === currentSlide
                        ? "carousel-indicator-active"
                        : "carousel-indicator"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Search Section */}
      <section className="py-12 bg-dark-900/50">
        <div className="container-custom">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Descobre eventos, festas e festivais em Portugal
            </h2>
            <p className="text-gray-400 text-lg">
              Procurar por evento, local ou cidade
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="search-bar">
              <MagnifyingGlassIcon className="h-6 w-6 text-gray-400 mr-4" />
              <input
                type="text"
                placeholder="Procurar por evento, local ou cidade"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500"
              />
              <div className="hidden md:flex items-center space-x-4 ml-4 border-l border-white/10 pl-4">
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="bg-transparent text-gray-300 outline-none cursor-pointer"
                >
                  <option>Onde?</option>
                  <option>Lisboa</option>
                  <option>Porto</option>
                  <option>Coimbra</option>
                </select>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-gray-300 outline-none cursor-pointer"
                >
                  <option>Quando?</option>
                  <option>Hoje</option>
                  <option>Esta semana</option>
                  <option>Este mês</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/events?category=${category.slug}`}
                className="category-pill"
              >
                <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-4 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <category.icon className="h-8 w-8 text-white" />
                </div>
                <span className="text-white font-semibold text-center group-hover:text-primary-400 transition-colors">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Vamos sair? Section */}
      <section className="py-16 bg-dark-900/30">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title mb-0">Vamos sair?</h2>
            <Link
              href="/events"
              className="text-primary-400 hover:text-primary-300 font-semibold flex items-center space-x-2 transition-colors"
            >
              <span>Ver mais</span>
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>

          <div className="events-grid">
            {loadingEvents ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton h-80 rounded-2xl" />
              ))
            ) : featuredEvents.length > 0 ? (
              featuredEvents.map((event) => {
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
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400 text-lg">
                  Nenhum evento disponível no momento
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Esta semana Section */}
      <section className="py-16">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="section-title mb-0">Esta semana</h2>
            <Link
              href="/events"
              className="text-primary-400 hover:text-primary-300 font-semibold flex items-center space-x-2 transition-colors"
            >
              <span>Ver mais</span>
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
          </div>

          <div className="events-grid">
            {loadingEvents ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton h-80 rounded-2xl" />
              ))
            ) : weekEvents.length > 0 ? (
              weekEvents.map((event) => {
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
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-400 text-lg">
                  Nenhum evento disponível no momento
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

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
