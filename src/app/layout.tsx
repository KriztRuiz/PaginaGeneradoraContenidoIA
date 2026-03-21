import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Content MVP",
  description: "MVP mínimo para publicar contenido",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}