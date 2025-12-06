import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TicketHub - Gestão de Eventos e Bilhetes",
  description:
    "Plataforma completa para gestão, venda e rastreamento de bilhetes de eventos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt" suppressHydrationWarning className="scrollbar-dark">
      <body
        className={`${inter.className} scrollbar-dark`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#1a1a1a",
                color: "#fff",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
