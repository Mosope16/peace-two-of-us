import type { Metadata } from "next";
import { Inter, Outfit } from 'next/font/google';
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Navbar from "@/components/navbar";
import AuthGuard from "@/components/auth-guard";
import QueryProvider from "@/components/providers/query-provider";
import RealtimeProvider from "@/components/providers/realtime-provider";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit', display: 'swap' });

export const metadata: Metadata = {
  title: "Peace - Private Relationship Space",
  description: "A private digital space where two people can preserve memories, keep track of important dates, exchange love letters, and stay emotionally connected.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Peace",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icons/icon-192.svg",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f43f5e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.variable} ${outfit.variable} font-sans antialiased min-h-screen flex flex-col`}>
          <QueryProvider>
            <RealtimeProvider>
              <Navbar />
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <AuthGuard>{children}</AuthGuard>
              </main>
              <footer className="py-6 text-center text-xs text-zinc-500 glass-nav">
                <p>Made with ❤️ &bull; Peace</p>
              </footer>
              <PWAInstallPrompt />
            </RealtimeProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

