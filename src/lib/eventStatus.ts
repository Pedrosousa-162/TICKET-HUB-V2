// Biblioteca para gerenciar status e expiração de eventos

export type EventStatus =
  | "active" // Evento futuro, vendas abertas
  | "closing" // Evento começou mas ainda aceita bilhetes (2h após início)
  | "expired"; // Evento expirado, não aceita mais bilhetes

export interface EventStatusInfo {
  status: EventStatus;
  isExpired: boolean;
  isClosing: boolean;
  canPurchase: boolean;
  closingTimeRemaining?: {
    hours: number;
    minutes: number;
    seconds: number;
    totalMinutes: number;
  };
  message?: string;
}

/**
 * Verifica o status de um evento baseado na data e hora
 *
 * Regras:
 * - Eventos passados = EXPIRADO
 * - No dia do evento, aceita bilhetes até 2h após o início
 * - Quando começou mas ainda dentro das 2h = FECHANDO (mostra countdown)
 */
export function getEventStatus(
  eventDate: string, // YYYY-MM-DD
  eventTime: string, // HH:MM ou HH:MM:SS
): EventStatusInfo {
  try {
    // Combinar data e hora do evento
    const eventDateTime = new Date(`${eventDate}T${eventTime}`);
    const now = new Date();

    // Adicionar 2 horas ao horário do evento (janela de venda)
    const eventClosingTime = new Date(
      eventDateTime.getTime() + 2 * 60 * 60 * 1000,
    );

    // Se já passou do horário de fechamento (evento + 2h)
    if (now >= eventClosingTime) {
      return {
        status: "expired",
        isExpired: true,
        isClosing: false,
        canPurchase: false,
        message: "Evento encerrado",
      };
    }

    // Se o evento já começou mas ainda está dentro da janela de 2h
    if (now >= eventDateTime && now < eventClosingTime) {
      const timeRemaining = eventClosingTime.getTime() - now.getTime();
      const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutesRemaining = Math.floor(
        (timeRemaining % (1000 * 60 * 60)) / (1000 * 60),
      );
      const secondsRemaining = Math.floor((timeRemaining % (1000 * 60)) / 1000);
      const totalMinutes = Math.floor(timeRemaining / (1000 * 60));

      return {
        status: "closing",
        isExpired: false,
        isClosing: true,
        canPurchase: true,
        closingTimeRemaining: {
          hours: hoursRemaining,
          minutes: minutesRemaining,
          seconds: secondsRemaining,
          totalMinutes: totalMinutes,
        },
        message: `Bilhetes fecham em: ${hoursRemaining}h ${minutesRemaining}m`,
      };
    }

    // Evento ainda não começou
    return {
      status: "active",
      isExpired: false,
      isClosing: false,
      canPurchase: true,
    };
  } catch (error) {
    console.error("Error parsing event date/time:", error);
    // Em caso de erro, assumir que está ativo
    return {
      status: "active",
      isExpired: false,
      isClosing: false,
      canPurchase: true,
    };
  }
}

/**
 * Filtra lista de eventos removendo os expirados
 */
export function filterActiveEvents<T extends { event_date: string; event_time: string }>(
  events: T[]
): T[] {
  return events.filter(event => {
    const status = getEventStatus(event.event_date, event.event_time);
    return !status.isExpired;
  });
}

/**
 * Verifica se um evento pode receber compras
 */
export function canPurchaseTickets(
  eventDate: string,
  eventTime: string,
): boolean {
  const status = getEventStatus(eventDate, eventTime);
  return status.canPurchase;
}

/**
 * Formata o tempo restante para exibição
 */
export function formatTimeRemaining(closingTime: {
  hours: number;
  minutes: number;
  seconds: number;
}): string {
  const { hours, minutes, seconds } = closingTime;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Calcula quando um evento expira (data + hora + 2h)
 */
export function getEventExpirationTime(
  eventDate: string,
  eventTime: string,
): Date {
  const eventDateTime = new Date(`${eventDate}T${eventTime}`);
  return new Date(eventDateTime.getTime() + 2 * 60 * 60 * 1000);
}

/**
 * Verifica se um evento está próximo de expirar (menos de 1h)
 */
export function isEventClosingSoon(
  eventDate: string,
  eventTime: string,
): boolean {
  const status = getEventStatus(eventDate, eventTime);
  if (!status.isClosing || !status.closingTimeRemaining) {
    return false;
  }
  return status.closingTimeRemaining.totalMinutes < 60;
}
