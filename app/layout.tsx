import type { Metadata } from "next";
import { Inter, Outfit, Inter_Tight } from 'next/font/google';
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import Navbar from "@/components/navbar";
import AuthGuard from "@/components/auth-guard";
import QueryProvider from "@/components/providers/query-provider";
import RealtimeProvider from "@/components/providers/realtime-provider";
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });
const interTight = Inter_Tight({ subsets: ['latin'], variable: '--font-inter-tight' });

export const metadata: Metadata = {
  title: "Peace - Private Relationship Space",
  description: "A private digital space where two people can preserve memories, keep track of important dates, exchange love letters, and stay emotionally connected.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body className={`${inter.variable} ${outfit.variable} ${interTight.variable} font-sans antialiased min-h-screen flex flex-col`}>
          <QueryProvider>
            <RealtimeProvider>
              <Navbar />
              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <AuthGuard>{children}</AuthGuard>
              </main>
              <footer className="py-6 text-center text-xs text-zinc-500 glass-nav">
                <p>Made with ❤️ &bull; Peace</p>
              </footer>
            </RealtimeProvider>
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
