import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "600", "700", "900"] });

export const metadata: Metadata = {
  title: "MUNINN · Motor de Cruce SAP — Tiendas Daka",
  description: "El cuervo de la memoria. Cruza códigos de proveedor con códigos SAP y alimenta el ecosistema.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
