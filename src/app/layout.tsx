import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "UCSM - Sistema de Asistencia",
  description: "IV Seminario Internacional de Costos y Gestion de Operaciones - Universidad Catolica de Santa Maria",
  icons: {
    icon: "/img/logo-ucsm.png",
    apple: "/img/logo-ucsm-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            toastOptions={{
              style: {
                fontFamily: "var(--font-outfit)",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
