"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import {
  PlusIcon,
  TicketIcon,
  ChartBarIcon,
  ClipboardDocumentIcon,
  UserCircleIcon,
  ArrowRightIcon,
  BriefcaseIcon,
  XMarkIcon,
  EyeIcon,
  ShoppingCartIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Association {
  id: string;
  role: string;
  unique_link: string | null;
  joined_at: string;
  event: {
    id: string;
    title: string;
    slug: string;
    event_date: string;
    association_code: string;
  };
  stats: {
    views: number;
    sales: number;
    revenue: number;
    conversion_rate: number;
  } | null;
}

export default function AssociationsPage() {
  return (
    <ProtectedRoute>
      <AssociationsContent />
    </ProtectedRoute>
  );
}

function AssociationsContent() {
  const { user, profile, signOut } = useAuth();
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [associationCode, setAssociationCode] = useState("");
  const [joiningCode, setJoiningCode] = useState(false);

  useEffect(() => {
    if (user) {
      loadAssociations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadAssociations() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("event_users")
        .select(
          `
          id,
          role,
          unique_link,
          joined_at,
          event:events (
            id,
            title,
            slug,
            event_date,
            association_code
          )
        `,
        )
        .eq("user_id", user?.id)
        .order("joined_at", { ascending: false });

      if (error) throw error;

      const associationsWithStats = await Promise.all(
        (data || []).map(async (assoc) => {
          if (assoc.unique_link) {
            const { data: statsData } = await supabase
              .from("link_analytics")
              .select("views, sales, revenue, conversion_rate")
              .eq("unique_link", assoc.unique_link)
              .single();

            return {
              ...assoc,
              stats: statsData || {
                views: 0,
                sales: 0,
                revenue: 0,
                conversion_rate: 0,
              },
            };
          }
          return { ...assoc, stats: null };
        }),
      );

      setAssociations(associationsWithStats);
    } catch (error) {
      console.error("Error loading associations:", error);
      toast.error("Erro ao carregar associações");
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinAssociation() {
    if (!associationCode.trim()) {
      toast.error("Por favor, insira um código de associação");
      return;
    }

    setJoiningCode(true);

    try {
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("id, title")
        .eq("association_code", associationCode.trim())
        .single();

      if (eventError || !eventData) {
        toast.error("Código de associação inválido");
        return;
      }

      const { data: existingAssoc } = await supabase
        .from("event_users")
        .select("id")
        .eq("event_id", eventData.id)
        .eq("user_id", user?.id)
        .single();

      if (existingAssoc) {
        toast.error("Já estás associado a este evento");
        return;
      }

      const uniqueLink = `${associationCode.trim()}-${user?.id?.substring(0, 8)}`;

      const { error: insertError } = await supabase.from("event_users").insert({
        event_id: eventData.id,
        user_id: user?.id,
        role: "collaborator",
        unique_link: uniqueLink,
      });

      if (insertError) throw insertError;

      toast.success(`Associado com sucesso ao evento: ${eventData.title}`);
      setShowJoinModal(false);
      setAssociationCode("");
      loadAssociations();
    } catch (error) {
      console.error("Error joining association:", error);
      toast.error("Erro ao associar ao evento");
    } finally {
      setJoiningCode(false);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copiado para a área de transferência!");
  };

  const handleSignOut = async () => {
    await signOut();
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
      return format(new Date(date), "d 'de' MMM yyyy", { locale: ptBR });
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
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Minhas Associações 🤝
            </h1>
            <p className="text-gray-400 text-lg">
              Gerir eventos onde és colaborador
            </p>
          </div>

          {/* Action Button */}
          <div className="mb-8">
            <button
              onClick={() => setShowJoinModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Associar-me a um Evento</span>
            </button>
          </div>

          {/* Associations Grid */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-64 rounded-2xl" />
              ))}
            </div>
          ) : associations.length === 0 ? (
            <div className="card-dark p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-dark-800 mb-4">
                <UserGroupIcon className="h-10 w-10 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Sem associações
              </h3>
              <p className="text-gray-400 mb-6">
                Ainda não estás associado a nenhum evento como colaborador
              </p>
              <button
                onClick={() => setShowJoinModal(true)}
                className="btn-primary inline-flex"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Associar-me a um Evento
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {associations.map((assoc) => (
                <div key={assoc.id} className="card-dark-hover p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                        {assoc.event.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{formatEventDate(assoc.event.event_date)}</span>
                        </div>
                        <div className="badge-success">
                          {assoc.role === "organizer"
                            ? "Organizador"
                            : "Colaborador"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  {assoc.stats && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-dark-800/50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <EyeIcon className="h-4 w-4 text-blue-400" />
                          <span className="text-xs text-gray-400 uppercase font-semibold">
                            Visualizações
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {assoc.stats.views}
                        </p>
                      </div>

                      <div className="bg-dark-800/50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <ShoppingCartIcon className="h-4 w-4 text-green-400" />
                          <span className="text-xs text-gray-400 uppercase font-semibold">
                            Vendas
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {assoc.stats.sales}
                        </p>
                      </div>

                      <div className="bg-dark-800/50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CurrencyEuroIcon className="h-4 w-4 text-yellow-400" />
                          <span className="text-xs text-gray-400 uppercase font-semibold">
                            Receita
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          €{assoc.stats.revenue.toFixed(2)}
                        </p>
                      </div>

                      <div className="bg-dark-800/50 rounded-xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <ChartBarIcon className="h-4 w-4 text-primary-400" />
                          <span className="text-xs text-gray-400 uppercase font-semibold">
                            Conversão
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                          {assoc.stats.conversion_rate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="divider" />

                  {/* Unique Link */}
                  {assoc.unique_link && (
                    <div className="mb-4">
                      <label className="block text-sm text-gray-400 mb-2">
                        Teu Link Único
                      </label>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-dark-800/50 rounded-xl p-3 overflow-hidden">
                          <p className="text-white text-sm font-mono truncate">
                            {`${window.location.origin}/events/${assoc.event.slug}?ref=${assoc.unique_link}`}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `${window.location.origin}/events/${assoc.event.slug}?ref=${assoc.unique_link}`,
                            )
                          }
                          className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-xl transition-colors"
                          title="Copiar link"
                        >
                          <ClipboardDocumentIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/events/${assoc.event.slug}`}
                      className="flex-1 btn-secondary text-center text-sm py-2"
                    >
                      Ver Evento
                    </Link>
                    <Link
                      href={`/events/${assoc.event.slug}/manage`}
                      className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-center text-sm py-2 px-4 rounded-lg transition-colors"
                    >
                      Gerir
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Join Association Modal */}
      {showJoinModal && (
        <div className="modal-backdrop fixed inset-0 flex items-center justify-center p-4 z-50">
          <div
            className="absolute inset-0"
            onClick={() => setShowJoinModal(false)}
          />
          <div className="card-dark p-8 max-w-md w-full relative z-10 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Associar-me a um Evento
              </h2>
              <button
                onClick={() => setShowJoinModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <p className="text-gray-400 mb-6">
              Insere o código de associação que recebeste do organizador do
              evento para te associares como colaborador.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Código de Associação
              </label>
              <input
                type="text"
                value={associationCode}
                onChange={(e) => setAssociationCode(e.target.value)}
                placeholder="Ex: ABC123"
                className="input-dark w-full"
                disabled={joiningCode}
              />
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 btn-secondary"
                disabled={joiningCode}
              >
                Cancelar
              </button>
              <button
                onClick={handleJoinAssociation}
                disabled={joiningCode || !associationCode.trim()}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joiningCode ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                    A associar...
                  </>
                ) : (
                  <>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Associar
                  </>
                )}
              </button>
            </div>
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
