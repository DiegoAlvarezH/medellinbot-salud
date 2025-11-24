import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedellínBot Salud - Tu Asistente de Salud Pública",
  description: "Encuentra servicios de salud, información de vacunación y calidad del aire en Medellín mediante conversación con IA",
  keywords: ["salud", "Medellín", "chatbot", "servicios de salud", "vacunación", "calidad del aire"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex flex-col min-h-screen bg-gradient-mesh">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
