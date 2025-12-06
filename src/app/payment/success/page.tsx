"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircleIcon,
  TicketIcon,
  QrCodeIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  EnvelopeIcon,
  UserIcon,
  SparklesIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

interface Ticket {
  id: string;
  ticket_type: string;
  qr_code: string;
  qr_code_data: string;
  buyer_name: string;
  buyer_email: string;
  event: {
    title: string;
    date: string;
    time: string;
    location: string;
    cover_image: string | null;
  };
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<"qrcode" | "info">("qrcode");

  useEffect(() => {
    if (sessionId) {
      loadTickets();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const loadTickets = async () => {
    try {
      // Primeiro tenta buscar os bilhetes existentes
      let response = await fetch(`/api/get-tickets?session_id=${sessionId}`);
      let data = await response.json();

      // Se não houver bilhetes, cria automaticamente
      if (response.ok && (!data.tickets || data.tickets.length === 0)) {
        console.log("Nenhum bilhete encontrado, criando automaticamente...");

        // Criar bilhetes automaticamente
        const createResponse = await fetch("/api/create-tickets-from-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (createResponse.ok) {
          // Buscar os bilhetes novamente
          response = await fetch(`/api/get-tickets?session_id=${sessionId}`);
          data = await response.json();
        }
      }

      if (response.ok) {
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-primary-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-400 text-lg">Carregando seus bilhetes...</p>
        </div>
      </div>
    );
  }

  if (!sessionId || tickets.length === 0) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/50">
              <CheckCircleIcon className="h-14 w-14 text-white" />
            </div>
            <h1 className="text-4xl font-bold gradient-text mb-4">
              Pagamento Confirmado!
            </h1>
            <p className="text-gray-400 text-lg mb-2">
              Seus bilhetes foram enviados por email.
            </p>
            <p className="text-gray-500">Verifique sua caixa de entrada.</p>
          </div>
          <Link href="/events" className="btn-primary inline-flex items-center">
            Ver Mais Eventos
          </Link>
        </div>
      </div>
    );
  }

  const firstTicket = tickets[0];

  return (
    <div className="min-h-screen bg-dark py-12 px-4 sm:px-6 lg:px-8">
      {/* Success Banner */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-16 h-16 flex items-center justify-center flex-shrink-0 shadow-lg shadow-green-500/50">
              <CheckCircleIcon className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                Pagamento Confirmado!{" "}
                <SparklesIcon className="h-6 w-6 text-yellow-400" />
              </h1>
              <p className="text-gray-400">
                Seus bilhetes foram confirmados e enviados para{" "}
                <span className="text-primary-400 font-semibold">
                  {firstTicket.buyer_email}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Ticket Card */}
          <div className="lg:col-span-2">
            <div className="card-dark overflow-hidden">
              {/* Event Header */}
              <div className="relative h-48 bg-gradient-to-r from-primary-600 to-blue-600">
                {firstTicket.event.cover_image ? (
                  <>
                    <Image
                      src={firstTicket.event.cover_image}
                      alt={firstTicket.event.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
                  </>
                ) : null}
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    {firstTicket.event.title}
                  </h2>
                  <div className="flex items-center gap-4 text-gray-300">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      <span className="text-sm">
                        {new Date(firstTicket.event.date).toLocaleDateString(
                          "pt-PT",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-5 w-5" />
                      <span className="text-sm">{firstTicket.event.time}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Buyer Info */}
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-500/20 rounded-full w-12 h-12 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-primary-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Titular</p>
                    <p className="text-xl font-bold text-white">
                      {firstTicket.buyer_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-800">
                <button
                  onClick={() => setActiveTab("qrcode")}
                  className={`flex-1 py-4 px-6 font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === "qrcode"
                      ? "bg-primary-500/10 text-primary-400 border-b-2 border-primary-500"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <QrCodeIcon className="h-5 w-5" />
                  QR Code
                </button>
                <button
                  onClick={() => setActiveTab("info")}
                  className={`flex-1 py-4 px-6 font-semibold transition-all flex items-center justify-center gap-2 ${
                    activeTab === "info"
                      ? "bg-primary-500/10 text-primary-400 border-b-2 border-primary-500"
                      : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                  }`}
                >
                  <TicketIcon className="h-5 w-5" />
                  Informações
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6 sm:p-8">
                {activeTab === "qrcode" ? (
                  <div className="space-y-8">
                    {tickets.map((ticket, index) => (
                      <div
                        key={ticket.id}
                        className={
                          index > 0 ? "pt-8 border-t border-gray-800" : ""
                        }
                      >
                        <div className="text-center">
                          <div className="bg-white p-6 rounded-2xl inline-block shadow-xl border-4 border-gray-800">
                            <Image
                              src={ticket.qr_code}
                              alt={`QR Code - ${ticket.ticket_type}`}
                              width={280}
                              height={280}
                              className="mx-auto"
                            />
                          </div>
                          {tickets.length > 1 && (
                            <div className="mt-4">
                              <span className="badge-primary">
                                Bilhete {index + 1} de {tickets.length}
                              </span>
                              <p className="text-gray-400 mt-2 font-medium">
                                {ticket.ticket_type}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-4 mt-6">
                      <p className="text-sm text-gray-400 text-center">
                        <span className="text-primary-400 font-semibold">
                          💡 Dica:
                        </span>{" "}
                        Apresente este QR Code na entrada do evento
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Location */}
                    <div className="card-dark-hover p-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary-500/20 rounded-lg p-2">
                          <MapPinIcon className="h-6 w-6 text-primary-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-400 mb-1">
                            Localização
                          </p>
                          <p className="font-semibold text-white text-lg">
                            {firstTicket.event.location}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="card-dark-hover p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-blue-500/20 rounded-lg p-2">
                            <CalendarIcon className="h-6 w-6 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Data</p>
                            <p className="font-semibold text-white">
                              {new Date(
                                firstTicket.event.date,
                              ).toLocaleDateString("pt-PT", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="card-dark-hover p-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-green-500/20 rounded-lg p-2">
                            <ClockIcon className="h-6 w-6 text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-400 mb-1">Hora</p>
                            <p className="font-semibold text-white">
                              {firstTicket.event.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Important Info */}
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5 space-y-3">
                      <h4 className="font-bold text-yellow-400 flex items-center gap-2">
                        <span>⚠️</span> Informações Importantes
                      </h4>
                      <div className="space-y-2 text-sm text-gray-400">
                        <p className="flex items-start gap-2">
                          <span className="text-lg">🪪</span>
                          <span>
                            <strong className="text-white">Obrigatório</strong>{" "}
                            a apresentação de documento de identificação
                          </span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="text-lg">📧</span>
                          <span>Guarde este email com os seus bilhetes</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <span className="text-lg">⏰</span>
                          <span>Chegue com antecedência para evitar filas</span>
                        </p>
                      </div>
                    </div>

                    {/* Tickets List */}
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <TicketIcon className="h-5 w-5 text-primary-400" />
                        Seus Bilhetes ({tickets.length})
                      </h3>
                      <div className="space-y-3">
                        {tickets.map((ticket, index) => (
                          <div key={ticket.id} className="card-dark-hover p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-white">
                                  {ticket.ticket_type}
                                </p>
                                <p className="text-sm text-gray-400">
                                  Bilhete #{index + 1}
                                </p>
                              </div>
                              <button
                                onClick={() => setActiveTab("qrcode")}
                                className="text-primary-400 hover:text-primary-300 font-medium text-sm transition-colors"
                              >
                                Ver QR Code →
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card-dark p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Ações Rápidas
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2">
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Baixar Bilhetes
                </button>
                <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-gray-700">
                  <EnvelopeIcon className="h-5 w-5" />
                  Reenviar Email
                </button>
              </div>
            </div>

            {/* Event Summary */}
            <div className="card-dark p-6">
              <h3 className="text-lg font-bold text-white mb-4">Resumo</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Evento</span>
                  <span className="text-white font-semibold">
                    {firstTicket.event.title}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total de Bilhetes</span>
                  <span className="text-white font-semibold">
                    {tickets.length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Comprador</span>
                  <span className="text-white font-semibold">
                    {firstTicket.buyer_name}
                  </span>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="bg-gradient-to-br from-primary-500/10 to-blue-500/10 border border-primary-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">
                Precisa de Ajuda?
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Entre em contato conosco se tiver alguma dúvida sobre seus
                bilhetes.
              </p>
              <button className="text-primary-400 hover:text-primary-300 font-semibold text-sm transition-colors">
                Falar com Suporte →
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 text-center">
          <Link href="/events" className="btn-primary inline-flex items-center">
            Explorar Mais Eventos
          </Link>
        </div>
      </div>
    </div>
  );
}
