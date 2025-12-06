"use client";

import { useEffect, useState } from "react";
import { ClockIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { getEventStatus, formatTimeRemaining } from "@/lib/eventStatus";

interface EventCountdownProps {
  eventDate: string;
  eventTime: string;
  className?: string;
}

export default function EventCountdown({
  eventDate,
  eventTime,
  className = "",
}: EventCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Função para atualizar o countdown
    const updateCountdown = () => {
      const status = getEventStatus(eventDate, eventTime);

      setIsExpired(status.isExpired);
      setIsClosing(status.isClosing);

      if (status.isClosing && status.closingTimeRemaining) {
        setTimeRemaining(status.closingTimeRemaining);
      } else {
        setTimeRemaining(null);
      }
    };

    // Atualizar imediatamente
    updateCountdown();

    // Atualizar a cada segundo
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [eventDate, eventTime]);

  // Não mostrar nada se não estiver fechando
  if (!isClosing || !timeRemaining || isExpired) {
    return null;
  }

  // Determinar estilo baseado no tempo restante
  const urgencyLevel =
    timeRemaining.hours === 0 && timeRemaining.minutes < 30
      ? "critical" // Menos de 30 minutos
      : timeRemaining.hours === 0
      ? "warning" // Menos de 1 hora
      : "info"; // Mais de 1 hora

  const styles = {
    critical: {
      bg: "bg-red-500/20",
      border: "border-red-500/50",
      text: "text-red-400",
      icon: "text-red-400",
      pulse: "animate-pulse",
    },
    warning: {
      bg: "bg-yellow-500/20",
      border: "border-yellow-500/50",
      text: "text-yellow-400",
      icon: "text-yellow-400",
      pulse: "",
    },
    info: {
      bg: "bg-blue-500/20",
      border: "border-blue-500/50",
      text: "text-blue-400",
      icon: "text-blue-400",
      pulse: "",
    },
  };

  const style = styles[urgencyLevel];

  return (
    <div
      className={`${style.bg} ${style.border} border-2 rounded-xl p-4 ${style.pulse} ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {urgencyLevel === "critical" ? (
            <ExclamationTriangleIcon className={`h-6 w-6 ${style.icon}`} />
          ) : (
            <ClockIcon className={`h-6 w-6 ${style.icon}`} />
          )}
          <div>
            <p className={`text-sm font-medium ${style.text}`}>
              {urgencyLevel === "critical"
                ? "⚠️ Últimos minutos!"
                : "Bilhetes fecham em:"}
            </p>
            <p className={`text-2xl font-bold ${style.text} tracking-wider`}>
              {timeRemaining.hours > 0 && (
                <>
                  <span>{timeRemaining.hours}</span>
                  <span className="text-sm">h</span>
                  <span className="mx-1">:</span>
                </>
              )}
              <span>
                {timeRemaining.minutes.toString().padStart(2, "0")}
              </span>
              <span className="text-sm">m</span>
              <span className="mx-1">:</span>
              <span>
                {timeRemaining.seconds.toString().padStart(2, "0")}
              </span>
              <span className="text-sm">s</span>
            </p>
          </div>
        </div>

        {urgencyLevel === "critical" && (
          <div className="text-right">
            <p className={`text-xs ${style.text} font-semibold uppercase`}>
              Última chamada!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
