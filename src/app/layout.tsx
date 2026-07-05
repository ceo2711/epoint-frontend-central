import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppProviders } from "@/components/providers/AppProviders";
import { EPOINT_LOGO_PATH } from "@/components/layout/AppLogo";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ePoint Central",
  description: "Plataforma de gestión y onboarding de clientes",
  icons: {
    icon: EPOINT_LOGO_PATH,
    apple: EPOINT_LOGO_PATH,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full w-full overflow-x-hidden bg-cream-400 text-slate-900">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
