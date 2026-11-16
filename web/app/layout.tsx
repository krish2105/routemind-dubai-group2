import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeToggle, themeInitScript } from "@/components/theme/ThemeToggle";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "RouteMind Dubai | AI in Logistics & Route Optimization",
  description: "Group 2, AI in Operations (MAIB AI 218), SP Jain Dubai. Simulated prototype: all data is assumed.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
        <ThemeToggle className="fixed right-4 top-4 z-50" />
      </body>
    </html>
  );
}
